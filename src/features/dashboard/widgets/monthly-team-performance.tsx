/**
 * MonthlyTeamPerformance — bible Dashboard.jsx lines 1144–1193.
 *
 * Same shape as WeeklyTeamPerformance, monthly window.
 */

import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeamMonth } from '@/features/dashboard/hooks/use-team-month';
import { HorizontalBar } from './_horizontal-bar';
import { cardStyle, headerPad } from './_styles';

export function MonthlyTeamPerformance() {
  const { stats, isLoading } = useTeamMonth();
  const totalHours = stats.reduce((s, r) => s + r.hours, 0);
  const totalRevenue = stats.reduce((s, r) => s + r.revenue, 0);

  return (
    <Card style={cardStyle()} data-testid="monthly-team-performance">
      <CardHeader
        className="flex flex-row items-center justify-between"
        style={headerPad()}
      >
        <CardTitle
          className="flex items-center gap-2"
          style={{
            fontSize: 'var(--theme-text-card-title)',
            color: 'var(--theme-stone-900)',
          }}
        >
          <Users className="h-4 w-4" aria-hidden="true" />
          Monthly Team Performance
        </CardTitle>
        <span
          style={{
            fontSize: 'var(--theme-text-caption)',
            color: 'var(--theme-stone-500)',
          }}
        >
          {totalHours.toFixed(1)}h • ${Math.round(totalRevenue).toLocaleString()}
        </span>
      </CardHeader>
      <CardContent>
        {isLoading && stats.length === 0 ? (
          <div
            aria-busy="true"
            aria-label="Monthly team performance loading"
            className="animate-pulse rounded"
            style={{ height: '14rem', backgroundColor: 'var(--theme-stone-200)' }}
          />
        ) : stats.length === 0 ? (
          <p
            className="py-6 text-center"
            style={{
              fontSize: 'var(--theme-text-caption)',
              color: 'var(--theme-stone-500)',
            }}
          >
            0.0h • $0
          </p>
        ) : (
          <HorizontalBar
            data={stats.map((s) => ({ ...s, accent: s.isHsh }))}
            bars={[
              {
                dataKey: 'hours',
                fill: '#4F46E5',
                name: 'Hours',
                formatter: (v) => `${v.toFixed(1)}h`,
              },
              {
                dataKey: 'revenue',
                fill: '#059669',
                name: 'Revenue',
                formatter: (v) => `$${Math.round(v).toLocaleString()}`,
              },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
}
