# Time & Expenses Page — RULE-0 Parity Audit

**Bible:** `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/TimeAndExpenses.jsx` (271 lines)
**Port:** `/Users/gqadonis/Projects/midnight/hotseaters-ultimate/src/features/trials/pages/time-and-expenses-page.tsx`
**Audit date:** 2026-06-29

---

## Gate Results

| Gate | Result | Notes |
|------|--------|-------|
| G1 — Bible read end-to-end | PASS | Bible read in full |
| G2 — Rendered DOM regions match | FAIL | All tab content is "Coming soon" stubs |
| G3 — Every visible string verbatim | PARTIAL | Page title "Time & Expenses", subtitle "Track your time and expenses", tab labels (Clock/Time/Expenses/Reports/Time Off) — all verbatim. Tab content strings absent. |
| G4 — Image assets locally hosted | N/A | No images on this page |
| G5 — var(--theme-*) tokens referenced | PASS | Header and container tokens correct |
| G6 — Animations reproduced | N/A | No page-level animations in bible |
| G7 — Deep links / CTAs correct | FAIL | No CTAs in tab content (all stubbed) |
| G8 — Business rules / calculations preserved (RULE J) | FAIL | All Tier-2 data stubbed; all calculations absent |

**Overall: FAIL (SKELETON STUB)** — Chrome (title, subtitle, tabs) is correct; all content is stub.

---

## What the port has (PASS)

