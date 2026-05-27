# Tasks — change-S08

- [ ] T1. Read `HotSeatersMVP/src/components/settings/TierManagement.jsx` in full (564 LOC). Document all state variables, CRUD operations, and visual sections before writing the port.

- [ ] T2. Verify `consultantTiers` in `useTier1()` (should be from change-405 `selectConsultantTiers`). Create `useTierCRUD()` hook if not present (create/update/delete/reorder `metadata_type` rows with scope=tier).

- [ ] T3. NEW `src/features/company/components/tiers-settings-tab.tsx`:
  - Port all visual sections and CRUD flows from TierManagement.jsx
  - Replace `base44.entities.*` with store actions
  - Replace `@tanstack/react-query` with entity graph reads
  - DnD reorder via `@hello-pangea/dnd`
  - All theme tokens applied

- [ ] T4. NEW `src/features/company/components/__tests__/tiers-settings-tab.spec.tsx`:
  - Basic render + CRUD flow tests

- [ ] T5. `pnpm typecheck && pnpm lint && pnpm test` green

## Acceptance

- All TierManagement.jsx functionality reproduced
- No base44 / react-query imports
- Theme tokens match bible
