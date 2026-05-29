# Tasks — change-D01

- [x] T1. Read bible `hooks/useDealsTrialsData.js` + `getDealsTrialsData` edge fn end-to-end.
- [x] T2. Confirm port `trial` entity has every field the deal surface reads; extend entities.ts only if missing (NO new table).
- [x] T3. Build `use-deals-trials-data.ts` (scope deals|trials) over the trial store + useTier1.
- [x] T4. Add deals-store actions if needed (stage transition); RULE D.
- [x] T5. Tests: scope filtering (deals = early pipeline stages) + projection field names.
- [x] T6. `pnpm typecheck && pnpm lint && pnpm test` green.
