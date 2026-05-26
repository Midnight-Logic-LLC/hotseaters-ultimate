/**
 * ActiveTrialPerformance — bible Dashboard.jsx lines 1195–1252.
 *
 * Empty copy: "No active trial data yet" (bible line 1247).
 */

import { Gavel } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActiveTrialStats } from '@/features/dashboard/hooks/use-active-trial-stats';
import { HorizontalBar } from './_horizontal-bar';
import { cardStyle, headerPad } from './_styles';

export function ActiveTrialPerformance() {
  const { stats, isLoading } = useActiveTrialStats();

  return (
    <Card style={cardStyle()} data-testid="active-trial-performance">
      <CardHeader style={headerPad()}>
        <CardTitle
          className="flex items-center gap-2"
          style={{
            fontSize: 'var(--theme-text-card-title)',
            color: 'var(--theme-stone-900)',
          }}
        >
          <Gavel className="h-4 w-4" aria-hidden="true" />
          Active Trial Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && stats.length === 0 ? (
          <div
            aria-busy="true"
            aria-label="Active trial performance loading"
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
            No active trial data yet
          </p>
        ) : (
          <HorizontalBar
            data={stats.map((s) => ({ ...s, name: `${s.name} (${s.client})` }))}
            bars={[
              {
                dataKey: 'hours',
                fill: '#2563EB',
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
            height={288}
          />
        )}
      </CardContent>
    </Card>
  );
}
