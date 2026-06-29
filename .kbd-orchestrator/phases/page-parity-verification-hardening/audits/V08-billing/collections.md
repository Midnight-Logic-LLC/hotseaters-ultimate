# RULE-0 Parity Audit — Collections

**Bible:** `HotSeatersMVP/src/pages/Collections.jsx` (829 lines)
**Port:** `src/features/collections/pages/collections-page.tsx`
**Audit date:** 2026-06-29

---

## Gate verdict: BLOCKED

Business logic (grouping, filtering, paid-invoice detection, date ranges,
`hsh_paid` overrides, resend dialog) is thoroughly ported. Blocking defects
are Tier-2 data stubs and un-ported display sub-components.

---

## Defects

### D1 — BLOCKING — Tier-2 data stubs

```ts
const invoices: Invoice[] = [];
const clients: Client[] = [];
const trials: Trial[] = [];
const payments: Collection[] = [];
const hiringCompanies: Client[] = [];
```

**User impact:** page always shows empty state. No collections visible.

---

### D2 — BLOCKING — Display sub-components are stubs

| Sub-component | Bible renders | Port renders |
|---------------|--------------|--------------|
| `CollectionsCards` | card-per-group layout | `ComingSoonStub` |
| `CollectionsList / InvoiceListTable` | list/table view | `ComingSoonStub` |
| `RecordPaymentContent` | payment amount / date / method form | `ComingSoonStub` |
| `CollectionsSortHeader` | sortable column headers | not rendered |
| `PaymentsFilterSheet` | mobile filter drawer | not rendered (null) |
| `PdfPreviewDialog` | embedded PDF preview | not rendered (null) |

---

### D3 — BLOCKING — `markPaidMutation` is a no-op stub

Bible (lines ~620–650) creates a `Collection` record then recalculates status:
```js
// bible Collections.jsx
if (Math.round(totalPaid * 100) >= Math.round((invoice.total || 0) * 100))
  newStatus = 'paid';
else if (totalPaid > 0)
  newStatus = 'partial';
```
Port dialog "Record Collection" button calls no mutation.

---

### D4 — BLOCKING — `resendInvoiceMutation` is wired but calls no function

The resend dialog (lines 690–751) correctly shows the form and recipients.
The `AlertDialogAction` fires but no mutation is wired — it just closes the
dialog. Bible calls `sendInvoiceEmail` with `skip_status_update=true` and
optional `custom_message`.

---

### D5 — MEDIUM — localStorage preferences not loaded

Bible persists `activeTab`, `dateFilter`, `groupBy`, `showRowTint` to
`localStorage` key `'collections_toolbar_prefs'` and loads them on mount.

Port initialises all preferences to defaults only (no localStorage read/write).

---

### D6 — LOW — Zero-balance confirm dialog not implemented

Bible (lines ~618–622): if `remaining <= 0` at mark-paid time, shows "Mark
Invoice as Paid?" confirm dialog without creating a Collection record.
Port does not implement this zero-balance guard.

---

## Business rules preserved

| Rule | Bible ref | Port status |
|------|-----------|-------------|
| `isPaidFromPayments`: `status==='paid'` OR `Math.round(total*100) >= Math.round(invoice.total*100)` | lines 264–271 | ✓ lines 303–308 |
| `isOverdue`: `parseISO(due_date) < todayLocal` | lines 273–278 | ✓ lines 310–316 |
| `isOpenStatus`: `sent \|\| partial \|\| hsh_approved \|\| hsh_paid` | line 280 | ✓ lines 318–320 |
| `hsh_paid` label override: "Payment Sent" | line 303 | ✓ line 323 |
| `hsh_paid` color override: `bg-blue-100 text-blue-700` | line 304 | ✓ line 325 |
| Paid invoices sorted by latest `collection_date \|\| payment_date` | lines 349–359 | ✓ lines 402–414 |
| Date range computation (all 8 options) | lines 322–337 | ✓ lines 360–389 |
| `matchesSearch`: searches client name, case_name, job_number, invoice_number | lines 310–318 | ✓ lines 328–340 |
| Stage groups: Open (`success`), Overdue (`danger`), Paid (`success`) | lines 446–497 | ✓ lines 498–520 |
| Grand total labels: "Total Outstanding" / "Total Paid" / "Grand Total" | line 641 | ✓ lines 543–546 |
| Toolbar tabs: Open / Paid / All | — | ✓ lines 620–638 |
| `GrandTotalBarStub` functional (computes sum) | — | ✓ lines 177–200 |
| Resend dialog: shows recipients, optional message textarea | lines 654–708 | ✓ lines 690–751 |
| Mark-paid: mobile Drawer / desktop AlertDialog | lines 710–763 | ✓ lines 753–803 |

---

## V11 backlog items

- Wire billing store hook (Invoice, Client, Trial, Collection entities)
- Port `CollectionsCards` component
- Port `CollectionsList` + `InvoiceListTable` + `CollectionsSortHeader`
- Port `RecordPaymentContent` form
- Port `PdfPreviewDialog`
- Port `PaymentsFilterSheet` (mobile)
- Wire `markPaidMutation` → create Collection + recalculate status
- Wire `resendInvoiceMutation` → `sendInvoiceEmail` with `skip_status_update=true`
- Implement localStorage preference persistence (`collections_toolbar_prefs`)
- Implement zero-balance confirm dialog guard
