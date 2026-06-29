# Timeline Page — RULE-0 Parity Audit

**Bible:** `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/Timeline.jsx` (1212 lines)
**Port:** `/Users/gqadonis/Projects/midnight/hotseaters-ultimate/src/features/trials/pages/timeline-page.tsx`
**Audit date:** 2026-06-29

---

## Gate Results

| Gate | Result | Notes |
|------|--------|-------|
| G1 — Bible read end-to-end | PASS | 1212-line bible read in full |
| G2 — Rendered DOM regions match | FAIL | Major sub-components stubbed (Coming soon) |
| G3 — Every visible string verbatim | PARTIAL | Page title / subtitle / empty-state / legend labels match; toolbar strings absent |
| G4 — Image assets locally hosted | N/A | No images on this page |
| G5 — var(--theme-*) tokens referenced | PASS | All card tokens and font tokens correctly referenced |
| G6 — Animations reproduced | FAIL | Gantt bars, drag-and-drop, undo shake animation, pinch-to-zoom — all absent |
| G7 — Deep links / CTAs correct | FAIL | ServiceAssignmentModal, TrialSummaryModal, TrialDetailSheet CTAs absent |
| G8 — Business rules / calculations preserved (RULE J) | FAIL | All computations stubbed; Tier-2 data is hardcoded `[]` |

**Overall: FAIL (SKELETON STUB)** — Page renders correct chrome (title, subtitle, card wrapper, empty-state, legend) but delivers none of the functional surface. This matches the prior assessment of "skeleton stub."

---

## What the port has (PASS)

1. Page title "Trial Timeline" — verbatim.
2. Subtitle "Timeline view of scheduled trials" — verbatim.
3. Header hidden on mobile (`hidden lg:flex`) — matches bible.
4. Card wrapper with correct `var(--theme-card-*)` tokens.
5. Empty-state: `<GanttChartIcon>` + "No scheduled services to display" — verbatim.
6. Legend toggle ("Service Types") with correct colors and labels — verbatim match of bible lines 1154–1161.
7. Orientation change listener → `setIsPortrait` and `setMobileViewMode`.
8. Mobile hide-bottom-tab-bar class management in landscape.
9. Sidebar resize handle (mouse/touch) with 100–400px clamp.
10. `schedule_full_width`, `schedule_show_revenue_chart`, `schedule_mobile_view` prefs loaded from userInfo.
11. `coreDataLoading` gate mirrors bible's `!prefsLoaded || !userInfo?.company_id`.

---

## Defects

### DEFECT-TM-01 (CRITICAL) — Tier-2 data is hardcoded empty — no real trial/service data
- **Bible:** Loads trials, clients, trialServices, services, trialServiceAssignments, pipelineStages, consultants, hiringCompanies, timeOffs, openRequests, favorites, subcontractTrials, mySubcontractGigs, trialSegments via `useTimelineData()`.
- **Port:** `const trials: unknown[] = []` hardcoded. All derived arrays (filteredServices, trialGroups, etc.) are absent.
- **Fix required:** Wire `useTimelineData()` equivalent via entity graph / Tier-2 store.

### DEFECT-TM-02 (CRITICAL) — TimelineToolbar stub
- **Bible:** `TimelineToolbar` renders: groupBy (Trial/Consultant), Hide Deals toggle, Hide Pre-Trial toggle, Hide Continued toggle, Show Revenue Chart toggle, time scale selector (Day/Week/Month), zoom slider, Fit button, Full-Width toggle, Mine toggle, filter sheet button, mobile view mode toggle.
- **Port:** `<ComingSoonStub name="TimelineToolbar" />` — nothing visible to user.
- **Fix required:** Port `TimelineToolbar` or equivalent.

### DEFECT-TM-03 (CRITICAL) — TimelineSidebar stub
- **Bible:** Sidebar renders trial/consultant groups with expand/collapse chevrons, service names, assignment info, time-off rows — all clickable to open ServiceAssignmentModal.
- **Port:** `<ComingSoonStub name="TimelineSidebar" />`.
- **Fix required:** Port `TimelineSidebar`.

### DEFECT-TM-04 (CRITICAL) — TimelineHeader stub
- **Bible:** `TimelineHeader` renders date ruler (days/weeks/months) with today indicator. Synced horizontally with timeline body.
- **Port:** `<ComingSoonStub name="TimelineHeader" />`.
- **Fix required:** Port `TimelineHeader`.

### DEFECT-TM-05 (CRITICAL) — TimelineBars stub
- **Bible:** `TimelineBars` renders colored Gantt bars for each service, supports drag-and-drop date editing, split billing, segment bars, time-off bars, tooltips, text overflow detection.
- **Port:** `<ComingSoonStub name="TimelineBars" />`.
- **Fix required:** Port `TimelineBars`.

### DEFECT-TM-06 (CRITICAL) — MobileTimelineListView stub
- **Bible:** Mobile portrait shows a list-style view of trial groups with service rows.
- **Port:** `<ComingSoonStub name="MobileTimelineListView" />`.
- **Fix required:** Port `MobileTimelineListView`.

### DEFECT-TM-07 (CRITICAL) — MobileLandscapePrompt stub
- **Bible:** Mobile portrait (before rotation) shows a prompt to rotate to landscape.
- **Port:** `<ComingSoonStub name="MobileLandscapePrompt" />`.
- **Fix required:** Port `MobileLandscapePrompt`.

