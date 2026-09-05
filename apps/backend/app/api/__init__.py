"""API v1 路由注册"""

from fastapi import APIRouter

from app.api.v1 import health, personnel_events

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(health.router)
api_v1_router.include_router(personnel_events.router)
