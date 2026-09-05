"""请求级上下文（基于 contextvars）

为什么用 ContextVar：
- 一次 HTTP 请求可能跨多个 async 协程和后台任务，普通全局变量会被覆盖
- ContextVar 会随 asyncio 任务自动传播，子协程拿到的还是同一个值
- 配合 logging 里的 patcher，每条日志可以自动带上 trace_id，无需手动传

使用方式：
    from app.core.context import trace_id_var, get_trace_id, set_trace_id

    set_trace_id("abc123")     # 中间件里调用
    get_trace_id()              # 业务代码 / 日志 patcher 调用
"""

from __future__ import annotations

import uuid
from contextvars import ContextVar

# 默认值 "-"：非请求场景（lifespan 启动 / 后台任务）会取到这个，避免日志里出 KeyError
trace_id_var: ContextVar[str] = ContextVar("trace_id", default="-")


def get_trace_id() -> str:
    """获取当前上下文的 trace_id。非请求链路返回 '-'。"""
    return trace_id_var.get()


def set_trace_id(trace_id: str | None = None) -> str:
    """设置 trace_id；若未提供则生成一个 16 位 hex。返回设置后的值。"""
    if not trace_id:
        trace_id = uuid.uuid4().hex[:16]
    trace_id_var.set(trace_id)
    return trace_id


def reset_trace_id(token) -> None:
    """请求结束时恢复 ContextVar（避免污染下一个请求的上下文）。"""
    trace_id_var.reset(token)
