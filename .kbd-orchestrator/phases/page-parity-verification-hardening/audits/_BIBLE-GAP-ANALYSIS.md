# Bible gap analysis — 427-commit drift (AUTHORITATIVE, name-status verified)

_2026-05-29. Diff of bible: `pre-parity-reset-2026-05-29` (old source the port
was built from, `6f97312a`) → current `HEAD` (`29ae47e3`). Excludes `Doc*`
(RULE 7 content)._

> **Method note (important):** earlier versions of this doc read `git diff
> --stat` churn numbers and mis-stated some of them as file deletions. This
> version uses `git diff --name-status` (the authoritative D/M/A signal) and
> supersedes all prior delete/add claims here.

## App pages (non-Doc) — name-status old→new

| Status | Page |
|--------|------|
| **D (deleted)** | `Sales.jsx` (Sales-Hub wrapper dissolved — handled in D05) |
| **M (modified, still alive)** | Approvals, Bills, Clients, Collections, Dashboard, DealTracker, HSHDirectory, HelpWanted, HotSeatHubMarketing, Invoices, Landing, **LeadRadar**, MobileMore, PotentialGigs, Projections, Settings, Team, TimeAndExpenses, Timeline, Trials |

**Key fact for D08:** `LeadRadar.jsx` is **M (modified +18/−52), NOT deleted**.
The Lead Radar PAGE survives in the current bible (525 LOC), routed in
`App.jsx`, and nav-linked in `Layout.jsx` (Sales group = **Lead Radar + Deal
Tracker + Clients**, all three coexist). The pivot ADDED the Deal surface
alongside Lead Radar; it did not remove the page.

## Sales/pipeline/deals components — name-status old→new

### Deleted (D) — the old Lead SUB-components (genuinely gone)
`pipeline/PipelinePageContent.jsx`, `sales/LeadActivityColumn.jsx`,
`sales/LeadAttachmentControl.jsx`, `sales/LeadCard.jsx`,
`sales/LeadDetailPanel.jsx`, `sales/LeadEditSheet.jsx`,
`sales/LeadFilterSheet.jsx`, `sales/LeadFollowUpBanner.jsx`,
`sales/LeadsKanbanGrid.jsx`, `sales/LeadsRadarTab.jsx`, `sales/NewLeadForm.jsx`,
`sales/leadWizard/NewLeadStepActivity.jsx`,
`sales/leadWizard/NewLeadStepContactFirm.jsx`,
`sales/leadWizard/NewLeadWizard.jsx`.

→ These Lead sub-components were removed; their behavior was **inlined into the
slimmed `LeadRadar.jsx`** (which is why the page shrank to 525 LOC while still
functioning). The port's `lead-radar-page.tsx` already follows this inlined
shape (it inlined `LeadsRadarTab` when first built).

### Added (A) — the new Deal subsystem (ported in D01–D04)
`sales/AddContactWizard.jsx`, `CascadeDeleteDialog.jsx`,
`DealTrackerColumnFrame.jsx`, `DealTrackerKanbanGrid.jsx`,
`DealTrackerLostList.jsx`, `DealTrackerSalesStageFilters.jsx`,
`DealTrackerViewModeToggle.jsx`, `DealUrgencyBanner.jsx`, `OpportunityCard.jsx`,
`QuickPickDateChips.jsx`.

### Modified (M)
`deals/DealWizard.jsx`, `sales/DealTrackerTab.jsx`,
`sales/InlineSalesActivityForm.jsx`, `sales/NoNextStepConfirmModal.jsx`,
`sales/SalesActivityHistoryDialog.jsx`, `sales/SalesNotesSection.jsx`.

## What this means for the phase

1. **D01–D07 (Deals work) stand** — the Deal subsystem was genuinely ADDED;
   everything built was real bible parity.
2. **D05 (Sales.jsx retired)** — correct; `Sales.jsx` IS `D`.
3. **D08 is a RECONCILE, not a retirement** — `LeadRadar.jsx` is alive (M).
   The port's `lead-radar-page.tsx` was built against the OLD bible; bring it to
   parity with the current 525-LOC `LeadRadar.jsx`. The deleted Lead
   sub-components don't need separate port deletions because the port never
   created them as separate files (it inlined). Verify no port file references a
   now-deleted Lead concept that the bible dropped.
4. **The old "Body B = retire Lead code" framing was wrong** about LeadRadar
   the page; it was right that the Lead sub-components are gone. Net: no
   port-side dead-Lead deletion needed beyond what D05 already did.

## Page-level drift sizes (from --stat, for prioritization only — not delete signals)
Sales −419 (deleted), DealTracker ±321, Landing ±354, LeadRadar +18/−52,
Clients ±55, MobileMore ±19, Dashboard ±13, Timeline ±12; long tail of 1-line
Michroma page-title edits (done in the verification phase).

## Systemic items already handled
- ✅ Michroma page-title font token (verification phase).
- ✅ Sales.jsx retirement (D05).
- ✅ Dashboard leads→deals pivot (D07).
