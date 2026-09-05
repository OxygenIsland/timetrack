/**
 * 全局类型声明
 */

declare global {
  interface Window {
    electronAPI?: {
      getAppVersion: () => Promise<string>;
      getUserDataPath: () => Promise<string>;
      openLogFolder: () => Promise<void>;
    };
  }
}

export {};