### DEFECT-TM-08 (CRITICAL) — No drag-and-drop (useTimelineDrag)
- **Bible:** `useTimelineDrag` hook enables drag-and-drop date editing for services and trial date ranges, with optimistic cache patching, undo history, split-billing dialog triggers, and segment-aware validation.
- **Port:** Not implemented.
- **Fix required:** Port `useTimelineDrag`.

### DEFECT-TM-09 (CRITICAL) — No undo (useTimelineUndo + useShakeUndo)
- **Bible:** `useTimelineUndo` / `useShakeUndo` / `TimelineUndoBar` provide undo for drag operations.
- **Port:** Not implemented.
- **Fix required:** Port undo stack.

### DEFECT-TM-10 (CRITICAL) — No ServiceAssignmentModal
- **Bible:** Clicking a service opens `ServiceAssignmentModal` showing consultant assignments, subcontract request status, accept/decline, favorite controls.
- **Port:** Not implemented.
- **Fix required:** Port `ServiceAssignmentModal`.

### DEFECT-TM-11 (CRITICAL) — No TrialSummaryModal / TrialDetailSheet
- **Bible:** Clicking a trial bar on desktop opens `TrialSummaryModal`; on mobile opens `TrialDetailSheet`.
- **Port:** Not implemented.
- **Fix required:** Port both.

### DEFECT-TM-12 (CRITICAL) — No SplitBillingDialog
- **Bible:** When dragging a service with `has_daily_minimum` across the trial start threshold, `SplitBillingDialog` opens asking the user how to split pre-trial (hourly) and in-trial (daily min) billing.
- **Port:** Not implemented.
- **Fix required:** Port `SplitBillingDialog`.

### DEFECT-TM-13 (CRITICAL) — No Alert dialogs (pending assignment, validation error)
- **Bible:** Two `AlertDialog` instances: one for "Cancel HotSeatHub Post?" when assigning a consultant whose service has an open marketplace request, one for validation errors from date updates.
- **Port:** Not implemented.
- **Fix required:** Port both alert dialogs.

### DEFECT-TM-14 (HIGH) — No 4-quadrant scroll sync
- **Bible:** Header scrolls horizontally in sync with body; trial list scrolls vertically in sync with body. Implemented via ref-based listeners with scrollbar width compensation.
- **Port:** Ref exists (`timelineContainerRef`) but no scroll sync wired.
- **Fix required:** Implement scroll sync once components are ported.

### DEFECT-TM-15 (HIGH) — No zoom (wheel / pinch)
- **Bible:** Ctrl+wheel and pinch-to-zoom change `zoomLevel`. Zoom formula: `unitWidth = 9.8 * Math.pow(100, zoomLevel * 0.858) * (timeline.daysPerUnit / 7)`.
- **Port:** `zoomLevel` state absent.
- **Fix required:** Port zoom handling.

### DEFECT-TM-16 (HIGH) — Revenue chart (TimelineRevenueChart) stub
- **Bible:** When `showRevenueChart`, renders a projected daily revenue chart above the timeline with breakeven and goal lines. Driven by `calculateProjectedDailyRevenue`.
- **Port:** `<ComingSoonStub name="TimelineRevenueChart" />`.
- **Fix required:** Port when Tier-2 data lands.

### DEFECT-TM-17 (HIGH) — Preference persistence missing
- **Bible:** Time scale, groupBy, isFullWidth, hideDeals, hidePreTrial, hideContinued, showRevenueChart, showMine all persist to `userInfo.preferences` via `base44.entities.UserInfo.update`.
- **Port:** Preferences are read from `userInfo` but not written back.
- **Fix required:** Wire pref persistence to the entity update store.

### DEFECT-TM-18 (HIGH) — "Mine" filter logic absent
- **Bible:** `showMine` filters services to only those where `trialServiceAssignments.some(a => a.consultant_id === userInfo.id)`. Subcontract gigs are always shown as they are already user-scoped.
- **Port:** State exists but no filter applied (data is `[]`).
- **Fix required:** Implement once data is wired.

---

## Business Rules Assessment (RULE J)

| Rule | Bible Location | Port Status |
|------|---------------|-------------|
| unitWidth formula | Timeline.jsx line 779 | ABSENT |
| getTimelineData | timelinePositionUtils | ABSENT |
| getServicePosition / getTrialPosition | timelinePositionUtils | ABSENT |
| calculateProjectedDailyRevenue | pdrCalculations | ABSENT |
| updateServiceDates payload (daysBefore, billing method, PDR) | Timeline.jsx lines 306–422 | ABSENT |
| updateSegmentDates batch | Timeline.jsx lines 285–304 | ABSENT |
| Optimistic cache patch for service date drag | Timeline.jsx lines 425–465 | ABSENT |
| filteredServices (hideDeals / hideContinued / hidePreTrial) | Timeline.jsx lines 768–776 | ABSENT |
| trialGroups / consultantGroups sort order | Timeline.jsx lines 787–819 | ABSENT |
| fit zoom formula | Timeline.jsx line 839 | ABSENT |
| scroll center-date restore from sessionStorage | Timeline.jsx lines 853–870 | ABSENT |

---

## Inline Fixes Made
None — stub requires full Tier-2 integration before any of these can be addressed.
