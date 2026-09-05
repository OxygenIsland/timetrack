"""FastAPI 中间件

TraceIdMiddleware 职责：
1. 优先从请求头 `X-Trace-Id` 读取 trace_id（前端 / 网关可显式传入，便于跨服务追踪）
2. 没有就生成一个 16 位 hex（UUID4 截断）
3. 写入 `contextvars.trace_id_var`（供业务代码与日志 patcher 读取）
4. 同时写入 `request.state.trace_id`（异常处理 handler 用）
5. 透传到响应头 `X-Trace-Id`
6. 记录一次请求级 INFO 日志（method / path / status / 耗时）

注意：
- ContextVar 在 async 任务中会自动继承，业务代码无需传参即可通过日志拿到 trace_id
- 异常路径下我们不能修改响应头（因为 response 可能不存在），
  只负责记录日志；统一错误响应里仍然会通过 `build_error_response(trace_id=...)` 把 id 放进 body
"""

from __future__ import annotations

import time

from fastapi import Request
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.context import reset_trace_id, set_trace_id


class TraceIdMiddleware(BaseHTTPMiddleware):
    """为每个请求注入 trace_id，并输出一次结构化访问日志"""

    async def dispatch(self, request: Request, call_next) -> Response:
        incoming = request.headers.get("X-Trace-Id", "").strip()
        trace_id = set_trace_id(incoming or None)
        request.state.trace_id = trace_id

        start = time.perf_counter()
        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
            response.headers["X-Trace-Id"] = trace_id
            return response
        finally:
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.bind(
                trace_id=trace_id,
                method=request.method,
                path=request.url.path,
                status=status_code,
                duration_ms=elapsed_ms,
                client=request.client.host if request.client else None,
            ).info("request")
            # 请求结束不影响其他请求的 ContextVar（每个请求有自己的 task）
            # 但保留 reset 以防同步代码误用
            # reset_trace_id(token)  # 此处没有 token
