# Tasks — change-403

## 403.a — Per-user PGlite key
- [ ] T1. Refactor `src/shared/db/pglite-client.ts`. Replace singleton with `openForUser(userId)` + `closeForUser(userId)`. IDB store name: `idb://hotseaters/${userId}`. Per-user cache in module state.
- [ ] T2. `src/features/auth/stores/auth-store.ts` — `signIn` success: `await pglite.openForUser(session.user.id)` then start sync. `signOut`: stop sync → `pglite.closeForUser(prev)` → graph reset → Supabase signOut.
- [ ] T3. Expose / verify `useGraphStore.getState().reset()`. If missing, propose upstream addition; for now, set `entities`/`patches`/`lists` to {} via a vendored helper.

## 403.b — Schema split
- [ ] T4. NEW `src/shared/db/local-schema-common.sql` — extract from current `local-schema.sql`: `metadata_type`, `entity_metadata`, `settings_type`, `country`, `state`, pipeline-stage seed catalogs. Idempotent CREATEs.
- [ ] T5. NEW `src/shared/db/local-schema-user.sql` — extract tenanted tables: client, client_address, client_service_override, trial, trial_service, trial_contact, trial_segment, invoice, bill_payment, time_entry, expense, subcontract_request, subcontract_assignment, deal_document, document_signer, company, user_info.
- [ ] T6. Delete original `local-schema.sql` (or convert to a stub that imports the two parts for backwards compatibility).
- [ ] T7. `pglite-client.ts` boot sequence: open → apply common → apply user → attach `createPGlitePersistenceAdapter` → start Electric → start Realtime.

## 403.c — Electric tenant adapter
- [ ] T8. `src/shared/db/electric-sync.ts` — refactor to use `createTenantScopedElectricAdapter({ tenantColumn: 'company_id', claim: () => ({ companyId: useAuthSession.getState().companyId }) })`. Register all tenanted shapes through it.
- [ ] T9. NEW system-reference shape registrar (no tenantColumn) — separate helper so misuse can't cross-pollinate.
- [ ] T10. NEW unit `tenant-adapter.spec.ts` — attaching a shape without `tenantColumn` throws.

## 403.d — Realtime channels
- [ ] T11. NEW `src/shared/db/realtime-channels.ts`. Subscribers for current user_info, current company, notifications. Writes call `useGraphStore.getState().putEntity(type, row)`.
- [ ] T12. Wire channel lifecycle to `openForUser` / `closeForUser`.

## 403.e — Docs
- [ ] T13. NEW `docs/architecture/sync-policy.md` containing the per-domain transport table + "how to add a new table" recipe + the cross-references to ElectricSQL and Supabase docs.
- [ ] T14. Link from `CLAUDE.md` and `AGENTS.md`.

## 403.f — Tests
- [ ] T15. NEW Playwright `pglite-isolation.spec.ts`. Sign in as A, write a client. Sign out. Sign in as B. Assert B sees 0 of A's clients. Inspect IDB → two databases present.
- [ ] T16. NEW E2E `realtime-theme.spec.ts` — change `company.theme.brand_primary` via Studio (psql), assert app picks it up within 2 s.
- [ ] T17. `pnpm typecheck && pnpm test && pnpm test:e2e` green.
- [ ] T18. Production smoke after deploy.
