# Bible gap analysis — 427-commit drift

_2026-05-29. Diff of bible app pages: `pre-parity-reset-2026-05-29` (old source
the port was built from, `6f97312a`) → current `HEAD` (`29ae47e3`). Excludes
`Doc*` (RULE 7 content). This sizes how much of the port actually drifts from
the refreshed bible._

## Good news: the gap is bounded, not "the whole port"

Of ~33 app surfaces, the 427 commits meaningfully changed **~8 pages**, with a
clear long tail of trivial 1-line edits that are a single systemic fix.

## Tier 1 — substantial re-port (large diffs)

| Page | Δ lines | Nature | Port action |
|------|--------:|--------|-------------|
| `Sales.jsx` | −419 | Heavily reduced/refactored — Sales Hub simplified | Re-port `sales/pages/sales-page.tsx` vs current bible |
| `Landing.jsx` | 354 (±) | Dark navy→cyan gradient hero redesign + `text-cyan-300` accent | Re-port `landing/pages/landing-page.tsx` |
| `DealTracker.jsx` | 321 (±) | Significant rework | Re-port `deals/pages/deal-tracker-page.tsx` |

## Tier 2 — moderate drift (re-audit + targeted fixes)

| Page | Δ lines | Nature |
|------|--------:|--------|
| `LeadRadar.jsx` | 70 | Likely tied to the leads→deals pivot |
| `Clients.jsx` | 55 | Moderate change |
| `MobileMore.jsx` | 19 | Nav/menu change |
| `Dashboard.jsx` | 13 | **Functional: leads→deals** — `useMyStaleLeadsCount`→`useMyStaleDealsCount`, LeadRadar→DealTracker nav, copy "leads need attention"→"deals need attention" + Michroma title |
| `Timeline.jsx` | 12 | Moderate change |

## Tier 3 — systemic 1-line change (ONE shared fix, not per-page)

These pages each show a **+1 line** diff that is the SAME change: page-title
headings gained `fontFamily: 'Michroma, sans-serif'`. The bible moved page
titles to the Michroma display font.

Affected: `Trials`, `TimeAndExpenses`, `Projections`, `HSHDirectory`, `Team`,
`Settings`, `PotentialGigs`, `Invoices`, `HotSeatHubMarketing`, `HelpWanted`,
`Collections`, `Bills`, `Approvals` (+ the Tier-1/2 pages also gained it).

**Action (RULE 0.3 — fix in the shared layer):** apply the Michroma page-title
treatment once — via the shared page-title/heading component or a theme token —
rather than editing each page. Verify the port's title element + theme tokens
match the bible's new `fontFamily: 'Michroma, sans-serif'` on page titles.

## Net remaining re-port scope

- **1 systemic fix:** page-title → Michroma (covers the entire Tier-3 list).
- **1 functional fix:** Dashboard leads→deals (hook + nav + copy).
- **3 substantial re-ports:** Sales, Landing, DealTracker.
- **5 moderate re-audits:** LeadRadar, Clients, MobileMore, Dashboard(visual), Timeline.

This is a finish-able body of work, NOT a full re-port. It folds into the
existing V03–V11 structure with V11 absorbing the remediation. The earlier
fear ("427 commits → whole port stale") is disproved: most surfaces are
untouched or share one systemic title-font change.

## Recommended sequencing

1. **Systemic Michroma page-title fix** (one change, unblocks Tier-3 parity).
2. **Dashboard leads→deals** functional alignment.
3. **Landing re-port** (highest-visibility; dark-hero redesign).
4. **Sales + DealTracker re-ports** (largest diffs).
5. **Tier-2 re-audits** (LeadRadar, Clients, MobileMore, Timeline).
6. Re-run `pnpm test:bible-parity` + authed VR; confirm drift < gate.

## Component diff — the REAL story: a Leads→Deals re-architecture

