# Onboarding — RULE-0 Audit

Bible: `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/Onboarding.jsx`
Port: `/Users/gqadonis/Projects/midnight/hotseaters-ultimate/src/features/onboarding/pages/onboarding-page.tsx`

## Gate Results

1. **Bible read:** PASS
2. **DOM regions:** PASS — Both are gate-only pages. Bible renders a centered `Loader2` spinner on a `bg-gradient-to-br from-indigo-50 via-white to-stone-50` background while checking, then delegates to `<OnboardingWizard />`. Port is structurally identical: null/spinner while loading, then `<OnboardingWizard />`.
   - DEFECT: Bible renders `<Loader2 className="w-8 h-8 animate-spin text-indigo-600" />` inside a full-height `div` with the indigo-50/white/stone-50 gradient. Port returns `null` (no spinner) during the `isLoading` state — the user sees a blank screen instead of a loading spinner.
3. **Verbatim strings:** PASS — This page renders no user-visible strings except via child components. The spinner contains no text.
4. **Local assets:** PASS — No image assets used on this gate page.
5. **theme tokens:** PASS — Bible uses hardcoded `bg-gradient-to-br from-indigo-50 via-white to-stone-50` (not `--theme-*` tokens) for the loading state. Port also uses `bg-gradient-to-br from-indigo-50 via-white to-stone-50` in the wizard loading state. Consistent.
6. **Animations:** FAIL — Bible shows `animate-spin` `Loader2` during `checkingUser` state. Port returns `null` during `isLoading`, giving the user a blank white screen. The spinner animation is missing from the loading gate.
7. **Deep links/CTAs:** PASS — Bible bounces to `/AcceptInvite?token=...` (pending token), `/Landing` (not auth / error), or `/Dashboard` (has company). Port bounces to `/AcceptInvite?token=...`, `/login` (not auth), or `/Dashboard` (has company). The not-auth destination differs: bible → `/Landing`, port → `/login`. This is an acceptable architectural adaptation (`/login` is the port's equivalent of the bible's public Landing page auth flow).
8. **Business rules:** PASS (with minor note)
   - Bible rule 1: pending `pending_invitation_token` → redirect to AcceptInvite. ✓ Port implements this.
   - Bible rule 2: not authenticated → bounce to Landing. ✓ Port equivalent: bounce to `/login`.
   - Bible rule 3: Tier-1 boot error → bounce to Landing. PORT PARTIAL: Port does not have an explicit error state guard — `useAuth()` sets `isLoading=false` and `isAuthenticated=false` on error, so user bounces to `/login`. Functionally equivalent, but the error-specific guard is implicit.
   - Bible rule 4: `force_onboarding` flag → clear it, potentially clear company_id from UserInfo, then show wizard. PORT PARTIAL: Port clears the flag and calls `reset()` (clears persisted wizard state) but does NOT call an equivalent of `base44.entities.UserInfo.update(userInfo.id, { company_id: null, ... })`. If user has a `company_id` set, they will be bounced to `/Dashboard` before reaching the wizard.
   - Bible rule 5: already has company → bounce to Dashboard. ✓ Port implements this.
   - Bible rule 6: authenticated, no company → show wizard. ✓ Port implements this.

## Defects (V11 remediation backlog)

- **D1 [HIGH]** Loading spinner missing: Port returns `null` during auth loading; bible shows `<Loader2>` spinner on indigo gradient background. User sees blank white screen instead of loading state.
- **D2 [MEDIUM]** `force_onboarding` path incomplete: Port clears the flag and resets wizard state but does not call `UserInfo.update({ company_id: null })`. If a reactivated user still has a `company_id` in the DB, the `companyId` check will bounce them to Dashboard before the wizard.

## Inline fixes applied

None — both defects require multi-file orchestration (store changes or hook changes), not 1-2 line fixes.
