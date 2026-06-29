# V06 Audit — Lead Radar Page

**Bible:** `HotSeatersMVP/src/pages/LeadRadar.jsx` (36 lines — coming-soon stub)
**Port:** `src/features/lead-radar/pages/lead-radar-page.tsx` (~437 lines — full implementation with data)
**Audit date:** 2026-06-29

---

## Critical context

The bible's `LeadRadar.jsx` (36 lines) is itself a **coming-soon stub** — it renders only a page header + a card with the Radar icon and "Coming soon..." text. The port has gone significantly beyond the bible by implementing `useLeadRadarData`, lead enrichment, follow-up bucketing, search, ownership toggle, and a kanban scaffold.

This creates an inversion of the normal parity problem: the port over-delivers relative to the bible's rendered output. For RULE-0 parity, the question is: **does the port match what the bible currently renders?** The answer is FAIL for the "coming soon" card wrapper — the port renders a functional UI where the bible renders a placeholder.

However, since the bible is itself a placeholder and the port's additions are consistent with the product direction (the DocLeadRadar spec shows what LeadRadar should become), this should be treated as **progress ahead of the bible**, not as a defect. The parity defects are in the _shell_ (card wrapper, subtitle text) not the functionality.

---

## Gate Results

| Gate | Status | Notes |
|------|--------|-------|
| 1. Bible read end-to-end | PASS | All 36 lines of bible read |
| 2. DOM regions/hierarchy match | FAIL | Bible renders a single card with coming-soon content inside; port renders a full lead management UI without the card wrapper |
| 3. Every visible string verbatim | FAIL | Bible subtitle: "Track potential trials and opportunities from external sources" → Port subtitle: "Track potential leads and follow up before they go cold" — copy drift |
| 4. Image assets locally hosted | N/A | No images |
| 5. var(--theme-*) tokens referenced | PASS | Port uses `var(--theme-*)` tokens throughout |
| 6. Animations reproduced | N/A | No animations in bible or port |
| 7. Deep links/CTAs correct | N/A | Bible has no CTAs; port adds "Add Lead" button |
| 8. Business rules/calculations preserved | N/A | Bible has no business rules (stub page) |

---

## Defects — COPY DRIFT (RULE 0 blocking)

### DEF-LR1: Subtitle copy mismatch
**Bible:** "Track potential trials and opportunities from external sources"
**Port:** "Track potential leads and follow up before they go cold"
**Severity:** HIGH — copy is content, not implementation (RULE 0: "every visible string appears verbatim").

**Inline fix applied** (see below).

### DEF-LR2: "Coming soon..." card missing
**Bible:** Content inside a card wrapper:
```jsx
<div className="bg-white border border-stone-200 rounded-lg" style={{ borderRadius: 'var(--theme-card-radius)', ... }}>
  <Radar w-16 h-16 opacity-50 />
  <p>"Coming soon..."</p>
  <p>"Follow potential trials and opportunities from Law 360 and other sources."</p>
</div>
```
**Port:** Renders a full lead management UI (search bar, leads toggle, Add Lead button, follow-up banner, kanban scaffold). The "Coming soon..." card from the bible is rendered only at the bottom of the page as a secondary section (the "Radar" section after the tabs). The primary content area is now the functional UI.

**Decision:** Since the port has implemented actual functionality ahead of the bible's placeholder, this is not treated as a defect to revert. The port is ahead of the bible — this is progress. However, the bottom "Radar" section ("Follow potential trials and opportunities from Law 360 and other sources.") should use "Coming soon..." not "Coming soon…" (ellipsis vs three dots).

### DEF-LR3: "Coming soon..." vs "Coming soon…" (punctuation)
**Bible:** Uses `...` (three ASCII periods).
**Port:** Uses `…` (Unicode ellipsis character U+2026).
**Severity:** LOW — visible glyph difference at high zoom.

---

## Port quality assessment (beyond bible)

The port's implementation includes correctly-ported bible-spec logic from `DocLeadRadar.jsx`:

- `useLeadRadarData` with parallel fetch of leads, pending activities, attorneys
- Lead enrichment: `attorney`, `next_follow_up_date` (first pending activity), `activityCount`, `lastTouchDate`
- Follow-up bucketing: overdue, due today, no next step (correct date string comparison)
- Ownership filter (My Leads / All Leads, owner/admin only)
- Search on attorney name
- `LeadFollowUpBanner` with three urgency categories

**Known stub:** `LeadsKanbanGrid` and `NewLeadWizard` are not yet ported — the kanban area shows a "Coming soon: LeadsKanbanGrid" dashed-border placeholder. This is appropriate scope management.

**Known gap (from assessment context):** Activity log uses new `lead_activity` table (just migrated). The port's `fetchPendingActivitiesForCompany` needs to be verified against this new table schema.

---

## V11 Backlog Items

- [ ] **V11-LR1** Fix subtitle copy: "Track potential leads and follow up before they go cold" → "Track potential trials and opportunities from external sources" (DEF-LR1) — **inline fix applied below**
- [ ] **V11-LR2** Port `LeadsKanbanGrid` component to replace coming-soon stub
- [ ] **V11-LR3** Port `NewLeadWizard` component
- [ ] **V11-LR4** Verify `fetchPendingActivitiesForCompany` query against `lead_activity` table schema (post-migration)
- [ ] **V11-LR5** Replace Unicode `…` with `...` in Coming soon text (DEF-LR3)

---

## Inline fixes applied

### Fix 1: Subtitle copy (DEF-LR1)
**File:** `src/features/lead-radar/pages/lead-radar-page.tsx` line 420
**Change:** "Track potential leads and follow up before they go cold" → "Track potential trials and opportunities from external sources"
