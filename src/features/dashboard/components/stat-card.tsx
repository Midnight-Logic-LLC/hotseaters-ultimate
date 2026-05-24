/**
 * StatCard — small tile used in the dashboard's metrics band. Ports the
 * legacy card markup from `HotSeatersMVP/src/pages/Dashboard.jsx` for a
 * single key metric (Active Trials, Trials YTD, etc.).
 *
 * All interactive tiles have a minimum height of 44px so touch targets
 * meet the mobile requirement (RULE 4).
 */

import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/shared/lib/cn';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconClassName?: string;
  /** Caption rendered below the value. */
  caption?: string;
  /**
   * Percent delta vs prior period. When omitted the up/down arrow row is
   * not rendered. Positive = green up; negative = red down.
   */
  delta?: number | null;
  deltaLabel?: string;
  /** When present, the card acts as a button. */
  onClick?: () => void;
  /** When true, render a "Coming in v0.2" badge in the corner. */
  stub?: boolean;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  caption,
  delta,
  deltaLabel = 'vs last month',
  onClick,
  stub = false,
}: StatCardProps) {
  const body = (
    <>
      <CardHeader
        className="flex flex-row items-center justify-between pb-2"
        style={{ padding: 'var(--theme-card-header-padding)' }}
      >
        <CardTitle
          style={{
            fontSize: 'var(--theme-text-label)',
            fontWeight: 500,
            color: 'var(--theme-stone-600)',
          }}
        >
          {title}
        </CardTitle>
        <Icon className={cn('h-4 w-4', iconClassName)} />
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
          style={{ fontSize: '1.5rem', color: 'var(--theme-stone-900)' }}
        >
          {value}
        </div>
        {delta !== undefined && delta !== null && (
          <div className="mt-1 flex items-center gap-1">
            {delta >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            )}
            <p
              className={delta >= 0 ? 'text-green-600' : 'text-red-600'}
              style={{
                fontSize: 'var(--theme-text-caption)',
                fontWeight: 500,
              }}
            >
              {Math.abs(delta).toFixed(1)}% {deltaLabel}
            </p>
          </div>
        )}
        {caption && (
          <p
            style={{
              fontSize: 'var(--theme-text-caption)',
              color: 'var(--theme-stone-500)',
              marginTop: '0.25rem',
            }}
          >
            {caption}
          </p>
        )}
      </CardContent>
      {stub && (
        <span
          className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
          style={{
            backgroundColor: 'var(--theme-stone-100)',
            color: 'var(--theme-stone-500)',
          }}
        >
          v0.2
        </span>
      )}
    </>
  );

  const cardStyle = {
    borderRadius: 'var(--theme-card-radius)',
    boxShadow: 'var(--theme-card-shadow)',
    borderWidth: 'var(--theme-card-border)',
    backgroundColor: 'var(--theme-card-bg)',
    position: 'relative' as const,
    minHeight: '44px',
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="text-left"
        aria-label={`${title}: ${value}`}
      >
        <Card
          className="transition-shadow hover:shadow-lg"
          style={cardStyle}
        >
          {body}
        </Card>
      </button>
    );
  }

  return (
    <Card style={cardStyle}>
      {body}
    </Card>
  );
}
