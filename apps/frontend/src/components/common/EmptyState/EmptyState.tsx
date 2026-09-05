/**
 * EmptyState - 空状态组件
 */

import React from 'react';
import { Empty } from 'antd';

interface Props {
  description?: string;
  children?: React.ReactNode;
  image?: React.ReactNode;
}

export function EmptyState({ description = '暂无数据', children, image }: Props) {
  return (
    <Empty image={image} description={description}>
      {children}
    </Empty>
  );
}
