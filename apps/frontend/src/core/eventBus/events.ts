/**
 * 事件名常量（统一管理）
 *
 * 命名规范：`<域>:<动作>`，全小写，蛇形命名
 */
export const Events = {
  // 人员事件
  PERSON_ENTER: 'person:enter',
  PERSON_LEAVE: 'person:leave',
  PERSON_REIDENTIFIED: 'person:reidentified',

  // 工时事件
  WORKHOUR_THRESHOLD_REACHED: 'workhour:threshold_reached',
  WORKHOUR_RULE_CHANGED: 'workhour:rule_changed',
  WORKHOUR_CORRECTED: 'workhour:corrected',

  // 系统事件
  CAMERA_OFFLINE: 'system:camera_offline',
  CAMERA_ONLINE: 'system:camera_online',
  ALGO_DISCONNECTED: 'system:algo_disconnected',
  ALGO_CONNECTED: 'system:algo_connected',

  // 用户事件
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
} as const;

export type EventName = (typeof Events)[keyof typeof Events];
