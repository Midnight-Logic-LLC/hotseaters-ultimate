/**
 * StubCard — placeholder used for MVP cards whose backing entities aren't
 * yet synced in v0.1 (Tier-C: invoices, time entries, subcontract,
 * notifications). Keeps the dashboard layout faithful so visual parity is
 * easy to read once those entities land.
 */

import type { LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface StubCardProps {
  title: string;
  icon: LucideIcon;
  iconClassName?: string;
  description?: string;
}

export function StubCard({
  title,
  icon: Icon,
  iconClassName,
  description = 'Lands when this entity syncs (v0.2).',
}: StubCardProps) {
  return (
    <Card
      style={{
        borderRadius: 'var(--theme-card-radius)',
        boxShadow: 'var(--theme-card-shadow)',
        borderWidth: 'var(--theme-card-border)',
        backgroundColor: 'var(--theme-card-bg)',
        position: 'relative',
      }}
    >
      <CardHeader
        className="flex flex-row items-center justify-between pb-2"
        style={{ padding: 'var(--theme-card-header-padding)' }}
      >
        <CardTitle
          style={{
            fontSize: 'var(--theme-text-label)',
            fontWeight: 500,
            color: 'var(--theme-stone-500)',
          }}
        >
          {title}
        </CardTitle>
        <Icon className={iconClassName ?? 'h-4 w-4 text-stone-400'} />
      </CardHeader>
      <CardContent
        style={{
          paddingLeft: 'var(--theme-card-header-padding)',
          paddingRight: 'var(--theme-card-header-padding)',
          paddingBottom: 'var(--theme-card-header-padding)',
        }}
      >
        <div
          className="font-bold"
          style={{ fontSize: '1.5rem', color: 'var(--theme-stone-400)' }}
        >
          —
        </div>
        <p
          style={{
            fontSize: 'var(--theme-text-caption)',
            color: 'var(--theme-stone-500)',
            marginTop: '0.25rem',
          }}
        >
          {description}
        </p>
      </CardContent>
      <span
        className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
        style={{
          backgroundColor: 'var(--theme-stone-100)',
          color: 'var(--theme-stone-500)',
        }}
      >
        v0.2
      </span>
    </Card>
  );
}
