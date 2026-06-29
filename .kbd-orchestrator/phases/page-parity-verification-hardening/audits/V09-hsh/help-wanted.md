# RULE-0 Parity Audit — HelpWanted

**Bible:** `HotSeatersMVP/src/pages/HelpWanted.jsx` (1251 lines)
**Port:** `src/features/hsh/pages/help-wanted-page.tsx`
**Audit date:** 2026-06-29

---

## Gate verdict: BLOCKED

Feature gate, dialog chrome (cancel agreement, cancel request, referral form),
toolbar, unassigned-services owner section, and business-rule derivations are
well-ported. Blocking defects are Tier-2 data stubs and un-ported view
components.

---

## Defects

### D1 — BLOCKING — Tier-2 data stubs (HSH store not landed)

```ts
const myRequests: HWRequest[] = EMPTY_ARR;
const receivedResponses: HWResponse[] = EMPTY_ARR;
const hiredSubcontractors: HWAssignment[] = EMPTY_ARR;
```

**User impact:** all three view renders show "coming soon". No postings visible.

---

### D2 — BLOCKING — All three view components are `StubView` stubs

| View | Port renders |
|------|-------------|
| kanban | `StubView "RequestsKanban — pending port"` |
| card | `StubView "RequestsCards — pending port"` |
| list | `StubView "RequestsListTable — pending port"` |

---

### D3 — BLOCKING — `AcceptConfirmationModal` is a stub

Bible shows "Accept and Close" (closes the posting) vs "Accept and Keep Open"
(does not close). Port modal (lines 652–677) shows "Close" only.

**Bible mutations triggered on accept:**
- `acceptResponseMutation`: sets response `status='accepted'`, creates
  SubcontractAssignment
- Conditional post close: `updateRequestMutation({ status: 'filled' })`

---

### D4 — BLOCKING — `cancelAgreementMutation` is a toast-only no-op

Bible calls `cancelHSHSubcontractAgreement` cloud function with timezone.
Port (line 734) calls `toast.info('Cancel agreement — coming soon')`.

---

### D5 — BLOCKING — `deleteRequestMutation` is a toast-only no-op

Bible calls `deleteHSHRequest` cloud function and blocks if `hasTimeEntries`.
Port (line 782) calls `toast.info('Cancel request — coming soon')`.

---

### D6 — MEDIUM — Map view not implemented

Bible has a full map view (`HWMapView`) with `HWBulkAssignDialog`. Port has
no map view mode in the toggle (only list/card/kanban).

---

### D7 — MEDIUM — `showMyDeals` toggle absent

Bible persists `showMyDeals` to `userInfo.preferences.helpWantedShowMyDeals`.
Port has no such toggle.

---

### D8 — MEDIUM — Page icon uses `Orbit` instead of `HSHIcon`

Bible: `<HSHIcon className="w-10 h-10" />`. Port: `<Orbit className="w-8 h-8">`.

---

### D9 — LOW — `UnassignedServicesList` is a "coming soon" inline stub

Bible renders a full list of trial services not yet posted to HSH, with a
"Post" button per service. Port renders "UnassignedServicesList — coming soon".

---

### D10 — LOW — `ReferralInviteForm` is a stub

Port (lines 795–820) shows "ReferralInviteForm — coming soon". Bible shows
a full invitation form with email input and message.

---

## Business rules preserved

| Rule | Bible ref | Port status |
|------|-----------|-------------|
| `marketplace_post_jobs` gate → `return null` | line 53 | ✓ line 402–404 |
| `isOwner = company_role === 'owner'` (unassigned services section) | line 60 | ✓ line 417 |
| `hasTimeEntries` guard (blocks delete) | lines 544–547 | ✓ lines 288–291 |
| `getDateRange` helper (all 8 cases, verbatim) | lines 586–606 | ✓ lines 126–183 |
| `filteredRequests`: search + date range filter | lines 609–635 | ✓ lines 301–318 |
| `openRequests`: status `'open'` | line 637 | ✓ line 322 |
| `allFilledRequests`: status `'filled'` | line 638 | ✓ line 326 |
| `completedRequests`: assignment `'completed'` | lines 640–645 | ✓ lines 331–338 |
| `cancelledAssignmentRequests`: assignment `'cancelled'` | lines 647–651 | ✓ lines 340–347 |
| `filledRequests`: filled but not completed/cancelled | lines 653–657 | ✓ lines 349–355 |
| `cancelledRequests`: status `'cancelled'` + cancelled assignments | lines 659–663 | ✓ lines 358–364 |
| Unassigned services: 2-panel grid, owner-only | lines 871–918 | ✓ lines 595–604 |
| Cancel agreement dialog: reason textarea, consultant name shown | lines 990–1027 | ✓ lines 679–746 |
| Cancel request dialog: service name shown | lines 1029–1059 | ✓ lines 748–791 |

---

## V11 backlog items

- Wire HSH store hook (SubcontractRequest, SubcontractResponse, SubcontractAssignment)
- Port `RequestsKanban`, `RequestsCards`, `RequestsListTable` view components
- Port `AcceptConfirmationModal` (two-button: Accept+Close / Accept+Keep Open)
- Wire `acceptResponseMutation` + conditional `updateRequestMutation`
- Wire `cancelAgreementMutation` → `cancelHSHSubcontractAgreement` cloud function
- Wire `deleteRequestMutation` → `deleteHSHRequest` cloud function (with hasTimeEntries guard)
- Port `HWMapView` + `HWBulkAssignDialog` (map mode)
- Implement `showMyDeals` toggle with `userInfo.preferences` persistence
- Replace `<Orbit>` icon with `HSHIcon` (w-10 h-10)
- Port `UnassignedServicesList` with per-service Post button
- Port `ReferralInviteForm` with email + message fields
