/**
 * 统一 API 错误处理
 *
 * 关联文档：docs/错误码体系规范.md
 */

import { message, notification } from 'antd';
import { ErrorCodes, type ApiError } from './types';

/**
 * 错误级别（用于差异化展示）
 */
type ErrorLevel = 'fatal' | 'error' | 'warning' | 'info';

/**
 * 根据错误码判断展示级别
 */
function getErrorLevel(code: string): ErrorLevel {
  // FATAL 级（数据库连接、服务不可用等）
  const fatalCodes = [
    ErrorCodes.SYS_SERVICE_UNAVAILABLE,
    ErrorCodes.SYS_INTERNAL_ERROR,
    ErrorCodes.DB_CONNECTION_FAILED,
    ErrorCodes.ALG_UNAVAILABLE,
  ];
  if (fatalCodes.includes(code as any)) return 'fatal';

  // WARNING 级（可恢复）
  const warningCodes = [
    ErrorCodes.CAM_OFFLINE,
    ErrorCodes.WS_DISCONNECTED,
    ErrorCodes.AUTH_TOKEN_EXPIRED,
    ErrorCodes.ALG_HEARTBEAT_TIMEOUT,
  ];
  if (warningCodes.includes(code as any)) return 'warning';

  // INFO 级（无需弹窗）
  const infoCodes = [
    ErrorCodes.FE_EMPTY_DATA,
    ErrorCodes.EVT_DUPLICATE,
    ErrorCodes.WH_ALREADY_CORRECTED,
  ];
  if (infoCodes.includes(code as any)) return 'info';

  return 'error';
}

/**
 * 根据错误码判断是否需要特殊处理
 */
function handleSpecialErrors(error: ApiError): void {
  switch (error.code) {
    // Token 过期：跳转登录
    case ErrorCodes.AUTH_TOKEN_EXPIRED:
    case ErrorCodes.SYS_NOT_LOGGED_IN:
      // 跳转到登录页（具体跳转逻辑由应用层实现）
      window.dispatchEvent(new CustomEvent('auth:logout'));
      break;

    // 工时权限不足
    case ErrorCodes.WH_NO_CORRECTION_PERMISSION:
    case ErrorCodes.AUTH_NO_PERMISSION:
      notification.warning({
        message: '权限不足',
        description: error.message,
      });
      break;

    // 默认不处理
    default:
      break;
  }
}

/**
 * 统一错误处理入口
 */
export function handleApiError(error: ApiError, options?: { silent?: boolean }): void {
  // 1. 统一日志
  console.error(`[${error.code}] ${error.message}`, {
    trace_id: error.trace_id,
    details: error.details,
    path: error.path,
  });

  // 静默模式（业务自行处理）
  if (options?.silent) {
    return;
  }

  // 2. 特殊错误处理
  handleSpecialErrors(error);

  // 3. 默认 toast 提示
  const level = getErrorLevel(error.code);
  if (level === 'info') return; // info 级不弹窗

  const duration = level === 'fatal' ? 0 : level === 'error' ? 5 : 3;

  if (level === 'fatal') {
    notification.error({
      message: error.message,
      description: error.suggestion || error.details?.reason as string,
      duration,
      placement: 'topRight',
    });
  } else if (level === 'warning') {
    message.warning(error.message, duration);
  } else {
    message.error(error.message, duration);
  }
}

/**
 * 创建一个 BizError 类（业务主动抛出时用）
 */
export class BizError extends Error {
  public readonly code: string;
  public readonly http_status: number;
  public readonly trace_id: string;
  public readonly timestamp: string;
  public readonly details?: Record<string, any>;
  public readonly suggestion?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.code = error.code;
    this.http_status = error.http_status;
    this.trace_id = error.trace_id;
    this.timestamp = error.timestamp;
    this.details = error.details;
    this.suggestion = error.suggestion;
    this.name = 'BizError';
  }
}
