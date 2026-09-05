"""数据库 Model 注册入口

新加 Model 时，在这里 import 一次，确保 init_db() 能找到所有表。
"""

from app.models.personnel_event import PersonnelEvent  # noqa: F401

__all__ = ["PersonnelEvent"]
