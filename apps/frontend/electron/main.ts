import { app, BrowserWindow, shell, ipcMain } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

// 单实例锁
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

// 后端服务进程（开发时由 Vite 代理后端，生产时由 Electron 启动）
function startBackendService() {
  if (process.env.NODE_ENV === 'development') {
    // 开发模式：后端由 FastAPI 独立启动（uvicorn），不在 Electron 内部启动
    console.log('[Electron] 开发模式：后端服务由 uvicorn 独立启动');
    return;
  }

  // 生产模式：启动打包后的后端可执行文件
  const backendPath = path.join(process.resourcesPath, 'backend', 'timetrack-backend.exe');
  console.log('[Electron] 启动后端服务:', backendPath);

  backendProcess = spawn(backendPath, [], {
    stdio: 'pipe',
    env: {
      ...process.env,
      TIMETRACK_CONFIG_DIR: path.join(app.getPath('userData'), 'config'),
      TIMETRACK_LOG_DIR: path.join(app.getPath('userData'), 'logs'),
    },
  });

  backendProcess.stdout?.on('data', (data) => {
    console.log(`[Backend] ${data.toString().trim()}`);
  });

  backendProcess.stderr?.on('data', (data) => {
    console.error(`[Backend Error] ${data.toString().trim()}`);
  });

  backendProcess.on('exit', (code) => {
    console.error(`[Backend] 进程退出，code=${code}`);
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    title: 'TimeTrack - 智能工时统计系统',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 开发模式加载 Vite dev server，生产模式加载打包后的 HTML
  if (process.env.NODE_ENV === 'development') {
    // vite-plugin-electron 启动时会传 VITE_DEV_SERVER_URL
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devUrl);
    // 自动打开 DevTools（F12 切换）
    if (process.env.OPEN_DEVTOOLS !== 'false') {
      mainWindow.webContents.openDevTools();
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // 外部链接用默认浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC 处理器（给 preload 暴露的 API）
ipcMain.handle('app:getVersion', () => app.getVersion());
ipcMain.handle('app:getUserDataPath', () => app.getPath('userData'));
ipcMain.handle('app:openLogFolder', () => {
  const logDir = path.join(app.getPath('userData'), 'logs');
  shell.openPath(logDir);
});

// 应用生命周期
app.whenReady().then(() => {
  startBackendService();

  // 等待后端启动（最多 10 秒）
  if (process.env.NODE_ENV !== 'development') {
    setTimeout(createMainWindow, 3000);
  } else {
    createMainWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // 关闭所有窗口时退出应用（包括 macOS，避免后台残留进程）
  app.quit();
});

app.on('before-quit', () => {
  // 关闭后端进程
  if (backendProcess) {
    console.log('[Electron] 关闭后端进程');
    backendProcess.kill();
    backendProcess = null;
  }
});

// 强制退出时清理后端
app.on('will-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});

// 单实例锁：第二个实例启动时聚焦到已有窗口
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});
