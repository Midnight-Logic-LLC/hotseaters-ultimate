/**
 * RevenueTrendCard — stacked bar chart of actual vs projected revenue.
 *
 * Ported from `HotSeatersMVP/src/pages/Dashboard.jsx` lines 303–525:
 * - Monthly (12 bars, fiscal-year aligned) or weekly (52 bars) toggle.
 * - Cumulative toggle.
 * - Actual revenue from invoices; projected revenue from trial_service PDR.
 * - Toggle state persisted in userInfo.preferences via the entity graph.
 *
 * For change-402 this card renders the chart from pre-computed data passed
 * via props (populated by useDashboardAggregates). Preference persistence
 * is local-state only for now (graph write layer lands in change-403).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';

export interface RevenueTrendPoint {
  label: string;
  revenue: number;
  projected: number;
}

interface RevenueTrendCardProps {
  /** Monthly trend data (12 items). */
  monthlyData: RevenueTrendPoint[];
  /** Weekly trend data (52 items). */
  weeklyData: RevenueTrendPoint[];
  /** Annual revenue target (from company settings). Draws a reference line. */
  annualTarget?: number;
  /** Initial time period toggle value. */
  defaultTimePeriod?: 'month' | 'week';
  /** Initial cumulative toggle value. */
  defaultShowCumulative?: boolean;
}

export function RevenueTrendCard({
  monthlyData,
  weeklyData,
  annualTarget = 0,
  defaultTimePeriod = 'month',
  defaultShowCumulative = false,
}: RevenueTrendCardProps) {
  const [timePeriod, setTimePeriod] = useState<'month' | 'week'>(defaultTimePeriod);
  const [showCumulative, setShowCumulative] = useState(defaultShowCumulative);

  const baseData = timePeriod === 'week' ? weeklyData : monthlyData;

  // Build cumulative version
  let cumRevenue = 0;
  let cumProjected = 0;
  const cumulativeData = baseData.map((d) => {
    cumRevenue += d.revenue;
    cumProjected += d.projected;
    return { label: d.label, revenue: cumRevenue, projected: cumProjected };
  });

  const displayData = showCumulative ? cumulativeData : baseData;

  const periodsPerYear = timePeriod === 'week' ? 52 : 12;
  const goalValue = showCumulative
    ? annualTarget
    : annualTarget > 0
    ? annualTarget / periodsPerYear
    : 0;

  const formatCurrency = (v: number) =>
    v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${Math.round(v)}`;

  return (
    <Card
      style={{
        borderRadius: 'var(--theme-card-radius)',
        boxShadow: 'var(--theme-card-shadow)',
        borderWidth: 'var(--theme-card-border)',
        backgroundColor: 'var(--theme-card-bg)',
      }}
    >
      <CardHeader
        className="flex flex-row items-center justify-between"
        style={{ padding: 'var(--theme-card-header-padding)' }}
      >
        <CardTitle
          className="flex items-center"
          style={{
            fontSize: 'var(--theme-text-card-title)',
            color: 'var(--theme-stone-900)',
            gap: 'var(--theme-element-gap)',
          }}
        >
          <DollarSign className="h-5 w-5 text-green-600" />
          Revenue Trend
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex rounded border" style={{ borderColor: 'var(--theme-stone-200)' }}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-r-none px-2 text-xs"
              style={timePeriod === 'month' ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' } : {}}
              onClick={() => setTimePeriod('month')}
            >
              Month
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-l-none px-2 text-xs"
              style={timePeriod === 'week' ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' } : {}}
              onClick={() => setTimePeriod('week')}
            >
              Week
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            style={showCumulative ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white', borderColor: 'var(--theme-brand-primary)' } : {}}
            onClick={() => setShowCumulative((v) => !v)}
          >
            Cumulative
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={displayData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              interval={timePeriod === 'week' ? 3 : 0}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              formatter={(value: number, name: string) => [
                `$${Math.round(value).toLocaleString()}`,
                name === 'revenue' ? 'Actual' : 'Projected',
              ]}
            />
            {goalValue > 0 && (
              <ReferenceLine
                y={goalValue}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{ value: 'Goal', fill: '#10b981', fontSize: 11 }}
              />
            )}
            <Bar dataKey="revenue" name="revenue" fill="#4f46e5" radius={[2, 2, 0, 0]} stackId="a" />
            <Bar dataKey="projected" name="projected" fill="#a5b4fc" radius={[2, 2, 0, 0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex items-center gap-4 justify-end" style={{ fontSize: 'var(--theme-text-caption)', color: 'var(--theme-stone-500)' }}>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-sm" style={{ backgroundColor: '#4f46e5' }} />
            Actual
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-sm" style={{ backgroundColor: '#a5b4fc' }} />
            Projected
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default RevenueTrendCard;
