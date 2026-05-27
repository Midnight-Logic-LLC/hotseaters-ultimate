# Tasks — change-S04

- [ ] T1. NEW `src/features/company/components/time-tracking-settings-tab.tsx`:
  - Props: same pattern as company-settings-tab — receives `generalSettings`, `setGeneralSettings`, `company`, `handleSaveSettings`, `saveSettingsMutation`, `updateCompanyMutation`
  - Card "Time Clock Settings":
    - `time_rounding_minutes` select: options 5, 10, 15, 30, 60 (with minute labels)
    - `clock_in_rounding` select: nearest/up/down
    - `clock_out_rounding` select: nearest/up/down
    - "Hide Deals from Time Clock" Switch: checked = `company?.hide_deals_from_time_clock || false`; onCheckedChange → `updateCompanyMutation` immediate save (matches bible: not batched)
  - Card "Default Billing":
    - `default_daily_minimum_hours` Input type="number" step="0.5" min="0"
    - Helper text: "Minimum hours to bill per day during trials"
  - Footer: "Save Time Tracking Settings" Button (same pattern as company tab)
  - All card/theme tokens identical to company tab

- [ ] T2. NEW `src/features/company/components/__tests__/time-tracking-settings-tab.spec.tsx`:
  - Renders both cards
  - "Hide Deals" Switch: onChange calls updateCompanyMutation (not handleSaveSettings)
  - Save button: calls handleSaveSettings
  - All three rounding selects render with correct options

- [ ] T3. `pnpm typecheck && pnpm lint && pnpm test` green

## Acceptance

- `hide_deals_from_time_clock` toggle saves immediately (no save button needed)
- All rounding fields default correctly per bible
- No new Supabase imports in component file
