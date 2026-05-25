/**
 * QuickStatsCard — bible Dashboard.jsx lines 926–989.
 *
 * Compact list of 4 always-on counters + 2 conditional HSH counters.
 */

import { Clock, FileText, Orbit, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuickStats } from '@/features/dashboard/hooks/use-quick-stats';
import { cardStyle, headerPad, bodyPad } from './_styles';

interface StatRowProps {
  icon: typeof Users;
  label: string;
  value: string | number;
  valueClass?: string;
}

function StatRow({ icon: Icon, label, value, valueClass }: StatRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: 'var(--theme-stone-500)' }} aria-hidden="true" />
        <span className="text-sm" style={{ color: 'var(--theme-stone-600)' }}>
          {label}
        </span>
      </div>
      <span
        className={`font-semibold ${valueClass ?? ''}`}
        style={!valueClass ? { color: 'var(--theme-stone-900)' } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

export function QuickStatsCard() {
  const {
    activeClients,
    teamMembers,
    outstandingAmount,
    avgHoursPerWeek,
    openHshPosts,
    activeHshGigs,
    isLoading,
  } = useQuickStats();

  return (
    <Card style={cardStyle()} data-testid="quick-stats-card">
      <CardHeader style={headerPad()}>
        <CardTitle
          style={{
            fontSize: 'var(--theme-text-card-title)',
            color: 'var(--theme-stone-900)',
          }}
        >
          Quick Stats
        </CardTitle>
      </CardHeader>
      <CardContent style={bodyPad()} className="space-y-4">
        {isLoading ? (
          <div
            aria-busy="true"
            aria-label="Quick stats loading"
            className="animate-pulse rounded"
            style={{ height: '8rem', backgroundColor: 'var(--theme-stone-200)' }}
          />
        ) : (
          <>
            <StatRow icon={Users} label="Active Clients" value={activeClients} />
            <StatRow icon={Users} label="Team Members" value={teamMembers} />
            <StatRow
              icon={FileText}
              label="Outstanding"
              value={`$${Math.round(outstandingAmount).toLocaleString()}`}
              valueClass="text-amber-600"
            />
            <StatRow icon={Clock} label="Avg Hours/Week" value={avgHoursPerWeek.toFixed(1)} />
            {openHshPosts !== undefined && (
              <StatRow
                icon={Orbit}
                label="HSH Posts"
                value={openHshPosts}
                valueClass="text-purple-600"
              />
            )}
            {activeHshGigs !== undefined && (
              <StatRow
                icon={Orbit}
                label="HSH Gigs"
                value={activeHshGigs}
                valueClass="text-purple-600"
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
