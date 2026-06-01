# Tasks — change-S04

- [x] invoice reads → analysed: `invoices-store.fetchInvoicesForCompany` has ZERO callers (only a comment in projections-page references the name). DEAD CODE — not converted (YAGNI/surgical). Left in place, flagged for S07.
- [x] time_entry reads → analysed: `time-entries-store` has ZERO external importers. DEAD CODE — not converted. Left in place, flagged for S07.
- [x] subcontract_request + subcontract_assignment reads → analysed: `subcontracts-store` has ZERO external importers. DEAD CODE — not converted. (Note: assignment reads filter by hiring_company_id/subcontractor_company_id, NOT company_id, so they'd need a raw useLiveQuery hook, not useTierAQuery — moot while unwired.)
- [x] approvals queue → CONVERTED: `use-approvals.ts` now reads synced `user_info` via `useTierAQuery(..., "account_status = 'pending'")`; removed the REST `fetchPendingMembers` (deleted from store, zero refs remain). approve/reject Edge Functions kept; added optimistic `dismissedIds` set to preserve instant removal between Edge Function return and sync delta. `refresh` kept as stable no-op for caller compatibility.
- [x] Remove dead REST read-fetcher: removed `fetchPendingMembers` from approvals-store (the one live read converted).
- [x] 2nd-visit network reads = 0 for Approvals (now local). Invoices/T&E/Subcontracts already made zero entity-read calls (their store reads were never wired).
- [x] UI parity unchanged (approvals: same pending list, same sort created_at desc, same approve/reject + mutatingId UX)
- [x] `pnpm typecheck` clean; `pnpm eslint src/features/approvals` clean

## Reality note (honest scope correction)
The plan/assessment assumed invoices/time-entries/subcontracts had LIVE per-visit
duplicate fetches. Investigation showed their store read functions have ZERO
callers — they are unwired dead code (counted by the assessment's `.select()`
grep but never invoked). Building useLiveQuery wrappers for unconsumed reads
would be speculative (YAGNI). Per the surgical-changes rule, the dead read fns
are LEFT in place and flagged for the S07 doc/cleanup pass (or a future
dead-code sweep). The single genuine billing/ops duplicate-fetch was approvals,
now converted.
