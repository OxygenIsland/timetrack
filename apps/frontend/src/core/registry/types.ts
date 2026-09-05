/**
 * 业务模块标准化接口
 *
 * 每个业务模块（M1 看板、M2 记录、M3 工时、M4 报表）都实现这个接口。
 * 通过模块注册中心（ModuleRegistry）注入到应用中。
 */

import type { ComponentType } from 'react';

/** 业务模块接口 */
export interface IModule {
  /** 模块唯一标识（用于依赖、卸载、查询） */
  id: string;

  /** 模块显示名称 */
  name: string;

  /** 模块版本 */
  version: string;

  /** 模块挂载时调用（可选） */
  onMount?: (ctx: ModuleContext) => void | Promise<void>;

  /** 模块卸载时调用（可选） */
  onUnmount?: (ctx: ModuleContext) => void | Promise<void>;

  /** 模块提供的路由（可能多个） */
  routes: IModuleRoute[];

  /** 模块在导航栏的入口（可选） */
  navigation?: IModuleNavigation;

  /** 模块需要的权限点 */
  permissions?: string[];

  /** 模块依赖的其他模块 id */
  dependencies?: string[];

  /** 模块对外暴露的能力（其他模块可调用） */
  capabilities?: Record<string, (...args: any[]) => any>;
}

/** 模块路由 */
export interface IModuleRoute {
  /** 路由路径 */
  path: string;

  /** 路由组件（Container 组件） */
  component: ComponentType<any>;

  /** 子路由 */
  children?: IModuleRoute[];

  /** 是否需要鉴权 */
  requireAuth?: boolean;

  /** 需要的权限点 */
  permissions?: string[];

  /** 路由 meta 信息 */
  meta?: IRouteMeta;
}

/** 路由 meta */
export interface IRouteMeta {
  title?: string;
  icon?: string;
  hideInMenu?: boolean;
  [key: string]: any;
}

/** 模块导航菜单 */
export interface IModuleNavigation {
  title: string;
  icon?: string;
  /** 排序（越小越靠前） */
  order?: number;
  /** 父菜单 id */
  parent?: string;
}

/** 模块上下文（在 onMount 时注入） */
export interface ModuleContext {
  /** 当前用户 */
  user: IUser | null;
  /** API 客户端 */
  api: IApiClient;
  /** WebSocket 管理器 */
  ws: IWSManager;
  /** 事件总线 */
  bus: IEventBus;
  /** 全局 store */
  store: IGlobalStore;
}

/** 用户信息 */
export interface IUser {
  id: string;
  username: string;
  displayName: string;
  permissions: string[];
}

/** API 客户端接口 */
export interface IApiClient {
  get<T = any>(url: string, params?: Record<string, any>): Promise<T>;
  post<T = any>(url: string, data?: any): Promise<T>;
  put<T = any>(url: string, data?: any): Promise<T>;
  delete<T = any>(url: string, params?: Record<string, any>): Promise<T>;
}

/** WebSocket 管理器接口 */
export interface IWSManager {
  subscribe(channel: string, handler: (data: any) => void): () => void;
  unsubscribe(channel: string, handler: (data: any) => void): void;
  connect(): void;
  disconnect(): void;
  isConnected(): boolean;
}

/** 事件总线接口 */
export interface IEventBus {
  on(event: string, handler: (data: any) => void | Promise<void>): () => void;
  off(event: string, handler: (data: any) => void | Promise<void>): void;
  emit(event: string, data?: any): Promise<void>;
}

/** 全局 Store 接口 */
export interface IGlobalStore {
  getState(): any;
  setState(partial: any): void;
}
