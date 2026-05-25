/**
 * KpiTrialsYtd — bible Dashboard.jsx lines 845–862.
 *
 * Count of trials won since Jan 1 of the current year.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gavel } from 'lucide-react';
import { useTier1 } from '@/app/tier1-provider';
import { useTrialsList } from '@/features/trials/hooks/use-trials-list';
import { computeTrialsYtdCount } from '@/features/dashboard/business-rules/revenue-aggregation';
import { KpiTile } from './kpi-tile';

export function KpiTrialsYtd() {
  const navigate = useNavigate();
  const { company } = useTier1();
  const companyId = company?.id ?? null;
  const { items: trials, isLoading } = useTrialsList({ companyId });
  const now = useMemo(() => new Date(), []);

  const count = useMemo(() => {
    if (!companyId) return 0;
    return computeTrialsYtdCount(trials, now);
  }, [companyId, trials, now]);

  const ready = !isLoading && companyId !== null;
  return (
    <KpiTile
      title="Trials YTD"
      value={ready ? count : undefined}
      icon={Gavel}
      iconClass="h-4 w-4 text-blue-600"
      caption={ready ? `Won since Jan 1, ${now.getFullYear()}` : undefined}
      onClick={() => navigate('/Trials')}
      testId="kpi-trials-ytd"
    />
  );
}
