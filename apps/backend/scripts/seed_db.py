"""数据库初始化 + Mock 数据脚本

用途：
- 首次启动时初始化表
- 写入若干 mock 数据，方便前端联调

运行方式：
    python -m scripts.seed_db
"""

from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.db.session import SessionLocal, init_db
from app.models.personnel_event import EventType, PersonnelEvent


# Mock 数据配置
MOCK_CAMERAS = ["cam_01", "cam_02", "cam_03", "cam_04"]
MOCK_PERSONS = ["person_001", "person_002", "person_003", "person_004", "person_005"]
MOCK_REGIONS = ["region_A", "region_B", "region_C"]


def seed_personnel_events(db: Session, count: int = 50) -> None:
    """写入 mock 人员事件

    生成策略：
    - 时间：过去 24 小时内随机分布
    - 摄像头：4 路随机
    - 人员：5 个随机
    - 事件类型：DETECTED（80%）+ IN（10%）+ OUT（10%）
    - 置信度：0.7 - 0.99 之间随机
    """
    now = datetime.now(timezone.utc)
    events: list[PersonnelEvent] = []

    for i in range(count):
        # 随机分布到过去 24 小时
        offset_minutes = random.randint(0, 24 * 60)
        event_time = now - timedelta(minutes=offset_minutes)

        # 事件类型加权
        event_type_choices = (
            [EventType.DETECTED] * 8
            + [EventType.IN] * 1
            + [EventType.OUT] * 1
        )

        event = PersonnelEvent(
            id=str(uuid.uuid4()),
            person_id=random.choice(MOCK_PERSONS),
            camera_id=random.choice(MOCK_CAMERAS),
            event_type=random.choice(event_type_choices),
            event_time=event_time,
            confidence=round(random.uniform(0.7, 0.99), 3),
            region_id=random.choice(MOCK_REGIONS),
            bbox="100,150,300,400",  # 假的检测框
            workwear_attrs='{"helmet": true, "vest": true}',
            thumbnail_path=None,
            remark=None,
            created_at=now,
        )
        events.append(event)

    db.add_all(events)
    db.commit()
    print(f"✅ 写入 {count} 条人员事件")


def main() -> None:
    print("🔧 初始化数据库表...")
    init_db()
    print("✅ 表创建成功")

    db = SessionLocal()
    try:
        # 清空旧数据（仅 mock，不影响生产）
        deleted = db.query(PersonnelEvent).delete()
        db.commit()
        if deleted > 0:
            print(f"🗑️  清空旧数据: {deleted} 条")

        # 写入 mock 数据
        seed_personnel_events(db, count=50)

        # 验证
        total = db.query(PersonnelEvent).count()
        print(f"📊 当前数据库共 {total} 条事件")
    finally:
        db.close()

    print("\n🎉 Mock 数据准备完成！")
    print("下一步：uvicorn app.main:app --reload --port 8000")


if __name__ == "__main__":
    main()
