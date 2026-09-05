"""人员事件 Service（业务逻辑层）

职责：
- 封装数据库 CRUD
- 实现业务规则（时间范围校验、置信度过滤等）
- 处理数据转换（ORM → Schema）

设计原则：
- 一期最简：直接转发到 ORM，不引入复杂业务规则
- 后续扩展：B3-02 置信度过滤、B3-04 重复事件合并
"""

from __future__ import annotations

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models.personnel_event import EventType, PersonnelEvent
from app.schemas.personnel_event import (
    PersonnelEventItem,
    PersonnelEventListResponse,
    PersonnelEventQuery,
)


def list_events(
    db: Session, query: PersonnelEventQuery
) -> PersonnelEventListResponse:
    """查询人员事件列表（带分页和过滤）

    一期实现：
    - 基础过滤（person_id / camera_id / event_type / 时间范围）
    - 按 event_time 倒序
    - 分页

    后续扩展：
    - 重复事件合并（B3-04）
    - 人员名称关联（人员档案表）
    """
    # 构造过滤条件
    conditions = []
    if query.person_id:
        conditions.append(PersonnelEvent.person_id == query.person_id)
    if query.camera_id:
        conditions.append(PersonnelEvent.camera_id == query.camera_id)
    if query.event_type:
        conditions.append(PersonnelEvent.event_type == EventType(query.event_type))
    if query.start_time:
        conditions.append(PersonnelEvent.event_time >= query.start_time)
    if query.end_time:
        conditions.append(PersonnelEvent.event_time <= query.end_time)

    where_clause = and_(*conditions) if conditions else None

    # 查询总数
    count_stmt = select(func.count(PersonnelEvent.id))
    if where_clause is not None:
        count_stmt = count_stmt.where(where_clause)
    total = db.execute(count_stmt).scalar() or 0

    # 查询数据（按时间倒序，分页）
    offset = (query.page - 1) * query.page_size
    stmt = (
        select(PersonnelEvent)
        .order_by(PersonnelEvent.event_time.desc())
        .offset(offset)
        .limit(query.page_size)
    )
    if where_clause is not None:
        stmt = stmt.where(where_clause)

    db_events = db.execute(stmt).scalars().all()

    # ORM → Schema
    items = [PersonnelEventItem.model_validate(e) for e in db_events]

    return PersonnelEventListResponse(
        items=items,
        total=total,
        page=query.page,
        page_size=query.page_size,
    )


def get_event(db: Session, event_id: str) -> PersonnelEventItem:
    """查询单条事件（详情页用）

    找不到时抛 BizError(EVT_RECORD_NOT_FOUND)，由全局异常处理器转 404。
    """
    from app.core.exceptions import BizError
    from app.core.error_codes import ErrorCode

    event = db.get(PersonnelEvent, event_id)
    if event is None:
        raise BizError(
            ErrorCode.EVT_RECORD_NOT_FOUND,
            details={"event_id": event_id},
        )
    return PersonnelEventItem.model_validate(event)
