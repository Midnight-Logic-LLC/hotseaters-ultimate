# change-S04 — billing + ops local reads

## Why
`invoices`, `approvals`, `time-entries`, `subcontracts` stores REST-fetch on
mount. After S02 their tables are synced.

## What changes
Convert reads for `invoice`, `time_entry`, `subcontract_request`,
`subcontract_assignment` to `useLiveQuery`; stores keep writes only. Confirm
the approvals queue (derived across invoice + time_entry) resolves from local
views.

## Impact
`src/features/invoices/stores/*`, `src/features/approvals/stores/*`,
`src/features/time-entries/stores/*`, `src/features/subcontracts/stores/*`.
Depends on S02. RULE B/C/D.
