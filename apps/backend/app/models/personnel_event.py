"""人员事件表 Model

对应文档：
- docs/后端需求-核心需求.md B3-01 人员事件记录
- 前端 M2 人员记录模块：/api/v1/personnel/events

字段设计原则：
- id 用 UUID 字符串（不暴露数据库递增 ID，方便分布式/数据迁移）
- 时间字段统一用 UTC 存储，前端按需格式化
- 摄像头 ID 引用 B7 配置中的摄像头表（一期先做外键关联预留）
- event_type 用枚举字符串（IN / OUT / DETECTED），便于扩展

SQLAlchemy 2.0 风格：
- 用 mapped_column + Mapped[...] 类型注解
- 用 Optional[...] 表示可空字段
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class EventType(str, enum.Enum):
    """人员事件类型"""

    IN = "IN"  # 进入区域
    OUT = "OUT"  # 离开区域
    DETECTED = "DETECTED"  # 在区域内被检测到（周期上报）
    APPEARED = "APPEARED"  # 首次出现
    DISAPPEARED = "DISAPPEARED"  # 消失


class PersonnelEvent(Base):
    """人员事件表

    一条记录 = 一次人员事件（进入/离开/被检测）
    """

    __tablename__ = "personnel_events"
    __table_args__ = (
        # 按时间倒序查询是最频繁的，加索引
        Index("idx_events_timestamp", "event_time"),
        # 按人员 ID 查询也频繁
        Index("idx_events_person_id", "person_id"),
        # 按摄像头 + 时间范围查询
        Index("idx_events_camera_time", "camera_id", "event_time"),
    )

    # 主键：UUID 字符串
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    # 人员标识（ReID 全局 ID 或临时 ID）
    person_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    # 摄像头 ID（关联摄像头配置表，一期先用字符串）
    camera_id: Mapped[str] = mapped_column(String(64), nullable=False)

    # 事件类型
    event_type: Mapped[EventType] = mapped_column(
        Enum(EventType, native_enum=False, length=16),
        nullable=False,
    )

    # 事件发生时间（UTC）
    event_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    # 置信度（0.0 - 1.0）
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    # 区域 ID（事件发生的归属区域，一期先存字符串）
    region_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # 检测框 bbox（JSON 字符串，格式 "x1,y1,x2,y2"）
    bbox: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # 工装识别结果（JSON 字符串，格式：{"helmet": true, "vest": false}）
    # 一期先存 JSON 字符串，后续可拆表
    workwear_attrs: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 缩略图路径（M2-04 回看用）
    thumbnail_path: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # 备注
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 系统字段
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )

    def __repr__(self) -> str:
        return (
            f"<PersonnelEvent(id={self.id}, person_id={self.person_id}, "
            f"event_type={self.event_type.value}, event_time={self.event_time})>"
        )
