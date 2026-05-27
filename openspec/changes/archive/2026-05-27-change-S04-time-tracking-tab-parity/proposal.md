# change-S04 — Time Tracking tab full parity

## Why

The bible's Time Tracking tab is inlined in `Settings.jsx` (not a separate
component). It controls time rounding, clock-in/out rounding methods, daily
minimum hours, and a hide-deals toggle. None of these are ported.

## What changes

1. NEW `src/features/company/components/time-tracking-settings-tab.tsx`
   - Section "Time Clock Settings" Card:
     - 2-col grid: Time Rounding select (5/10/15/30/60 min), Rounding Method (Clock-In) select (nearest/up/down), Rounding Method (Clock-Out) select (nearest/up/down)
     - "Hide Deals from Time Clock" Switch row (immediate save via `updateCompanyImmediate`)
   - Section "Default Billing" Card:
     - Default Daily Minimum Hours (number input, step 0.5)
   - Footer: "Save Time Tracking Settings" Button

2. Reuses `useCompanySettings` hook (extended in S03) — all fields already in `generalSettings`

## Acceptance

- "Hide Deals from Time Clock" saves immediately on toggle (does not wait for Save button)
- All other fields save on "Save Time Tracking Settings" button
- Rounding selects default to "nearest" per bible
- `default_daily_minimum_hours` defaults to "8"
