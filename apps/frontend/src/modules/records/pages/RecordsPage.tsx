/**
 * 人员记录列表页
 *
 * 数据来源：GET /api/v1/personnel/events
 * 关联文档：apps/backend/app/api/v1/personnel_events.py
 */

import { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, Card, Statistic, Row, Col } from 'antd';
import type { TableColumnsType } from 'antd';
import { ReloadOutlined, VideoCameraOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import { PageContainer } from '../../../components/common/PageContainer';
import { apiClient } from '../../../core/api';
import type { IModuleContext } from '../../../core/registry/types';

// ===== 类型定义（与后端 Schema 对齐） =====
interface PersonnelEventItem {
  id: string;
  person_id: string;
  camera_id: string;
  event_type: 'IN' | 'OUT' | 'DETECTED' | 'APPEARED' | 'DISAPPEARED';
  event_time: string;
  confidence: number | null;
  region_id: string | null;
  bbox: string | null;
  workwear_attrs: string | null;
  thumbnail_path: string | null;
  remark: string | null;
}

interface PersonnelEventListResponse {
  items: PersonnelEventItem[];
  total: number;
  page: number;
  page_size: number;
}

// 事件类型颜色映射
const EVENT_TYPE_COLORS: Record<string, string> = {
  IN: 'green',
  OUT: 'orange',
  DETECTED: 'blue',
  APPEARED: 'cyan',
  DISAPPEARED: 'gray',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  IN: '进入',
  OUT: '离开',
  DETECTED: '检测到',
  APPEARED: '出现',
  DISAPPEARED: '消失',
};

export function RecordsPage(_ctx: IModuleContext) {
  const [data, setData] = useState<PersonnelEventListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<PersonnelEventListResponse>(
        '/personnel/events',
        { page, page_size: pageSize },
      );
      setData(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加载失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  // 表格列定义
  const columns: TableColumnsType<PersonnelEventItem> = [
    {
      title: '事件 ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {id.slice(0, 8)}...
        </span>
      ),
    },
    {
      title: '人员 ID',
      dataIndex: 'person_id',
      key: 'person_id',
      width: 120,
      render: (id: string) => <Tag color="purple">{id}</Tag>,
    },
    {
      title: '摄像头',
      dataIndex: 'camera_id',
      key: 'camera_id',
      width: 110,
      render: (id: string) => (
        <Space>
          <VideoCameraOutlined />
          <span>{id}</span>
        </Space>
      ),
    },
    {
      title: '事件类型',
      dataIndex: 'event_type',
      key: 'event_type',
      width: 100,
      render: (type: string) => (
        <Tag color={EVENT_TYPE_COLORS[type] || 'default'}>
          {EVENT_TYPE_LABELS[type] || type}
        </Tag>
      ),
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 100,
      render: (conf: number | null) =>
        conf != null ? (
          <span style={{ fontFamily: 'monospace' }}>
            {(conf * 100).toFixed(1)}%
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: '区域',
      dataIndex: 'region_id',
      key: 'region_id',
      width: 100,
      render: (r: string | null) => r || '-',
    },
    {
      title: '发生时间',
      dataIndex: 'event_time',
      key: 'event_time',
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  // 统计卡片
  const stats = data?.items
    ? {
        total: data.total,
        in: data.items.filter((e) => e.event_type === 'IN').length,
        out: data.items.filter((e) => e.event_type === 'OUT').length,
        detected: data.items.filter((e) => e.event_type === 'DETECTED').length,
      }
    : { total: 0, in: 0, out: 0, detected: 0 };

  return (
    <PageContainer
      title="人员记录"
      subtitle="查询与浏览人员进出流水（数据来源：后端 FastAPI）"
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchData}
          loading={loading}
        >
          刷新
        </Button>
      }
    >
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总记录数" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进入（IN）"
              value={stats.in}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="离开（OUT）"
              value={stats.out}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="检测到（DETECTED）"
              value={stats.detected}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 错误提示 */}
      {error && (
        <Card style={{ marginBottom: 16, borderColor: '#ff4d4f' }}>
          <div style={{ color: '#ff4d4f' }}>
            ⚠️ 数据加载失败：{error}
            <br />
            <span style={{ fontSize: 12, color: '#999' }}>
              请确认后端服务已启动：<code>pnpm dev:backend</code>
            </span>
          </div>
        </Card>
      )}

      {/* 数据表格 */}
      <Table<PersonnelEventItem>
        columns={columns}
        dataSource={data?.items || []}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
    </PageContainer>
  );
}
