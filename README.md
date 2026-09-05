# TimeTrack - 智能摄像头工时统计系统

> 单人全栈项目 · Electron 桌面应用 · 智能摄像头工时统计

## 📂 仓库结构

```
TimeTrack/
├── apps/
│   └── frontend/              ← 前端（Electron + React）
├── docs/                      ← 设计文档
│   ├── 后端需求-核心需求.md
│   ├── 前端需求-核心需求.md
│   ├── 后端架构设计文档.md
│   ├── 前端架构设计文档.md
│   ├── 技术路线设计文档.md
│   └── 错误码体系规范.md
├── package.json               ← pnpm workspace 根
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .prettierrc.json
└── .gitignore
```

> ⚠️ **后端（FastAPI + Python）将在 `apps/backend/` 单独搭建**，
> 暂未实现（前端先行）。

## 🚀 快速开始

### 前端开发

```bash
# 安装依赖
pnpm install

# 启动开发（Electron + Vite）
pnpm dev
```

详见 [apps/frontend/README.md](./apps/frontend/README.md)

## 📚 设计文档

- [技术路线设计文档.md](./docs/技术路线设计文档.md) - 技术选型
- [后端架构设计文档.md](./docs/后端架构设计文档.md) - 后端模块划分
- [前端架构设计文档.md](./docs/前端架构设计文档.md) - 前端模块设计
- [错误码体系规范.md](./docs/错误码体系规范.md) - 前后端错误码统一规范
- [后端需求-核心需求.md](./docs/后端需求-核心需求.md)
- [前端需求-核心需求.md](./docs/前端需求-核心需求.md)

## 🔧 常用命令

```bash
# 安装依赖
pnpm install

# 启动开发
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm type-check

# 代码检查
pnpm lint:check

# 代码格式化
pnpm format
```

## 📋 项目状态

| 模块 | 状态 | 说明 |
|------|------|------|
| 前端骨架 | ✅ 完成 | Electron + Vite + React + TS |
| 前端架构 | ✅ 完成 | 模块注册、UI/业务分离 |
| 后端 | 🟡 待搭建 | FastAPI + Python |
| 视频流 | 🟡 待接入 | MediaMTX + WHEP |
| 算法 | 🟡 待对接 | 由算法工程师负责 |
| 打包 | 🟡 待完成 | electron-builder |

## 🛠 技术栈总览

**前端**：Electron 32 + Vite 5 + React 18 + TypeScript 5 + Ant Design 5 + Zustand + TanStack Query

**后端（待搭建）**：Python 3.11 + FastAPI + PostgreSQL + TimescaleDB

**算法（待对接）**：YOLOv8 + ByteTrack + OSNet ReID

详见 [技术路线设计文档.md](./docs/技术路线设计文档.md)

## 📝 开发规范

- **TypeScript Strict**：启用所有严格检查
- **ESLint + Prettier**：代码风格统一
- **目录结构**：按业务模块划分，每个模块内部三层分离（pages/containers/components）
- **错误码**：所有异常必须使用 [`错误码体系规范.md`](./docs/错误码体系规范.md) 中定义的错误码
- **Git 提交**：建议使用 conventional commits
