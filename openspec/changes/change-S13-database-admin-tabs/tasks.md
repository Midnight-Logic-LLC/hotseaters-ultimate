# Tasks — change-S13

- [ ] T1. Read `HotSeatersMVP/src/components/settings/DatabaseDebug.jsx` and `AdminPanel.jsx` for structure reference.

- [ ] T2. NEW `src/features/company/components/publish-seed-defaults-button.tsx`:
  - Import `isSeedSuperadmin` from `@/features/company/business-rules/seed-company`
  - Import `currentUserInfo` from `useTier1()`
  - If `!isSeedSuperadmin(currentUserInfo)` → return `null`
  - Renders `<Button variant="outline" size="sm">Publish Seed Defaults</Button>`
  - onClick → (placeholder) alert or call to seed publication edge function if available
  - Accepts `className` prop (for "w-full" mobile variant)

- [ ] T3. NEW `src/features/company/components/database-settings-tab.tsx`:
  - Shows PGlite status: DB URL, last sync timestamp per entity from Electric
  - Row counts per table (query PGlite via the existing worker bridge)
  - "Clear Local Cache" button → calls `pgliteWorker.clearDB()` (or equivalent) with confirmation AlertDialog
  - Electric sync status badges (syncing / synced / error) per entity group

- [ ] T4. NEW `src/features/company/components/admin-settings-tab.tsx`:
  - Sections based on `AdminPanel.jsx` structure but adapted:
    - Company list (for superadmin)
    - User management quick actions
    - System status (Electric health, Supabase connection status)
  - Non-implemented items shown as "Coming soon" cards

- [ ] T5. `pnpm typecheck && pnpm lint && pnpm test` green

## Acceptance

- PublishSeedDefaultsButton renders null for non-seed-superadmins
- Database tab shows real PGlite information (not hardcoded)
- Admin tab renders without crashing
- No base44 imports
