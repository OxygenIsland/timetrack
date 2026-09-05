# TimeTrack Backend

FastAPI + SQLAlchemy + SQLite 后端服务。

## 一期目标

打通前后端基础链路，验证架构合理性。

**当前覆盖接口**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/health` | 健康检查 |
| GET | `/api/v1/personnel/events` | 人员事件列表（分页 + 过滤） |
| GET | `/api/v1/personnel/events/{id}` | 人员事件详情 |

## 快速开始

### 1. 安装 uv（一次性的，10 秒）

如果你已经装了 uv，跳过这一步。

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# 或 brew
brew install uv
```

### 2. 一键同步依赖

```bash
cd apps/backend

# uv 自动做这些事：
#   - 读 .python-version → 自动下载 Python 3.11（如果本机没有）
#   - 读 pyproject.toml → 解析依赖
#   - 创建 .venv/
#   - 安装所有包 + 生成 uv.lock
uv sync --extra dev
```

**对比传统做法**：

```bash
# 老派：5 步 + 容易出错
python3 -m venv .venv          # 3.14 上可能炸
source .venv/bin/activate     # 需要手动激活
pip install -e ".[dev]"       # 受 PEP 668 限制可能炸

# uv：1 步搞定，跨平台一致
uv sync --extra dev
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 默认配置即可，一期不需要改
```

### 4. 初始化数据库 + 写入 Mock 数据

```bash
uv run python -m scripts.seed_db
```

**为什么用 `uv run` 而不是直接 `python`**？

`uv run` 会自动激活 `.venv`，你**永远不需要手动 source**。任何 Python 命令（pytest、python、pip、ruff）都可以这样调用。

### 5. 启动服务

```bash
uv run uvicorn app.main:app --reload --port 8000
```

或者更简单：

```bash
pnpm dev        # pnpm 直接代理到 uv run
```

打开浏览器访问：

- Swagger UI：<http://127.0.0.1:8000/docs>
- ReDoc：<http://127.0.0.1:8000/redoc>
- 健康检查：<http://127.0.0.1:8000/api/v1/health>

### 6. 测试接口

```bash
# 查询前 5 条事件
curl 'http://127.0.0.1:8000/api/v1/personnel/events?page=1&page_size=5'

# 按摄像头过滤
curl 'http://127.0.0.1:8000/api/v1/personnel/events?camera_id=cam_01'
```

## 与前端联调

后端起在 8000 端口后，需要让前端 Vite dev server（5173）代理 `/api/v1/*` 到 `http://127.0.0.1:8000`。

在 `apps/frontend/vite.config.ts` 的 `server` 块加：

```typescript
server: {
  port: 5173,
  strictPort: true,
  host: '127.0.0.1',
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
    },
  },
},
```

## 目录结构

```
apps/backend/
├── app/
│   ├── api/v1/           # API 路由（v1 版本）
│   │   ├── health.py
│   │   └── personnel_events.py
│   ├── core/             # 核心：配置、错误码、异常
│   │   ├── config.py
│   │   ├── error_codes.py
│   │   └── exceptions.py
│   ├── db/               # 数据库：会话、引擎
│   │   └── session.py
│   ├── models/           # SQLAlchemy ORM Model
│   │   └── personnel_event.py
│   ├── schemas/          # Pydantic 数据契约
│   │   └── personnel_event.py
│   ├── services/         # 业务逻辑层
│   │   └── personnel_event_service.py
│   └── main.py           # FastAPI 应用入口
├── scripts/              # 一次性脚本（建表、灌数据）
│   └── seed_db.py
├── data/                 # 运行时数据（SQLite、日志）—— git 忽略
├── tests/                # pytest 测试
├── pyproject.toml
└── .env.example
```

## 错误响应规范

所有错误响应严格对齐 `docs/错误码体系规范.md`：

```json
{
  "code": "E-EVT-001",
  "http_status": 404,
  "message": "人员事件记录不存在",
  "trace_id": "abc123def456",
  "timestamp": "2026-09-05T18:30:15+00:00",
  "path": "/api/v1/personnel/events/xxx",
  "details": { "event_id": "xxx" },
  "suggestion": null
}
```
