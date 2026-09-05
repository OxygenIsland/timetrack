/**
 * 系统模块（提供基础能力，最先注册）
 */

import type { IModule } from '../../core/registry/types';
import { SystemStatusPage } from './pages/SystemStatusPage';
import { SystemLogsPage } from './pages/SystemLogsPage';

export const SystemModule: IModule = {
  id: 'system',
  name: '系统',
  version: '1.0.0',

  routes: [
    {
      path: '/system/status',
      component: SystemStatusPage,
      requireAuth: true,
      meta: { title: '系统状态', icon: 'SettingOutlined' },
    },
    {
      path: '/system/logs',
      component: SystemLogsPage,
      requireAuth: true,
      meta: { title: '系统日志', icon: 'FileTextOutlined' },
    },
  ],

  navigation: {
    title: '系统管理',
    icon: 'SettingOutlined',
    order: 99,
  },

  permissions: ['system:view', 'system:logs:view'],
};
