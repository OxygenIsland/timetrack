import { PageContainer } from '../../../components/common/PageContainer';
import { EmptyState } from '../../../components/common/EmptyState';

export function ReportCenterPage() {
  return (
    <PageContainer title="报表中心" subtitle="日报 / 周报 / 月报生成与导出">
      <EmptyState description="报表中心页面骨架已就绪" />
    </PageContainer>
  );
}
