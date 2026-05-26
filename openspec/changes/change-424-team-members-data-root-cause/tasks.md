# Tasks — change-424

## Diagnostic (must complete before any code change)

- [ ] T1. With change-420 landed, `pnpm dev` → `/Dashboard` signed in
  as `tjames@prometheusags.ai` (the user from the screenshot). Open
  DevTools → Network → filter `user_info`. Capture:
  - URL of the request.
  - Status code.
  - Response body (first 5 rows + `total` field).
  - Response `Content-Range` header.
- [ ] T2. From DevTools → Console: `$0` selector on the `Team Members`
  row in Quick Stats. Read the displayed count.
- [ ] T3. Record the observation in this `tasks.md` under "Diagnostic
  results" below. Branch to one of the four cases in the proposal.

## Diagnostic results

(Partially resolved via static analysis — 2026-05-26)

- `user_info` table: confirmed in core V2 schema (`legacy-sql/002_schema_v2.sql:897`)
- Store call: `fetchTeamForCompany` → `supabase.from('user_info').select('*').eq('company_id', ...).order('created_at')` — no status filter
- Data flow: REST → `useEntityList` → `useTeam.members` → `useQuickStats` client-side filter `m.account_status === 'active'`
- Latent status field bug: **CONFIRMED and FIXED** (T8/T9 committed as f00d76e)
  — `status: 'active'` hardcode replaced with `status: m.account_status ?? 'inactive'`
- Runtime branch: **Requires browser observation** (T1/T2 pending user to run `pnpm dev`)
  - Most likely Branch A (already fixed by 420, latent fix adds correctness) OR
    Branch B (normalize drops items) — `user_info` is not a V3-only table so 404 is unlikely
- Request URL: pending
- Status code: pending
- Row count: pending
- Widget shows: pending
- Branch: A or B (to confirm at browser)

## Branch A — already fixed by 420

- [ ] T4A. Confirm widget shows the expected count (2 in the
  reference screenshot).
- [ ] T5A. Apply the latent fix from T8 below regardless (status
  filter parity).

## Branch B — REST returns data but `useTeam` drops it

- [ ] T4B. EDIT `src/features/company/hooks/use-team.ts` line 39
  area: inspect why `list.items.length > 0` doesn't reach
  `members`. Likely culprits: normalize fn dropping rows because
  `id` is missing or `data` is a wrong shape; `useEntityList`'s
  `queryKey` mismatching between the fetch and the read.
- [ ] T5B. Land the targeted fix. Spec at
  `src/features/company/hooks/__tests__/use-team.spec.tsx` must cover
  the regression.

## Branch C — RLS or auth rejection

- [ ] T4C. AUDIT the active RLS policy on `public.user_info` in
  `latest-data/supabase/migrations/`. Specifically look for the
  `SELECT` USING clause.
- [ ] T5C. AUDIT `src/shared/db/supabase-client.ts` + `auth-session.ts`
  for the auth header attached to REST calls. Compare to the bible's
  same call.
- [ ] T6C. EITHER (a) land a corrective RLS migration in
  `latest-data/supabase/migrations/<ts>_user_info_rls_fix.sql` and
  re-run `supabase db push`, OR (b) fix the app's auth header
  propagation. Cite which.

## Branch D — latent status filter bug bites

- [ ] T4D. (Same as T8 below.)

## Latent fix (apply in every branch)

- [x] T8. FIXED in commit f00d76e — `use-quick-stats.ts` now maps
  `status: m.account_status ?? 'inactive'` instead of hard-coded `'active'`.
- [x] T9. FIXED in commit f00d76e — added explicit fixture: 2 active + 1
  inactive members → `teamMembers === 2`.

## Verification

- [x] T10. `pnpm vitest run` — 299/299 tests green (2026-05-26).
- [ ] T11. Manual at `pnpm dev`: Quick Stats → Team Members displays
  the expected count for the screenshot user (2). Other Quick Stats
  fields are unchanged. **→ REQUIRES BROWSER (user action)**
- [ ] T12. Capture a fresh side-by-side at 1440×900 of port vs
  bible's Quick Stats card. **→ REQUIRES BROWSER (user action)**

## Acceptance

- Port Quick Stats → Team Members value === bible value for the
  same user.
- Spec covers active vs inactive member counting.
- Diagnostic results recorded above so a future regression can be
  located fast.
