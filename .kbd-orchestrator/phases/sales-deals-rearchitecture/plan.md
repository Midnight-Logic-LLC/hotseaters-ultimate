# Plan — sales-deals-rearchitecture

_Generated: 2026-05-29 (Claude Opus 4.8). Bible @ `29ae47e3`._

## Critical de-risking finding (resolves the assessment's blocking question)

**No `deal`/`opportunity` schema migration is required.** Investigation of the
bible + self-hosted migrations + the port entity proves a "deal" is **a `trial`
at an early pipeline stage**, not a new entity:

- Bible `useDealsTrialsData({ scope: 'deals' | 'trials' })` fans out the SAME
  Tier-2 query (`getDealsTrialsData`) for both scopes. The hook's own comment:
  *"`leads` was dropped entirely (dead code on the deals page) … RTS handlers
  for … Lead are gone."*
- Migrations have **no** standalone `deal`/`opportunity` table. The `trial`
  table already carries `pipeline_stage_id` (→ `entity_metadata` scope
  `pipeline_stage`) and `deal_document_id`. There IS a legacy `lead` table
  (now dead in the bible) and a `deal_document` join table (already migrated).
- The port's `trial` entity (`src/features/trials/entities.ts`) ALREADY has
  `pipeline_stage_id` + `deal_document_id`, is registered, and is synced
  (`sync-config.ts`). Full trial hooks/store layer exists.

**Therefore this phase is a UI + store/hook RE-PORT over the existing trial
entity — NOT a data-model build.** Scope and risk are much lower than the
assessment's worst case. DealTracker = a deals-scoped view of trials; the Lead
subsystem is retired.

## Change Backend

**OpenSpec** — `openspec/changes/change-D*/`.

## Execution Order

### Foundation
| # | Change | Title | Depends on |
|---|--------|-------|-----------|
| 1 | change-D01 | Deals-scope data layer: `use-deals-trials-data` hook (scope='deals'\|'trials') over the trial entity + deal store; confirm trial entity exposes pipeline_stage/deal fields; NO migration | — |

### DealTracker surface
| # | Change | Title | Depends on |
|---|--------|-------|-----------|
| 2 | change-D02 | DealTracker page + Kanban: port `DealTrackerKanbanGrid`, `OpportunityCard`/`DealCard`, `DealTrackerColumnFrame`, `DealTrackerSalesStageFilters`, `DealTrackerViewModeToggle`, `DealUrgencyBanner`, `StaleBadge`, `DealTrackerLostList` | D01 |
| 3 | change-D03 | Deal wizard: port `components/deals/*` (DealWizard, WizardStep1ClientContact, WizardStep2CaseDetails, AvailableServicesColumn, ServiceSegmentSelector, WizardDialogs, useVenueSearch) | D01 |
| 4 | change-D04 | Sales activity surface: `InlineSalesActivityForm`, `SalesActivityHistoryDialog`, `SalesNotesSection`, `ActivityToolbar`, `NoNextStepConfirmModal`, `CascadeDeleteDialog`, `AddContactWizard` | D01 |

### Adjacent pages
| # | Change | Title | Depends on |
|---|--------|-------|-----------|
| 5 | change-D05 | Sales Hub re-port (simplified, −419 bible) over deals scope | D01, D02 |
| 6 | change-D06 | Revenue Projections re-port (`RevenueProjectionsTab`, `RevenueDataTable`, `revenueDetailAggregator`) | D01 |
| 7 | change-D07 | Dashboard sales-widget pivot: stale-DEALS count (was leads), DealTracker nav (was LeadRadar), copy "deals need attention", Michroma title already done | D01 |

### Retire + verify
| # | Change | Title | Depends on |
|---|--------|-------|-----------|
| 8 | change-D08 | LeadRadar disposition + retire dead Lead code: decide retire-vs-repurpose per current bible nav; delete `lead-radar` page/store, `ensure-lead-for-attorney` rule, Lead-based components/types no longer referenced | D02, D05 |
| 9 | change-D09 | Verification: business-rule parity (RULE J — stage transitions, stale/urgency bucketing, revenue projection math), VR vs current bible at 1440×900 + 375×667, gate trio, Lighthouse | D02–D08 |

## Agent Recommendations

| Change | Agent | Notes |
|--------|-------|-------|
| D01 | code-architect | Hook/store design over existing trial entity; RULE C/D |
| D02 | gan-generator | Largest UI surface; read bible DealTracker.jsx + components/sales/* first |
| D03 | gan-generator | Multi-step wizard; read components/deals/* |
| D04 | gan-generator | Sales-activity components |
| D05 | gan-generator | Simplified Sales Hub |
| D06 | gan-generator | Revenue projections + aggregator (RULE J math) |
| D07 | code-architect | Dashboard widget pivot — small, surgical |
| D08 | refactor-cleaner | Dead-code retirement; verify no live imports before delete |
| D09 | e2e-runner | VR + Lighthouse + business-rule tests |

## Reusable existing infrastructure

- `src/features/trials/` — full trial entity, hooks, store. Deals scope layers on top.
- `src/features/trials/business-rules/*` — reuse stage/segment utilities.
- Pipeline stages via `useTier1().pipelineStages` (already wired).
- `tests/visual-parity/` harness (bible-vs-port + authed baselines).

## Open decisions (carry into execution, not blocking the plan)

1. **LeadRadar fate** (D08): confirm current bible nav — retire or repurpose as
   a deals-radar. Default: retire (bible dropped Leads).
2. **Sales-activity → deal flow**: map the bible's new activity model; replace
   `ensure-lead-for-attorney` with a deal-creation rule if the bible creates
   deals from activities.
3. **Data migration**: legacy `lead` rows — if any exist in tenant DBs, decide
   lead→trial(deal-scope) backfill vs. greenfield. Likely greenfield (dev data).

## Completion gate

1. `pnpm typecheck && pnpm lint && pnpm test` green.
2. DealTracker renders deals (early-stage trials) in a Kanban matching the bible.
3. Deal wizard creates a trial at the correct initial pipeline stage.
4. Sales Hub + Revenue Projections at parity with current bible.
5. Dashboard shows stale-DEALS + routes to DealTracker.
6. Lead subsystem retired; no dead Lead imports; `knip`/typecheck clean.
7. VR ≤5% drift vs current bible on DealTracker/Sales/Projections (desktop+mobile).
8. Business rules verified (RULE J).

## Out of scope

- New `deal`/`opportunity` table (NOT needed — deals are trials).
- Re-port of unaffected surfaces (handled in page-parity-verification-hardening).
- entity-management 2.0 redesign.
