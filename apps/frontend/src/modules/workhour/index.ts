/**
 * M3 工时模块
 */

import type { IModule } from '../../core/registry/types';
import { WorkHourRulePage } from './pages/WorkHourRulePage';
import { WorkHourRecordPage } from './pages/WorkHourRecordPage';
import { WorkHourCorrectionPage } from './pages/WorkHourCorrectionPage';

export const WorkHourModule: IModule = {
  id: 'workhour',
  name: '工时',
  version: '1.0.0',
  dependencies: ['records'],

  routes: [
    {
      path: '/workhour',
      component: WorkHourRulePage,
      requireAuth: true,
      meta: { title: '工时规则', icon: 'ClockCircleOutlined' },
    },
    {
      path: '/workhour/records',
      component: WorkHourRecordPage,
      requireAuth: true,
      meta: { title: '工时记录', hideInMenu: true },
    },
    {
      path: '/workhour/correction',
      component: WorkHourCorrectionPage,
      requireAuth: true,
      meta: { title: '工时修正', hideInMenu: true },
    },
  ],

  navigation: {
    title: '工时管理',
    icon: 'ClockCircleOutlined',
    order: 3,
  },

  permissions: ['workhour:view', 'workhour:edit'],

  capabilities: {
    getRealtimeWorkHour: async (ctx, globalId: string) => {
      return ctx.api.get(`/workhour/realtime/${globalId}`);
    },
    getTodayWorkHour: async (ctx, globalId: string) => {
      return ctx.api.get(`/workhour/today/${globalId}`);
    },
  },
};
