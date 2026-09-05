/**
 * 事件总线（轻量级，跨模块异步通知）
 *
 * 使用场景：
 * - 跨模块的事件通知（人员进入 → 看板更新 + 工时累计）
 * - 调用方不关心响应方是谁
 *
 * 注意：同模块内部优先用 store 通信，跨模块才用 EventBus。
 */

type EventHandler = (data: any) => void | Promise<void>;

class EventBus {
  private handlers = new Map<string, EventHandler[]>();

  /**
   * 订阅事件，返回取消订阅函数
   */
  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);

    // 返回取消订阅函数
    return () => this.off(event, handler);
  }

  /**
   * 取消订阅
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx > -1) {
        handlers.splice(idx, 1);
      }
    }
  }

  /**
   * 发布事件（异步）
   */
  async emit(event: string, data?: any): Promise<void> {
    const handlers = this.handlers.get(event) || [];
    const results = handlers.map((h) => {
      try {
        return Promise.resolve(h(data));
      } catch (err) {
        console.error(`[EventBus] 事件处理器异常: ${event}`, err);
        return null;
      }
    });
    await Promise.all(results);
  }

  /**
   * 清空所有订阅（慎用）
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * 调试：获取所有事件名
   */
  getEventNames(): string[] {
    return Array.from(this.handlers.keys());
  }
}

/** 全局单例 */
export const eventBus = new EventBus();
