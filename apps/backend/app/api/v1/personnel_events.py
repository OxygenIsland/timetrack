"""人员事件 API

接口列表：
- GET  /api/v1/personnel/events         查询列表（带分页和过滤）
- GET  /api/v1/personnel/events/{id}    查询详情

对应：
- docs/后端需求-核心需求.md B3-01 人员事件记录
- 前端 M2 人员记录模块
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.error_codes import ErrorCode
from app.core.exceptions import BizError
from app.db.session import get_db
from app.schemas.personnel_event import (
    PersonnelEventItem,
    PersonnelEventListResponse,
)
from app.services import personnel_event_service

router = APIRouter(prefix="/personnel/events", tags=["人员事件"])


@router.get("", response_model=PersonnelEventListResponse)
async def list_personnel_events(
    page: int = Query(default=1, ge=1, le=10000, description="页码"),
    page_size: int = Query(default=20, ge=1, le=200, description="每页数量"),
    person_id: str | None = Query(default=None, description="人员 ID"),
    camera_id: str | None = Query(default=None, description="摄像头 ID"),
    event_type: str | None = Query(default=None, description="事件类型"),
    start_time: datetime | None = Query(default=None, description="起始时间"),
    end_time: datetime | None = Query(default=None, description="结束时间"),
    db: Session = Depends(get_db),
) -> PersonnelEventListResponse:
    """查询人员事件列表

    支持过滤：person_id / camera_id / event_type / 时间范围
    按 event_time 倒序，分页。
    """
    # event_type 校验（如果传入，必须是合法枚举值）
    if event_type is not None:
        valid_types = {"IN", "OUT", "DETECTED", "APPEARED", "DISAPPEARED"}
        if event_type not in valid_types:
            raise BizError(
                ErrorCode.API_INVALID_PARAMS,
                details={"event_type": event_type, "valid": sorted(valid_types)},
            )

    # 构造查询参数
    from app.schemas.personnel_event import PersonnelEventQuery

    query = PersonnelEventQuery(
        page=page,
        page_size=page_size,
        person_id=person_id,
        camera_id=camera_id,
        event_type=event_type,  # type: ignore[arg-type]
        start_time=start_time,
        end_time=end_time,
    )

    return personnel_event_service.list_events(db, query)


@router.get("/{event_id}", response_model=PersonnelEventItem)
async def get_personnel_event(
    event_id: str,
    db: Session = Depends(get_db),
) -> PersonnelEventItem:
    """查询单条事件详情"""
    return personnel_event_service.get_event(db, event_id)
