/**
 * 模块注册中心（微内核核心）
 *
 * 职责：
 * 1. 注册业务模块
 * 2. 管理模块生命周期（挂载/卸载）
 * 3. 解决模块依赖关系（拓扑排序）
 * 4. 提供路由和导航的统一入口
 *
 * 使用示例：
 *   moduleRegistry.register(DashboardModule);
 *   moduleRegistry.registerAll([M1, M2, M3, M4]);
 *   await moduleRegistry.mountAll(ctx);
 */

import type { IModule, IModuleRoute, ModuleContext } from './types';

class ModuleRegistry {
  private modules = new Map<string, IModule>();
  private mounted = new Set<string>();

  /**
   * 注册模块
   */
  register(module: IModule): void {
    if (this.modules.has(module.id)) {
      console.warn(`[ModuleRegistry] 模块 ${module.id} 已存在，将被覆盖`);
    }
    this.modules.set(module.id, module);
    console.info(`[ModuleRegistry] 注册模块: ${module.id}@${module.version}`);
  }

  /**
   * 批量注册
   */
  registerAll(modules: IModule[]): void {
    modules.forEach((m) => this.register(m));
  }

  /**
   * 挂载所有模块（按依赖顺序）
   */
  async mountAll(ctx: ModuleContext): Promise<void> {
    const sorted = this.topoSort();
    console.info(`[ModuleRegistry] 挂载顺序: ${sorted.join(' → ')}`);

    for (const id of sorted) {
      await this.mount(id, ctx);
    }
  }

  /**
   * 挂载单个模块
   */
  async mount(id: string, ctx: ModuleContext): Promise<void> {
    const mod = this.modules.get(id);
    if (!mod) {
      throw new Error(`[ModuleRegistry] 模块不存在: ${id}`);
    }
    if (this.mounted.has(id)) {
      return;
    }

    // 先挂载依赖
    if (mod.dependencies) {
      for (const dep of mod.dependencies) {
        await this.mount(dep, ctx);
      }
    }

    if (mod.onMount) {
      await mod.onMount(ctx);
    }
    this.mounted.add(id);
    console.info(`[ModuleRegistry] 已挂载: ${id}`);
  }

  /**
   * 卸载模块
   */
  async unmount(id: string, ctx: ModuleContext): Promise<void> {
    const mod = this.modules.get(id);
    if (!mod || !this.mounted.has(id)) {
      return;
    }
    if (mod.onUnmount) {
      await mod.onUnmount(ctx);
    }
    this.mounted.delete(id);
    console.info(`[ModuleRegistry] 已卸载: ${id}`);
  }

  /**
   * 获取模块
   */
  get(id: string): IModule | undefined {
    return this.modules.get(id);
  }

  /**
   * 获取所有路由（扁平化）
   */
  getAllRoutes(): IModuleRoute[] {
    const allRoutes: IModuleRoute[] = [];
    this.modules.forEach((m) => {
      allRoutes.push(...m.routes);
    });
    return allRoutes;
  }

  /**
   * 获取所有导航菜单（按 order 排序）
   */
  getAllNavigation(): Array<{
    id: string;
    path: string;
    title: string;
    icon?: string;
    order: number;
  }> {
    const navs: Array<{
      id: string;
      path: string;
      title: string;
      icon?: string;
      order: number;
    }> = [];

    this.modules.forEach((m) => {
      if (m.navigation && m.routes.length > 0) {
        const mainRoute = m.routes[0];
        navs.push({
          id: m.id,
          path: mainRoute.path,
          title: m.navigation.title,
          icon: m.navigation.icon,
          order: m.navigation.order ?? 999,
        });
      }
    });

    return navs.sort((a, b) => a.order - b.order);
  }

  /**
   * 获取所有已挂载模块的能力
   */
  getAllCapabilities(): Record<string, Record<string, (...args: any[]) => any>> {
    const caps: Record<string, Record<string, (...args: any[]) => any>> = {};
    this.modules.forEach((m) => {
      if (m.capabilities) {
        caps[m.id] = m.capabilities;
      }
    });
    return caps;
  }

  /**
   * 获取某个模块的能力
   */
  getCapability(moduleId: string): Record<string, (...args: any[]) => any> | undefined {
    const mod = this.modules.get(moduleId);
    return mod?.capabilities;
  }

  /**
   * 拓扑排序（按依赖关系）
   */
  private topoSort(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>(); // 用于检测循环依赖
    const result: string[] = [];

    const dfs = (id: string) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        throw new Error(`[ModuleRegistry] 检测到循环依赖: ${id}`);
      }
      visiting.add(id);

      const mod = this.modules.get(id);
      if (mod?.dependencies) {
        mod.dependencies.forEach((dep) => {
          if (!this.modules.has(dep)) {
            throw new Error(`[ModuleRegistry] 模块 ${id} 依赖的 ${dep} 不存在`);
          }
          dfs(dep);
        });
      }

      visiting.delete(id);
      visited.add(id);
      result.push(id);
    };

    this.modules.forEach((_, id) => dfs(id));
    return result;
  }

  /**
   * 调试用：获取当前所有模块状态
   */
  debug(): void {
    console.table(
      Array.from(this.modules.entries()).map(([id, m]) => ({
        id,
        name: m.name,
        version: m.version,
        mounted: this.mounted.has(id),
        routes: m.routes.length,
        capabilities: Object.keys(m.capabilities || {}).length,
      })),
    );
  }
}

/** 全局单例 */
export const moduleRegistry = new ModuleRegistry();
