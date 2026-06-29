# RULE-0 Parity Audit — Bills

**Bible:** `HotSeatersMVP/src/pages/Bills.jsx` (749 lines)
**Port:** `src/features/bills/pages/bills-page.tsx`
**Audit date:** 2026-06-29

---

## Gate verdict: BLOCKED

Business-rule logic, dialog chrome, sidebar-aware breakpoint, and all
constants are well-ported. Blocking defects are Tier-2 data stubs and
un-ported sub-display-components.

---

## Defects

### D1 — BLOCKING — Tier-2 data stubs (billing store not landed)

```ts
const bills: BillInvoice[] = [];
const companies: BillCompany[] = [];
const trials: BillTrial[] = [];
const payments: BillPayment[] = [];
```

**User impact:** page shows only stub sections. No bills are visible.

---

### D2 — BLOCKING — All display sub-components are stubs

| Sub-component | Bible renders | Port renders |
|---------------|--------------|--------------|
| `CollectionsCards` | card-grid of bills | `StubSection` |
| `CollectionsList` | grouped list with sort header | `StubSection` |
| `InvoiceListTable` | ungrouped flat table | `StubSection` |
| `PageToolbar` | search + tab + groupBy + date filter + row-tint | `StubSection` with props echo |
| `PaymentsFilterSheet` | mobile filter drawer | `StubSection` |
| `GrandTotalBar` | footer total bar | `StubSection` |
| `CollectionsSortHeader` | sort header row | `StubSection` |
| `RecordPaymentContent` | payment form fields | `StubSection` |
| `PdfPreviewDialog` | embedded PDF iframe | `StubSection` |

---

### D3 — BLOCKING — `recordBillPaymentMutation` is a no-op stub

Bible (lines ~530–560) creates a `BillPayment` record and conditionally
sets invoice status to `'hsh_paid'`:
```js
// bible Bills.jsx
if (Math.round(newTotalPaid * 100) >= Math.round((invoice.total || 0) * 100))
  status = 'hsh_paid'
```
Port `handleRecordPayment` calls `toast.success('Bill payment recorded')` only.

---

## Business rules preserved

| Rule | Bible ref | Port status |
|------|-----------|-------------|
| `isBillPaid`: status `paid \|\| hsh_paid` OR `Math.round(totalPaid*100) >= Math.round(total*100)` | lines ~280–290 | ✓ lines 248–252 |
| `isOverdue`: `parseISO(due_date) < todayLocal` (local time) | lines ~295–305 | ✓ lines 254–260 |
| `isOpenStatus`: `hsh_approved \|\| sent \|\| partial` | line ~310 | ✓ line 262–263 |
| Sidebar-aware breakpoint: `sidebarCollapsed ? 1072 : 1280` | lines ~42–44 | ✓ line 181 |
| Date range default: `'this_year'` | line ~65 | ✓ line 194 |
| Default payment amount: `Math.max(0, invoice.total - priorPaid).toFixed(2)` | lines ~390–395 | ✓ lines 376–380 |
| Stage groups: Unpaid (`hsh-primary`), Past Due (`danger`), Paid (`success`) | lines ~490–530 | ✓ lines 506–539 |
| GroupBy options: stage / none / client / trial | — | ✓ lines 433–476 |
| Grand total label: "Total Outstanding" / "Total Paid" / "Grand Total" | — | ✓ lines 573–579 |
| `BILL_PAYMENT_LABELS` constant | — | ✓ lines 163–170 (exact strings match) |
| Desktop: AlertDialog / Mobile: Drawer for record-payment | — | ✓ lines 759–792 |
| `paymentsByInvoice` aggregation map | — | ✓ lines 222–233 |

---

## V11 backlog items

- Wire billing store hook (BillInvoice, BillCompany, BillTrial, BillPayment entities)
- Port `CollectionsCards` component
- Port `CollectionsList` + `CollectionsSortHeader` components
- Port `InvoiceListTable` component
- Port `PageToolbar` component
- Port `PaymentsFilterSheet` (mobile)
- Port `GrandTotalBar` component
- Port `RecordPaymentContent` form fields
- Port `PdfPreviewDialog`
- Wire `recordBillPaymentMutation` → create `BillPayment` + conditional `hsh_paid` status
- Wire `updatePaymentMutation` + `deletePaymentMutation`
