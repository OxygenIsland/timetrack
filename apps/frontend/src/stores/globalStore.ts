/**
 * 全局 store
 */

import { create } from 'zustand';
import type { IUser } from '../core/registry/types';

export interface GlobalState {
  /** 当前用户 */
  user: IUser | null;
  /** 系统状态 */
  systemStatus: 'normal' | 'degraded' | 'error';
  /** WebSocket 连接状态 */
  wsConnected: boolean;
  /** 折叠侧边栏 */
  sidebarCollapsed: boolean;
  /** 最近一次接口的 trace_id（用于排障时一键复制给后端） */
  lastTraceId: string;

  // Actions
  setUser: (user: IUser | null) => void;
  setSystemStatus: (status: 'normal' | 'degraded' | 'error') => void;
  setWsConnected: (connected: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLastTraceId: (traceId: string) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  user: null,
  systemStatus: 'normal',
  wsConnected: false,
  sidebarCollapsed: false,
  lastTraceId: '',

  setUser: (user) => set({ user }),
  setSystemStatus: (systemStatus) => set({ systemStatus }),
  setWsConnected: (wsConnected) => set({ wsConnected }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setLastTraceId: (lastTraceId) =>
    set(typeof lastTraceId === 'string' && lastTraceId ? { lastTraceId } : {}),
}));
