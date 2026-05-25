# Tasks — change-402

## 402.a — Shell wiring
- [ ] T1. Grep `src/` for `/logo.svg` references; replace each with `/brand/chameleon-logo.png`.
- [ ] T2. NEW `src/features/auth/components/sidebar-user-footer.tsx` ported from `HotSeatersMVP/src/components/sidebar/SidebarUserFooter.jsx`. Wires `signOut` to existing `auth-store.signOut`.
- [ ] T3. `src/app/app-shell.tsx` — mount `<Toaster position="top-center" />`, `<TrialBanner company={company} />`, `<SidebarUserFooter user={user} userInfo={userInfo} />`.
- [ ] T4. NEW `src/shared/components/trial-banner.tsx` ported from `HotSeatersMVP/src/components/TrialBanner.jsx`. Renders only when `company.trial_status` is set.

## 402.b — Dashboard aggregator hook
- [ ] T5. NEW `src/features/dashboard/hooks/use-dashboard-aggregates.ts`. Pure function over (entity-graph snapshot, now). Outputs: revenueYtd, revenueChange, pipelineValue, weightedPipelineValue, dealsActive, outstandingAmount, outstandingCount, trialsActive, trialsUpcoming, trialsYtdCount, revenuePerTrialYtd, recentInvoices, recentlyWonDeals, activeConsultants, avgHoursPerConsultant, openHSHPosts, activeHSHGigs, dealsByStage, trialsByStage, weeklyUserStats, monthlyUserStats, trialStats.
- [ ] T6. Unit spec `use-dashboard-aggregates.spec.ts` — table-driven against fixture snapshots, matches bible's math exactly (line-by-line port from `Dashboard.jsx:115-300`).

## 402.c — KPI tiles + Recent Activity row
- [ ] T7. `src/features/dashboard/pages/dashboard-page.tsx` — replace 3 StubCards with real Cards ported from `Dashboard.jsx:763-883`. Drop the bottom placeholder grid (Active Clients + Team).
- [ ] T8. Port Sales Pipeline + Quick Stats + Recent Activity row from `Dashboard.jsx:890-1083`. Recharts already in deps.
- [ ] T9. Port Needs Attention banner from `Dashboard.jsx:711-755` + `useMyStaleLeadsCount` hook.

## 402.d — Team + trial + upcoming + quick actions
- [ ] T10. Port weekly + monthly team-performance bar charts from `Dashboard.jsx:1085+` (requires reading page 2 of that file first).
- [ ] T11. Port active-trial performance card (hours + revenue per trial).
- [ ] T12. Port upcoming-trials list (next 5 by start_date).
- [ ] T13. Port Quick Actions row.

## 402.e — Revenue trend chart (deferrable)
- [ ] T14. NEW `src/features/dashboard/components/revenue-trend-card.tsx`. Port `Dashboard.jsx:303-525` math + stacked-bar render. Monthly/weekly toggle, cumulative toggle, trend line, goal line — all persist via `userInfo.preferences`.

## 402.f — Tests
- [ ] T15. Extend change-209 bible-parity harness to cover `/Dashboard` 1440×900 + 414×896.
- [ ] T16. NEW Playwright `dashboard-widget-parity.spec.ts` — 6 KPI tiles non-stub, pipeline bar count = stage count, sign-out via footer works.
- [ ] T17. `pnpm typecheck && pnpm test && pnpm test:e2e` green.
- [ ] T18. Visual diff ≤ 5 % vs the user's `/Dashboard` screenshot at 1440×900.
