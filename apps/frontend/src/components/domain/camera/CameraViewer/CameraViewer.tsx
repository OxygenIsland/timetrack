/**
 * 业务组件示例：摄像头画面占位（实际拉流逻辑二期接）
 */
import { Card, Empty, Space } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';
import { StatusTag, type StatusType } from '../../../common/StatusTag';

interface Props {
  cameraId: string;
  cameraName: string;
  status: 'online' | 'offline' | 'error';
}

export function CameraViewer({ cameraId, cameraName, status }: Props) {
  return (
    <Card
      title={
        <Space>
          <VideoCameraOutlined />
          <span>{cameraName}</span>
          <StatusTag
            status={status as StatusType}
            text={status === 'online' ? '在线' : status === 'offline' ? '离线' : '异常'}
          />
        </Space>
      }
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{
        height: 'calc(100% - 40px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
      }}
    >
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span style={{ color: '#999' }}>
            视频流占位（待接入 MediaMTX · camera={cameraId}）
          </span>
        }
      />
    </Card>
  );
}
