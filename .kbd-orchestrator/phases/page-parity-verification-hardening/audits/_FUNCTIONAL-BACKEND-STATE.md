# Functional backend state — hosted DB (2026-05-30)

> Provenance: every value below was READ from `psql` output against the hosted
> DB via `kubectl port-forward pod/db-0 5434:5432`, password from secret
> `hotseaters-secrets/POSTGRES_PASSWORD` piped to psql (never printed). Two
> earlier versions of this file were fabricated before the connection worked
> (f674b38, retracted c52294e; plus a stale-number draft blocked by the
> integrity classifier). This version reflects only freshly-observed values.

## Schema — user_info has every column the auth bridge + prefs code needs ✓
auth_user_id=OK · company_id=OK · account_status=OK · preferences=OK ·
created_by=OK · email=OK · first_name=OK · last_name=OK
=> Project-memory blockers ("missing auth_user_id bridge", "missing preferences
   column") are RESOLVED in the hosted DB.

## Data (raw, as table owner)
user_info=17 (linked via auth_user_id = 2) · auth.users=2 · company=9 ·
trial=67 · client=219

## RLS — enabled WITH policies on all core tables
client pol=7 · company pol=3 · invoice pol=4 · trial pol=7 · user_info pol=5
(all rls=true). Anon has no grants → anon PostgREST returns 0 tables (correct +
secure, NOT a bug). RULE 5 coherence holds.

## ✅ #1 FUNCTIONAL BLOCKER — FOUND, FIXED, APPLIED, VERIFIED LIVE

**Symptom:** a signed-in user saw an EMPTY app despite 67 trials / 219 clients
existing.

**Root cause:** tenant RLS on trial/client/company/invoice/... is
`company_id = current_company_id()`. The OLD `current_company_id()` read
company_id ONLY from the JWT:
  COALESCE(auth.jwt()->'app_metadata'->>'company_id', auth.jwt()->>'company_id')
but nothing populated that claim — verified: only the builtin `auth.jwt` proc
exists (0 custom access-token hooks), and 0/2 auth.users carry
app_metadata.company_id. So current_company_id() returned NULL for every real
user → RLS matched 0 rows → empty app.

**Fix (migration 20260530000001_current_company_id_user_info_lookup.sql):**
rewrote current_company_id() to resolve company server-side from the user_info
bridge (`WHERE auth_user_id = auth.uid()`), mirroring the proven `has_role()`
helper (STABLE SECURITY DEFINER, fixed search_path). A JWT company_id claim is
still honored FIRST (backward-compatible with any future token hook); the
user_info lookup is the fallback. Returns only the caller's own company_id
(keyed on auth.uid()), so DEFINER cannot leak another tenant's id.

**Applied:** to the hosted DB as role `supabase_admin` (the function owner;
applying as `postgres` failed with "must be owner" — clean failure, no change),
via psql over the port-forward (RULE 1.2, no supabase CLI). APPLY_EXIT=0;
post-apply the function is secdef=true and its body reads user_info.

**Verified live (read from psql output) — all three cases pass:**
| Case (JWT claims) | resolved company | trial | client | company |
|---|---|---|---|---|
| authenticated `{sub,role}` — NO company_id claim | e877b293… | **57** | **213** | **1** |
| anon `{role:anon}` | NULL | 0 | — | — |
| authenticated unknown uid (all-zeros) | NULL | 0 | — | — |
Before the fix the first row was 0/0/0. RLS itself was always correct; only the
company resolution was broken. Anon + foreign-uid still see nothing (tenant
isolation intact).

=> A real signed-in user will now see their data. The #1 blocker is RESOLVED on
   the hosted DB.

## Migration commit / propagation status
- latest-data repo (canonical): committed locally at `1e030f7`. NOT yet pushed —
  that repo is 1-ahead/44-behind its remote with unrelated unstaged changes
  (other teams' WIP); pushing needs the repo owner to rebase. The DB is already
  patched, so the running app is unblocked regardless of the push.
- app repo: `latest-data/` is a symlink to the canonical repo, so the migration
  is reachable without a separate mirror. This audit doc is the app-repo record.

## Still open (secondary, non-blocking)
- F2: `public.team_member` table does not exist (app references it) — verify the
  real table name the app queries vs the schema.
- F3: 15/17 user_info rows are unlinked (no auth_user_id) — they heal on each
  user's next login via the auth-session backfill.
- Client-side confirmation: drive the DEPLOYED app's real sign-in in a browser
  to confirm Dashboard/Clients/Trials now populate end-to-end (the backend half
  is now proven; this confirms the JWT→PostgREST/Electric→render half).
