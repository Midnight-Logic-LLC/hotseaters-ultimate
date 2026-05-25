/**
 * KpiRevenueYtd — bible Dashboard.jsx lines 762–786.
 *
 * Hide-for-trial_consultant gating lives in the widget registry
 * (change-408), not here.
 */

import { useNavigate } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, DollarSign } from 'lucide-react';
import { useTier1 } from '@/app/tier1-provider';
import { useTrialsList } from '@/features/trials/hooks/use-trials-list';
import {
  useRevenueTrend,
} from '@/features/dashboard/hooks/use-revenue-trend';
import { useRecentActivity } from '@/features/dashboard/hooks/use-recent-activity';
import { KpiTile } from './kpi-tile';

/**
 * Revenue YTD is derived from the same hybrid-REST invoice data the
 * RevenueTrend chart uses; we just sum the actual revenue column of
 * the (already-windowed) trend dataset. Falls back to 0 while loading.
 */
function useRevenueYtdAggregate(): {
  revenueYtd: number;
  changePct: number;
  isLoading: boolean;
} {
  const trend = useRevenueTrend();
  // Recent activity also touches invoices — we piggyback on its REST
  // hit for the month-over-month delta. (When invoice joins sync this
  // becomes one fetch.)
  const activity = useRecentActivity();

  // YTD = sum of revenue across the trend dataset (cumulative=false
  // returns per-bucket values; cumulative=true returns running totals).
  // Either way `data[N-1].revenue` is the YTD total in cumulative mode;
  // in per-bucket mode we sum the buckets.
  const total = trend.data.reduce(
    (sum, point) => sum + (trend.cumulative ? Math.max(point.revenue, sum) : point.revenue),
    0,
  );

  // Month-over-month: compare last two non-zero monthly buckets.
  let changePct = 0;
  if (trend.period === 'month' && trend.data.length >= 2) {
    const last = trend.data[trend.data.length - 1]?.revenue ?? 0;
    const prev = trend.data[trend.data.length - 2]?.revenue ?? 0;
    if (prev > 0) changePct = ((last - prev) / prev) * 100;
  }

  return {
    revenueYtd: trend.cumulative
      ? trend.data[trend.data.length - 1]?.revenue ?? 0
      : total,
    changePct,
    isLoading: trend.isLoading || activity.isLoading,
  };
}

export function KpiRevenueYtd() {
  const navigate = useNavigate();
  const { company } = useTier1();
  const { isLoading: trialsLoading } = useTrialsList({ companyId: company?.id ?? null });
  const { revenueYtd, changePct, isLoading } = useRevenueYtdAggregate();
  const ready = !isLoading && !trialsLoading && company !== null;
  const value = ready ? `$${Math.round(revenueYtd).toLocaleString()}` : undefined;
  const Arrow = changePct >= 0 ? ArrowUpRight : ArrowDownRight;
  const caption = ready ? (
    <span className="flex items-center gap-1">
      <Arrow className={`h-4 w-4 ${changePct >= 0 ? 'text-green-600' : 'text-red-600'}`} aria-hidden="true" />
      <span className={changePct >= 0 ? 'text-green-600' : 'text-red-600'}>
        {Math.abs(changePct).toFixed(1)}% vs last month
      </span>
    </span>
  ) : undefined;
  return (
    <KpiTile
      title="Revenue YTD"
      value={value}
      icon={DollarSign}
      iconClass="h-4 w-4 text-green-600"
      caption={caption}
      onClick={() => navigate('/Invoices')}
      testId="kpi-revenue-ytd"
    />
  );
}
