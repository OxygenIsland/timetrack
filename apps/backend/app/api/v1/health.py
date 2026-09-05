"""健康检查接口

用途：
- Electron / Docker / 监控探活
- 不依赖任何业务数据，直接返回
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/health", tags=["健康检查"])


class HealthResponse(BaseModel):
    """健康检查响应"""

    status: Literal["ok"] = "ok"
    app_name: str
    app_version: str
    app_env: str
    server_time: str


@router.get("", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """健康检查端点（GET /api/v1/health）

    返回 200 + 应用元信息。
    """
    return HealthResponse(
        status="ok",
        app_name=settings.app_name,
        app_version=settings.app_version,
        app_env=settings.app_env,
        server_time=datetime.utcnow().isoformat(),
    )
