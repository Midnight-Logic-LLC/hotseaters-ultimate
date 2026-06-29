# RULE-0 Parity Audit — Approvals

**Bible:** `HotSeatersMVP/src/pages/Approvals.jsx` (271 lines)
**Port:** `src/features/approvals/pages/approvals-page.tsx`
**Audit date:** 2026-06-29

---

## Gate verdict: BLOCKED

The page skeleton and business-rule logic are correct. All blocking defects are
caused by the billing store not yet landing (Tier-2 data).

---

## Defects

### D1 — BLOCKING — Tier-2 data stubs (billing store not landed)

All Tier-2 arrays are hard-coded to `EMPTY_ARR`:
- `timeEntries` (bible key `allTimeEntries`)
- `expenses` (bible key `allCompanyExpenses`)
- `trials` (bible key `approvalTrials`)
- `subcontractAssignments`, `hshCompanies`, `hshInvoices` (bible key `approvalHshData`)
- `hshSubcontractorCompanies`

**User impact:** columns always show "No items pending". Approvals flow is
entirely broken.

**Fix:** wire billing store hook when it lands; remove `EMPTY_ARR` stubs.

---

### D2 — BLOCKING — Sub-column components are `StubColumn` stubs

`ApproveTimeColumn`, `ApproveExpensesColumn`, and `ApproveHSHInvoicesColumn`
are not ported. Port renders a generic card with the column title only.

**Bible renders:**
- `ApproveTimeColumn`: time-entry cards with approve/reject per entry, bulk
  approve, "Include in-progress" toggle wiring, ApprovalsCompactSummary
- `ApproveExpensesColumn`: expense approval cards
- `ApproveHSHInvoicesColumn`: HSH invoice approval with per-invoice actions

**Fix:** port all three column components against the billing store.

---

### D3 — MEDIUM — `ApprovalsCompactSummary` stub is an inline toggle

The port renders an "Include in-progress" toggle inline in the summary bar
area. The bible's `ApprovalsCompactSummary` component also shows billing
metrics (total approved hours, total approved amount, etc.). The summary bar
in the port is purely the toggle widget.

**Fix:** port `ApprovalsCompactSummary` with the full metric display.

---

### D4 — LOW — HSH column title string

Port renders `title="HSH Invoices"`.
Bible renders column via `ApproveHSHInvoicesColumn` whose header reads
"Approve HSH Invoices".

**Trivial fix (1 line):**
```tsx
// approvals-page.tsx line 210
<StubColumn title="Approve HSH Invoices" ... />
```

---

## Business rules preserved

| Rule | Bible ref | Port status |
|------|-----------|-------------|
| `isOwnerOrAdmin = company_role === 'owner' \|\| 'admin'` | line 39 | ✓ line 101–102 |
| `isPerTrial = company.invoice_period === 'per_trial'` | line 44 | ✓ line 104 |
| `effectiveIncludeInProgress = isPerTrial ? true : includeInProgress` | line 45 | ✓ line 105 |
| 3-col grid when `enrichedHSHInvoices.length > 0` | line 107 | ✓ line 203–207 |
| `ApprovalsCompactSummary` hidden when `isPerTrial` | line 226 | ✓ line 169 |
| Page title "Approvals" / subtitle "Review and approve…" | line 67 | ✓ lines 156–165 |
| Desktop-only header | line 65 | ✓ line 147 |

---

## V11 backlog items

- Port `ApproveTimeColumn` (depends on billing store Tier-2 hook)
- Port `ApproveExpensesColumn` (depends on billing store Tier-2 hook)
- Port `ApproveHSHInvoicesColumn` (depends on billing store + HSH store Tier-2)
- Port `ApprovalsCompactSummary` with metric display
- Fix column title string: "HSH Invoices" → "Approve HSH Invoices"
