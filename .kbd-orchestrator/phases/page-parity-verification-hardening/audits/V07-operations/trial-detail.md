# Trial Detail Page — RULE-0 Parity Audit

**Bible:** `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/components/trials/TrialDetails.jsx` + `TrialInfoPanel.jsx`
**Port:** `/Users/gqadonis/Projects/midnight/hotseaters-ultimate/src/features/trials/pages/trial-detail-page.tsx`
**Audit date:** 2026-06-29

Note: The bible does not have a standalone `TrialDetail.jsx` page. The detail surface is the `TrialDetails` component rendered as an in-page overlay from `Trials.jsx`. The port implements this as a routed page at `/trials/:trialId`, which is architecturally different but may be acceptable under RULE 0's "implementation may differ" allowance. The acceptance gate is the rendered output and behaviour, not source structure.

---

## Gate Results

| Gate | Result | Notes |
|------|--------|-------|
| G1 — Bible read end-to-end | PASS | TrialDetails.jsx + TrialInfoPanel.jsx read (TrialInfoPanel.jsx is ~1100 LOC) |
| G2 — Rendered DOM regions match | PARTIAL | Core header fields present; several major sections missing |
| G3 — Every visible string verbatim | PARTIAL | Header copy matches; action button labels and section headers partially missing |
| G4 — Image assets locally hosted | N/A | No images on this page |
| G5 — var(--theme-*) tokens referenced | PASS | All card tokens referenced correctly |
| G6 — Animations reproduced | N/A | Bible has no page-level animations on this surface |
| G7 — Deep links / CTAs correct | FAIL | Edit routes to `/trials/:id/edit` (routed page); bible edit opens `DealWizardV2` in-place |
| G8 — Business rules / calculations preserved (RULE J) | FAIL | See defects |

**Overall: FAIL** — 9 blocking defects, 4 medium defects.

---

## Defects

### DEFECT-TD-01 (CRITICAL) — Missing action buttons panel
- **Bible (TrialDetails.jsx):** Renders a full action-button panel controlled by `isTrial`, `isDeal`, `isLostDeal`, `isCompletedTrial`. Buttons visible to user:
  - Active trial: "Mark as Completed" (with type picker: fully_settled, hung_jury, verdict_rendered, case_continued), "Revert to Deal"
  - Active deal: "Mark as Won", "Mark as Lost", "Mark as Settled"
  - Completed trial: "Restore Trial" / "Restore Deal" (depending on completion_type)
  - Owner/admin with active trial: "Delete"
  - Editor with active trial: "Edit" (via EditWizardMenu or direct)
- **Port:** Only an "Edit" link (routes to `/trials/:id/edit`). No status transitions, no delete, no restore.
- **Fix required:** Implement full action button panel with all mutations.

### DEFECT-TD-02 (CRITICAL) — Missing time tracking / invoices sections
- **Bible (TrialInfoPanel.jsx lines ~730–930):** When `isTrial`, renders Time section, Expenses section, and Invoices section with live counts, subtotals, and links.
- **Port:** No time, expenses, or invoices sections rendered.
- **Fix required:** Add these sections for `isTrial` state (when Tier-2 stores are ready).

### DEFECT-TD-03 (CRITICAL) — Missing HSH section
- **Bible:** When `isTrial`, renders HSH (HotSeatHub) section showing subcontract assignments, open requests, and related controls.
- **Port:** No HSH section.
- **Fix required:** Add HSH section when trial is in-trial state.

### DEFECT-TD-04 (CRITICAL) — Stage/type derivation missing
- **Bible:** Derives `isDeal`, `isTrial`, `isLostDeal` from `pipelineStages.find(s => s.id === trial.pipeline_stage_id)` and `completion_type`. These control which sections and buttons are visible.
- **Port:** Only uses `completion_type` for the status badge; does not derive `isDeal`/`isTrial`/`isLostDeal`.
- **Fix required:** Load pipeline stages and derive these flags to gate sections/actions correctly.

### DEFECT-TD-05 (HIGH) — Stats row is wrong
- **Bible (TrialInfoPanel.jsx):** Shows daily minimum hours, bill for weekends, rate/billing method per service, projected daily revenue. No generic "Services / Est. Value / Attorneys / Segments" row.
- **Port:** Shows a 4-card stats row: Services count, Est. Value (fmtMoney), Attorneys count, Segments count. These counts are not shown in the bible's detail panel.
- **Fix required:** Replace with the bible's info layout. The count/stats row is a port invention.

