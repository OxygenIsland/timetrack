"""数据库会话管理

SQLAlchemy 2.0 风格：
- 用 sessionmaker 创建 SessionLocal
- get_db() 依赖函数提供请求作用域的 Session
- init_db() 在应用启动时建表（开发模式用，生产应该用 Alembic）

参考：
- SQLAlchemy 2.0 文档：https://docs.sqlalchemy.org/en/20/orm/session_basics.html
"""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    """所有 ORM Model 的基类"""

    pass


def create_db_engine() -> Engine:
    """根据配置创建数据库引擎

    一期用 SQLite，参数说明：
    - check_same_thread=False: 允许多线程访问（FastAPI 异步需要）
    - echo=False: 生产环境关闭 SQL 日志（开发环境可设为 True 调试）
    """
    connect_args = {}
    if settings.database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    return create_engine(
        settings.database_url,
        connect_args=connect_args,
        echo=False,
        future=True,
    )


# 全局单例
engine: Engine = create_db_engine()
SessionLocal: sessionmaker[Session] = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,  # 提交后对象仍可访问属性
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI 依赖：每个请求一个 Session，请求结束自动关闭

    用法：
        @router.get("/items")
        def list_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """初始化数据库（开发模式用：导入所有 Model 后 create_all）

    生产应该用 Alembic 迁移。详见后续迭代。
    """
    # 导入所有 Model 以确保它们注册到 Base.metadata
    from app.models import personnel_event  # noqa: F401

    Base.metadata.create_all(bind=engine)
