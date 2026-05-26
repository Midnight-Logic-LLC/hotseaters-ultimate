# change-424 — Team Members count parity (data-layer investigation)

## Why
The user's side-by-side screenshots show — same user, same data —
Quick Stats → Team Members: port `0`, bible `2`. The bible value is
correct. The assessment §C.1 identified three possible root causes:

a. `useTeam` returns `members: []` because the Supabase REST call
   fails silently.
b. `useTeam` returns `members: []` because the broken `useEntityList`
   snapshot (§A.1) blocks the consumer from completing first commit.
c. `use-quick-stats` hard-codes `status: 'active'` on every row while
   the bible filters by the real `user_info.status` — a latent bug,
   not the "0 vs 2" cause but worth fixing.

**(b) is the dominant cause** by the trace evidence (`getSnapshot`
warning at exactly the consumer chain). Change-420 likely resolves it
as a side-effect. This change is the **diagnostic + targeted fix**
that runs AFTER 420 lands, so we observe real behavior instead of
assuming.

## What changes
**Conditional on observed behavior after change-420 lands.**

1. RUN the dashboard, open DevTools → Network → filter for
   `user_info` requests. Inspect the call shape:
   - URL pattern: `/rest/v1/user_info?select=*&company_id=eq.<uuid>&order=created_at.asc`
   - Status code (expected 200; 400 / 401 / 403 indicate RLS).
   - Response body row count.
   - Response headers (`Content-Range` should report `0-N/N+1`).
2. BRANCH on observation:

### Case A — REST returns 200 with the expected 2 rows; widget shows 2
- Already fixed by change-420. Document the verification and close.

### Case B — REST returns 200 with the expected 2 rows; widget still shows 0
- The bug is in `useTeam`'s normalize / mapping. EDIT
  `src/features/company/hooks/use-team.ts` to confirm `members ===
  list.items` reaches the consumer. Add a `console.warn` if
  `list.items.length > 0 && members.length === 0` to surface the
  drift. Compare to the bible's data flow.

### Case C — REST returns 401 / 403 / RLS-rejected
- RLS on `public.user_info` doesn't permit the current JWT to see
  the company's members. INSPECT `latest-data/supabase/migrations/`
  for the active RLS policy on `user_info`. The bible's reads use
  the same JWT (`useCurrentUser` already authenticates), so either
  the policy is too restrictive (regression) or the port reaches
  Supabase with a different role.
- AUDIT `src/shared/db/supabase-client.ts` and `auth-session.ts`
  for the auth header attached to the REST call. Compare to the
  bible's auth header.
- LAND the corrective policy or auth header change. Migration
  goes in `latest-data/supabase/migrations/<ts>_user_info_rls_fix.sql`.

### Case D — REST returns the rows; latent `status: 'active'` bug bites
- EDIT `src/features/dashboard/hooks/use-quick-stats.ts` to filter
  consultants by real `member.status === 'active'` (parity with
  bible `Dashboard.jsx:209`). Update the spec at
  `src/features/dashboard/hooks/__tests__/use-quick-stats.spec.tsx`
  to cover the inactive-member case.

3. UPDATE `src/features/dashboard/hooks/use-quick-stats.ts` regardless
   of which branch above fires: replace the hard-coded
   `status: 'active'` mapping with `status: member.status ?? 'inactive'`
   so the count reflects reality (this is a latent fix even if not
   the "0 vs 2" cause).

## Out of scope
- Other Quick Stats fields (Active Clients, Outstanding, Avg
  Hours/Week, HSH Posts, HSH Gigs) — those have their own data
  sources; if any are wrong AFTER 420 + 424, file follow-ups, don't
  scope-creep this change.
- Tier-1 bootstrap timing (welcome name, header skeletons) — already
  handled by change-422 for the welcome string, structurally fine
  for the rest.
- Adding a "Team Members" spec at the Cypress / e2e level —
  separate parity-spec change; this is unit + integration only.

## Tasks → see `tasks.md`.
