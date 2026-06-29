# AccountDeactivated — RULE-0 Audit

Bible: `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/components/AccountDeactivated.jsx`
Port: `/Users/gqadonis/Projects/midnight/hotseaters-ultimate/src/features/auth/pages/account-deactivated-page.tsx`

Note: The bible source is a component (`src/components/`) not a page (`src/pages/`), referenced in the port's comment.
No corresponding page file exists in `HotSeatersMVP/src/pages/` — this is rendered as a component within the
app shell when `account_status === 'disabled'`. Port correctly exposes it as a page route
(`account-deactivated-page.tsx`), which is the appropriate adaptation.

## Gate Results

1. **Bible read:** PASS
2. **DOM regions:** PASS — Both render a centered card layout with identical structure:
   - `min-h-screen bg-gradient-to-b from-white to-slate-50` outer container ✓
   - `max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100` card ✓
   - `text-center` inner div ✓
   - Red circular icon container (`bg-red-100`, inline-flex, w-16 h-16, mb-6) ✓
   - SVG ban icon (same path data `M18.364 18.364A9 9 0 005.636 5.636...`) ✓
   - h1 heading ✓
   - body paragraph ✓
   - `bg-slate-50 rounded-md` contact box with support email ✓
   - Sign out button ✓
   Structure is a near-exact match.
3. **Verbatim strings:** PASS
   - "Account Deactivated" (h1) ✓
   - "Your HotSeaters account has been deactivated by your company administrator. You no longer have access to the application." ✓
   - "If you believe this is an error, please contact:" ✓
   - "Support@HotSeaters.com" (mailto link text) ✓
   - "Sign out" (button) — bible uses "Sign out" displayed via button text (hardcoded as `Sign out` inline), port uses `<Button>Sign out</Button>` ✓
   All strings match verbatim.
4. **Local assets:** PASS — No image assets used.
5. **theme tokens:** PASS — Neither bible nor port use `var(--theme-*)` tokens on this page; both use hardcoded Tailwind utility classes (slate, red, white). This is consistent and intentional — it is a dead-end deactivation screen that intentionally bypasses company theming.
6. **Animations:** PASS — No animations on this page in either bible or port. ✓
7. **Deep links/CTAs:** PASS
   - Support email: `mailto:Support@HotSeaters.com` ✓ (both use same href)
   - Sign out: Bible calls `base44.auth.logout()`. Port calls `signOut()` from `useAuth` hook. Functionally equivalent. ✓
8. **Business rules:** PASS
   - Dead-end screen: no navigation back into the app ✓
   - Explicit logout CTA ✓
   - Support contact email ✓
   - PORT NOTE: Bible's sign out button uses raw `<button>` with Tailwind classes (`px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors`). Port uses `<Button variant="outline">` from the shadcn primitive. Per RULE G, this is the correct approach. The rendered output should be visually equivalent, but the primitive must be audited separately (RULE 0.2/0.3) to ensure `variant="outline"` matches the bible's button style.

## Defects (V11 remediation backlog)

- **D1 [LOW]** Button visual: Bible uses a raw `<button>` with precise hardcoded Tailwind classes (`text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50`). Port uses `<Button variant="outline">`. If the `variant="outline"` primitive has different border color, font weight, or hover state from the bible, this is a visual defect that must be fixed in `src/components/ui/button.tsx` per RULE 0.3 — not in this file.

## Inline fixes applied

None.
