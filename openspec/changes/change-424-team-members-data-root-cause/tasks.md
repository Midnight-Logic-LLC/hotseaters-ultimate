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

(filled in during T3)

- Request URL: ...
- Status code: ...
- Row count: ...
- Widget shows: ...
- Branch: A / B / C / D

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

- [ ] T8. EDIT `src/features/dashboard/hooks/use-quick-stats.ts`:
  replace the hard-coded `status: 'active'` consultant-mapping line
  with `status: member.status ?? 'inactive'`. The `consultants
  .filter(c => c.status === 'active')` filter elsewhere in the hook
  (matching bible `Dashboard.jsx:209`) then produces the correct
  count for both active and inactive members.
- [ ] T9. UPDATE `src/features/dashboard/hooks/__tests__/use-quick-stats.spec.tsx`
  with a fixture covering: 2 active members + 1 inactive member →
  `teamMembers === 2`.

## Verification

- [ ] T10. `pnpm typecheck && pnpm test`. Must stay green.
- [ ] T11. Manual at `pnpm dev`: Quick Stats → Team Members displays
  the expected count for the screenshot user (2). Other Quick Stats
  fields are unchanged.
- [ ] T12. Capture a fresh side-by-side at 1440×900 of port vs
  bible's Quick Stats card. Both should display matching values for
  Active Clients, Team Members, Outstanding, Avg Hours/Week, and any
  HSH-flagged rows.

## Acceptance

- Port Quick Stats → Team Members value === bible value for the
  same user.
- Spec covers active vs inactive member counting.
- Diagnostic results recorded above so a future regression can be
  located fast.
