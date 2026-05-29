# change-D02 — DealTracker page + Kanban

## Why
Port the bible DealTracker (deals-scoped trial Kanban) to replace the old-model
`deals/pages/deal-tracker-page.tsx`. This is the headline surface of the
Leads→Deals pivot.

## What changes
Re-port `deal-tracker-page.tsx` to consume `use-deals-trials-data({scope:"deals"})`
(D01). Port bible components: DealTrackerKanbanGrid, OpportunityCard/DealCard,
DealTrackerColumnFrame, DealTrackerSalesStageFilters, DealTrackerViewModeToggle,
DealUrgencyBanner, StaleBadge, DealTrackerLostList. Columns = pipeline stages
from useTier1(). Mobile-first (RULE I). shadcn/Base-UI primitives (RULE G/H).

## Impact
App UI. Depends on D01. Bible: DealTracker.jsx + components/sales/* @ 29ae47e3.
