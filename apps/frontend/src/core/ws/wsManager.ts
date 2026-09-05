/**
 * WebSocket 管理器（自动重连、心跳、订阅频道）
 */

import ReconnectingWebSocket from 'reconnecting-websocket';
import type { IWSManager } from '../registry/types';

interface WSMessage {
  type: string;
  channel?: string;
  data?: unknown;
  timestamp?: string;
  trace_id?: string;
}

// 订阅/取消订阅消息用专用类型
interface SubscribeMessage {
  type: 'subscribe' | 'unsubscribe';
  channels: string[];
}

class WSManager implements IWSManager {
  private ws: ReconnectingWebSocket | null = null;
  private url: string;
  private handlers = new Map<string, Set<(data: unknown) => void>>();
  private heartbeatTimer: number | null = null;
  private subscribedChannels: Set<string> = new Set();

  constructor(url?: string) {
    this.url = url || import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/realtime';
  }

  /**
   * 建立连接
   */
  connect(): void {
    if (this.ws) return;

    this.ws = new ReconnectingWebSocket(this.url, [], {
      maxRetries: Infinity,
      connectionTimeout: 4000,
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
    });

    this.ws.addEventListener('open', () => {
      console.info('[WS] 连接已建立');
      // 重新订阅之前的频道
      if (this.subscribedChannels.size > 0) {
        this.send({
          type: 'subscribe',
          channels: Array.from(this.subscribedChannels),
        } as unknown as WSMessage);
      }
      this.startHeartbeat();
    });

    this.ws.addEventListener('message', (event) => {
      this.handleMessage(event.data);
    });

    this.ws.addEventListener('close', () => {
      console.warn('[WS] 连接已断开，将自动重连');
      this.stopHeartbeat();
    });

    this.ws.addEventListener('error', (event) => {
      console.error('[WS] 连接错误', event);
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 订阅频道
   */
  subscribe(channel: string, handler: (data: unknown) => void): () => void {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());

      // 首次订阅时通知服务器
      if (!this.subscribedChannels.has(channel)) {
        this.subscribedChannels.add(channel);
        if (this.isConnected()) {
          this.sendSubscribe('subscribe', [channel]);
        }
      }
    }
    this.handlers.get(channel)!.add(handler);

    // 返回取消订阅函数
    return () => this.unsubscribe(channel, handler);
  }

  /**
   * 取消订阅
   */
  unsubscribe(channel: string, handler: (data: unknown) => void): void {
    const set = this.handlers.get(channel);
    if (set) {
      set.delete(handler);
      if (set.size === 0) {
        this.handlers.delete(channel);
        this.subscribedChannels.delete(channel);
        if (this.isConnected()) {
          this.sendSubscribe('unsubscribe', [channel]);
        }
      }
    }
  }

  /**
   * 处理收到的消息
   */
  private handleMessage(raw: unknown): void {
    try {
      const msg: WSMessage = JSON.parse(String(raw));

      if (msg.type === 'pong') return;
      if (msg.type === 'error') {
        console.error('[WS] 服务端错误', msg);
        return;
      }

      if (msg.channel && this.handlers.has(msg.channel)) {
        const handlers = this.handlers.get(msg.channel)!;
        handlers.forEach((h) => {
          try {
            h(msg.data);
          } catch (err) {
            console.error(`[WS] 频道 ${msg.channel} 处理器异常`, err);
          }
        });
      }
    } catch (err) {
      console.error('[WS] 消息解析失败', err, raw);
    }
  }

  /**
   * 发送通用消息
   */
  private send(msg: WSMessage): void {
    if (this.ws && this.isConnected()) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  /**
   * 发送订阅/取消订阅
   */
  private sendSubscribe(type: 'subscribe' | 'unsubscribe', channels: string[]): void {
    if (this.ws && this.isConnected()) {
      const msg: SubscribeMessage = { type, channels };
      this.ws.send(JSON.stringify(msg));
    }
  }

  /**
   * 启动心跳（每 30 秒一次）
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

/** 全局单例 */
export const wsManager = new WSManager();
