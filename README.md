# TimeTrack - 智能摄像头工时统计系统

> 单人全栈项目 · Electron 桌面应用 · 智能摄像头工时统计

[![License](https://img.shields.io/badge/license-UNLICENSED-red)]()
[![Frontend](https://img.shields.io/badge/frontend-React%2018-61dafb)]()
[![Backend](https://img.shields.io/badge/backend-FastAPI-009688)]()
[![Node](https://img.shields.io/badge/node-%E2%89%A518-339933)]()
[![Python](https://img.shields.io/badge/python-3.11-3776ab)]()

## 项目简介

TimeTrack 是一套基于摄像头的人员行为识别与工时统计系统。通过摄像头实时识别在岗 / 离岗 / 出入车间等行为，结合工时规则自动生成人员记录与统计报表。

- **应用形态**：Electron 桌面应用（同时支持 Web 启动）
- **后端框架**：FastAPI + SQLAlchemy + SQLite（一期）
- **前端框架**：Electron 32 + Vite 5 + React 18 + TypeScript 5 + Ant Design 5

## ✨ 功能特性（一期）

- 📊 **实时看板**：展示当前在岗人数、摄像头状态、关键指标
- 👥 **人员记录**：人员出入事件列表与详情，支持分页与多维过滤
- ⏱️ **工时管理**：工时规则配置、工时记录查询、工时修正申请
- 📈 **报表中心**：按人 / 按车间 / 按时间段生成统计报表，支持导出
- 🛠️ **系统管理**：系统状态监控、日志查看、基础配置

## 📂 仓库结构

```
timetrack/
├── apps/
│   ├── frontend/                 ← 前端（Electron + React + TS）
│   └── backend/                  ← 后端（FastAPI + Python + SQLite）
├── docs/                         ← 设计文档
│   ├── 后端需求-核心需求.md
│   ├── 后端需求-拓展需求.md
│   ├── 前端需求-核心需求.md
│   ├── 前端需求-拓展需求.md
│   ├── 后端架构设计文档.md
│   ├── 前端架构设计文档.md
│   ├── 技术路线设计文档.md
│   └── 错误码体系规范.md
├── package.json                  ← pnpm workspace 根
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .prettierrc.json
└── .gitignore
```

## 🧱 子项目

| 子项目 | 技术栈 | 说明 |
|--------|--------|------|
| [`apps/frontend`](./apps/frontend/README.md) | Electron 32 + Vite 5 + React 18 + TS 5 + Ant Design 5 | 桌面应用前端，含主进程 / 预加载 / 渲染层 |
| [`apps/backend`](./apps/backend/README.md) | Python 3.11 + FastAPI + SQLAlchemy 2 + SQLite + Loguru | REST API 服务，依赖由 `uv` 管理 |

## 🚀 快速开始

### 环境要求

| 工具 | 版本 | 用途 |
|------|------|------|
| Node.js | ≥ 18 | 前端构建与运行 |
| pnpm | ≥ 8 | Monorepo 包管理 |
| uv | 最新版 | 后端依赖与虚拟环境管理 |
| Python | 3.11 | 后端运行（uv 会自动安装） |

### 1. 安装 Node 端依赖

```bash
pnpm install
```

### 2. 启动前端（开发模式）

```bash
# 仅前端
pnpm dev

# 同时启动前端 + 后端
pnpm dev:all
```

### 3. 启动后端（开发模式）

```bash
# 单独启动后端
pnpm dev:backend

# 一键写入 Mock 数据 + 启动
pnpm dev:backend:seed
```

或在后端目录内手动操作：

```bash
cd apps/backend
uv sync --extra dev
cp .env.example .env
uv run python -m scripts.seed_db   # 初始化 Mock 数据
uv run uvicorn app.main:app --reload --port 8000
```

前端默认地址：`http://localhost:5173`
后端默认地址：`http://127.0.0.1:8000`

## 🔧 常用命令

```bash
# 安装依赖
pnpm install

# 开发
pnpm dev                # 仅前端
pnpm dev:backend        # 仅后端
pnpm dev:all            # 同时启动前后端

# 构建
pnpm build              # 前端构建

# 数据初始化
pnpm dev:backend:seed   # 后端写入 Mock 数据

# 类型检查
pnpm type-check

# 代码检查
pnpm lint:check

# 代码格式化
pnpm format

# 清理构建产物
pnpm clean
```

后端独立命令：

```bash
cd apps/backend
uv run pytest           # 单元测试
uv run ruff check app scripts   # 代码检查
uv run black app scripts        # 代码格式化
```

## 📋 项目状态

| 模块 | 状态 | 说明 |
|------|------|------|
| 前端骨架 | ✅ 完成 | Electron + Vite + React + TS |
| 前端架构 | ✅ 完成 | 模块注册中心、UI / 业务分离 |
| 前端核心模块 | ✅ 完成 | Dashboard / Records / WorkHour / Report / System |
| 后端骨架 | ✅ 完成 | FastAPI + SQLAlchemy + SQLite |
| 前端 - TraceId 联动 | ✅ 完成 | axios 请求头注入 + 响应头/错误体回填 + 状态栏一键复制 |
| 后端 - 健康检查 | ✅ 完成 | `/api/v1/health` |
| 后端 - 人员事件接口 | ✅ 完成 | `/api/v1/personnel/events` |
| 视频流 | 🟡 待接入 | MediaMTX + WHEP |
| 算法对接 | 🟡 待对接 | YOLOv8 + ByteTrack + OSNet ReID |
| 鉴权体系 | 🟡 待搭建 | JWT + RBAC |
| 持久化升级 | 🟡 待规划 | SQLite → PostgreSQL + TimescaleDB |
| 打包发布 | 🟡 待完成 | electron-builder |

## 🛠 技术栈总览

**前端**：Electron 32 + Vite 5 + React 18 + TypeScript 5 + Ant Design 5 + Zustand + TanStack Query + React Router 6

**后端**：Python 3.11 + FastAPI + SQLAlchemy 2.0 + Pydantic v2 + SQLite + Loguru（uv 管理依赖）

**算法（待对接）**：YOLOv8 + ByteTrack + OSNet ReID

**视频流（待接入）**：MediaMTX + WHEP

详见 [技术路线设计文档.md](./docs/技术路线设计文档.md)

## 📚 设计文档

- 需求
  - [后端需求-核心需求.md](./docs/后端需求-核心需求.md)
  - [后端需求-拓展需求.md](./docs/后端需求-拓展需求.md)
  - [前端需求-核心需求.md](./docs/前端需求-核心需求.md)
  - [前端需求-拓展需求.md](./docs/前端需求-拓展需求.md)
- 架构设计
  - [后端架构设计文档.md](./docs/后端架构设计文档.md)
  - [前端架构设计文档.md](./docs/前端架构设计文档.md)
- 规范
  - [技术路线设计文档.md](./docs/技术路线设计文档.md)
  - [错误码体系规范.md](./docs/错误码体系规范.md)

## 📝 开发规范

- **TypeScript Strict**：启用所有严格检查
- **ESLint + Prettier**：代码风格统一
- **目录结构**：按业务模块划分，每个模块内部三层分离（pages / containers / components）
- **错误码**：所有异常必须使用 [错误码体系规范.md](./docs/错误码体系规范.md) 中定义的错误码
- **依赖管理**
  - 前端：`pnpm`（workspace）
  - 后端：`uv`（PEP 621 / PEP 735）
- **Git 提交**：建议使用 conventional commits

## 🤝 贡献

本项目为单人全栈项目，暂不接收外部贡献。

## 📄 许可

UNLICENSED - 仅供内部使用。
