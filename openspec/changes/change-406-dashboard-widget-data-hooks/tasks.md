# Tasks — change-406

## Per-hook implementation (each gets a TDD pair: hook + spec)

- [x] T1. `use-pipeline-stages.ts` — thin re-export of `useTier1().pipelineStages` with `useMemo` filter to active stages of either type. Spec: returns active-only by default; `{ type: 'sales' }` filters to sales stages.

- [x] T2. `use-pipeline-summary.ts` — `useEntityList({ type: 'Trial', queryKey: ['trial', companyId], where: { company_id: companyId } })` + `usePipelineStages({ type: 'sales' })` → returns `{ dealsByStage, pipelineValue, weightedValue, activeDeals }` via Phase A `pipeline-aggregation`. Spec: seeded graph → bible-matched output.

- [x] T3. `use-upcoming-trials.ts` — `useEntityView<Trial>({ baseQueryKey: ['trial', 'upcoming', companyId], view: { filter: [...], sort: [{ field: 'start_date', direction: 'asc' }], limit: 5 } })`. Joins `Client` for `firm_name`. Spec: only future + op-stage trials; sorted asc; limit honored.

- [x] T4. `use-recent-activity.ts` — combines `useEntityView<Trial>({ filter: [completion_type='won'], sort: [won_date desc], limit: 3 })` + `useEntityView<Invoice>({ ..., mode: 'hybrid', remoteFetch: invoicesApi.recent, limit: 3 })`. Returns `{ recentlyWon, recentInvoices, isLoading }`.

- [x] T5. `use-active-trial-stats.ts` — `useEntityView<Trial>({ filter: active+op-stage })` + `useEntityView<TimeEntry>({ mode: 'hybrid', remoteFetch })` + clients. Pass to `computeActiveTrialStats`. Spec: empty trials → `[]`; with seeded entries → sorted desc by revenue.

- [x] T6. `use-team-week.ts` — `useEntityList<TimeEntry>({ ..., mode: 'hybrid', remoteFetch })` for this-week window + `useTier1().userInfos` + `useEntityView<SubcontractAssignment>({ mode: 'hybrid', ... })`. Pipeline: `filterTimeEntriesInWindow → aggregateTeamStats`. Spec: HSH merge, dedupe, empty handling.

- [x] T7. `use-team-month.ts` — same shape, monthly window. Shares helpers with T6 (extract `useTeamPeriod(startDate, endDate)` if duplication exceeds 30 lines).

- [x] T8. `use-quick-stats.ts` — combines five hooks/list reads into the 7 secondary counters (active clients, team members, outstanding $, avg hrs/wk, HSH posts/gigs, etc. per bible 926–989). Uses `computeOutstandingInvoices` + `avgHoursPerActiveConsultant`.

- [x] T9. `use-revenue-trend.ts` — `useEntityView<Invoice>({ mode: 'hybrid', remoteFetch })` for the fiscal-year window + `useTrialProjections()` for the projected-invoice map. Composes `monthlyTrend`/`weeklyTrend`/`toCumulative`/`attachTrend`/`revenueGoalForPeriod`. Reads `period` + `cumulative` + `fiscalYear` from `useDashboardPreferences()`. Spec: each toggle path produces the expected dataset shape.

- [x] T10. `use-trial-projections.ts` — `useEntityView<TrialService>({ mode: 'hybrid', remoteFetch })` + `useEntityList<Trial>` + `useTier1().pipelineStages` + `useTier1().services`. Composes `enrichTasksWithDailyRevenue` + `buildProjectedInvoiceMap`. Returns `Map<dateKey, $>` keyed by billing date.

- [x] T11. `use-needs-attention.ts` — `useEntityView<Lead>({ mode: 'hybrid', remoteFetch })` + same for `SalesActivity` (status='pending'), `Attorney`, `Client`. Composes `computeStaleLeadCounts({ now, myUserInfoId })`. Spec: matches bible counts.

- [x] T12. `use-dashboard-preferences.ts` — reads `useTier1().userInfo.preferences` + `useEntityMutation({ type: 'UserInfo', mutate: (input) => api.patchUserInfo({ id, preferences: { ...existing, ...input } }) })`. Optimistic patch. Returns `{ prefs, setFiscalYear, setShowCumulative, setPeriod }`.

- [x] T13. `use-quick-actions.ts` — composes `quickActionsFor({ role, company })` from Phase A + resolves each `QuickActionId` to `{ label, icon, onClick }`. `onClick` navigates via `useNavigate` (side-effects deferred to offline-first phase). Spec: role × company-flag × action-id table.

## Verification

- [x] T14. `pnpm vitest run src/features/dashboard/hooks` green — every hook has at least one spec.
- [x] T15. `pnpm typecheck && pnpm lint` green. boundaries lint passes — no hook imports a component, no hook imports `getLocalDB` or supabase directly.
- [x] T16. Manual DevTools sanity: open `/Dashboard` in dev, confirm that widget hooks fetch via REST when `SYNC_CONFIG` doesn't carry the backing entity (visible in Network panel as Supabase REST calls).

## Acceptance

- 14 hook files + 14 spec files; each spec asserts at least one bible-matched output.
- No hook recomputes a calculation that exists in `business-rules/` — every numeric output flows through the Phase A modules.
- Bundle size budget: `pnpm size` within budget (≤ +5KB gzip).
