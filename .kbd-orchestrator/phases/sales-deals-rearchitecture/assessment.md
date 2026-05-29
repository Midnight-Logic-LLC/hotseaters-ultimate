# Assessment — sales-deals-rearchitecture

_Generated: 2026-05-29 (Claude Opus 4.8). Bible @ `29ae47e3` (post-refresh)._

## Why this phase exists

The `page-parity-verification-hardening` phase discovered (see that phase's
`audits/_BIBLE-GAP-ANALYSIS.md`) that the bible underwent a **fundamental
Leads → Deals/Opportunities re-architecture** in the 427 commits the local
bible checkout had been behind. The port's entire sales surface was built on
the OLD Lead model and is now architecturally divergent from the bible.

This is feature work the size of an original wave — NOT a parity patch — so it
gets its own phase rather than folding into V11 of the verification phase.

## What the bible now has (target state)

### Pages
- `DealTracker.jsx` — reads `useDealsTrialsData({ scope: 'deals' })`; owns
  `DealTrackerTab`, `DealUrgencyBanner`, `DealWizard`, `AddContactWizard`,
  `TrialDetails`/`HSHTrialDetails` as page-level overlays.
- `Sales.jsx` — heavily reduced (−419 lines vs old) — Sales Hub simplified.
- `LeadRadar.jsx` — changed (70 lines); role under the new model TBD (may be
  superseded by DealTracker or repurposed).
- `Dashboard.jsx` — sales widgets pivoted: `useMyStaleDealsCount` (was
  `useMyStaleLeadsCount`), nav → DealTracker (was LeadRadar), copy "deals need
  attention" (was "leads need attention").

### New `components/sales/` (Deal-based — added)
DealTrackerKanbanGrid, DealTrackerTab, DealTrackerColumnFrame,
DealTrackerLostList, DealTrackerSalesStageFilters, DealTrackerViewModeToggle,
OpportunityCard, DealCard, DealFilterSheet, DealUrgencyBanner, StaleBadge,
CascadeDeleteDialog, AddContactWizard, InlineSalesActivityForm,
SalesActivityHistoryDialog, SalesNotesSection, SalesPersonFilter,
RevenueProjectionsTab, RevenueDataTable, ActivityToolbar, NoNextStepConfirmModal,
QuickPickDateChips, DetailLevelSlider, ClientSummaryCard.

### New `components/deals/` wizard subsystem (added)
DealWizard, WizardStep1ClientContact, WizardStep2CaseDetails,
AvailableServicesColumn, ServiceSegmentSelector, WizardDialogs, useVenueSearch.

### Removed (old Lead-based — must be retired in the port)
LeadCard, LeadsKanbanGrid, LeadsRadarTab, LeadDetailPanel, LeadEditSheet,
LeadAttachmentControl, LeadFollowUpBanner, PipelinePageContent, the entire
`sales/leadWizard/*`.

## What the port has now (current state)

- `deals/pages/deal-tracker-page.tsx` — built on OLD model.
- `sales/pages/sales-page.tsx`, `sales/pages/projections-page.tsx`.
- `lead-radar/pages/lead-radar-page.tsx` + `lead-radar/stores/lead-radar-store.ts`
  — Lead-based, with `LeadRow`, `fetchLeadsForCompany`, inlined `LeadsRadarTab`.
- `company/business-rules/ensure-lead-for-attorney.ts` — Lead-centric rule.
- Entity model: Lead-based (no Deal/Opportunity entity registered).

## Gap summary

| Area | Bible (target) | Port (current) | Work |
|------|----------------|----------------|------|
| Data model | Deal/Opportunity entities, `useDealsTrialsData` | Lead entities | NEW entities + stores + hooks; retire Lead model |
| DealTracker | Kanban of deals + wizard overlays | Old-model page | Re-port page + components |
| Deal wizard | `components/deals/*` multi-step | none | Port the wizard subsystem |
| Sales Hub | Simplified (−419) | Old fuller version | Re-port to simplified design |
| LeadRadar | Changed/possibly superseded | Lead-based page | Decide fate; re-port or retire |
| Dashboard sales widgets | stale-DEALS count + DealTracker nav | stale-leads | Pivot hook + nav + copy |
| Cascade delete | `CascadeDeleteDialog` | none | Port |
| Revenue projections | `RevenueProjectionsTab` + aggregator | `projections-page` (old) | Re-port |

## Open questions for the plan phase

1. **Entity/schema:** does the self-hosted Supabase already have a `deal` /
   `opportunity` table (and Electric shape / RLS), or must migrations be added
   first? (RULE 1 — psql against self-hosted, never CLI/cloud.) This gates
   everything; likely a `latest-data` migration is needed.
2. **LeadRadar fate:** retire, or keep as a deals-radar view? Confirm against
   the bible's current routing/nav.
3. **`ensure-lead-for-attorney` business rule** — replace with a deal-creation
   rule? Map the bible's new sales-activity → deal flow.
4. **Migration of existing data** — if any Lead rows exist, is there a
   lead→deal data migration, or is this greenfield?

## Recommended wave structure (for /kbd-plan)

| Wave | Scope |
|------|-------|
| D0 | Schema + entity foundation: `deal`/`opportunity` table + RLS + Electric shape + entity registration + sync-config (RULE 5 coherence) |
| D1 | Stores + hooks: `useDealsTrialsData` equivalent, deal store, retire lead-radar-store |
| D2 | DealTracker page + Kanban (`DealTrackerKanbanGrid`, `OpportunityCard`, `DealCard`, columns, filters, view-toggle, urgency banner, stale badge) |
| D3 | Deal wizard subsystem (`components/deals/*` — multi-step create) |
| D4 | Sales Hub re-port (simplified) + Revenue Projections re-port |
| D5 | Dashboard sales-widget pivot (stale-deals, DealTracker nav, copy) |
| D6 | LeadRadar disposition (retire or repurpose) + retire dead Lead components/rules |
| D7 | Verification: business-rule parity (RULE J), VR vs current bible, gate trio |

## Dependencies / constraints

- All RULES 0–9 + A–K apply. Self-hosted Supabase only (RULE 1). Bible is
  ground truth (RULE 2). Components→hooks→stores (RULE 3). Entities via
  prometheus-entity-management (RULE E). Mobile-first (RULE I).
- Bible is now correctly checked out at `29ae47e3` (ground truth for this
  phase). Old state recoverable at tag `pre-parity-reset-2026-05-29`.

## Scope estimate

Comparable to one of the original W4/W5 waves. 7 sub-waves (D0–D7), with D0
(schema) on the critical path and likely requiring a `latest-data` migration
before any UI work.
