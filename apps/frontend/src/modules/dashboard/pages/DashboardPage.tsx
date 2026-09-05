/**
 * M1 看板页面 - Container 层
 *
 * 职责：业务逻辑、状态管理、数据流编排
 */

import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Space, Typography } from 'antd';
import { TeamOutlined, ClockCircleOutlined, AlertOutlined } from '@ant-design/icons';
import { PageContainer } from '../../../components/common/PageContainer';
import { CameraViewer } from '../../../components/domain/camera/CameraViewer';
import { eventBus } from '../../../core/eventBus/EventBus';
import { Events } from '../../../core/eventBus/events';

const { Text } = Typography;

export function DashboardPage() {
  const [onSiteCount, setOnSiteCount] = useState<number>(0);
  const [todayWorkHours] = useState<number>(0);
  const [activeAlerts] = useState<number>(0);

  // 订阅人员进入事件，更新在岗人数
  useEffect(() => {
    const off = eventBus.on(Events.PERSON_ENTER, () => {
      setOnSiteCount((c) => c + 1);
    });
    return off;
  }, []);

  // 模拟 4 路摄像头（一期骨架，二期对接 MediaMTX 视频流）
  const cameras = [
    { id: 'cam_01', name: '胎位 A', status: 'online' as const },
    { id: 'cam_02', name: '胎位 B', status: 'online' as const },
    { id: 'cam_03', name: '胎位 C', status: 'offline' as const },
    { id: 'cam_04', name: '胎位 D', status: 'online' as const },
  ];

  // 解决 ESLint 未使用告警（占位字段）
  void todayWorkHours;
  void activeAlerts;

  return (
    <PageContainer title="实时看板" subtitle="智能摄像头工时统计系统">
      {/* 顶部统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="当前在岗"
              value={onSiteCount}
              prefix={<TeamOutlined />}
              suffix="人"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="今日累计工时"
              value={todayWorkHours}
              prefix={<ClockCircleOutlined />}
              suffix="小时"
              precision={1}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="未处理告警"
              value={activeAlerts}
              prefix={<AlertOutlined />}
              suffix="条"
              valueStyle={{ color: activeAlerts > 0 ? '#ff4d4f' : undefined }}
            />
          </Card>
        </Col>
      </Row>

      {/* 4 路视频墙 */}
      <Row gutter={[16, 16]}>
        {cameras.map((cam) => (
          <Col span={12} key={cam.id}>
            <div style={{ height: 320 }}>
              <CameraViewer
                cameraId={cam.id}
                cameraName={cam.name}
                status={cam.status}
              />
            </div>
          </Col>
        ))}
      </Row>

      <div style={{ marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
        <Space direction="vertical" size={4}>
          <Text type="secondary">
            📌 当前为骨架版本，UI 与业务三层分离：pages/ → containers/ → components/
          </Text>
          <Text type="secondary">
            📌 视频流待接入 MediaMTX（WHEP 协议）；实时数据待接入 WebSocket
          </Text>
          <Text type="secondary">
            📌 详见 docs/前端架构设计文档.md
          </Text>
        </Space>
      </div>
    </PageContainer>
  );
}
