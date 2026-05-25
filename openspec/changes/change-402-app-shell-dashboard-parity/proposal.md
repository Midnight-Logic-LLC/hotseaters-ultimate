# change-402 — app-shell + dashboard widget parity

## Why
Port's `/Dashboard` renders 3 of 6 KPI tiles as `StubCard` placeholders and
has zero charts. Bible Dashboard.jsx is 1441 LOC of widgets: 6 KPIs, sales
pipeline bar chart, Quick Stats, Recent Activity, weekly + monthly team
performance, active-trial performance, upcoming trials, Quick Actions,
revenue trend with projected overlay. Bible Layout.jsx mounts
SidebarUserFooter, Toaster, TrialBanner; port omits all three. Three
inconsistent logo sources across the same app.

## What changes
1. Logo unification → `/brand/chameleon-logo.png` everywhere.
2. NEW `src/features/auth/components/sidebar-user-footer.tsx` (port from
   bible).
3. `src/app/app-shell.tsx` mounts Toaster + TrialBanner + SidebarUserFooter.
4. NEW `src/features/dashboard/hooks/use-dashboard-aggregates.ts` — pure
   derivations matching bible math.
5. `src/features/dashboard/pages/dashboard-page.tsx` — remove all StubCards;
   port bible widgets verbatim.
6. NEW `src/features/dashboard/components/revenue-trend-card.tsx`
   (recharts, deferrable sub-task).
7. NEW widget components: team-performance-card, trial-performance-card,
   upcoming-trials-card, quick-actions-card, needs-attention-banner.

## Out of scope
- `<CompanyMigration />` port.
- NotificationsMenu port (mobile header).
- Per-company Google Fonts injection (lands with change-403's company
  Realtime channel).

## Tasks → see `tasks.md`.
