/**
 * QuickStatsCard — compact secondary stats list. Ports the legacy
 * `Dashboard.jsx` "Quick Stats" card. v0.1 trims the rows that depend on
 * Tier-C entities (Outstanding, Avg Hours/Week, HSH counts) — those are
 * replaced with a "Coming in v0.2" footnote.
 */

import { Users, FileText, Clock, Orbit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard-stats';
import { useTier1 } from '@/app/tier1-provider';

export function QuickStatsCard() {
  const stats = useDashboardStats();
  const { company } = useTier1();

  return (
    <Card
      style={{
        borderRadius: 'var(--theme-card-radius)',
        boxShadow: 'var(--theme-card-shadow)',
        borderWidth: 'var(--theme-card-border)',
        backgroundColor: 'var(--theme-card-bg)',
      }}
    >
      <CardHeader style={{ padding: 'var(--theme-card-header-padding)' }}>
        <CardTitle
          style={{
            fontSize: 'var(--theme-text-card-title)',
            color: 'var(--theme-stone-900)',
          }}
        >
          Quick Stats
        </CardTitle>
      </CardHeader>
      <CardContent
        style={{ padding: 'var(--theme-card-padding)' }}
        className="space-y-4"
      >
        <Row
          icon={Users}
          label="Active Clients"
          value={stats.clientsActive.toLocaleString()}
        />
        <Row
          icon={Users}
          label="Team Members"
          value={stats.teamActive.toLocaleString()}
        />
        <Row
          icon={FileText}
          label="Outstanding"
          value="$—"
          tone="muted"
          stub
        />
        <Row icon={Clock} label="Avg Hours/Week" value="—" tone="muted" stub />
        {(company?.marketplace_post_jobs || company?.marketplace_fill_jobs) && (
          <Row icon={Orbit} label="HSH activity" value="—" tone="muted" stub />
        )}
      </CardContent>
    </Card>
  );
}

interface RowProps {
  icon: typeof Users;
  label: string;
  value: string;
  tone?: 'normal' | 'muted';
  stub?: boolean;
}

function Row({ icon: Icon, label, value, tone = 'normal', stub = false }: RowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <Icon
          className="h-4 w-4"
          style={{ color: 'var(--theme-stone-500)' }}
        />
        <span
          style={{
            fontSize: 'var(--theme-text-body)',
            color: 'var(--theme-stone-600)',
          }}
        >
          {label}
        </span>
        {stub && (
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
            style={{
              backgroundColor: 'var(--theme-stone-100)',
              color: 'var(--theme-stone-500)',
            }}
          >
            v0.2
          </span>
        )}
      </span>
      <span
        className="font-semibold"
        style={{
          fontSize: 'var(--theme-text-body)',
          color:
            tone === 'muted'
              ? 'var(--theme-stone-400)'
              : 'var(--theme-stone-900)',
        }}
      >
        {value}
      </span>
    </div>
  );
}
