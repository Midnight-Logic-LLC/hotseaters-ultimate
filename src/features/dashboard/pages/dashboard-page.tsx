/**
 * DashboardPage — thin composition shell.
 *
 * This file does NOT render business logic. It reads the role-aware
 * widget registry (`useDashboardWidgets`) and lays each widget into
 * its declared grid slot. Adding a widget = adding a registry row +
 * a widget file + a hook file. Zero edits here.
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx — the rendered layout
 * (KPI row, 3-col main row, wide rows, footer) at viewports 1440×900
 * + 375×667. Visual parity is enforced by the change-409 Playwright
 * harness, not by hand-curating JSX here.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useMemo } from 'react';
import {
  useDashboardLayout,
  useDashboardWidgets,
  type WidgetSlot,
  type WidgetSpec,
} from '@/features/dashboard/hooks/use-dashboard-widgets';

function partition(
  specs: ReadonlyArray<WidgetSpec>,
): Record<WidgetSlot, WidgetSpec[]> {
  const out: Record<WidgetSlot, WidgetSpec[]> = {
    header: [],
    banner: [],
    kpi: [],
    'main-1': [],
    'main-2': [],
    'main-3': [],
    wide: [],
    footer: [],
  };
  for (const s of specs) out[s.slot].push(s);
  return out;
}

function renderSlot(specs: ReadonlyArray<WidgetSpec>) {
  return specs.map((s) => {
    const C = s.Component;
    return (
      <div key={s.id} data-testid="dashboard-card" className="contents">
        <C />
      </div>
    );
  });
}

export function DashboardPage() {
  const specs = useDashboardWidgets();
  const grouped = useMemo(() => partition(specs), [specs]);
  const { kpiGridClass } = useDashboardLayout();

  return (
    <div
      className="w-full min-w-0 lg:px-8"
      style={{
        padding: 'var(--theme-page-padding)',
        fontFamily: 'var(--theme-font-body)',
        fontSize: 'var(--theme-text-body)',
      }}
      data-testid="dashboard-page"
    >
      <div
        className="mx-auto"
        style={{ maxWidth: 'var(--theme-max-content-width)' }}
        data-testid="dashboard-card-stack"
      >
        {renderSlot(grouped.header)}

        {renderSlot(grouped.banner)}

        {/* KPI row — class comes from useDashboardLayout, NOT a role check. */}
        {grouped.kpi.length > 0 && (
          <section
            className={kpiGridClass}
            style={{
              gap: 'var(--theme-card-gap)',
              marginBottom: 'var(--theme-section-gap)',
            }}
            aria-label="Key metrics"
          >
            {renderSlot(grouped.kpi)}
          </section>
        )}

        {/* Main 3-column row (Pipeline | Quick Stats | Recent Activity).
            Empty slots collapse — role filter handles the matrix. */}
        {grouped['main-1'].length +
          grouped['main-2'].length +
          grouped['main-3'].length >
          0 && (
          <section
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            style={{
              gap: 'var(--theme-card-gap)',
              marginBottom: 'var(--theme-section-gap)',
            }}
          >
            {renderSlot(grouped['main-1'])}
            {renderSlot(grouped['main-2'])}
            {renderSlot(grouped['main-3'])}
          </section>
        )}

        {/* Wide row — full-card on mobile, 2-col on lg. */}
        {grouped.wide.length > 0 && (
          <section
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{
              gap: 'var(--theme-card-gap)',
              marginBottom: 'var(--theme-section-gap)',
            }}
          >
            {renderSlot(grouped.wide)}
          </section>
        )}

        {/* Footer — Quick Actions */}
        {renderSlot(grouped.footer)}
      </div>
    </div>
  );
}
