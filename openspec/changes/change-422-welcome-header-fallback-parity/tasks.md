# Tasks — change-422

- [x] T1. EDITED `src/features/dashboard/widgets/welcome-header.tsx`
  line 22. Replaced the conditional
  `{userInfo?.first_name ? \`, ${userInfo.first_name}\` : ''}` with
  `, {userInfo?.first_name || 'User'}` to match the bible
  (`Dashboard.jsx:703`). The leading "Welcome back," text is now
  static; only the name token is dynamic.
- [x] T2. UPDATED the existing welcome-header unit spec at
  `src/features/dashboard/widgets/__tests__/welcome-header.spec.tsx`.
  Replaced the prior `"Welcome back"` (no-name) expectation — which
  contradicted the new bible-parity behaviour — with two new specs:
  - `userInfo === null` → `"Welcome back, User"` (pre-hydration).
  - `userInfo.first_name === ''` → `"Welcome back, User"` (falsy
    fallback).
  Kept the original `first_name === 'Travis'` →
  `"Welcome back, Travis"` spec unchanged.
- [x] T3. `pnpm typecheck` clean. `pnpm test` **299/299 green**
  (up from 298, +1 for the new empty-string fallback case).
- [/] T4. **DEFERRED to user manual verification.** `pnpm dev` →
  `/Dashboard` — header should now read "Welcome back, User"
  briefly during auth resolution, then "Welcome back, Travis" once
  tier1 hydrates. No missing-comma flash, no width jump.

## Acceptance

- ✓ Header text matches the bible exactly on every render state.
- ✓ Spec covers all three states (named, null, empty-string).
- ✓ 299/299 tests green.
- ⌛ Manual side-by-side at `/Dashboard` deferred to user.

## Verification commit

- `29cf8a0` — welcome-header copy + spec updates.
