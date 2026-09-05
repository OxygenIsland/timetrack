/**
 * LoadingMask - 加载遮罩
 */

import React from 'react';
import { Spin } from 'antd';

interface Props {
  loading?: boolean;
  tip?: string;
  children?: React.ReactNode;
  fullscreen?: boolean;
}

export function LoadingMask({ loading = false, tip = '加载中...', children, fullscreen }: Props) {
  if (!loading) return <>{children}</>;

  if (fullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.7)',
          zIndex: 9999,
        }}
      >
        <Spin tip={tip} size="large" />
      </div>
    );
  }

  return (
    <Spin tip={tip} spinning={loading}>
      {children}
    </Spin>
  );
}
