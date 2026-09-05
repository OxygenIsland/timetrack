/**
 * M2 人员记录模块
 */

import type { IModule } from '../../core/registry/types';
import { RecordsPage } from './pages/RecordsPage';
import { RecordDetailPage } from './pages/RecordDetailPage';

export const RecordsModule: IModule = {
  id: 'records',
  name: '人员记录',
  version: '1.0.0',

  routes: [
    {
      path: '/records',
      component: RecordsPage,
      requireAuth: true,
      meta: { title: '人员记录', icon: 'UnorderedListOutlined' },
    },
    {
      path: '/records/:id',
      component: RecordDetailPage,
      requireAuth: true,
      meta: { title: '记录详情', hideInMenu: true },
    },
  ],

  navigation: {
    title: '人员记录',
    icon: 'UnorderedListOutlined',
    order: 2,
  },

  permissions: ['records:view'],

  capabilities: {
    getRecentRecords: async (ctx, params?: Record<string, any>) => {
      return ctx.api.get('/personnel/events', params);
    },
  },
};
