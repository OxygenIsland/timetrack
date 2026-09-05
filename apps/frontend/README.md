# TimeTrack - 前端

> 智能摄像头工时统计系统 - Electron 桌面应用

## 📋 技术栈

- **桌面框架**: Electron 32
- **构建工具**: Vite 5
- **UI 框架**: React 18 + TypeScript 5 (strict)
- **UI 组件库**: Ant Design 5
- **状态管理**: Zustand + TanStack Query
- **路由**: React Router 6
- **实时通信**: WebSocket (reconnecting-websocket)
- **包管理**: pnpm

## 📂 目录结构

```
apps/frontend/
├── electron/                 ← Electron 主进程
│   ├── main.ts              ← 主进程入口
│   └── preload.ts           ← 预加载脚本
├── src/
│   ├── main.tsx             ← 应用入口
│   ├── App.tsx              ← 根组件
│   │
│   ├── core/                ← 框架核心 ⭐
│   │   ├── registry/        ← 模块注册中心（微内核）
│   │   ├── eventBus/        ← 事件总线
│   │   ├── api/             ← API 客户端
│   │   ├── error/           ← 错误码体系集成
│   │   ├── ws/              ← WebSocket 管理
│   │   └── auth/            ← 鉴权
│   │
│   ├── modules/             ← 业务模块 ⭐
│   │   ├── dashboard/       ← M1 看板
│   │   ├── records/         ← M2 人员记录
│   │   ├── workhour/        ← M3 工时
│   │   ├── report/          ← M4 报表
│   │   └── system/          ← 系统管理
│   │
│   ├── components/          ← UI 组件
│   │   ├── common/          ← 通用组件（跨业务）
│   │   ├── domain/          ← 业务组件
│   │   └── layout/          ← 布局组件
│   │
│   ├── stores/              ← 全局 Store
│   ├── router/              ← 路由
│   ├── types/               ← 全局类型
│   └── styles/              ← 全局样式
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装 Node.js >= 18
node -v  # 应输出 v18+

# 安装 pnpm
npm install -g pnpm
```

### 2. 安装依赖

```bash
# 在项目根目录
cd /Users/albert/Documents/TimeTrack

# 安装所有 workspace 依赖
pnpm install
```

### 3. 启动开发

```bash
# 启动前端（Electron + Vite）
pnpm dev
```

启动后会：
- Vite dev server 启动在 `http://localhost:5173`
- Electron 启动并自动连接到 Vite dev server
- 后端服务（FastAPI）需要单独启动（详见后端 README）

### 4. 单独启动

```bash
# 只启动 Vite（不开 Electron，用于浏览器调试）
cd apps/frontend
pnpm dev:vite

# 只启动 Electron（前提：Vite 已启动）
cd apps/frontend
pnpm dev:electron
```

## 📦 构建生产

```bash
# 构建前端
pnpm build

# 打包 Electron 应用
pnpm build:electron
```

打包产物在 `apps/frontend/dist-electron/` 和 `apps/frontend/dist/`。

## 🏗️ 架构设计

### 模块注册机制（微内核）

每个业务模块实现 `IModule` 接口，通过 `moduleRegistry` 注册：

```typescript
// modules/dashboard/index.ts
export const DashboardModule: IModule = {
  id: 'dashboard',
  name: '看板',
  version: '1.0.0',
  routes: [{ path: '/dashboard', component: DashboardPage }],
  navigation: { title: '看板', icon: 'DashboardOutlined', order: 1 },
  capabilities: { /* ... */ },
  onMount: async (ctx) => { /* 挂载逻辑 */ },
};
```

主入口注册所有模块：

```typescript
// main.tsx
moduleRegistry.registerAll([
  SystemModule,
  DashboardModule,
  RecordsModule,
  WorkHourModule,
  ReportModule,
]);
await moduleRegistry.mountAll(ctx);
```

### UI 与业务三层分离

每个业务模块内部分三层：

```
modules/<module>/
├── pages/         ← 路由入口（仅组合 Container）
├── containers/    ← 业务逻辑、状态管理（未来可加）
└── components/    ← 纯 UI 组件（无业务逻辑）
```

### 错误码体系

所有 API 错误必须走 `docs/错误码体系规范.md` 定义的错误码，详见 `src/core/error/`。

## 📚 文档

- 架构设计：`../../../docs/前端架构设计文档.md`
- 错误码规范：`../../../docs/错误码体系规范.md`
- 后端架构：`../../../docs/后端架构设计文档.md`
- 技术路线：`../../../docs/技术路线设计文档.md`

## 🔧 常用命令

```bash
# 类型检查
pnpm type-check

# ESLint 检查
pnpm lint:check

# ESLint 自动修复
pnpm lint

# 格式化代码（在项目根目录）
pnpm format
```

## ⚠️ 当前状态

✅ **骨架已完成**：
- Electron + Vite + React + TS 基础工程
- 模块注册机制 + 4 个业务模块骨架 + 系统模块
- 通用 UI 组件库（ErrorBoundary、PageContainer、DataTable、EmptyState、StatusTag、LoadingMask）
- 业务组件（CameraViewer 占位）
- 错误码体系前端集成（71 个错误码）
- WebSocket 管理（自动重连、心跳、订阅）
- API 客户端（注入 trace_id、token、统一错误处理）
- 主布局（侧边栏 + 顶栏 + 状态指示）

🟡 **待完成**：
- 各业务模块页面具体实现（Container + Component）
- MediaMTX 视频流接入（WHEP 协议）
- 后端 API 对接
- 单元测试
- 打包脚本完善（electron-builder 配置）

## 🔗 一期开发建议顺序

1. **对接后端 API**（登录、获取摄像头列表）
2. **M1 看板**：接入视频流 + 实时人员数据
3. **M2 人员记录**：实现表格 + 详情 + 回放
4. **M3 工时**：实现规则配置 + 实时累计 + 修正审计
5. **M4 报表**：实现生成 + 导出 + 图表
6. **打包发布**
