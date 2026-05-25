/**
 * WeeklyTeamPerformance — bible Dashboard.jsx lines 1092–1142.
 */

import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTeamWeek } from '@/features/dashboard/hooks/use-team-week';
import { HorizontalBar } from './_horizontal-bar';
import { cardStyle, headerPad } from './_styles';

export function WeeklyTeamPerformance() {
  const { stats, isLoading } = useTeamWeek();
  const totalHours = stats.reduce((s, r) => s + r.hours, 0);
  const totalRevenue = stats.reduce((s, r) => s + r.revenue, 0);

  return (
    <Card style={cardStyle()} data-testid="weekly-team-performance">
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
          Weekly Team Performance
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
            aria-label="Weekly team performance loading"
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
