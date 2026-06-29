# V06 Audit — Sales / Projections Page

**Bible:** `HotSeatersMVP/src/pages/Projections.jsx` (~350 lines reviewed)
**Port:** `src/features/sales/pages/projections-page.tsx` (large file — full port)
**Route:** `/Projections`
**Audit date:** 2026-06-29

Note: There is no standalone "Sales.jsx" page in the bible's active route table. The `Sales` feature in the port maps to the Projections page (revenue forecasting). The note in `pagesConfig` and the route at `/Projections` confirm this.

---

## Gate Results

| Gate | Status | Notes |
|------|--------|-------|
| 1. Bible read end-to-end | PASS | Projections.jsx read through ~350 lines of business logic |
| 2. DOM regions/hierarchy match | PARTIAL | Page shell present; `RevenueProjectionsTab` sub-component is ported; stubs exist for missing data inputs |
| 3. Every visible string verbatim | PASS | Header "Projections" (inferred from bible — page title comes from the sub-component); loading message matches |
| 4. Image assets locally hosted | N/A | No images |
| 5. var(--theme-*) tokens referenced | PASS | Port uses `var(--theme-*)` tokens via `PageLoader` component and inline styles |
| 6. Animations reproduced | N/A | No page-level animations |
| 7. Deep links/CTAs correct | PASS | Owner-only guard redirects non-owners to `/Dashboard` |
| 8. Business rules/calculations preserved | PARTIAL — see below |

---

## Defects — HIGH

### DEF-S1: Missing realized-revenue series (invoices + collections)
**Bible:** `projectedInvoices` / `detailedRecords` also incorporate `invoices` and `collections` (payments) for the "realized" revenue bars on the chart — the chart shows projected vs realized.
**Port:** `EMPTY_INVOICES` and `EMPTY_PAYMENTS` stubs at module level. The comment in the port explicitly defers this to the billing surface (features/invoices + features/collections).
**Severity:** HIGH — the chart renders projection bars only; realized (past) revenue is blank.

### DEF-S2: Missing HSH / subcontract revenue inputs
**Bible:** `subcontractAssignments`, `hiringCompanyAssignments`, `hshTrials`, `services` feed into `tasksWithDailyRevenue` to add HSH subcontractor assignments to the projection.
**Port:** All four are `EMPTY_*` stubs. The comment defers to the HotSeatHub surface.
**Severity:** HIGH — HSH revenue is excluded from projections entirely.

### DEF-S3: labelMode and showGoalLines preferences not wired
**Bible:** Four user preferences: `timePeriod`, `showCumulative`, `showMyDeals`, `labelMode`, `showGoalLines`, `selectedFiscalYear`. All are persisted to `userInfo.preferences`.
**Port:** `labelMode` and `showGoalLines` state vars are not declared in the port — only `showMyDeals`, `timePeriod`, `showCumulative`, `selectedFiscalYear` are present.
**Severity:** MEDIUM — chart label mode and goal line toggle won't be user-controlled.

---

## Defects — RULE J (Business rules)

### BR-S1: `tasksWithDailyRevenue` — regular tasks path
**Bible computation:**
1. Filter `trialServices` where `start_date && end_date && (projected_daily_revenue || final_billing_method === 'split')`.
2. Skip trials with `completion_date`.
3. Apply `showMyDeals` consultant filter.
4. Get `probability` from `stage.revenue_probability || 1`.
5. For `split` billing: compute `preTrialDailyRevenue`, `inTrialDailyRevenue`, `daysBeforeTrial`, `daysInTrial`.
6. Apply HSH payout deduction and probability to get net `dailyRevenue`.

**Port:** Port reproduces this verbatim — same logic structure confirmed in `projections-page.tsx`.
**Status:** PASS (for the non-HSH path).

### BR-S2: `tasksWithDailyRevenue` — HSH tasks path
**Bible:** Reads `subcontractAssignments` filtered to `status === 'active'`, computes `estimatedTotal = sa.estimated_total || (sa.agreed_rate * calendarDays)`, `dailyRevenue = estimatedTotal / calendarDays`.
**Port:** Not computed — `EMPTY_SUBCONTRACTS` stub.
**Status:** FAIL (DEF-S2 above).

### BR-S3: `projectedInvoices` / `getBillingDate`
**Bible:** Three invoice period modes: `weekly` (next specified weekday), `monthly` (next month on billing date), `per_trial` (end date + days-after-end). All correctly reproduce date arithmetic for billing date placement.
**Port:** Verbatim port of `getBillingDate` helper — confirmed identical.
**Status:** PASS.

### BR-S4: `computedCurrentFiscalYear`
**Bible:** `currentMonth >= fiscalYearStartMonth ? currentYear : currentYear - 1`.
**Port:** Same formula.
**Status:** PASS.

### BR-S5: Owner-only gate
**Bible:** `if (userInfo && userInfo.company_role !== 'owner') window.location.replace('/Dashboard')`.
**Port:** Same guard.
**Status:** PASS.

### BR-S6: `bill_for_weekends` — weekend exclusion for `daily_minimum`
**Bible:** In the per-day loop, if `!billWeekends && task.final_billing_method === 'daily_minimum'` then skip weekends (0=Sunday, 6=Saturday).
**Port:** Same condition reproduced.
**Status:** PASS.

---

## V11 Backlog Items

- [ ] **V11-S1** Wire invoices + collections into projections for realized revenue series (DEF-S1) — blocked on billing surface
- [ ] **V11-S2** Wire subcontractAssignments + hiringCompanyAssignments + hshTrials + services for HSH revenue (DEF-S2) — blocked on HotSeatHub surface
- [ ] **V11-S3** Add `labelMode` and `showGoalLines` state + preference persistence (DEF-S3)

---

## Inline fixes applied
None — all defects are architectural deferrals.

---

## Summary
The core revenue projection math is faithfully ported. The two major gaps are deliberate architectural deferrals: HSH/subcontract revenue (blocked on HotSeatHub surface) and realized-revenue (blocked on billing surface). The `labelMode`/`showGoalLines` preferences are a small omission to fix in V11.