### DEFECT-TD-06 (HIGH) — Missing deal documents section
- **Bible:** When documents exist, renders `DealDocumentsSection` (e-sign status, download, view links).
- **Port:** No documents section.
- **Fix required:** Add documents section.

### DEFECT-TD-07 (HIGH) — Missing sales activity section
- **Bible:** Renders `SalesActivitySection` for deal/trial (activity log, notes, next steps).
- **Port:** No activity section.
- **Fix required:** Add sales activity section.

### DEFECT-TD-08 (HIGH) — Client firm name not displayed in header
- **Bible (TrialInfoPanel.jsx lines ~200–240):** Header prominently shows the client's `firm_name` / `full_name` as a key piece of meta. Also shows attorney list from secondaryContacts.
- **Port:** Does not load or display client info in the header; attorney count in stats card but no names.
- **Fix required:** Load and display client info in header.

### DEFECT-TD-09 (HIGH) — Missing pipeline stage badge in header
- **Bible:** Shows the current pipeline stage as a colored badge (using PipelineStageBadge component) next to the title.
- **Port:** Shows a completion badge only when `completion_type` is set; active trials show no stage badge.
- **Fix required:** Load pipeline stages and render the stage badge.

### DEFECT-TD-10 (MEDIUM) — Tab set does not match bible
- **Bible tabs (TrialDetails.jsx):** Services, Contacts, Time, Expenses, Invoices, Documents, HSH. Tab visibility is gated by `isTrial` / `isDeal` / `isLostDeal`.
- **Port tabs:** Services, Attorneys, Segments, Assignments, Map.
- **Assessment:** Some port tabs (Segments, Assignments, Map) are additions not in the bible's tab set. Segments and Assignments exist as sub-panels within the bible's Services tab. Map may be acceptable as an extension. The Attorneys tab name matches "Contacts" in content but deviates in label. The critical tabs missing from the port are Time, Expenses, Invoices, Documents, HSH.
- **Fix required:** Add Time, Expenses, Invoices, Documents, HSH tabs; gate by trial vs deal state; rename Attorneys → Contacts.

### DEFECT-TD-11 (MEDIUM) — Missing close/back button behavior
- **Bible:** Detail panel has a close button (X) that returns to the pipeline with `onClose(() => setSelectedTrial(null))`.
- **Port:** No close button; uses browser back navigation (route-based).
- **Fix required:** If keeping routed approach, add a "← Back to Trials" button; if converting to overlay approach, add close button.

### DEFECT-TD-12 (MEDIUM) — `isProcessing` spinner missing
- **Bible:** Passes `isProcessing` to `TrialDetails` which renders a loading overlay over action buttons during mutations.
- **Port:** No mutation loading state on the detail page.
- **Fix required:** Add `isPending` states on all mutation buttons.

### DEFECT-TD-13 (LOW) — `formatTrialDates` handles `continued_date_precision === 'none'` correctly
- **Port:** PASS for this specific calculation — port correctly renders "Continued - new dates to be determined" for `none`, and "Rescheduled to {Month YYYY} (exact dates TBD)" for `month_only`.

---

## Business Rules Assessment (RULE J)

| Rule | Bible Location | Port Status |
|------|---------------|-------------|
| isDeal / isTrial / isLostDeal derivation from pipeline stage | TrialDetails.jsx lines 222–225 | MISSING |
| isCompletedTrial (completion_type && ≠ case_continued) | Trials.jsx line 148 | MISSING |
| canEdit: owner/admin or (sales && own trial) | Trials.jsx line 144 | PARTIAL (present but not applied to all gates) |
| canComplete: same as canEdit | Trials.jsx line 145 | MISSING |
| isOwnTrial: consultant_id === userInfo.id | Trials.jsx line 143 | PARTIAL |
| Restore: isLostDeal → restoreDeal else restoreTrial | Trials.jsx line 253 | MISSING |
| Delete only when !isCompletedTrial && isOwnerOrAdmin | Trials.jsx line 256 | MISSING |

---

## Inline Fixes Made
None — defects require significant feature additions, not inline edits.
