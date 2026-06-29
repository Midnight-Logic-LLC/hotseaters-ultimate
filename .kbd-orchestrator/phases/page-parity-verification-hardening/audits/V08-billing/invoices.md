# RULE-0 Parity Audit — Invoices

**Bible:** `HotSeatersMVP/src/pages/Invoices.jsx` (1619 lines)
**Port:** `src/features/invoices/pages/invoices-page.tsx`
**Audit date:** 2026-06-29

---

## Gate verdict: BLOCKED

Kanban chrome, dialogs, and navigation logic are well-ported. All blocking
defects trace to Tier-2 data stubs (billing store not landed).

---

## Defects

### D1 — BLOCKING — Tier-2 data stubs (billing store not landed)

All billing data stubs to empty arrays:
- `invoices`, `clients`, `trials`, `timeEntries`, `expenses`
- `subcontractAssignments`, `hiringCompanies`, `hshTrials`

**User impact:** both Kanban columns are always empty. No invoices can be
created, previewed, edited, or sent.

**Fix:** wire billing store hook.

---

### D2 — BLOCKING — `readyToInvoiceList` is hard-coded to `[]`

Bible lines 1039–1141 compute the "Create Invoices" column from `timeEntries`
and `expenses` grouped by trial. Port stubs to `useMemo<ReadyItem[]>(() => [], [])`.

**Bible formula for totalAmount:**
```js
// bible Invoices.jsx ~line 1068
totalAmount += Math.round((entry.amount || 0) * 100) / 100;
```

**Fix:** implement grouping logic when billing store lands.

---

### D3 — BLOCKING — Invoice form is a cancel-only stub

Bible `InvoiceForm` renders the full create/edit invoice form including:
- Trial/client selector
- Time-entry checkbox list with hours, amount
- Expense checkbox list
- Notes, recipient emails
- PDF preview link

Port renders a stub card with just "Create Invoice — form pending store wiring"
and a Cancel button.

---

### D4 — BLOCKING — All 4 mutations are no-ops

| Mutation | Bible action | Port status |
|----------|-------------|-------------|
| `createInvoiceMutation` | marks TimeEntries/Expenses 'billed', creates Invoice, triggers `generateInvoicePdf` | `toast.info('...pending')` |
| `saveInvoiceMutation` | adds/removes line items, conditionally re-generates PDF | `toast.info('...pending')` |
| `invalidateInvoiceMutation` | calls `deleteInvoice` cloud function | `handleDeleteInvoice` → toast only |
| `sendInvoiceMutation` | calls `sendInvoiceEmail` or sets status='sent' | `handleSendInvoice` → toast only |

---

### D5 — MEDIUM — `BillingCompactSummary` is a stub

Port renders a single-line stub with a DollarSign icon. Bible's
`BillingCompactSummary` shows total ready-to-invoice, total draft, and
month-to-date billed amounts.

---

### D6 — LOW — HSH badge class must use CSS, not Tailwind

Bible (line ~1097):
```jsx
<Badge className="mt-1 bg-purple-100 text-purple-700 text-[10px]">HSH</Badge>
```
Port (line 534): same class string — this matches. No defect.

---

### D7 — LOW — "Create Invoice" button shows `Plus + FileText` on mobile

Port (lines 469–479) correctly renders the icon pair on mobile per bible lines
1311–1321. Verified correct.

---

### D8 — LOW — Send dialog "Mark as Sent" label logic

Port (lines 908–916) correctly renders "Send Invoice" vs "Mark as Sent" based
on whether `recipients.to.length > 0`. Matches bible. No defect.

---

## Business rules preserved (layout/navigation)

| Rule | Bible ref | Port status |
|------|-----------|-------------|
| Auto-open from URL params `trialId` + `clientId` + `from=trial` | lines 369–388 | ✓ lines 255–281 |
| Status colors: draft/sent/partial/paid/cancelled | lines 1014–1020 | ✓ `STATUS_COLORS` |
| `draftInvoices`: status `draft \|\| generating` | line 1027 | ✓ line 340–341 |
| Form hidden on mobile when `showForm` | line 1307 | ✓ line 466 |
| Delete dialog copy: "return all associated time entries…" | lines 1496–1516 | ✓ lines 776–784 |
| PDF failed: extract error from `invoice.notes` regex `\[GENERATING\]` | lines 1430–1451 | ✓ lines 628–636, 657–674 |

---

## V11 backlog items

- Wire billing store hook (all Tier-2 stubs)
- Implement `readyToInvoiceList` grouping formula (totalAmount rounding)
- Port `InvoiceForm` component (full create/edit)
- Wire `createInvoiceMutation` → `generateInvoicePdf` cloud function
- Wire `saveInvoiceMutation` (line-item delta, PDF regen)
- Wire `invalidateInvoiceMutation` → `deleteInvoice` cloud function
- Wire `sendInvoiceMutation` → `sendInvoiceEmail` cloud function
- Port `BillingCompactSummary` with metric display
