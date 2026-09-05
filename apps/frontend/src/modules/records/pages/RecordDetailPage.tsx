/**
 * 人员记录详情页（骨架）
 */
import { useParams } from 'react-router-dom';
import { PageContainer } from '../../../components/common/PageContainer';
import { EmptyState } from '../../../components/common/EmptyState';

export function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <PageContainer title="记录详情">
      <EmptyState description={`记录 ID: ${id ?? 'N/A'} - 待实现详情展示`} />
    </PageContainer>
  );
}
