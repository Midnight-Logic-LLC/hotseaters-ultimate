# change-D06 — Revenue Projections re-port

## Why
Bible revenue projections moved to RevenueProjectionsTab + RevenueDataTable +
revenueDetailAggregator under the deals model. Port projections-page.tsx accordingly.

## What changes
Re-port sales/pages/projections-page.tsx + port RevenueProjectionsTab,
RevenueDataTable, revenueDetailAggregator. Preserve all projection math (RULE J).

## Impact
App UI + business rules. Depends on D01. Bible components/sales/* @ 29ae47e3.