> ⚠️ **CORRECTION (2026-05-29, during D08).** The "Deleted (old Lead-based
> subsystem)" list below was **WRONG** — it misread `git diff --stat` churn
> numbers as file deletions. Verified with `git diff --name-status
> pre-parity-reset-2026-05-29 HEAD -- 'src/components/sales/Lead*' src/pages/LeadRadar.jsx`:
> **every Lead file is `M` (modified) or `A` (added) — ZERO deletions.**
> `LeadRadar.jsx` is alive (modified +18/−52), nav-linked (Layout.jsx Sales
> group: Lead Radar + Deal Tracker + Clients), and routed in App.jsx.
> `LeadAttachmentControl.jsx` + `LeadFollowUpBanner.jsx` were **added**.
> **The pivot ADDED the Deal surface; it did NOT remove Leads — both coexist.**
> Consequence: D08 is a RECONCILE of the port's Lead Radar page to the current
> bible (~70-line drift), NOT a retirement. The D01–D07 Deals work remains
> valid (Deals were genuinely added). The large `−` numbers below are diff
> churn, not deletions — retracted.

### ~~Deleted (old Lead-based subsystem)~~ — RETRACTED (all are M/A, not D)
- ~~`sales/LeadCard.jsx` (−550)~~ → M (modified, still exists)
- ~~`sales/LeadsKanbanGrid.jsx`, `LeadDetailPanel.jsx`, `LeadsRadarTab.jsx`~~ → all M
- ~~`sales/leadWizard/*`~~ → all M (NewLeadWizard/Step* modified, still exist)
- `LeadAttachmentControl.jsx`, `LeadFollowUpBanner.jsx` → A (ADDED in the pivot)
- (`PipelinePageContent.jsx` churn not re-verified here — treat as churn, not a
  confirmed delete, until checked with `--name-status`.)

### Added (new Deal-based subsystem)
- `sales/DealTrackerKanbanGrid.jsx` (+720), `sales/OpportunityCard.jsx` (+711),
  `sales/AddContactWizard.jsx` (+695), `sales/DealUrgencyBanner.jsx` (+330),
  `sales/DealTrackerLostList.jsx` (+206), `sales/DealTrackerColumnFrame.jsx`,
  `sales/DealTrackerSalesStageFilters.jsx`, `sales/CascadeDeleteDialog.jsx`
- `trials/SalesActivitySection.jsx` (±249), `clients/ClientDetails.jsx` (±148)

### Interpretation

This is **not parity drift to patch** — it is a **major feature
re-architecture** in the bible. The port's Sales/Leads/Pipeline surface (built
on the OLD Lead model) is now architecturally divergent from the current
bible's Deal/Opportunity model. The Dashboard leads→deals change seen in the
page diff is the visible tip of this pivot.

## REVISED net scope — two distinct bodies of work

### Body A — small parity fixes (fits in this verification phase)
1. ✅ **DONE — Systemic Michroma page-title** font. Added
   `--theme-font-page-title: 'Michroma', sans-serif'` to `src/index.css` and
   referenced it via `fontFamily: 'var(--theme-font-page-title)'` on all 18
   in-app page-title `<h1>`s (trials/time-and-expenses/trial-detail/timeline/
   lead-radar/sales/projections/invoices/deal-tracker/bills/approvals/
   collections/hsh-directory/potential-gigs/help-wanted/settings/welcome-header
   + team). One token = one source of truth (RULE 0.3). Gate trio green.
   Excluded non-title uses: role-guard error screen, app-router debug
   placeholder, auth-card (marketing-themed, not in bible Michroma set), and
   the dead/unrouted company-settings-page.
2. Tier-2 visual re-audits where unaffected by the Deals pivot
   (MobileMore, Timeline, Clients-visual).
3. exhaustive-deps paydown (V12), final gate (V13).

### Body B — Leads→Deals re-architecture (its OWN phase, NOT verification)
- Re-port Sales, DealTracker, LeadRadar, Dashboard-sales-widgets, and the
  client/trial sales-activity surfaces against the new Deal/Opportunity model.
- New entities/stores/hooks for Deals/Opportunities; retire Lead-based ones.
- This is feature work of similar size to an original wave — it should be a
  dedicated `sales-deals-rearchitecture` phase, planned from the current bible,
  not folded into "verification & hardening."

## Bottom line for the owner

The 427-commit gap splits cleanly:
- **Most of the port is fine** — untouched pages + one systemic font fix.
- **The sales/leads subsystem needs a real re-port** to the bible's new Deals
  architecture. That is a NEW PHASE, not a V11 bug-fix.

Recommend: finish Body A inside this phase; spin up a separate
`sales-deals-rearchitecture` phase for Body B with its own assess/plan.
