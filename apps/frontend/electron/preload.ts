import { contextBridge, ipcRenderer } from 'electron';

// 暴露给渲染进程的 API（白名单机制，避免 nodeIntegration 风险）
const api = {
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  getUserDataPath: () => ipcRenderer.invoke('app:getUserDataPath'),
  openLogFolder: () => ipcRenderer.invoke('app:openLogFolder'),
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
