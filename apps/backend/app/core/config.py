"""应用配置（基于 Pydantic Settings）

设计原则：
- 所有配置项必须显式声明类型和默认值，不允许 None 隐式
- 配置从环境变量 + .env 文件加载
- 敏感字段（密钥、密码）必须能从环境变量覆盖

设计参考：
- Pydantic Settings 官方文档：https://docs.pydantic.dev/latest/concepts/pydantic_settings/
- 错误码体系规范：docs/错误码体系规范.md
"""

from __future__ import annotations

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用全局配置"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,  # 环境变量大小写不敏感
        extra="ignore",  # 忽略未定义的字段
    )

    # ===== 应用基础 =====
    app_name: str = "TimeTrack Backend"
    app_env: str = "development"
    app_version: str = "0.1.0"
    app_debug: bool = True
    app_host: str = "127.0.0.1"
    app_port: int = 8000

    # ===== CORS =====
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "app://.",
            "file://",
        ]
    )

    # ===== 数据库 =====
    database_url: str = "sqlite:///./data/timetrack.db"

    # ===== 日志 =====
    log_level: str = "INFO"
    log_dir: str = "./data/logs"
    log_file_max_bytes: int = 10 * 1024 * 1024  # 10MB
    log_file_backup_count: int = 10


# 全局单例：导入即可使用 `from app.core.config import settings`
settings = Settings()


# 派生路径：自动创建必要目录
def ensure_dirs() -> None:
    """确保运行时需要的目录存在（首次启动时调用）"""
    # 数据库目录
    db_path = Path(settings.database_url.replace("sqlite:///", "")).parent
    if not db_path.exists():
        db_path.mkdir(parents=True, exist_ok=True)

    # 日志目录
    log_dir = Path(settings.log_dir)
    if not log_dir.exists():
        log_dir.mkdir(parents=True, exist_ok=True)
