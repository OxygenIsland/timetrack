"""统一错误码定义（对齐 docs/错误码体系规范.md）

模块编号（来自规范第 2.2 节）：
- SYS: 系统级
- CAM: 摄像头
- ALG: 算法
- NVR: NVR
- EVT: 事件编排
- WH: 工时
- RPT: 报表
- CFG: 配置
- AUTH: 鉴权
- WS: WebSocket
- API: 通用 API
- DB: 数据库
- EXT: 外部对接
- FE: 前端

错误码格式：E-{模块}-{子模块}-{序号}
"""

from __future__ import annotations

from enum import Enum


class ErrorCode(str, Enum):
    """错误码枚举（与 docs/错误码体系规范.md 严格对齐）"""

    # ===== SYS 系统级 =====
    SYS_INTERNAL_ERROR = "E-SYS-001"  # 内部异常
    SYS_NOT_IMPLEMENTED = "E-SYS-002"  # 未实现

    # ===== API 通用 API =====
    API_INVALID_PARAMS = "E-API-001"  # 参数校验失败
    API_NOT_FOUND = "E-API-002"  # 资源不存在
    API_METHOD_NOT_ALLOWED = "E-API-003"  # 方法不允许
    API_UNAUTHORIZED = "E-API-004"  # 未认证
    API_FORBIDDEN = "E-API-005"  # 无权限
    API_RATE_LIMIT = "E-API-006"  # 限流

    # ===== DB 数据库 =====
    DB_CONNECTION_FAILED = "E-DB-001"  # 连接失败
    DB_QUERY_FAILED = "E-DB-002"  # 查询失败
    DB_WRITE_FAILED = "E-DB-003"  # 写入失败
    DB_RECORD_NOT_FOUND = "E-DB-004"  # 记录不存在
    DB_DUPLICATE_KEY = "E-DB-005"  # 唯一键冲突

    # ===== EVT 事件编排 =====
    EVT_RECORD_NOT_FOUND = "E-EVT-001"  # 人员事件记录不存在

    # ===== CAM 摄像头 =====
    CAM_OFFLINE = "E-CAM-001"  # 摄像头离线
    CAM_STREAM_FAILED = "E-CAM-002"  # 拉流失败

    # ===== ALG 算法 =====
    ALG_HEARTBEAT_TIMEOUT = "E-ALG-003"  # 心跳超时
    ALG_INFERENCE_FAILED = "E-ALG-004"  # 推理失败

    # ===== WH 工时 =====
    WH_RULE_CONFLICT = "E-WH-002"  # 规则冲突
    WH_CALCULATION_FAILED = "E-WH-003"  # 计算失败

    # ===== AUTH 鉴权 =====
    AUTH_TOKEN_INVALID = "E-AUTH-001"  # Token 无效
    AUTH_TOKEN_EXPIRED = "E-AUTH-002"  # Token 过期


# 错误码 → HTTP 状态码映射
# 一期最简版本：业务错误返回 200，错误码通过 body 传递
# 真正语义化错误：HTTP 4xx/5xx + body 错误码
HTTP_STATUS_MAP: dict[ErrorCode, int] = {
    ErrorCode.SYS_INTERNAL_ERROR: 500,
    ErrorCode.SYS_NOT_IMPLEMENTED: 501,
    ErrorCode.API_INVALID_PARAMS: 422,
    ErrorCode.API_NOT_FOUND: 404,
    ErrorCode.API_METHOD_NOT_ALLOWED: 405,
    ErrorCode.API_UNAUTHORIZED: 401,
    ErrorCode.API_FORBIDDEN: 403,
    ErrorCode.API_RATE_LIMIT: 429,
    ErrorCode.DB_CONNECTION_FAILED: 503,
    ErrorCode.DB_QUERY_FAILED: 500,
    ErrorCode.DB_WRITE_FAILED: 500,
    ErrorCode.DB_RECORD_NOT_FOUND: 404,
    ErrorCode.DB_DUPLICATE_KEY: 409,
    ErrorCode.EVT_RECORD_NOT_FOUND: 404,
    ErrorCode.CAM_OFFLINE: 503,
    ErrorCode.CAM_STREAM_FAILED: 502,
    ErrorCode.ALG_HEARTBEAT_TIMEOUT: 504,
    ErrorCode.ALG_INFERENCE_FAILED: 500,
    ErrorCode.WH_RULE_CONFLICT: 409,
    ErrorCode.WH_CALCULATION_FAILED: 500,
    ErrorCode.AUTH_TOKEN_INVALID: 401,
    ErrorCode.AUTH_TOKEN_EXPIRED: 401,
}


# 错误码 → 中文消息映射（前端直接展示给用户）
ERROR_MESSAGE_MAP: dict[ErrorCode, str] = {
    ErrorCode.SYS_INTERNAL_ERROR: "系统内部异常，请稍后重试",
    ErrorCode.SYS_NOT_IMPLEMENTED: "功能尚未实现",
    ErrorCode.API_INVALID_PARAMS: "请求参数校验失败",
    ErrorCode.API_NOT_FOUND: "请求的资源不存在",
    ErrorCode.API_METHOD_NOT_ALLOWED: "请求方法不被允许",
    ErrorCode.API_UNAUTHORIZED: "未认证或认证失败",
    ErrorCode.API_FORBIDDEN: "无权限访问",
    ErrorCode.API_RATE_LIMIT: "请求过于频繁，请稍后重试",
    ErrorCode.DB_CONNECTION_FAILED: "数据库连接失败",
    ErrorCode.DB_QUERY_FAILED: "数据查询失败",
    ErrorCode.DB_WRITE_FAILED: "数据写入失败",
    ErrorCode.DB_RECORD_NOT_FOUND: "数据记录不存在",
    ErrorCode.DB_DUPLICATE_KEY: "数据唯一键冲突",
    ErrorCode.EVT_RECORD_NOT_FOUND: "人员事件记录不存在",
    ErrorCode.CAM_OFFLINE: "摄像头离线",
    ErrorCode.CAM_STREAM_FAILED: "视频流拉取失败",
    ErrorCode.ALG_HEARTBEAT_TIMEOUT: "算法心跳超时",
    ErrorCode.ALG_INFERENCE_FAILED: "算法推理失败",
    ErrorCode.WH_RULE_CONFLICT: "工时规则冲突",
    ErrorCode.WH_CALCULATION_FAILED: "工时计算失败",
    ErrorCode.AUTH_TOKEN_INVALID: "登录令牌无效",
    ErrorCode.AUTH_TOKEN_EXPIRED: "登录令牌已过期",
}


def get_http_status(code: ErrorCode) -> int:
    """获取错误码对应的 HTTP 状态码（默认 500）"""
    return HTTP_STATUS_MAP.get(code, 500)


def get_message(code: ErrorCode) -> str:
    """获取错误码对应的中文消息"""
    return ERROR_MESSAGE_MAP.get(code, "未知错误")
