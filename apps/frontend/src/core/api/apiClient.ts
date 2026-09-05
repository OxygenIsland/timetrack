/**
 * API 客户端（基于 axios）
 *
 * 职责：
 * - 统一请求/响应拦截
 * - 注入 trace_id
 * - 注入 token
 * - 统一错误处理
 * - 与错误码体系集成
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import type { IApiClient } from '../registry/types';
import type { ApiError } from '../error/types';
import { handleApiError, BizError } from '../error/handleApiError';

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
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 注入 trace_id
        const traceId = (config.headers['X-Trace-Id'] as string) || uuidv4();
        config.headers['X-Trace-Id'] = traceId;

        // 注入 token
        if (this.token) {
          config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        // 注入时间戳
        config.headers['X-Request-Time'] = new Date().toISOString();

        return config;
      },
      (error) => Promise.reject(error),
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError<ApiError>) => {
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

    // 网络错误（无响应）
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
