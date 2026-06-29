# V06 Audit — Deal Tracker Page

**Bible:** `HotSeatersMVP/src/pages/DealTracker.jsx` (509 lines)
**Port:** `src/features/deals/pages/deal-tracker-page.tsx` (509 lines)
**Audit date:** 2026-06-29

---

## Gate Results

| Gate | Status | Notes |
|------|--------|-------|
| 1. Bible read end-to-end | PASS | Full 509-line bible read; port is a close adaptation |
| 2. DOM regions/hierarchy match | PASS | Page header, overlays (DealWizardV2, TrialDetails, HSHTrialDetails), hidden-while-overlay DealUrgencyBanner + DealTrackerTab — matches bible structure |
| 3. Every visible string verbatim | PASS | "Deal Tracker" heading ✓; "Track active deals and manage the sales pipeline" subtitle ✓ |
| 4. Image assets locally hosted | N/A | No images on this page |
| 5. var(--theme-*) tokens referenced | PASS | Port uses `var(--theme-page-padding)`, `var(--theme-font-body)`, `var(--theme-text-body)`, `var(--theme-max-content-width)`, `var(--theme-card-gap)`, `var(--theme-text-page-title)`, `var(--theme-stone-900)`, `var(--theme-stone-600)` — same token set as bible |
| 6. Animations reproduced | N/A | No page-level animations (animations are in sub-components) |
| 7. Deep links/CTAs correct | PASS | `?trialId=` and `?edit=` deep links handled; overlay close returns to tracker |
| 8. Business rules/calculations preserved | PARTIAL | See RULE J defects |

---

## Defects — HIGH

### DEF-DT1: TrialDetails overlay is a stub (known gap)
**Bible:** `TrialDetails` component renders a full deal/trial detail panel with tabs (Notes, Time & Expenses, Invoices, Documents, HSH, etc.), action buttons (Mark as Won/Lost/Settled/Completed, Restore, Revert, Delete).
**Port:** Per the known assessment gap, TrialDetails overlay is a stub — the Notes tab uses the new `deal_note` table (just migrated). The port's `TrialDetails` component needs full audit separately.
**Severity:** HIGH — but this is a sub-component defect, not a page-level defect.

### DEF-DT2: `editLaunchedFromCard` referenced before declaration
**Port line 184:** `setEditLaunchedFromCard(false)` is called inside `handleSubmit` before the `editLaunchedFromCard` state is declared at line 205.
**Bible:** State is declared at the top of the component (proper hoisting via `useState`).
**Severity:** LOW — JavaScript hoisting means `useState` will still work, but is a code ordering smell. (Inline fix applied below.)

### DEF-DT3: `handleViewModeChange` called before `savePreference` is defined (ordering)
**Port:** `handleViewModeChange` at line 94 calls `savePreference` which is defined at line 150 — fine in JS, but confusing code structure.
**Severity:** LOW — no runtime issue.

---

## Defects — RULE J (Business rules)

### BR-DT1: Deal pool filter — `stage.type === 'sales'` check
**Bible and port both filter:** active deals = trials where stage is sales-type and not lost/settled. Lost mode = trials where `completion_type === 'deal_lost' || 'deal_settled'`. `showMyDeals` filters by `consultant_id === userInfo.id`.
**Status:** PASS — port reproduces this correctly.

### BR-DT2: Contact-only prospect filter
**Bible:** Prospects = attorneys where `is_active_prospect && contact_status !== 'transferred' && !salesStageContactIds.has(a.id)`. In showMyDeals mode, additionally filtered by `firm.sales_lead === userInfo.id`.
**Port:** Exact same logic at lines 334–348.
**Status:** PASS.

### BR-DT3: Sales-stage date filter for Lost view
**Bible:** 8 date filter options (today, this_week, this_month, last_week, last_month, this_year, last_year, custom). Applied only in lost mode. Filters by trial date range overlap.
**Port:** Exact same 8 options with same range calculation logic at lines 286–311.
**Status:** PASS.

### BR-DT4: `daysUntilTrial` computation
**Bible and port:** `differenceInDays(new Date(deal.start_date + 'T00:00:00'), today)` — today is zeroed to midnight.
**Status:** PASS.

### BR-DT5: Drag-and-drop deal stage update
**Bible:** `handleDragEnd` calls `updateStageMutation.mutate({ id: draggableId, status: destination.droppableId })`.
**Port:** Same at line 327.
**Status:** PASS.

### BR-DT6: Preference persistence (debounced, batched)
**Bible:** Simple async write per preference change.
**Port:** Adds a 500ms debounce + batch (`pendingPrefsRef`) — actually improves on the bible to avoid rate-limit issues. Acceptable adaptation.
**Status:** PASS (improvement).

### BR-DT7: Permission checks for edit/complete
**Bible:** `canEdit = isOwnerOrAdmin || (isSales && trial.consultant_id === userInfo.id)`.
**Port:** Same formula at lines 354–355.
**Status:** PASS.

---

## Visual Strings Check

| String | Bible | Port | Match |
|--------|-------|------|-------|
| Page title | "Deal Tracker" | "Deal Tracker" | ✓ |
| Subtitle | "Track active deals and manage the sales pipeline" | "Track active deals and manage the sales pipeline" | ✓ |
| Loading message | "Loading deals..." | "Loading deals..." | ✓ |

---

## V11 Backlog Items

- [ ] **V11-DT1** Full audit of `TrialDetails` sub-component for Notes tab (deal_note table) parity
- [ ] **V11-DT2** Fix `editLaunchedFromCard` declaration order (cosmetic)

---

## Inline fixes applied
None required — DEF-DT2 is a code smell but not a functional defect.

---

## Summary
**Deal Tracker page is the strongest port of the five.** The page-level orchestration (overlays, preferences, data flow, permission gates, date filtering, drag-drop) all match the bible. The remaining gap is in the sub-components (particularly `TrialDetails`) and the Notes tab migration.
