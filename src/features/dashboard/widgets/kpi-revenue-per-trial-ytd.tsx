/**
 * KpiRevenuePerTrialYtd — bible Dashboard.jsx lines 864–884.
 *
 * Revenue YTD ÷ trials-won YTD. 0 when no trials won.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign } from 'lucide-react';
import { useTier1 } from '@/app/tier1-provider';
import { useTrialsList } from '@/features/trials/hooks/use-trials-list';
import { useRevenueTrend } from '@/features/dashboard/hooks/use-revenue-trend';
import {
  computeRevenuePerTrialYtd,
  computeTrialsYtdCount,
} from '@/features/dashboard/business-rules/revenue-aggregation';
import { KpiTile } from './kpi-tile';

export function KpiRevenuePerTrialYtd() {
  const navigate = useNavigate();
  const { company } = useTier1();
  const companyId = company?.id ?? null;
  const { items: trials, isLoading: trialsLoading } = useTrialsList({ companyId });
  const trend = useRevenueTrend();
  const now = useMemo(() => new Date(), []);

  // YTD revenue comes from the cumulative endpoint of the trend dataset
  // when cumulative is on, or summed when off.
  const revenueYtd = trend.cumulative
    ? trend.data[trend.data.length - 1]?.revenue ?? 0
    : trend.data.reduce((s, p) => s + p.revenue, 0);

  const trialsYtd = useMemo(
    () => (companyId ? computeTrialsYtdCount(trials, now) : 0),
    [companyId, trials, now],
  );
  const perTrial = computeRevenuePerTrialYtd(revenueYtd, trialsYtd);

  const ready = !trialsLoading && !trend.isLoading && companyId !== null;
  const value = ready
    ? `$${trialsYtd > 0 ? Math.round(perTrial).toLocaleString() : '0'}`
    : undefined;
  const caption = ready
    ? `$${Math.round(revenueYtd).toLocaleString()} total revenue`
    : undefined;

  return (
    <KpiTile
      title="Revenue/Trial YTD"
      value={value}
      icon={DollarSign}
      iconClass="h-4 w-4 text-teal-600"
      caption={caption}
      onClick={() => navigate('/Trials')}
      testId="kpi-revenue-per-trial-ytd"
    />
  );
}
