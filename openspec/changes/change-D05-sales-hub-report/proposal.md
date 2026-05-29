# change-D05 — Sales Hub RETIREMENT (revised from "re-port")

## Why (revised after reading the current bible)

The plan assumed Sales Hub was "simplified (−419 LOC)". Reading the current
bible (`HotSeatersMVP @ 29ae47e3`) shows the truth: **`src/pages/Sales.jsx` was
DELETED entirely** (the full −419). The Leads→Deals pivot dissolved the 3-tab
Sales Hub wrapper (Lead Radar / Deal Tracker / Projections). In the current
bible:

- There is **no `/Sales` page**.
- `DealTracker` (D02) and `Projections` (D06) are standalone pages.
- Bible nav (`src/Layout.jsx`): a **"Sales" section header** containing
  **Deal Tracker** + **Clients** items; **Projections** lives under the
  **Overview** section (with Dashboard). Lead Radar is no longer in the nav.

So this change is a **retirement + nav alignment**, NOT a UI re-port.

## What changes

1. DELETE the port's Sales-Hub wrapper page `src/features/sales/pages/sales-page.tsx`
   and any test/types that exist only to serve it.
2. Remove the `/Sales` route + the `/sales` → `/Sales` redirect from
   `src/app/app-router.tsx` and the `SalesPage` import.
3. Port nav (`src/app/navigation.ts`) is ALREADY bible-aligned for
   Overview(Dashboard+Projections) and Sales(DealTracker+Clients). The only
   stray item is **`Lead Radar`** in the Sales group, which the bible no longer
   shows. **Defer the Lead Radar nav item + page retirement to change-D08**
   (LeadRadar disposition) so the Lead retirement is handled in one place — do
   NOT remove it here.
4. Confirm nothing else imports `SalesPage` / links to `/Sales`. If an in-app
   link points at `/Sales`, repoint it to `/DealTracker` (bible equivalent).

## Impact

Deletion + route cleanup. No new UI. Depends on D02 (DealTracker is the
destination — exists). The `sales/pages/projections-page.tsx` is a SEPARATE
page handled in D06 — do not touch it here.
