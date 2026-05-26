/**
 * RevenueTrendCard — bible Dashboard.jsx lines 403–525 + the embedded
 * chart UI (port of the existing components/revenue-trend-card.tsx,
 * rewritten to consume use-revenue-trend + use-dashboard-preferences).
 *
 * Three toolbar controls:
 *   • Fiscal-year select  (5-year window centered on current FY)
 *   • Period toggle       (Month | Week)
 *   • Cumulative switch   (per-bucket vs running totals)
 *
 * Each control persists to `user_info.preferences` via the prefs hook —
 * write drains through the local_writes queue.
 */

import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRevenueTrend } from '@/features/dashboard/hooks/use-revenue-trend';
import { useDashboardPreferences } from '@/features/dashboard/hooks/use-dashboard-preferences';
import { cardStyle, headerPad } from './_styles';

export function RevenueTrendCard() {
  const trend = useRevenueTrend();
  const { setFiscalYear, setShowCumulative, setPeriod } = useDashboardPreferences();

  return (
    <Card style={cardStyle()} data-testid="revenue-trend-card">
      <CardHeader
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        style={headerPad()}
      >
        <CardTitle
          className="flex items-center gap-2"
          style={{
            fontSize: 'var(--theme-text-card-title)',
            color: 'var(--theme-stone-900)',
          }}
        >
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          Revenue Trend
        </CardTitle>
        <div className="flex items-center gap-3">
          <Select
            value={String(trend.fiscalYear)}
            onValueChange={(v) => {
              if (typeof v !== 'string') return;
              const year = parseInt(v, 10);
              if (Number.isFinite(year)) void setFiscalYear(year);
            }}
          >
            <SelectTrigger
              className="h-8 w-28"
              data-testid="revenue-trend-fiscal-year"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {trend.availableFiscalYears.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  FY {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={trend.period}
            onValueChange={(v) => {
              if (v === 'month' || v === 'week') void setPeriod(v);
            }}
          >
            <SelectTrigger
              className="h-8 w-24"
              data-testid="revenue-trend-period"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch
              id="revenue-trend-cumulative"
              checked={trend.cumulative}
              onCheckedChange={(v) => void setShowCumulative(v)}
              data-testid="revenue-trend-cumulative"
            />
            <Label htmlFor="revenue-trend-cumulative" className="text-sm">
              Cumulative
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {trend.isLoading && trend.data.length === 0 ? (
          <div
            aria-busy="true"
            aria-label="Revenue trend loading"
            className="animate-pulse rounded"
            style={{ height: '18rem', backgroundColor: 'var(--theme-stone-200)' }}
          />
        ) : (
          <div style={{ width: '100%', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={288} minWidth={1}>
              <ComposedChart data={trend.data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-stone-200)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--theme-stone-500)', fontSize: 11 }}
                  interval={trend.period === 'week' ? 3 : 0}
                />
                <YAxis
                  tick={{ fill: 'var(--theme-stone-500)', fontSize: 11 }}
                  tickFormatter={(v: number) =>
                    typeof v === 'number'
                      ? v >= 1000
                        ? `$${Math.round(v / 1000)}k`
                        : `$${v}`
                      : String(v)
                  }
                />
                <Tooltip
                  formatter={(v) =>
                    typeof v === 'number' ? `$${Math.round(v).toLocaleString()}` : v
                  }
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Actual"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  name="Projected"
                  stroke="#7C3AED"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="trend"
                  name="Trend"
                  stroke="#9CA3AF"
                  strokeWidth={1}
                  strokeDasharray="2 6"
                  dot={false}
                  connectNulls
                />
                {trend.revenueGoal > 0 && (
                  <ReferenceLine
                    y={trend.revenueGoal}
                    stroke="#DC2626"
                    strokeDasharray="2 4"
                    label={{
                      value: `Goal $${Math.round(trend.revenueGoal).toLocaleString()}`,
                      position: 'right',
                      fill: '#DC2626',
                      fontSize: 11,
                    }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
