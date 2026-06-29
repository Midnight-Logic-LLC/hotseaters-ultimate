# RULE-0 Parity Audit — PotentialGigs

**Bible:** `HotSeatersMVP/src/pages/PotentialGigs.jsx` (1007 lines)
**Port:** `src/features/hsh/pages/potential-gigs-page.tsx`
**Audit date:** 2026-06-29

---

## Gate verdict: BLOCKED

Feature gate, toolbar chrome, response-form modal, and all business-rule
derivations are well-ported. Blocking defects are Tier-2 data stubs and
un-ported view components.

---

## Defects

### D1 — BLOCKING — Tier-2 data stubs (HSH store not landed)

```ts
const allRequests: GigRequest[] = EMPTY_ARR;
const myResponses: GigResponse[] = EMPTY_ARR;
const myAssignments: GigAssignment[] = EMPTY_ARR;
const services = EMPTY_ARR;
const myConsultants = EMPTY_ARR;
const myServices = EMPTY_ARR;
```

**User impact:** no gigs are displayed; response form service picker is empty.

---

### D2 — BLOCKING — All three view components are `StubView` stubs

| View | Bible renders | Port renders |
|------|--------------|--------------|
| kanban | `GigsKanban` — columns per category | `StubView` |
| card | `GigsCards` — card per gig | `StubView` |
| list | `GigsListTable` — tabular list | `StubView` |

---

### D3 — BLOCKING — `createResponseMutation` is a no-op toast

Bible computes status from rate comparison:
```js
// bible PotentialGigs.jsx line ~588
status: parseFloat(proposed_rate) === request.estimated_rate
  ? 'pending_agreed'
  : 'pending_counter'
```
Port `handleSubmitResponse` only calls `toast.info('HSH response submission coming soon')`.

---

### D4 — MEDIUM — Consultant picker absent

Bible response form shows a consultant dropdown, hidden only when the company
has exactly 1 eligible consultant. Port response form has no consultant field
(the `consultant_id` state exists but no selector is rendered).

**Bible:** service-mapping + consultant picker + rate + message
**Port:** service-mapping (empty options) + rate + message

---

### D5 — MEDIUM — Page icon uses `Orbit` instead of `HSHIcon`

Bible page title uses `<HSHIcon className="w-10 h-10" />` (a custom SVG icon
component). Port uses `<Orbit className="w-8 h-8">`. The visible size and icon
shape are different.

**Fix:** replace `<Orbit className="w-8 h-8">` with the `HSHIcon` component
(or equivalent custom SVG) at `w-10 h-10`.

---

### D6 — LOW — `effectiveViewType` is not hardcoded to `'manage'`

Bible line 481: `const effectiveViewType = 'manage'` (hardcoded, ignoring
the kanban/card/list toggle). This forces the "manage" mode which shows full
request details with respond/decline buttons. Port computes
`effectiveViewType = isMobile ? 'card' : viewType` (respects toggle).

This is a subtle functional defect: when the bible is in "manage" mode, each
request card shows respond/decline CTAs directly. Port users in list mode do
not see those CTAs on the request cards until the GigsListTable renders them.

**Fix:** set `effectiveViewType = 'manage'` (no toggle consideration) when
all view sub-components are ported.

---

### D7 — LOW — `DeclineRequestDialog` is an inline stub

Port (lines 882–913) shows a plain "Decline Request — coming soon" modal.
Bible's `DeclineRequestDialog` shows reason input and decline/cancel buttons.

---

## Business rules preserved

| Rule | Bible ref | Port status |
|------|-----------|-------------|
| `marketplace_fill_jobs` gate → "Page Not Available" | line 57 | ✓ lines 342–384 |
| `filteredRequests`: excludes own company, respects `is_public=false` (invited check) | lines 371–394 | ✓ lines 187–205 |
| `newOpportunities`: open + no prior response | line 396 | ✓ lines 208–213 |
| `myPendingResponses`: `pending_agreed \|\| pending_counter \|\| negotiating` | lines 397–404 | ✓ lines 215–228 |
| `myAcceptedResponses`: `accepted` | line 406 | ✓ lines 230–237 |
| `myDeclinedResponses`: `declined \|\| lost` | lines 408–412 | ✓ lines 239–245 |
| `myCompletedGigs`: accepted + assignment `completed` | lines 414–419 | ✓ lines 248–258 |
| `myCancelledGigs`: accepted + assignment `cancelled` | lines 421–427 | ✓ lines 259–268 |
| `myActiveAcceptedResponses`: accepted + assignment not completed/cancelled | lines 429–433 | ✓ lines 270–278 |
| Response form: proposed_rate prefilled to `estimated_rate` | line ~472 | ✓ line 298 |
| Daily min display: `estimated_rate * dailyMinimumHours` | line ~508 | ✓ lines 706–710 |
| Background: `var(--theme-hsh-background)` | — | ✓ line 402 |

---

## V11 backlog items

- Wire HSH store hook (SubcontractRequest, SubcontractResponse, SubcontractAssignment)
- Wire myConsultants + myServices
- Port `GigsKanban`, `GigsCards`, `GigsListTable` view components
- Wire `createResponseMutation` with `pending_agreed` / `pending_counter` status logic
- Add consultant picker to response form
- Replace `<Orbit>` icon with `HSHIcon` (w-10 h-10)
- Port `DeclineRequestDialog` with reason field
- Set `effectiveViewType = 'manage'` per bible
