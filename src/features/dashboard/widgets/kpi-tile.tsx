/**
 * KpiTile — shared bible-parity primitive for the dashboard KPI row.
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 762–884 (each KPI
 * card is the same shape: title + icon row, then big value, then optional
 * caption). All values come from `--theme-*` tokens (RULE 0).
 *
 * Renders a skeleton shimmer when `value === undefined`.
 */

import type { ElementType, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cardStyle, headerPad, kpiBodyPad } from './_styles';

export interface KpiTileProps {
  title: string;
  /** When undefined, the tile renders a skeleton bar in place of the value. */
  value: string | number | undefined;
  icon: ElementType;
  /** Tailwind utility classes for the icon (e.g. 'h-4 w-4 text-green-600'). */
  iconClass: string;
  caption?: ReactNode;
  onClick?: () => void;
  /** Stable identifier — used by e2e tests + visual harness. */
  testId?: string;
}

export function KpiTile({
  title,
  value,
  icon: Icon,
  iconClass,
  caption,
  onClick,
  testId,
}: KpiTileProps) {
  const interactive = typeof onClick === 'function';
  return (
    <Card
      className={
        interactive
          ? 'cursor-pointer transition-shadow hover:shadow-lg'
          : 'transition-shadow'
      }
      style={cardStyle()}
      onClick={onClick}
      data-testid={testId}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <CardHeader
        className="flex flex-row items-center justify-between pb-2"
        style={headerPad()}
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
        <Icon className={iconClass} aria-hidden="true" />
      </CardHeader>
      <CardContent style={kpiBodyPad()}>
        {value === undefined ? (
          <div
            aria-busy="true"
            aria-label={`${title} loading`}
            className="animate-pulse rounded"
            style={{
              height: '1.5rem',
              width: '60%',
              backgroundColor: 'var(--theme-stone-200)',
            }}
          />
        ) : (
          <div
            className="font-bold"
            style={{ fontSize: '1.5rem', color: 'var(--theme-stone-900)' }}
          >
            {value}
          </div>
        )}
        {caption !== undefined && value !== undefined && (
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
    </Card>
  );
}
