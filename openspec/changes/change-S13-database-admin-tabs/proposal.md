# change-S13 — Database + Admin tabs + PublishSeedDefaultsButton

## Why

The bible has two admin-gated tabs: Database (shows DB debug info) and Admin
(shows `AdminPanel`). Both are `user.role === 'admin'` gated. The port needs
these tabs but their content is adapted to the port's architecture (PGlite debug,
Electric sync status, admin functions for the self-hosted stack).

`PublishSeedDefaultsButton` is also in this change — it appears in the Settings
page header (admin-gated, hidden on mobile).

## What changes

1. NEW `src/features/company/components/database-settings-tab.tsx`
   - Adapted port of `DatabaseDebug.jsx`
   - Shows: PGlite DB name/path, Electric sync status per entity, raw table row counts
   - "Clear Local Cache" button (wipes PGlite IDB, triggers re-sync)
   - "Export DB" button (exports PGlite IDB as file)

2. NEW `src/features/company/components/admin-settings-tab.tsx`
   - Adapted port of `AdminPanel.jsx`
   - Admin-only actions: list all companies (superadmin), impersonate company context, run maintenance tasks
   - Placeholder for actions not yet implemented in the port

3. NEW `src/features/company/components/publish-seed-defaults-button.tsx`
   - Port of `PublishSeedDefaultsButton.jsx`
   - Gated on `isSeedSuperadmin(userInfo)` from existing business rule `src/features/company/business-rules/seed-company.ts`
   - Button label: "Publish Seed Defaults"
   - On click: triggers seed publication API call (or placeholder alert if not yet implemented)

## Acceptance

- Database tab shows live PGlite status
- Admin tab renders without crashing
- PublishSeedDefaultsButton hidden for non-superadmin users
- Both tabs only appear when `user.role === 'admin'`
