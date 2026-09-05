/**
 * M1 看板模块
 *
 * 实现 IModule 接口，挂载时订阅实时人员数据。
 */

import type { IModule, ModuleContext } from '../../core/registry/types';
import { Events } from '../../core/eventBus/events';
import { DashboardPage } from './pages/DashboardPage';

export const DashboardModule: IModule = {
  id: 'dashboard',
  name: '实时看板',
  version: '1.0.0',

  routes: [
    {
      path: '/dashboard',
      component: DashboardPage,
      requireAuth: true,
      meta: { title: '实时看板', icon: 'DashboardOutlined' },
    },
  ],

  navigation: {
    title: '实时看板',
    icon: 'DashboardOutlined',
    order: 1,
  },

  permissions: ['dashboard:view'],

  capabilities: {
    /** 看板对外暴露：当前在岗人数 */
    getOnSiteCount: async (ctx: ModuleContext) => {
      const data = await ctx.api.get<{ count: number }>(
        '/personnel/realtime/count',
      );
      return data.count;
    },
  },

  onMount: async (ctx) => {
    console.info('[Dashboard] 模块挂载');

    // 订阅实时人员数据
    ctx.ws.subscribe('personnel_realtime', (data) => {
      ctx.bus.emit(Events.PERSON_ENTER, data);
    });
  },

  onUnmount: async () => {
    console.info('[Dashboard] 模块卸载');
  },
};
