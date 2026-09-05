"""人员事件 Schemas（API 数据契约）

对应：
- 接口路径：GET /api/v1/personnel/events
- 前端模块：apps/frontend/src/modules/records
- 前端调用：apiClient.get('/personnel/events', params)

设计原则：
- 输入（Query）和输出（Item/Response）严格分离
- 时间字段统一 ISO 8601 字符串
- 枚举字段直接用字符串，避免前端类型不匹配
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# 事件类型字面量（与 models/personnel_event.py 中的 EventType 保持一致）
EventTypeLiteral = Literal["IN", "OUT", "DETECTED", "APPEARED", "DISAPPEARED"]


class PersonnelEventQuery(BaseModel):
    """查询参数（GET 请求 query string）"""

    # 分页
    page: int = Field(default=1, ge=1, le=10000, description="页码，从 1 开始")
    page_size: int = Field(default=20, ge=1, le=200, description="每页数量，1-200")

    # 过滤条件（全部可选）
    person_id: str | None = Field(default=None, description="按人员 ID 过滤")
    camera_id: str | None = Field(default=None, description="按摄像头 ID 过滤")
    event_type: EventTypeLiteral | None = Field(default=None, description="按事件类型过滤")

    # 时间范围
    start_time: datetime | None = Field(default=None, description="起始时间（ISO 8601）")
    end_time: datetime | None = Field(default=None, description="结束时间（ISO 8601）")


class PersonnelEventItem(BaseModel):
    """单条人员事件（响应项）"""

    model_config = ConfigDict(from_attributes=True)  # 支持从 ORM 对象构造

    id: str
    person_id: str
    camera_id: str
    event_type: EventTypeLiteral
    event_time: datetime
    confidence: float | None = None
    region_id: str | None = None
    bbox: str | None = None
    workwear_attrs: str | None = None
    thumbnail_path: str | None = None
    remark: str | None = None


class PersonnelEventListResponse(BaseModel):
    """列表响应（带分页）"""

    items: list[PersonnelEventItem]
    total: int = Field(description="总记录数")
    page: int = Field(description="当前页码")
    page_size: int = Field(description="每页大小")
