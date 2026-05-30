# Functional backend state — hosted DB (2026-05-30, VERIFIED via psql over port-forward)

Reached the hosted Postgres in `hotseaters-platform` (svc `db`, pod `db-0`) via
`kubectl port-forward svc/db 5433:5432` + `psql` with the documented dev password
(`PG_PASSWORD=postgres`, per `latest-data/scripts/seed-hotbase.sh`). A
`db-migrate` job had Completed ~48min prior — schema is current.

All values below are from LIVE SQL against the hosted DB (read from drift-style
output files, not inferred).

## Schema — user_info has every column the auth bridge + prefs code needs
auth_user_id=OK · company_id=OK · account_status=OK · preferences=OK ·
created_by=OK · email=OK · first_name=OK · last_name=OK
=> The project-memory blockers ("missing auth_user_id bridge", "missing
   preferences column") are RESOLVED in the hosted DB. No longer blockers.

## Data — real accounts + domain data exist
user_info=7 (3 linked via auth_user_id) · auth.users=4 · company=2 ·
trial=14 · client=9

## RLS — enabled WITH policies on every core table
user_info rls=true pol=4 · company rls=true pol=3 · trial rls=true pol=5 ·
client rls=true pol=4 · invoice rls=true pol=3 · team_member rls=true pol=2
=> Explains anon PostgREST returning 0 tables earlier: anon has no grants
   (correct + secure). NOT a bug. RULE 5 coherence holds.

## Authenticated read path — WORKS end-to-end (the decisive test)
Impersonated a real linked owner inside a transaction:
  BEGIN; SET LOCAL role authenticated;
  SET LOCAL request.jwt.claims='{"sub":"<auth_user_id>","role":"authenticated"}';
Result:
  auth_user_info=1 · auth_trial=14 · auth_client=9 · auth_company=1
=> A signed-in user reading through RLS gets exactly their own rows. The backend
   functional chain (schema → data → auth bridge → RLS → reads) is HEALTHY.

## Consequence for "fastest path to working"
The BACKEND IS NOT THE BOTTLENECK. Schema/data/auth/RLS/auth-reads all pass.
The only unverified link is CLIENT-SIDE on the deployed app:
  (a) does sign-in succeed and resolve the user_info bridge,
  (b) is the JWT attached to PostgREST + Electric shape requests,
  (c) does PGlite sync + render the data.
Verify by driving the DEPLOYED app's real sign-in in a browser and watching
whether Dashboard/Clients/Trials populate. That is the next functional step.

## Access note (for reproducibility)
Port-forward: `kubectl -n hotseaters-platform port-forward svc/db 5433:5432`
Connect:      `PGPASSWORD=postgres psql -h 127.0.0.1 -p 5433 -U postgres -d postgres`
(Password is the documented dev default; the cluster secret is `db-credentials`
key `password` if it ever differs.)