1. Page title "Time & Expenses" — verbatim (rendered as HTML entity `&amp;` which is correct in JSX for `&`).
2. Subtitle "Track your time and expenses" — verbatim.
3. Header hidden on mobile (`hidden lg:flex`) — matches bible.
4. Tab labels: Clock / Time / Expenses / Reports / Time Off — verbatim match.
5. Tab values: `clock` / `combined` / `expenses` / `reports` / `timeoff` — verbatim.
6. `activeTab` state defaulting to `'combined'` — matches bible (the bible's `useTimeTrackingPreferences` also defaults to combined).
7. KPI cards conditional on `activeTab === 'combined'` — correct gate, wrong content (stub).
8. Debug card on clock tab when `company.show_debug_info` — structure matches bible.
9. `var(--theme-page-padding)` / `var(--theme-max-content-width)` / `var(--theme-card-gap)` — all referenced.
10. Loading guard: `if (isLoading) return <PageLoader ...>` — correct gate.

---

## Defects

### DEFECT-TE-01 (CRITICAL) — TimeClockInterface stub
- **Bible:** Full clock-in/clock-out interface with trial selector, service selector, time accumulator, active entry display, description field, start/stop/cancel controls. Driven by `activeEntry`, `hiringCompanyTrialServices`, `allTrialsForClock`, 8+ props.
- **Port:** `<ComingSoonStub label="TimeClockInterface" />`.
- **Fix required:** Port `TimeClockInterface` component.

### DEFECT-TE-02 (CRITICAL) — TimeTableTab stub (combined/Time tab)
- **Bible:** Spreadsheet-style time entry table with: date range filter, person filter, status filter (Pending/Approved/Rejected), my-time toggle, bulk approve/reject/reset, group by person/team/trial, adjust-for-daily-min toggle, allow-inactive toggle, inline edit/delete on entries.
- **Port:** `<ComingSoonStub label="TimeTableTab" />`.
- **Fix required:** Port `TimeTableTab`.

### DEFECT-TE-03 (CRITICAL) — TimeKPICards stub
- **Bible:** Shows KPI cards with: total hours, approved hours, pending hours, rejected hours — filtered by `showMyTime` toggle.
- **Port:** `<ComingSoonStub label="TimeKPICards" />`.
- **Fix required:** Port `TimeKPICards`.

### DEFECT-TE-04 (CRITICAL) — ExpensesTab stub
- **Bible:** Full expense list with: date filter, status filter (Pending/Approved/Rejected), my-expenses toggle, search query, person filter, group by team/trial/person/report, with expense CRUD actions, allow-inactive toggle.
- **Port:** `<ComingSoonStub label="ExpensesTab" />`.
- **Fix required:** Port `ExpensesTab`.

### DEFECT-TE-05 (CRITICAL) — ExpenseReportsTab stub
- **Bible:** Expense report grouping and submission workflow.
- **Port:** `<ComingSoonStub label="ExpenseReportsTab" />`.
- **Fix required:** Port `ExpenseReportsTab`.

### DEFECT-TE-06 (CRITICAL) — TimeOffTab stub
- **Bible:** Time off request list with status, date range, admin approve/reject, calendar integration.
- **Port:** `<ComingSoonStub label="TimeOffTab" />`.
- **Fix required:** Port `TimeOffTab`.

### DEFECT-TE-07 (CRITICAL) — No Tier-2 data wired
- **Bible:** `useTimeTrackingData()` loads: trials, clients, services, trialServices, consultants, pipelineStages, timeEntries, allTimeEntries, activeEntry, activeHiringCompanyEntry, userExpenses, subcontractAssignments, subcontractTrials, expenseReports, trialSegments, hshSubcontractorTimeEntries, hshSubcontractorExpenses — ~20 entity arrays.
- **Port:** `const timeEntries: unknown[] = []` and `const allTimeEntries: unknown[] = []` hardcoded.
- **Fix required:** Wire `useTimeTrackingData()` equivalent via entity graph / Tier-2 store.

### DEFECT-TE-08 (CRITICAL) — No mutations wired
- **Bible:** `useTimeTrackingMutations()` provides: `handleCreateEntry`, `handleUpdateEntry`, `handleDeleteEntry`, `handleApprove`, `handleReject`, `handleResetToPending`, `handleBulkApprove`, `handleBulkReject`, `handleBulkResetToPending`, `handleStartTracking`, `handleCancelTracking`, `handleUpdateDescription`.
- **Port:** All mutations are `void`-ed stubs.
- **Fix required:** Wire mutations to entity CRUD stores when Tier-2 lands.

### DEFECT-TE-09 (HIGH) — useTimeTrackingPreferences not ported
- **Bible:** `useTimeTrackingPreferences(userData)` maintains 20+ persisted preferences (tab, showMyTime, timeStatusFilter, personFilter, showFutureTrials, date filters, group-by flags, expense filters) all backed to `userInfo.preferences`.
- **Port:** Only `activeTab` and `showMyTime` as local state; no persistence.
- **Fix required:** Port preference persistence.

### DEFECT-TE-10 (HIGH) — Allow Inactive confirmation dialog missing
- **Bible:** "Allow Inactive" toggle (shared by Time and Expenses tabs) requires a confirmation `AlertDialog` ("This will let you add time and expenses to inactive cases. Use with caution.") before enabling.
- **Port:** State `allowInactive` exists as a `void` stub. No dialog.
- **Fix required:** Implement the confirmation dialog once TimeTableTab and ExpensesTab are ported.

### DEFECT-TE-11 (HIGH) — isBase44Admin check missing
- **Bible:** `const isBase44Admin = user?.role === 'admin' || user?.role === 'owner'` (platform-level admin, different from company role). Used to gate certain debug/admin views in sub-components.
- **Port:** Not computed.
- **Fix required:** Add `isBase44Admin` derivation from auth user role.

---

## Business Rules Assessment (RULE J)

| Rule | Bible Location | Port Status |
|------|---------------|-------------|
| showMyTime controls whether owner sees all vs own time | TimeAndExpenses.jsx lines 177, 221–222 | STATE EXISTS, NOT APPLIED |
| timeRoundingMinutes from company (default 15) | line 111 | ABSENT |
| clockInRounding / clockOutRounding from company | lines 195–196 | ABSENT |
| hideDeals from company (hide_deals_from_time_clock) | line 199 | ABSENT |
| subcontractAssignment hiringCompanyMap merge | lines 125–134 | ABSENT |
| hshSubcontractorTimeEntries deduplication via linked_time_entry_id | line 221 | ABSENT |
| hshSubcontractorExpenses deduplication via linked_expense_id | line 234 | ABSENT |
| spreadsheetProps construction (20+ props) | lines 95–153 | ABSENT |
| Tab-specific data scoping (owner sees all; non-owner sees own) | lines 96–100 | ABSENT |

---

## Inline Fixes Made
None — stub requires full Tier-2 integration before any of these can be addressed.
