# change-D08 — LeadRadar disposition + retire dead Lead code

## Why
The bible dropped the Lead subsystem. The port still has lead-radar page/store,
ensure-lead-for-attorney rule, and Lead-based components/types. Retire what the
current bible no longer has.

## What changes
Decide LeadRadar fate per current bible nav (default: retire). Delete
lead-radar page + store, ensure-lead-for-attorney rule, and any Lead-only
components/types with no live imports. Verify via knip/typecheck before delete
(no dangling references). RULE: surgical — only remove what is truly dead.

## Impact
App deletion + route cleanup. Depends on D02, D05 (deals surface must exist
before retiring leads). Bible @ 29ae47e3.
