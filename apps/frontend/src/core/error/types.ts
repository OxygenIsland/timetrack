/**
 * API 错误响应格式（与后端错误码体系规范对齐）
 *
 * 关联文档：docs/错误码体系规范.md
 */

export interface ApiError {
  /** 错误码 */
  code: string;
  /** HTTP 状态码 */
  http_status: number;
  /** 用户提示（中文） */
  message: string;
  /** 英文提示（可选） */
  message_en?: string;
  /** 全链路追踪 ID */
  trace_id: string;
  /** 时间戳 */
  timestamp: string;
  /** API 路径 */
  path?: string;
  /** 技术详情（开发排查用） */
  details?: Record<string, any>;
  /** 给用户的解决建议 */
  suggestion?: string;
}

/**
 * 错误码常量（与 docs/错误码体系规范.md 同步）
 *
 * ⚠️ 错误码变更必须走评审流程，详见错误码体系规范第 8 章。
 */
export const ErrorCodes = {
  // SYS - 系统级
  SYS_SERVICE_UNAVAILABLE: 'E-SYS-001',
  SYS_INTERNAL_ERROR: 'E-SYS-002',
  SYS_OVERLOAD: 'E-SYS-003',
  SYS_CONFIG_LOAD_FAILED: 'E-SYS-004',
  SYS_NOT_LOGGED_IN: 'E-SYS-005',
  SYS_NO_PERMISSION: 'E-SYS-006',

  // CAM - 摄像头
  CAM_OFFLINE: 'E-CAM-001',
  CAM_RTSP_FAILED: 'E-CAM-002',
  CAM_AUTH_FAILED: 'E-CAM-003',
  CAM_DECODE_FAILED: 'E-CAM-004',
  CAM_STREAM_TIMEOUT: 'E-CAM-005',
  CAM_INVALID_CONFIG: 'E-CAM-006',
  CAM_ALREADY_EXISTS: 'E-CAM-007',
  CAM_NOT_FOUND: 'E-CAM-008',

  // ALG - 算法
  ALG_UNAVAILABLE: 'E-ALG-001',
  ALG_HEARTBEAT_TIMEOUT: 'E-ALG-002',
  ALG_INVALID_EVENT: 'E-ALG-003',
  ALG_MISSING_FIELDS: 'E-ALG-004',
  ALG_START_FAILED: 'E-ALG-005',
  ALG_STOP_FAILED: 'E-ALG-006',
  ALG_RATE_EXCEEDED: 'E-ALG-007',
  ALG_RULE_CONFLICT: 'E-ALG-008',

  // NVR - NVR
  NVR_UNREACHABLE: 'E-NVR-001',
  NVR_QUERY_FAILED: 'E-NVR-002',
  NVR_DOWNLOAD_FAILED: 'E-NVR-003',
  NVR_NOT_FOUND: 'E-NVR-004',
  NVR_DOWNLOAD_TIMEOUT: 'E-NVR-005',

  // EVT - 事件编排
  EVT_PERSIST_FAILED: 'E-EVT-001',
  EVT_QUEUE_FULL: 'E-EVT-002',
  EVT_INVALID: 'E-EVT-003',
  EVT_DUPLICATE: 'E-EVT-004',
  EVT_PUSH_FAILED: 'E-EVT-005',

  // WH - 工时
  WH_CALC_FAILED: 'E-WH-001',
  WH_RULE_CONFLICT: 'E-WH-002',
  WH_INVALID_RULE: 'E-WH-003',
  WH_RECORD_NOT_FOUND: 'E-WH-004',
  WH_NO_CORRECTION_PERMISSION: 'E-WH-005',
  WH_INVALID_CORRECTION: 'E-WH-006',
  WH_ALREADY_CORRECTED: 'E-WH-007',

  // RPT - 报表
  RPT_GENERATE_FAILED: 'E-RPT-001',
  RPT_INVALID_PARAMS: 'E-RPT-002',
  RPT_NOT_FOUND: 'E-RPT-003',
  RPT_GENERATE_TIMEOUT: 'E-RPT-004',
  RPT_EXPORT_FAILED: 'E-RPT-005',
  RPT_EXPIRED: 'E-RPT-006',

  // CFG - 配置
  CFG_INVALID_VALUE: 'E-CFG-001',
  CFG_NOT_FOUND: 'E-CFG-002',
  CFG_ALREADY_EXISTS: 'E-CFG-003',
  CFG_HOT_UPDATE_FAILED: 'E-CFG-004',
  CFG_NO_PERMISSION: 'E-CFG-005',

  // AUTH - 鉴权
  AUTH_INVALID_CREDENTIALS: 'E-AUTH-001',
  AUTH_TOKEN_EXPIRED: 'E-AUTH-002',
  AUTH_NO_PERMISSION: 'E-AUTH-003',
  AUTH_TOO_MANY_ATTEMPTS: 'E-AUTH-004',
  AUTH_ACCOUNT_LOCKED: 'E-AUTH-005',

  // WS - WebSocket
  WS_DISCONNECTED: 'E-WS-001',
  WS_SUBSCRIBE_FAILED: 'E-WS-002',
  WS_PUSH_FAILED: 'E-WS-003',
  WS_HEARTBEAT_TIMEOUT: 'E-WS-004',

  // DB - 数据库
  DB_CONNECTION_FAILED: 'E-DB-001',
  DB_WRITE_FAILED: 'E-DB-002',
  DB_QUERY_FAILED: 'E-DB-003',
  DB_POOL_EXHAUSTED: 'E-DB-004',
  DB_CONSTRAINT_VIOLATION: 'E-DB-005',

  // EXT - 外部对接
  EXT_UNAVAILABLE: 'E-EXT-001',
  EXT_API_ERROR: 'E-EXT-002',
  EXT_TIMEOUT: 'E-EXT-003',

  // FE - 前端
  FE_RENDER_FAILED: 'E-FE-001',
  FE_EMPTY_DATA: 'E-FE-002',
  FE_BROWSER_INCOMPATIBLE: 'E-FE-003',
  FE_FORM_INVALID: 'E-FE-004',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/** 业务成功响应（用于校验） */
export interface ApiSuccess<T = any> {
  code: 'OK';
  http_status: number;
  data: T;
  trace_id: string;
  timestamp: string;
}
