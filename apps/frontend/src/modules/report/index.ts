/**
 * M4 报表模块
 */

import type { IModule } from '../../core/registry/types';
import { ReportCenterPage } from './pages/ReportCenterPage';
import { ReportDetailPage } from './pages/ReportDetailPage';

export const ReportModule: IModule = {
  id: 'report',
  name: '报表',
  version: '1.0.0',

  routes: [
    {
      path: '/report',
      component: ReportCenterPage,
      requireAuth: true,
      meta: { title: '报表中心', icon: 'BarChartOutlined' },
    },
    {
      path: '/report/:id',
      component: ReportDetailPage,
      requireAuth: true,
      meta: { title: '报表详情', hideInMenu: true },
    },
  ],

  navigation: {
    title: '报表中心',
    icon: 'BarChartOutlined',
    order: 4,
  },

  permissions: ['report:view', 'report:export'],

  capabilities: {
    generateReport: async (ctx, params: Record<string, any>) => {
      return ctx.api.post('/reports/generate', params);
    },
    exportReport: async (ctx, reportId: string) => {
      return ctx.api.get(`/reports/${reportId}/download`);
    },
  },
};
