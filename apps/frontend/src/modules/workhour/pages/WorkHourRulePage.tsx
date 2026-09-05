import { PageContainer } from '../../../components/common/PageContainer';
import { EmptyState } from '../../../components/common/EmptyState';

export function WorkHourRulePage() {
  return (
    <PageContainer title="工时规则" subtitle="配置有效工时判定、班次、阈值">
      <EmptyState description="工时规则页面骨架已就绪" />
    </PageContainer>
  );
}
