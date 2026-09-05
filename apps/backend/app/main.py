"""TimeTrack 后端入口

启动方式（开发）：
    cd apps/backend
    uv run uvicorn app.main:app --reload --port 8000

启动方式（生产）：
    timetrack-backend
    或
    uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api import api_v1_router
from app.core.config import ensure_dirs, settings
from app.core.error_codes import ErrorCode
from app.core.exceptions import BizError, build_error_response
from app.core.logging import setup_logging
from app.core.middleware import TraceIdMiddleware
from app.db.session import init_db


# ===== 日志初始化（必须在任何业务 logger / uvicorn 启动之前） =====
setup_logging()


# ===== 应用生命周期 =====
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用启动/关闭钩子"""
    logger.info(f"🚀 TimeTrack Backend 启动 (env={settings.app_env})")
    ensure_dirs()  # 确保 data/ 和 data/logs/ 存在
    init_db()  # 一期：自动建表
    logger.info(f"✅ 数据库初始化完成: {settings.database_url}")
    yield
    logger.info("🛑 TimeTrack Backend 关闭")


# ===== FastAPI 应用实例 =====
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.app_debug,
    lifespan=lifespan,
    # OpenAPI 文档地址：/docs (Swagger UI) / /redoc (ReDoc)
)


# ===== 中间件（注意顺序：最后 add 的最外层，先执行） =====
# 1. CORS（最外层，处理跨域）
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Trace-Id"],  # 让前端能读到 trace_id
)

# 2. TraceId：放在 CORS 之后；这样无论是否跨域都能拿到 trace_id
app.add_middleware(TraceIdMiddleware)


# ===== 全局异常处理器（对齐 docs/错误码体系规范.md） =====

def _get_trace_id(request: Request) -> str:
    """优先从中间件注入的 request.state.trace_id 读取，兜底用 header。"""
    return getattr(request.state, "trace_id", None) or request.headers.get(
        "X-Trace-Id", "-"
    )


@app.exception_handler(BizError)
async def biz_error_handler(request: Request, exc: BizError) -> JSONResponse:
    """业务异常：返回规范的错误响应"""
    trace_id = _get_trace_id(request)
    body = build_error_response(
        request=request,
        code=exc.code,
        message=exc.message,
        details=exc.details,
        suggestion=exc.suggestion,
        trace_id=trace_id,
    )
    logger.warning(f"BizError: {exc.code.value} - {exc.message}")
    return JSONResponse(status_code=exc.status_code, content=body, headers={"X-Trace-Id": trace_id})


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """HTTP 异常：404/405 等"""
    trace_id = _get_trace_id(request)
    if exc.status_code == 404:
        code = ErrorCode.API_NOT_FOUND
    elif exc.status_code == 405:
        code = ErrorCode.API_METHOD_NOT_ALLOWED
    elif exc.status_code == 401:
        code = ErrorCode.API_UNAUTHORIZED
    elif exc.status_code == 403:
        code = ErrorCode.API_FORBIDDEN
    else:
        code = ErrorCode.SYS_INTERNAL_ERROR

    body = build_error_response(
        request=request,
        code=code,
        message=str(exc.detail) if exc.detail else None,
        trace_id=trace_id,
    )
    logger.warning(f"HTTP {exc.status_code}: {exc.detail}")
    return JSONResponse(status_code=exc.status_code, content=body, headers={"X-Trace-Id": trace_id})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """兜底异常：所有未捕获的异常都走这里，返回 500 + SYS_INTERNAL_ERROR"""
    trace_id = _get_trace_id(request)
    logger.exception(f"未处理异常: {exc}")

    body = build_error_response(
        request=request,
        code=ErrorCode.SYS_INTERNAL_ERROR,
        message=str(exc) if settings.app_debug else None,  # 生产模式不泄露细节
        details={"exception_type": exc.__class__.__name__} if settings.app_debug else None,
        trace_id=trace_id,
    )
    return JSONResponse(status_code=500, content=body, headers={"X-Trace-Id": trace_id})


# ===== 注册路由 =====
app.include_router(api_v1_router)


# ===== 根路径健康检查（方便直接探活） =====
@app.get("/", tags=["根"])
async def root() -> dict[str, Any]:
    """根路径"""
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "env": settings.app_env,
        "docs": "/docs",
    }


# ===== 启动入口 =====
def run() -> None:
    """生产启动入口（通过 `timetrack-backend` 命令调用）"""
    uvicorn.run(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=False,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    # 开发模式直接运行：python app/main.py
    uvicorn.run(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=True,
        log_level=settings.log_level.lower(),
    )
