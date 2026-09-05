"""统一异常体系

设计原则：
- 所有业务异常都继承自 BizError
- 异常包含错误码、消息、HTTP 状态码、可选 details
- FastAPI 全局处理器把异常转换为符合 docs/错误码体系规范.md 的 JSON 响应

参考：docs/错误码体系规范.md 第 3.1 节
"""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from starlette.requests import Request

from app.core.error_codes import ErrorCode, get_http_status, get_message


class BizError(HTTPException):
    """业务异常基类

    用法：
        raise BizError(ErrorCode.EVT_RECORD_NOT_FOUND, details={"event_id": "123"})
    """

    def __init__(
        self,
        code: ErrorCode,
        message: str | None = None,
        details: dict[str, Any] | None = None,
        suggestion: str | None = None,
    ):
        self.code = code
        self.message = message or get_message(code)
        self.details = details or {}
        self.suggestion = suggestion
        super().__init__(status_code=get_http_status(code), detail=self.message)


def build_error_response(
    request: Request,
    code: ErrorCode,
    message: str | None = None,
    details: dict[str, Any] | None = None,
    suggestion: str | None = None,
    trace_id: str = "",
) -> dict[str, Any]:
    """构造符合规范的错误响应体

    返回字段对齐 docs/错误码体系规范.md 第 3.1 节。
    """
    from datetime import datetime

    return {
        "code": code.value,
        "http_status": get_http_status(code),
        "message": message or get_message(code),
        "trace_id": trace_id,
        "timestamp": datetime.now().isoformat(),
        "path": str(request.url.path) if request else "",
        "details": details or {},
        "suggestion": suggestion,
    }
