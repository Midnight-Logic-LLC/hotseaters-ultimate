/**
 * _styles.ts — internal style helpers shared by dashboard widgets.
 *
 * All values come from `--theme-*` CSS variables (RULE 0). No raw color
 * literals. Underscore prefix marks the file as widget-internal — not a
 * public dashboard API.
 */

import type { CSSProperties } from 'react';

export function cardStyle(): CSSProperties {
  return {
    borderRadius: 'var(--theme-card-radius)',
    boxShadow: 'var(--theme-card-shadow)',
    borderWidth: 'var(--theme-card-border)',
    backgroundColor: 'var(--theme-card-bg)',
  };
}

export function headerPad(): CSSProperties {
  return { padding: 'var(--theme-card-header-padding)' };
}

export function bodyPad(): CSSProperties {
  return { padding: 'var(--theme-card-padding)' };
}

/** Match bible's KPI body padding shape (header padding on three sides). */
export function kpiBodyPad(): CSSProperties {
  return {
    paddingLeft: 'var(--theme-card-header-padding)',
    paddingRight: 'var(--theme-card-header-padding)',
    paddingBottom: 'var(--theme-card-header-padding)',
  };
}
