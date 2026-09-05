/**
 * StatusTag - 状态标签
 *
 * 统一的标签颜色映射，方便全局统一视觉。
 */

import React from 'react';
import { Tag } from 'antd';

export type StatusType =
  | 'success'
  | 'error'
  | 'warning'
  | 'processing'
  | 'default'
  | 'offline'
  | 'online';

interface Props {
  status: StatusType;
  text: string;
  icon?: React.ReactNode;
}

const STATUS_COLOR: Record<StatusType, string> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  processing: 'processing',
  default: 'default',
  offline: 'default',
  online: 'success',
};

export function StatusTag({ status, text, icon }: Props) {
  return (
    <Tag color={STATUS_COLOR[status]} icon={icon}>
      {text}
    </Tag>
  );
}
