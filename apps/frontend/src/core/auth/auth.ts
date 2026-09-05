/**
 * 鉴权（简化版）
 *
 * 一期：单用户本地应用，简化处理
 * 二期：可扩展为多用户、角色权限
 */

import type { IUser } from '../registry/types';

const TOKEN_KEY = 'timetrack_token';
const USER_KEY = 'timetrack_user';

class Auth {
  private user: IUser | null = null;

  /**
   * 初始化（从 localStorage 恢复）
   */
  init(): void {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch {
        this.user = null;
      }
    }
  }

  /**
   * 登录（简化版，一期默认本地管理员）
   */
  async login(username: string, password: string): Promise<IUser> {
    // 一期：固定本地管理员账户
    if (username === 'admin' && password === 'admin') {
      this.user = {
        id: 'u_001',
        username: 'admin',
        displayName: '系统管理员',
        permissions: ['*'], // 一期全权限
      };
      localStorage.setItem(USER_KEY, JSON.stringify(this.user));
      localStorage.setItem(TOKEN_KEY, 'local-admin-token');
      return this.user;
    }
    throw new Error('用户名或密码错误');
  }

  /**
   * 登出
   */
  logout(): void {
    this.user = null;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  /**
   * 获取当前用户
   */
  getUser(): IUser | null {
    return this.user;
  }

  /**
   * 是否已登录
   */
  isAuthenticated(): boolean {
    return this.user !== null;
  }

  /**
   * 是否有权限
   */
  hasPermission(permission: string): boolean {
    if (!this.user) return false;
    if (this.user.permissions.includes('*')) return true;
    return this.user.permissions.includes(permission);
  }
}

export const auth = new Auth();
