import { useParams } from 'react-router-dom';
import { PageContainer } from '../../../components/common/PageContainer';
import { EmptyState } from '../../../components/common/EmptyState';

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <PageContainer title="报表详情">
      <EmptyState description={`报表 ID: ${id ?? 'N/A'} - 待实现详情展示`} />
    </PageContainer>
  );
}
