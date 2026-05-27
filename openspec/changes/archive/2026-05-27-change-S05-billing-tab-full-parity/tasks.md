# Tasks — change-S05

- [ ] T1. NEW `src/features/company/business-rules/retainer-formula.ts`:
  - `export function calculateRetainer(budget: number, minimum: number, divisor: number, multiplier: number): number`
  - Implementation: `return Math.max(minimum, Math.floor(budget / divisor) * multiplier)`
  - Matches bible line 170 exactly

- [ ] T2. NEW `src/features/company/business-rules/__tests__/retainer-formula.spec.ts`:
  - Test: budget=0 → returns minimum
  - Test: budget=14999, divisor=15000, mult=5000, min=1000 → 1000 (minimum wins)
  - Test: budget=15000, divisor=15000, mult=5000, min=1000 → 5000
  - Test: budget=30000 → 10000
  - Test: budget=45001, divisor=15000, mult=5000, min=1000 → 15000

- [ ] T3. NEW `src/features/company/components/billing-settings-tab.tsx`:
  - Props: `{ generalSettings, setGeneralSettings, company, handleSaveSettings, saveSettingsMutation, updateCompanyMutation }` — matches bible's BillingSettingsTab signature
  - Card "Billing Settings":
    - Row 1 (3-col): `default_daily_minimum_hours` (number, step 0.5), `default_tax_rate` (number, step 0.01), `invoice_due_days` select (7/14/30/45/60/90)
    - "Number Formatting" sub-section (h3 "Number Formatting"):
      - `invoice_number_format` input + `invoice_number_start` number input + `invoice_number_reset_yearly` Switch (immediate via updateCompanyMutation)
      - `job_number_format` input + `job_number_start` number input + `job_number_reset_yearly` Switch (immediate)
    - "Invoice Period" sub-section (h3 "Invoice Period"):
      - `invoice_period` select (weekly/monthly/per_trial) — immediate save on change
      - Conditional (when weekly): `weekly_billing_day` select — immediate
      - Conditional (when monthly): `monthly_billing_date` number input — immediate
      - Conditional (when per_trial): `per_trial_billing_days_after_end` number input — immediate
    - "Email Settings" sub-section: `sender_email` input
  - Card "Retainer Formula":
    - Prose: "HotSeaters can automatically calculate a retainer value..."
    - Sentence 1: "Every retainer will have a minimum value of $" + `retainer_minimum` input (w-28, h-9)
    - Sentence 2: "For every $" + `retainer_divisor` input + "of estimated budget, add $" + `retainer_multiplier` input + "to the retainer."
    - "Test Your Formula" sub-section: `test_budget` input (onChange → calls `calculateRetainer` and updates `calculated_retainer` readonly input)
  - Footer: "Save Billing Settings" Button

- [ ] T4. NEW `src/features/company/components/__tests__/billing-settings-tab.spec.tsx`:
  - Renders all three cards
  - Invoice period select: change to "weekly" → weekly billing day field appears; change to "monthly" → monthly billing date field appears; change to "per_trial" → days after end field appears
  - Test formula: type 30000 in hypothetical budget → calculated retainer shows 10000 (with default divisor/multiplier)
  - Reset yearly switch: onChange calls updateCompanyMutation (not handleSaveSettings)

- [ ] T5. `pnpm typecheck && pnpm lint && pnpm test` green

## Acceptance

- Formula calculator is live (no save button needed for the test)
- Conditional invoice period fields render correctly based on `company.invoice_period`
- All immediate-save switches call `updateCompanyMutation`, not `handleSaveSettings`
- `calculateRetainer` business rule is a pure function in `business-rules/` (RULE J)
