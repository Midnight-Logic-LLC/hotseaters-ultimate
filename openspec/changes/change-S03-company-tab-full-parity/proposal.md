# change-S03 — Company tab full parity

## Why

The bible's Company tab (`CompanySettingsTab.jsx`, 190 LOC) contains two visual
sections (Company Identity, Financial) plus a footer save button. The current
port has a `FirmInfoForm` inside `CompanySettingsPage` that covers only 8 basic
fields and is not styled with the theme token system. 22 fields are missing or
incorrectly structured.

## What changes

1. NEW `src/features/company/components/company-settings-tab.tsx`
   - Section 1 — "Company Identity" Card:
     - 2/3 col: Name input, row of Website + Email + Phone (phone masking), row of Address + City/State/ZIP (3-col)
     - 1/3 col: Logo 240×240 dashed-border placeholder (or img if logo set) + Upload/Change/Remove button
     - Admin-only: "Show Debug Info" Switch toggle (immediate save via `updateCompany`)
   - Section 2 — "Financial" Card:
     - 3-col: Fiscal Year Start Month (select, 12 months), Annual Revenue Target ($ right-aligned, comma-formatted), Monthly Breakeven ($, comma-formatted)
   - Footer: "Save Company Settings" Button (brand-primary, right-aligned)
   - All `Card`, `CardHeader`, `CardContent`, `CardTitle` theme tokens match bible exactly
   - Logo upload: calls `supabase.storage.from('company-logos').upload(...)` then `updateCompany({ logo: publicUrl })`

2. MODIFY `src/features/company/hooks/use-company-settings.ts`
   - Extend `generalSettings` shape to include all 22 bible fields (see `Settings.jsx` lines 32–58)
   - Extend `save()` to serialize all 22 fields with correct types (parse floats, ints)
   - Add `updateCompanyImmediate(patch)` action for immediate-effect fields

3. NEW `src/features/company/components/__tests__/company-settings-tab.spec.tsx`
   - Renders Company Identity section with all fields
   - Phone masking: type "5551234567" → displays "(555) 123-4567"
   - Revenue target: type "1500000" → displays "1,500,000"
   - Logo section: when `company.logo` is null → shows dashed placeholder; when set → shows img + remove button
   - Save button: triggers `save()` hook action

## Acceptance

- All 22 fields visible and editable
- Phone masking matches bible formula exactly
- Logo upload and remove work against self-hosted Supabase Storage
- "Save Company Settings" saves to `company` table (not `entity_setting`)
- Admin-only debug toggle absent for non-admin users
- All theme tokens (`--theme-card-radius`, `--theme-card-shadow`, etc.) applied
