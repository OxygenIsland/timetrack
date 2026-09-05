/**
 * PageContainer - 页面容器
 *
 * 提供统一的页面布局：标题、操作区、内容区。
 */

import React from 'react';
import { Space, Typography } from 'antd';
import styles from './PageContainer.module.css';

const { Title } = Typography;

interface Props {
  /** 页面标题 */
  title?: string;
  /** 页面副标题 */
  subtitle?: string;
  /** 标题右侧操作区 */
  extra?: React.ReactNode;
  /** 内容区 */
  children: React.ReactNode;
  /** 是否显示边框 */
  bordered?: boolean;
}

export function PageContainer({
  title,
  subtitle,
  extra,
  children,
  bordered = false,
}: Props) {
  return (
    <div className={`${styles.container} ${bordered ? styles.bordered : ''}`}>
      {(title || extra) && (
        <div className={styles.header}>
          <div className={styles.titleArea}>
            {title && <Title level={4} className={styles.title}>{title}</Title>}
            {subtitle && (
              <Typography.Text type="secondary" className={styles.subtitle}>
                {subtitle}
              </Typography.Text>
            )}
          </div>
          {extra && <Space className={styles.extra}>{extra}</Space>}
        </div>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
