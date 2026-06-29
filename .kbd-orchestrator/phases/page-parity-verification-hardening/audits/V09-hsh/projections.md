# RULE-0 Parity Audit — Projections

**Bible:** `HotSeatersMVP/src/pages/Projections.jsx` (317 lines)
**Port:** `src/features/sales/pages/projections-page.tsx`
**Audit date:** 2026-06-29

---

## Gate verdict: BLOCKED (1 blocking defect)

This is the most complete of the 9 audited pages. The revenue projection engine
(`useProjectionsData` hook, `RevenueProjectionsTab` component, and full fiscal-year
math) is fully wired and formula-accurate. One blocking functional defect: the
owner-only redirect guard is absent. Six data inputs are deferred (documented as
D06 — HSH store and billing store not yet landed).

---

## Defects

### D1 — BLOCKING — Owner-only redirect guard absent

**Bible lines 26–29:**
```js
useEffect(() => {
  if (userInfo.company_role !== 'owner') navigate('/Dashboard');
}, [userInfo]);
```

Port (`projections-page.tsx`) has no such guard. Non-owner users can access
the Projections page in the port; the bible restricts it to owners only.

**Fix (3 lines):**
```tsx
// in projections-page.tsx, after useTier1() destructures userInfo
useEffect(() => {
  if (userInfo?.company_role !== 'owner') navigate('/Dashboard');
}, [userInfo, navigate]);
```

---

### D2 — DEFERRED (D06) — HSH/subcontract data stubs

```ts
const EMPTY_SUBCONTRACTS: SubcontractAssignment[] = [];
const EMPTY_HIRING_ASSIGNMENTS: HiringAssignment[] = [];
const EMPTY_HSH_TRIALS: Trial[] = [];
const EMPTY_SERVICES: Service[] = [];
```

**User impact:** HSH task rows are omitted from the projection chart. The
`tasksWithDailyRevenue` array excludes all HSH-funded trials.

---

### D3 — DEFERRED (D06) — Billing realized revenue stubs

```ts
const EMPTY_INVOICES: Invoice[] = [];
const EMPTY_PAYMENTS: Payment[] = [];
```

**User impact:** Realized revenue bar in the projection chart shows $0.

---

### D4 — LOW — Page subtitle copy drift

**Bible line 54:** `"Revenue forecasting and billing projections"`
**Port:** `"Revenue forecasting across the fiscal year"`

The subtitle is visible under the page title. Both strings describe the same
page; this is a copy defect that should be fixed to match the bible verbatim.

---

## Business rules preserved

All core revenue-projection formulas are preserved verbatim from the bible.

| Rule | Bible ref | Port status |
|------|-----------|-------------|
| `fiscalYear = currentMonth >= fiscalYearStartMonth ? currentYear : currentYear - 1` | line 75 | ✓ `useProjectionsData` hook |
| `getBillingDate(trial, company)` helper | lines 82–100 | ✓ verbatim |
| Split billing detection: `isSplit`, `preTrialDays`, `inTrialDays` | lines 104–122 | ✓ verbatim |
| `preTrialDailyRevenue = (preTrialFee + extrasFee) / preTrialDays` | lines 124–126 | ✓ |
| `inTrialDailyRevenue = (weeklyFee * trialWeeks) / inTrialDays` | lines 127–129 | ✓ |
| Standard `dailyHshPayoutValue = hshAssignment.estimated_total / calendarDays` | line 135 | ✓ |
| `dailyRevenue (standard) = (drFull - dailyHshPayoutValue) * probability` | lines 138–140 | ✓ |
| HSH task: `estimatedTotal = sa.estimated_total ?? (sa.agreed_rate * calendarDays)` | lines 145–148 | ✓ |
| HSH task: `dailyRevenue = estimatedTotal / calendarDays` | line 150 | ✓ |
| `netProjectedValue = (dayRevenueFull - dayHshPayout) * probForDay` | lines 157–160 | ✓ |
| `projectedInvoices` — per-month aggregation | lines 165–180 | ✓ |
| `detailedRecords` — day-grain records for table view | lines 182–200 | ✓ |
| `showMyDeals` toggle wired to `userInfo.preferences` | line 65 | ✓ line 89 |
| Fiscal year state syncs on first load | line 67 | ✓ lines 91–95 |
| `RevenueProjectionsTab` component rendered | lines 250–270 | ✓ |
| `isPerTrial = company.invoice_period === 'per_trial'` | line 63 | ✓ line 85 |

---

## V11 backlog items

- Add owner-only redirect: `if (userInfo?.company_role !== 'owner') navigate('/Dashboard')`
- Fix subtitle copy: `"Revenue forecasting and billing projections"`
- Wire HSH store hook → replace `EMPTY_SUBCONTRACTS`, `EMPTY_HIRING_ASSIGNMENTS`, `EMPTY_HSH_TRIALS`, `EMPTY_SERVICES`
- Wire billing store hook → replace `EMPTY_INVOICES`, `EMPTY_PAYMENTS`
