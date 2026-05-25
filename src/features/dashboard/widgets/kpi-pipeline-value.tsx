/**
 * KpiPipelineValue — bible Dashboard.jsx lines 788–805.
 */

import { useNavigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { usePipelineSummary } from '@/features/dashboard/hooks/use-pipeline-summary';
import { KpiTile } from './kpi-tile';

export function KpiPipelineValue() {
  const navigate = useNavigate();
  const { pipelineValue, weightedValue, dealCount, isLoading } = usePipelineSummary();
  const value = isLoading ? undefined : `$${Math.round(pipelineValue).toLocaleString()}`;
  const caption = isLoading
    ? undefined
    : `${dealCount} active deals • $${Math.round(weightedValue).toLocaleString()} weighted`;
  return (
    <KpiTile
      title="Pipeline Value"
      value={value}
      icon={Briefcase}
      iconClass="h-4 w-4 text-purple-600"
      caption={caption}
      onClick={() => navigate('/DealTracker?tab=pipeline')}
      testId="kpi-pipeline-value"
    />
  );
}
