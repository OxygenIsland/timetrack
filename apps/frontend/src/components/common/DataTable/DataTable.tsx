/**
 * DataTable - 通用数据表格
 *
 * 基于 AntD Table 的封装，统一 loading/empty/error 状态。
 */

import { Table, Empty } from 'antd';
import type { TableProps } from 'antd';
import type { ApiError } from '../../../core/error/types';
import { LoadingMask } from '../LoadingMask';

interface DataTableProps<T> extends Omit<TableProps<T>, 'loading'> {
  loading?: boolean;
  error?: ApiError | null;
  dataSource?: T[];
  emptyText?: string;
}

export function DataTable<T extends object>({
  loading = false,
  error,
  dataSource = [],
  emptyText = '暂无数据',
  ...rest
}: DataTableProps<T>) {
  if (error) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div>
            <div style={{ color: '#ff4d4f' }}>加载失败</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              [{error.code}] {error.message}
            </div>
          </div>
        }
      />
    );
  }

  return (
    <LoadingMask loading={loading}>
      <Table<T>
        dataSource={dataSource}
        locale={{ emptyText }}
        {...rest}
      />
    </LoadingMask>
  );
}
