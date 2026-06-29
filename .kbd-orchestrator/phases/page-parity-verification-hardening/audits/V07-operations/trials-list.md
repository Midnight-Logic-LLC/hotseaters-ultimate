# Trials List Page — RULE-0 Parity Audit

**Bible:** `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/Trials.jsx`
**Port:** `/Users/gqadonis/Projects/midnight/hotseaters-ultimate/src/features/trials/pages/trials-list-page.tsx`
**Audit date:** 2026-06-29

---

## Gate Results

| Gate | Result | Notes |
|------|--------|-------|
| G1 — Bible read end-to-end | PASS | Bible read in full |
| G2 — Rendered DOM regions match | FAIL | See defects |
| G3 — Every visible string verbatim | PARTIAL | Header strings match; pipeline tab labels absent |
| G4 — Image assets locally hosted | N/A | No images on this page |
| G5 — var(--theme-*) tokens referenced | PARTIAL | Header uses tokens; table cells do not use all tokens |
| G6 — Animations reproduced | FAIL | Bible has no bespoke page-level animations, but pipeline tabs/cards have hover states; port renders a flat table |
| G7 — Deep links / CTAs correct | FAIL | See defects |
| G8 — Business rules / calculations preserved (RULE J) | FAIL | See defects |

**Overall: FAIL** — 8 blocking defects.

---

## Defects

### DEFECT-TL-01 (CRITICAL) — Wrong UI paradigm: table instead of pipeline
- **Bible:** `PipelineTabContent` (Kanban/pipeline board with inner tabs: Active / Pre-Trial / Completed). The bible renders trials as draggable pipeline cards grouped by stage, not a flat table.
- **Port:** Renders a `<Table>` (TanStack React Table) with columns: Case, Case #, Start, End, Status, Est. value.
- **Impact:** Entire visible layout is wrong. No pipeline stages, no inner tabs, no card groupings.
- **Fix required:** Replace TanStack table with a pipeline/tab view matching `PipelineTabContent` output.

### DEFECT-TL-02 (CRITICAL) — Missing page-level overlays
- **Bible:** Owns three page-level overlays: `DealWizardV2` (trial creation/edit form), `TrialDetails` (detail panel), `HSHTrialDetails`. These render above the pipeline and return to it when closed.
- **Port:** Zero overlays. Clicking a trial routes to a separate page (`/trials/:id`). The bible never navigates away — it opens a detail panel in-place.
- **Fix required:** Implement in-page overlay pattern matching the bible.

### DEFECT-TL-03 (CRITICAL) — Missing trial creation wizard
- **Bible:** "New trial" opens `DealWizardV2` in `mode="trial"`, a multi-step wizard with trial data, services, and secondary contacts.
- **Port:** "New trial" button calls `create.mutate({ company_id, case_name: 'New trial' })` — creates a blank trial with no wizard, no services, no contacts.
- **Fix required:** Integrate multi-step creation wizard.

### DEFECT-TL-04 (HIGH) — Permission gates incomplete
- **Bible:** `canEdit(trial)` checks `isOwnerOrAdmin || (isSales && isOwnTrial(trial))`. Edit is gated per trial, not globally. Delete is owner/admin only. Complete is owner/admin or sales+own.
- **Port:** Only `canCreate` is checked (globally). No per-trial edit/complete/delete gates in the list view.
- **Fix required:** Implement per-trial permission gates on all action buttons.

### DEFECT-TL-05 (HIGH) — Missing status-change actions
- **Bible:** Pipeline cards expose: Mark as Completed, Revert to Deal, Re-open trial, with full mutation chain (`markAsCompletedMutation`, `restoreTrialMutation`, `revertToDealMutation`).
- **Port:** No action buttons on trial rows beyond navigation.
- **Fix required:** Add status-change CTAs matching bible.

### DEFECT-TL-06 (HIGH) — Missing legacy URL param handling
- **Bible:** Consumes `?edit=<id>` and `?trialId=<id>` on mount, opens the corresponding wizard or detail panel, then clears params via `window.history.replaceState`.
- **Port:** No URL param handling.
- **Fix required:** Implement `?edit=` / `?trialId=` deep link consumption.

### DEFECT-TL-07 (HIGH) — Missing scroll-to-top on detail open
- **Bible:** When `selectedTrial` opens, scrolls `.main-content-with-tabs` or `main` to top, then `window.scrollTo(0, 0)`.
- **Port:** Not implemented (no detail overlay exists yet, so N/A until overlay is built).
- **Fix required:** Implement on overlay open.

### DEFECT-TL-08 (HIGH) — selectedTrial sync effect missing
- **Bible:** `useEffect` keeps `selectedTrial` in sync when RTS patches arrive by comparing JSON-stringified trial and calling `setSelectedTrial(updated)`.
- **Port:** Not implemented.
- **Fix required:** Implement once overlay is built.

### DEFECT-TL-09 (MEDIUM) — Search scope too narrow
- **Bible (PipelineTabContent):** Search covers case name, client name, city, state, judge, case number, attorney names, and more depending on the inner tab.
- **Port:** Only searches `case_name`, `case_number`, `judge`.
- **Fix required:** Expand search to match bible scope.

### DEFECT-TL-10 (MEDIUM) — Empty state copy wrong
- **Bible:** When no trials exist the pipeline renders an empty stage column (bible delegates to PipelineTabContent). No "No trials yet." string in the bible.
- **Port:** Renders "No trials yet." in the center of the table.
- **Note:** Acceptable placeholder until pipeline is implemented; not blocking if pipeline is rebuilt.

### DEFECT-TL-11 (LOW) — `var(--theme-font-page-title)` instead of `fontFamily: 'Michroma, sans-serif'`
- **Bible:** Title uses inline `fontFamily: 'Michroma, sans-serif'` explicitly.
- **Port:** Uses `fontFamily: 'var(--theme-font-page-title)'`.
- **Impact:** If `--theme-font-page-title` resolves to Michroma this is equivalent; otherwise font will differ visually. Verify the token resolves correctly in `index.css`.

---

## Inline Fixes Made
None — defects require architectural changes, not inline edits.
