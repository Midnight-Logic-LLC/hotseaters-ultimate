/**
 * KpiActiveTrials — bible Dashboard.jsx lines 826–843.
 *
 * Two derived counts: total active ops-stage trials + upcoming subset.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gavel } from 'lucide-react';
import { useTier1 } from '@/app/tier1-provider';
import { useTrialsList } from '@/features/trials/hooks/use-trials-list';
import {
  activeTrials as bibleActiveTrials,
  upcomingTrialsFrom,
  type PipelineStageLike,
  type TrialLike,
} from '@/features/dashboard/business-rules/pipeline-aggregation';
import { KpiTile } from './kpi-tile';

export function KpiActiveTrials() {
  const navigate = useNavigate();
  const { company, pipelineStages } = useTier1();
  const companyId = company?.id ?? null;
  const { items: trials, isLoading } = useTrialsList({ companyId });

  const { activeCount, upcomingCount } = useMemo(() => {
    if (!companyId) return { activeCount: 0, upcomingCount: 0 };
    const stageLikes: PipelineStageLike[] = pipelineStages.map((s) => ({
      id: s.id,
      type: s.type,
      revenue_probability: s.revenue_probability,
      is_active: s.is_active,
    }));
    const active = bibleActiveTrials(trials as unknown as TrialLike[], stageLikes);
    const upcoming = upcomingTrialsFrom(active, new Date());
    return { activeCount: active.length, upcomingCount: upcoming.length };
  }, [companyId, trials, pipelineStages]);

  const ready = !isLoading && companyId !== null;
  const value = ready ? activeCount : undefined;
  const caption = ready
    ? `${upcomingCount} upcoming • ${Math.max(0, activeCount - upcomingCount)} in progress`
    : undefined;

  return (
    <KpiTile
      title="Active Trials"
      value={value}
      icon={Gavel}
      iconClass="h-4 w-4 text-indigo-600"
      caption={caption}
      onClick={() => navigate('/Trials')}
      testId="kpi-active-trials"
    />
  );
}
