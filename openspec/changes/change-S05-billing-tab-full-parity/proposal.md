# change-S05 — Billing tab full parity

## Why

The bible's `BillingSettingsTab.jsx` (191 LOC) has three distinct sub-sections:
Billing Settings (daily min, tax rate, invoice due, number formatting, invoice
period), Retainer Formula (with live calculator), and Email Settings. The current
port has only a `RoutePlaceholder`. The retainer formula calculator is a
business-critical rule used to pre-populate job retainer values throughout the app.

## What changes

1. NEW `src/features/company/components/billing-settings-tab.tsx`
   - Card "Billing Settings":
     - 3-col: Default Daily Minimum Hours, Default Tax Rate (%), Invoice Due Date select (Net 7/14/30/45/60/90)
     - "Number Formatting" sub-section: Invoice Number Format + Invoice Starting Number + Reset switch; Job Number Format + Job Starting Number + Reset switch
     - "Invoice Period" sub-section: Billing Frequency select (weekly/monthly/per_trial) → conditional: Weekly Billing Day OR Monthly Billing Date OR Days After Trial End (each with immediate save)
     - "Email Settings" sub-section: Sender Email input
   - Card "Retainer Formula":
     - Prose explanation
     - Inline sentence inputs: minimum $ [input], $[divisor] → $[multiplier]
     - "Test Your Formula": hypothetical budget → calculated retainer (readonly)
   - Footer: "Save Billing Settings" Button

2. NEW `src/features/company/business-rules/retainer-formula.ts`
   - `export function calculateRetainer(budget: number, minimum: number, divisor: number, multiplier: number): number`
   - Formula: `Math.max(minimum, Math.floor(budget / divisor) * multiplier)`

3. NEW tests for retainer formula + billing tab component

## Acceptance

- Formula calculator updates in real-time as budget input changes
- Immediate-save fields (invoice_period, weekly_billing_day, monthly_billing_date, per_trial_billing_days_after_end, invoice_number_reset_yearly, job_number_reset_yearly) do not require the save button
- All other fields batch-save on "Save Billing Settings"
