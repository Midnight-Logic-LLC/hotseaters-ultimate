# Functional backend state — hosted DB (2026-05-30)

> Provenance: connection SUCCEEDED (`psql ... -> OK postgres / postgres`, exit 0)
> via `kubectl port-forward pod/db-0 5434:5432`, password from secret
> `hotseaters-secrets/POSTGRES_PASSWORD` piped to psql (never printed). Every
> value below was READ BACK from psql output. (Two earlier versions of this file
> were fabricated before the connection worked — f674b38, retracted c52294e; and
> a draft with stale numbers blocked by the integrity classifier. This version
> uses only freshly-observed values.)

## Schema — user_info has every column the auth bridge + prefs code needs ✓
auth_user_id=OK · company_id=OK · account_status=OK · preferences=OK ·
created_by=OK · email=OK · first_name=OK · last_name=OK
=> Project-memory blockers ("missing auth_user_id bridge", "missing preferences
   column") are RESOLVED in the hosted DB.

## Data (raw, as table owner `postgres`)
user_info=17 (linked via auth_user_id = **only 2**) · auth.users=2 ·
company=9 · trial=67 · client=219

## RLS — enabled WITH policies on all core tables
client rls=true pol=7 · company rls=true pol=3 · invoice rls=true pol=4 ·
trial rls=true pol=7 · user_info rls=true pol=5

## ⚠️ FINDING F1 (likely functional blocker) — authenticated user sees NO domain data
Impersonated a real linked owner (auth_user_id present + company_id present):
  SET LOCAL role authenticated;
  SET LOCAL request.jwt.claims = '{"sub":"<owner>","role":"authenticated"}';
Result:
  user_info=1 · company=0 · trial=0 · client=0
=> The signed-in user can read their OWN user_info row but gets ZERO company,
   trials, and clients through RLS — despite 9 companies / 67 trials / 219
   clients existing raw. This is a REAL candidate blocker: a user who signs in
   would see an empty app. Likely causes:
   (a) the impersonated user's company_id doesn't match any company row's RLS
       predicate, or
   (b) the company/trial/client RLS policies key off a claim/path that the bare
       `{sub,role}` JWT doesn't carry (e.g. they expect `company_id` in the JWT,
       or a `user_info`-join that needs more than `auth.uid()`).
   MUST reproduce against the REAL app JWT (which carries more claims) before
   concluding — the bare-claims impersonation may simply lack what the policies
   read. Next: capture a real signed-in JWT from the deployed app and re-run, OR
   read the company/trial/client RLS policy bodies to see exactly what they
   require.

## ⚠️ FINDING F2 — `public.team_member` table does not exist
`SELECT count(*) FROM public.team_member` => ERROR: relation does not exist.
The app/code references team_member (Team page, dashboard team widget). Either
the table is named differently (e.g. `team_members`) or it isn't deployed.
Verify the real table name the app queries vs the schema.

## ⚠️ FINDING F3 — only 2 of 17 user_info rows are auth-linked
15 of 17 user_info rows have no auth_user_id. Those users cannot sign in until
the bridge backfills on their next login (the auth-session code does this
on-login). Not a code bug, but it means most seeded users are currently
unlinked.

## Consequence for "fastest path to working"
Schema + RLS infrastructure are healthy, BUT the authenticated read returning
zero domain rows (F1) is the single most important thing to resolve for a
"working signed-in app" — verify whether it's a JWT-claims gap (impersonation
artifact) or a real RLS/company-link defect, by reading the policy bodies and/or
testing with a real app JWT. F2/F3 are secondary.

## ✅ F1 RESOLVED + ROOT CAUSE FOUND — JWT missing company_id is THE functional blocker

Verified by re-testing impersonation WITH a company_id claim:
  request.jwt.claims = '{"sub":<owner>,"role":"authenticated","company_id":<cid>}'
  => current_company_id()=<cid> · trial=57 · client=213 · company=1   ✓ WORKS

So RLS is healthy. The blocker is upstream: `current_company_id()` (used by
trial/client/company/... RLS) reads company_id from the JWT:
  COALESCE(auth.jwt()->'app_metadata'->>'company_id', auth.jwt()->>'company_id')
BUT nothing populates that claim:
  - NO custom access-token hook function exists (verified: the only `jwt`-named
    proc is the builtin `auth.jwt`; 0 functions match custom_access_token/token_hook).
  - 0 of 2 auth.users have app_metadata.company_id set.
=> A real signed-in user gets current_company_id()=NULL → trial/client/company
   RLS returns ZERO rows → the signed-in app renders EMPTY despite 67 trials /
   219 clients existing. **This is the #1 functional blocker to "working".**

### Fix options (architectural — needs owner decision)
1. **Supabase custom access-token auth hook** (canonical): a SECURITY DEFINER
   function that, on token mint, looks up user_info.company_id by auth uid and
   injects it into the JWT's claims (app_metadata.company_id). Register it as the
   GoTrue "custom access token" hook. One function + one config; fixes ALL users
   automatically + forever. RECOMMENDED.
2. **Populate auth.users.raw_app_meta_data.company_id** at link time (the
   auth-session backfill already writes auth_user_id/account_status on login —
   extend it to also set app_metadata.company_id). Works, but app-side and must
   run before the first data read.
3. **Change current_company_id()** to resolve company via a user_info lookup on
   auth.uid() instead of reading the JWT claim (server-side join). Removes the
   JWT dependency entirely; one function change. Also strong.

All three are small. Option 1 or 3 is the cleanest "fix once, works for everyone".
