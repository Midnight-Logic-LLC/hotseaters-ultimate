# change-D07 — Dashboard sales-widget pivot

## Why
Bible Dashboard pivoted sales widgets leads→deals: useMyStaleDealsCount (was
useMyStaleLeadsCount), nav → DealTracker (was LeadRadar), copy "deals need
attention" (was "leads need attention"). Michroma title already applied.

## What changes
Port dashboard stale-count hook to deals; update nav target + copy strings in
the dashboard widget(s). Small surgical change.

## Impact
App UI + hook. Depends on D01. Bible Dashboard.jsx @ 29ae47e3.
