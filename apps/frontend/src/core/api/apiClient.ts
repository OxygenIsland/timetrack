/**
 * API 客户端（基于 axios）
 *
 * 职责：
 * - 统一请求/响应拦截
 * - 注入 trace_id：
 *    1. 请求拦截器生成 16hex，写入 `X-Trace-Id` 请求头
 *    2. 响应拦截器从 `X-Trace-Id` 响应头回填（如果业务错误体里有 trace_id 优先用它）
 *    3. 把最终 trace_id 同步到 globalStore.lastTraceId
 * - 注入 token
 * - 统一错误处理
 * - 与错误码体系集成
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import type { IApiClient } from '../registry/types';
import type { ApiError } from '../error/types';
import { handleApiError, BizError } from '../error/handleApiError';
import { generateTraceId, persistTraceId } from '../trace/traceId';
import { useGlobalStore } from '../../stores/globalStore';

class ApiClient implements IApiClient {
  private instance: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string = '/api/v1') {
    this.instance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器：注入 trace_id / token / 时间戳
    this.instance.interceptors.request.use(
      (config) => {
        // 1) 优先使用调用方显式传入的 trace_id（极少用到，留个口子）
        const explicit =
          (config.headers['X-Trace-Id'] as string) ||
          (config.headers['x-trace-id'] as string);
        const traceId = explicit || generateTraceId();
        config.headers['X-Trace-Id'] = traceId;

        // 2) 在请求阶段就更新一次 store（保证请求刚发出去 UI 也能看到）
        useGlobalStore.getState().setLastTraceId(traceId);
        persistTraceId(traceId);

        // 3) 注入 token
        if (this.token) {
          config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        // 4) 注入时间戳（后端暂未使用，预留）
        config.headers['X-Request-Time'] = new Date().toISOString();

        return config;
      },
      (error) => Promise.reject(error),
    );

    // 响应拦截器：回填 trace_id + 统一错误处理
    this.instance.interceptors.response.use(
      (response) => {
        // 成功路径：以后端响应头为准（防止上游替换/代理导致 header 缺失，body 里也有 trace_id）
        const headerTraceId =
          (response.headers['x-trace-id'] as string | undefined) ||
          (response.data as any)?.trace_id;
        if (headerTraceId) {
          useGlobalStore.getState().setLastTraceId(headerTraceId);
          persistTraceId(headerTraceId);
        }
        return response.data;
      },
      (error: AxiosError<ApiError>) => {
        // 错误路径：先从 响应头 / body 拿 trace_id，回填 store
        const headerTraceId = error.response?.headers?.['x-trace-id'];
        const bodyTraceId = error.response?.data?.trace_id;
        const traceId = headerTraceId || bodyTraceId || '';
        if (traceId) {
          useGlobalStore.getState().setLastTraceId(traceId);
          persistTraceId(traceId);
        }
        return this.handleError(error);
      },
    );
  }

  /**
   * 统一错误处理
   */
  private handleError(error: AxiosError<ApiError>): never {
    if (error.response?.data) {
      const apiError = error.response.data;
      handleApiError(apiError);
      throw new BizError(apiError);
    }

    // 网络错误（无响应）：仍然保留当前 store 里的 lastTraceId（即本次请求发出去的 id）
    if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请稍后重试');
    } else if (error.message === 'Network Error') {
      message.error('网络异常，请检查网络连接');
    } else {
      message.error(`请求失败：${error.message}`);
    }

    throw error;
  }

  /**
   * 设置 token
   */
  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('timetrack_token', token);
    } else {
      localStorage.removeItem('timetrack_token');
    }
  }

  /**
   * 获取当前 token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * GET 请求
   */
  async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    const config: AxiosRequestConfig = { params };
    const res = await this.instance.get(url, config);
    return res as T;
  }

  /**
   * POST 请求
   */
  async post<T = any>(url: string, data?: any): Promise<T> {
    const res = await this.instance.post(url, data);
    return res as T;
  }

  /**
   * PUT 请求
   */
  async put<T = any>(url: string, data?: any): Promise<T> {
    const res = await this.instance.put(url, data);
    return res as T;
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    const res = await this.instance.delete(url, { params });
    return res as T;
  }

  /**
   * 文件下载
   */
  async download(url: string, params?: Record<string, any>, filename?: string): Promise<void> {
    const response = await this.instance.get(url, {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response as any]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
  }
}

/** 全局单例 */
export const apiClient = new ApiClient(
  import.meta.env.VITE_API_BASE_URL || '/api/v1',
);
