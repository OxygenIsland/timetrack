/**
 * 应用入口
 *
 * 1. 初始化鉴权
 * 2. 注册所有业务模块（实现 IModule 接口）
 * 3. 挂载所有模块
 * 4. 建立 WebSocket 连接
 * 5. 渲染应用
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

import { moduleRegistry } from './core/registry/ModuleRegistry';
import { apiClient } from './core/api/apiClient';
import { wsManager } from './core/ws/wsManager';
import { eventBus } from './core/eventBus/EventBus';
import { useGlobalStore } from './stores/globalStore';
import { auth } from './core/auth/auth';

import {
  SystemModule,
  DashboardModule,
  RecordsModule,
  WorkHourModule,
  ReportModule,
} from './modules';

async function bootstrap() {
  // 1. 初始化鉴权（从 localStorage 恢复）
  auth.init();

  // 2. 注册所有业务模块
  // 顺序无关，会自动拓扑排序
  moduleRegistry.registerAll([
    SystemModule,
    DashboardModule,
    RecordsModule,
    WorkHourModule,
    ReportModule,
  ]);

  console.info('[Bootstrap] 已注册模块:', moduleRegistry.getAllRoutes().length, '个路由');

  // 3. 构建模块上下文
  const ctx = {
    user: auth.getUser(),
    api: apiClient,
    ws: wsManager,
    bus: eventBus,
    store: useGlobalStore,
  };

  // 4. 挂载所有模块（按依赖顺序）
  try {
    await moduleRegistry.mountAll(ctx);
    moduleRegistry.debug();
  } catch (err) {
    console.error('[Bootstrap] 模块挂载失败', err);
  }

  // 5. 建立 WebSocket 连接（开发环境后端可能未启动，静默失败）
  if (import.meta.env.DEV) {
    // 开发环境不强制连接
  } else {
    try {
      wsManager.connect();
      useGlobalStore.getState().setWsConnected(wsManager.isConnected());
    } catch {
      // 静默
    }
  }

  // 6. 设置全局 store 用户
  if (auth.getUser()) {
    useGlobalStore.getState().setUser(auth.getUser());
  }

  // 7. 渲染应用
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement,
  );

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );

  console.info('[Bootstrap] 应用启动完成');
}

bootstrap().catch((err) => {
  console.error('[Bootstrap] 应用启动失败', err);
  // 显示错误提示（避免白屏）
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <h2 style="color: #ff4d4f;">应用启动失败</h2>
        <pre style="text-align: left; background: #f5f5f5; padding: 16px; border-radius: 4px;">${String(
          err,
        )}</pre>
      </div>
    `;
  }
});
