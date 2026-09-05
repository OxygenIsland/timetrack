"""日志配置（基于 Loguru）

设计目标：
- 控制台（人类可读，带颜色）+ 本地 JSON 文件（机器可读，便于后续接 Loki/ELK）
- 文件路径与滚动策略来自 settings.log_dir / log_file_max_bytes / log_file_backup_count
- 通过 InterceptHandler 接管 stdlib logging，让 uvicorn / sqlalchemy / fastapi
  这些第三方库的日志统一走 loguru 的格式与文件
- 通过 patcher 给每条日志自动注入 trace_id（来自 contextvars.trace_id_var）
- 生产环境默认关闭 diagnose（避免在 traceback 里泄露变量值）
- enqueue=True 保证多线程 / 多 worker 场景写入安全

调用方式：
    from app.core.logging import setup_logging
    setup_logging()                  # 进程入口处调用一次
    from loguru import logger         # 业务代码统一用这个 logger
    logger.info("xxx")                # 自动带 trace_id，无需手动传
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

from loguru import logger as _loguru_logger

from app.core.config import settings
from app.core.context import get_trace_id


# 需要被接管的 stdlib logger 名称（uvicorn / sqlalchemy 等）
_INTERCEPT_LOGGERS: tuple[str, ...] = (
    "uvicorn",
    "uvicorn.access",
    "uvicorn.error",
    "fastapi",
    "sqlalchemy.engine",
    "sqlalchemy.engine.Engine",
)


def _inject_trace_id(record: dict) -> None:
    """loguru patcher：每条日志记录注入当前请求的 trace_id。

    注意：patcher 会在 record dict 上修改字段，必须就地改。
    """
    record["extra"]["trace_id"] = get_trace_id()


class InterceptHandler(logging.Handler):
    """把 stdlib logging 的记录转发给 loguru。"""

    @staticmethod
    def _resolve_level(record: logging.LogRecord) -> str | int:
        try:
            return _loguru_logger.level(record.levelname).name
        except ValueError:
            return record.levelno

    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = self._resolve_level(record)
        except Exception:
            level = record.levelno

        # 找到真正的调用帧，避免日志里显示的是 logging 模块自身
        frame = logging.currentframe()
        depth = 2
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        _loguru_logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


def setup_logging() -> None:
    """初始化日志：控制台 + JSON 滚动文件 + trace_id 注入 + 接管 stdlib。

    必须在应用入口最早阶段调用（在 FastAPI / uvicorn 加载之前），
    否则 uvicorn 自身的 logger 会被它默认的 handler 提前占用。
    """
    # 1. 确保日志目录存在
    log_dir = Path(settings.log_dir)
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / "timetrack.log"

    # 2. patcher: 每条日志自动注入 trace_id
    _loguru_logger.configure(patcher=_inject_trace_id)

    # 3. 清掉 loguru 默认的 stderr handler，重新按配置添加
    _loguru_logger.remove()
    level = settings.log_level.upper()

    # 3.1 控制台：人类可读、带颜色，方便开发
    _loguru_logger.add(
        sys.stderr,
        level=level,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> "
            "[<level>{level: <8}</level>] "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> "
            "[trace=<cyan>{extra[trace_id]}</cyan>] - "
            "<level>{message}</level>"
        ),
        backtrace=False,
        diagnose=settings.app_debug,
        enqueue=False,
    )

    # 3.2 文件：JSON + 滚动 + 线程安全（enqueue=True）
    _loguru_logger.add(
        str(log_file),
        level=level,
        # serialize=True 让每条日志成为单行 JSON；时间戳走 ISO 8601 便于索引
        serialize=True,
        format="{time:YYYY-MM-DDTHH:mm:ss.SSSZ} {level} {name}:{function}:{line} - {message}",
        rotation=settings.log_file_max_bytes,
        retention=settings.log_file_backup_count,
        encoding="utf-8",
        enqueue=True,
        backtrace=False,
        diagnose=settings.app_debug,
    )

    # 4. 接管 stdlib logging，让 uvicorn / sqlalchemy 等也走 loguru
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    for name in _INTERCEPT_LOGGERS:
        std_logger = logging.getLogger(name)
        std_logger.handlers = [InterceptHandler()]
        std_logger.propagate = False
