/**
 * KpiOutstanding — bible Dashboard.jsx lines 807–824.
 */

import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useQuickStats } from '@/features/dashboard/hooks/use-quick-stats';
import { KpiTile } from './kpi-tile';

export function KpiOutstanding() {
  const navigate = useNavigate();
  const { outstandingAmount, isLoading } = useQuickStats();
  // The bible's caption is "{count} unpaid invoice(s)" — but useQuickStats
  // only surfaces $ today; we omit count rather than show a stale 0.
  // The KPI count is the visible primary signal.
  const value = isLoading
    ? undefined
    : `$${Math.round(outstandingAmount).toLocaleString()}`;
  return (
    <KpiTile
      title="Outstanding"
      value={value}
      icon={FileText}
      iconClass="h-4 w-4 text-amber-600"
      caption={isLoading ? undefined : 'sent + overdue invoices'}
      onClick={() => navigate('/Collections')}
      testId="kpi-outstanding"
    />
  );
}
