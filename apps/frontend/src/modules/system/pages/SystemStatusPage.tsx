import { PageContainer } from '../../../components/common/PageContainer';
import { EmptyState } from '../../../components/common/EmptyState';

export function SystemStatusPage() {
  return (
    <PageContainer title="系统状态" subtitle="摄像头 / 算法 / 数据库 / 服务健康度">
      <EmptyState description="系统状态监控页面骨架已就绪" />
    </PageContainer>
  );
}
