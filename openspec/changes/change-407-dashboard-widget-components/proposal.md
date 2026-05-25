# change-407 — Dashboard widget components

## Why
Phase A (business rules) + Phase B (lookups) + Phase C (hooks) provide
the data layer. This change builds the **17 widget components** that
consume those hooks and render bible-parity UI.

Each widget is a thin React component: it imports its hook, renders
UI primitives (`<Card>`, `<Button>`, recharts charts), exposes no
prop-drilling for data, and contains **no role checks**. Role gating
lives in the registry (change-408).

Visual parity is RULE 0 — every rendered viewport must overlap the
bible at 1440×900 and 375×667 within ≤5% drift.

## What changes
17 new files in `src/features/dashboard/widgets/`:

| File | Bible LOC | Hook |
|---|---|---|
| `welcome-header.tsx` | 698–709 | `useTier1().userInfo` |
| `needs-attention-banner.tsx` | 711–755 | `use-needs-attention` |
| `kpi-tile.tsx` | (shared primitive) | — |
| `kpi-revenue-ytd.tsx` | 762–786 | `use-recent-activity` shares the data feed (revenue YTD aggregate) |
| `kpi-pipeline-value.tsx` | 788–805 | `use-pipeline-summary` |
| `kpi-outstanding.tsx` | 807–824 | `use-quick-stats` (returns outstanding) |
| `kpi-active-trials.tsx` | 826–843 | `use-pipeline-summary` (ops side) |
| `kpi-trials-ytd.tsx` | 845–862 | inline derive from `useEntityList<Trial>` |
| `kpi-revenue-per-trial-ytd.tsx` | 864–884 | `use-quick-stats` |
| `sales-pipeline-chart.tsx` | 891–924 | `use-pipeline-summary` |
| `quick-stats-card.tsx` | 926–989 | `use-quick-stats` |
| `recent-activity-card.tsx` | 991–1090 | `use-recent-activity` |
| `weekly-team-performance.tsx` | 1092–1142 | `use-team-week` |
| `monthly-team-performance.tsx` | 1144–1193 | `use-team-month` |
| `active-trial-performance.tsx` | 1195–1252 | `use-active-trial-stats` |
| `upcoming-trials-card.tsx` | 1254–1322 | `use-upcoming-trials` |
| `revenue-trend-card.tsx` | (port of components/revenue-trend-card.tsx + `useRevenueTrend`) | `use-revenue-trend` + `use-dashboard-preferences` |
| `quick-actions-bar.tsx` | 1326–1437 | `use-quick-actions` |

Every widget:
- Renders its own loading skeleton (mirrors bible empty states).
- Reads colors/spacing/typography from `var(--theme-*)` only (no
  hardcoded values).
- Passes a11y check (`aria-label` on charts, `role="status"` on
  loading states, focus rings on clickable cards).

## Out of scope
- The page shell + registry (change-408).
- E2E tests beyond unit snapshots (change-409).
- Re-themeing or design-token changes (theme is bible-locked).

## Tasks → see `tasks.md`.
