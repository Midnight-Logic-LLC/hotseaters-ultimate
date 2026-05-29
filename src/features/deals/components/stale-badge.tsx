/**
 * stale-badge.tsx — port of HotSeatersMVP/src/components/sales/StaleBadge.jsx.
 *
 * Solid red pill badge with white reversed type for the Needs Attention count.
 * Variants:
 *   - "pill" (default): shows the number, hidden when count is 0.
 *   - "dot": small red dot only, no number.
 *
 * HotSeatersMVP is the bible.
 */

import type { CSSProperties } from 'react';

interface StaleBadgeProps {
  count?: number;
  variant?: 'pill' | 'dot';
  className?: string;
  style?: CSSProperties;
}

export function StaleBadge({
  count = 0,
  variant = 'pill',
  className = '',
  style = {},
}: StaleBadgeProps) {
  if (!count || count <= 0) return null;

  if (variant === 'dot') {
    return (
      <span
        aria-label={`${count} leads need attention`}
        className={`inline-block rounded-full ${className}`}
        style={{ width: '8px', height: '8px', backgroundColor: '#dc2626', ...style }}
      />
    );
  }

  const display = count > 99 ? '99+' : String(count);

  return (
    <span
      aria-label={`${count} leads need attention`}
      className={`inline-flex items-center justify-center font-semibold ${className}`}
      style={{
        backgroundColor: '#dc2626',
        color: 'white',
        fontSize: '10px',
        lineHeight: '1',
        padding: '2px 6px',
        minWidth: '18px',
        height: '18px',
        borderRadius: '9999px',
        ...style,
      }}
    >
      {display}
    </span>
  );
}
