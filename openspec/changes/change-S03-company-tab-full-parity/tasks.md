# Tasks — change-S03

- [ ] T1. NEW `src/features/company/components/company-settings-tab.tsx`:
  - Props: `{ generalSettings, setGeneralSettings, company, user, handleSaveSettings, saveSettingsMutation, updateCompanyMutation, handleLogoUpload, handleRemoveLogo, isUploadingLogo }` — matches bible's `CompanySettingsTab` prop signature
  - Section "Company Identity": Card with theme tokens (`--theme-card-radius`, `--theme-card-shadow`, `--theme-card-bg`, `--theme-card-border`, `--theme-stone-200`). 3-column grid (col-span-2 for fields, col-span-1 for logo). Full field list: company_name, website, email, phone (with masking), address, city, state (US state select), zip.
  - Phone masking logic (pure function): strip non-digits, format as `(XXX) XXX-XXXX`; triggers on every keystroke. Extract to `src/features/company/business-rules/format-phone.ts`.
  - Logo section: `company?.logo` present → `<img>` + `<Button>` remove (X icon, red-100 bg); absent → dashed border div with `ImageIcon`. Upload input: `type="file" accept="image/*" className="hidden"`, triggered by "Upload Logo" button.
  - Admin-only section: `user?.role === 'admin'` gate. "Show Debug Info" Switch → `updateCompanyMutation.mutate({ show_debug_info: checked })`.
  - Section "Financial": Card. 3-col grid: Fiscal Year Start Month (12-option select), Annual Revenue Target ($ prefix + right-aligned + comma display), Monthly Breakeven (same pattern). Helper text on each field matches bible exactly.
  - Footer: `<Button onClick={handleSaveSettings} disabled={saveSettingsMutation.isPending}>Save Company Settings</Button>` right-aligned.

- [ ] T2. NEW `src/features/company/business-rules/format-phone.ts`:
  - `export function formatPhone(raw: string): string` — strips non-digits, formats as `(XXX) XXX-XXXX` (partial for < 10 digits)
  - 100% matches bible phone logic (lines 67–78 of CompanySettingsTab.jsx)

- [ ] T3. MODIFY `src/features/company/hooks/use-company-settings.ts`:
  - Expand `GeneralSettings` interface to all 22 bible fields
  - `useEffect` that hydrates all 22 fields from `company` entity (matches bible lines 73–100)
  - `save()` serializes with correct types: `parseFloat` for tax_rate/revenue_target/monthly_breakeven/retainer_*; `parseInt` for invoice_number_start/job_number_start/invoice_due_days/time_rounding_minutes; string fields as-is
  - Add `updateCompanyImmediate(patch: Partial<Company>)` that calls company-store's direct update action (for Switch toggles and immediate-effect selects)
  - Add `isUploadingLogo: boolean`, `uploadLogo(file: File)`, `removeLogo()` actions

- [ ] T4. NEW `src/features/company/components/__tests__/company-settings-tab.spec.tsx`:
  - Render with mock props matching company entity with all fields populated
  - Assert "Company Identity" and "Financial" section headings visible
  - Assert phone masking: simulate input "5551234567", assert displayed as "(555) 123-4567"
  - Assert revenue target comma formatting
  - Assert logo: null company.logo → dashed placeholder; set → img element
  - Assert admin section hidden when user.role !== 'admin'
  - Assert save button calls `handleSaveSettings` on click

- [ ] T5. NEW `src/features/company/business-rules/__tests__/format-phone.spec.ts`:
  - Test: "" → ""
  - Test: "5" → "(5"
  - Test: "555" → "(555) "
  - Test: "5551234" → "(555) 123-4"
  - Test: "5551234567" → "(555) 123-4567"
  - Test: "55512345678" → "(555) 123-4567" (truncated at 10)

- [ ] T6. `pnpm typecheck && pnpm lint && pnpm test` green

## Acceptance

- All 22 generalSettings fields hydrated from company entity on mount
- Phone masking matches bible formula exactly
- Save serializes all fields with correct types (no string-vs-number mismatch)
- Logo upload/remove work without base44 dependency
- Theme tokens match bible exactly (no hardcoded colors)
