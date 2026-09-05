import { PageContainer } from '../../../components/common/PageContainer';
import { EmptyState } from '../../../components/common/EmptyState';

export function SystemLogsPage() {
  return (
    <PageContainer title="系统日志" subtitle="按模块、级别、时间查询">
      <EmptyState description="日志查询页面骨架已就绪（CLI 工具待开发）" />
    </PageContainer>
  );
}
