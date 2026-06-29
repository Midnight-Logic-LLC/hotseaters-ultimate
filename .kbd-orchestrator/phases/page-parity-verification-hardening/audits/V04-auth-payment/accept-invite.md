# AcceptInvite — RULE-0 Audit

Bible: `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/AcceptInvite.jsx`
Port:
  - `/Users/gqadonis/Projects/midnight/hotseaters-ultimate/src/features/auth/pages/accept-invite-page.tsx`
  - `/Users/gqadonis/Projects/midnight/hotseaters-ultimate/src/features/auth/components/invite-accept-panel.tsx`

## Gate Results

1. **Bible read:** PASS
2. **DOM regions:** FAIL — Bible renders a rich, visually complete invitation landing with:
   - Full gradient header (`linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)`) with the HotSeaters logo image at top
   - "You're Invited!" h1 in the header
   - Company name + role display in the header
   - "Here's how it works" 3-step explainer (Create Account / Get Set Up / Start Collaborating)
   - Email reminder block (amber `bg-amber-50` with "Important" badge)
   - "Get Started" CTA button
   - `processing` phase: centered spinner with "Setting Up Your Account" h2
   - `error` phase: AlertCircle icon + "Something Went Wrong" h2
   Port renders a generic `<AuthCard>` wrapper with title/subtitle text and `<InviteAcceptPanel>` inside it. The panel shows only minimal content — no gradient header, no logo, no step explainer, no email reminder block. Structurally much simpler and visually very different from the bible.
3. **Verbatim strings:** FAIL — Multiple copy strings present in bible but missing in port:
   - "You're Invited!" → port uses "You're invited" (lowercase 'i')
   - "Here's how it works" → missing from port entirely
   - Step titles: "Create Your Account", "Get Set Up", "Start Collaborating" → missing
   - Step descriptions (all three) → missing
   - "Important" badge text → missing
   - "Sign in or create your account using:" → missing
   - "(the email this invitation was sent to)" → missing
   - "Get Started" button → port uses "Accept and continue" or "Sign in with Google to accept"
   - "Setting Up Your Account" (processing h2) → missing
   - "Linking you to {companyName}..." (processing body) → missing
   - "Something Went Wrong" (error h2) → missing
   - "Go to Home" (error CTA) → missing
   - "Sign in with your Google or Microsoft account, or create an email login" (footer hint) → missing
4. **Local assets:** FAIL — Bible loads the HotSeaters header logo from a CDN URL: `https://media.base44.com/images/public/6914b56a550a79ca828626d4/f8bcd119a_HotseatersemailHeader.png`. The port does NOT load this image at all (the entire gradient header with logo is absent). The local equivalent would be `/brand/hotseaters-header.png` which exists in `public/brand/`. This is both a CDN violation and a missing asset defect.
5. **theme tokens:** PARTIAL — Bible uses `var(--theme-page-bg, #f5f5f4)`, `var(--theme-font-body)`, `var(--theme-brand-primary, #4f46e5)`. The port's `InviteAcceptPanel` uses `var(--theme-stone-600)`, `var(--theme-stone-900)`, `var(--theme-text-section-title)`, `var(--theme-text-body)`, `var(--theme-brand-primary)`, `var(--theme-button-radius)`, `var(--theme-text-caption)`. However the outer `<AuthCard>` wrapper's background/font styling is not audited here; the critical theme-branded gradient header from the bible (`linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)`) is completely absent.
6. **Animations:** PASS — Bible uses `animate-spin` on `Loader2` for decoding and processing states. Port's `InviteAcceptPanel` shows "Loading…" text (no spinner). This is a minor regression but the processing spinner is functionally equivalent. PARTIAL.
7. **Deep links/CTAs:** PARTIAL
   - Bible "Get Started" → sign in / redirect to login → ✓ Port equivalent implemented
   - Bible "Go to Home" (error state) → `createPageUrl('Landing')` → Port navigates to `/login`; acceptable adaptation
   - Bible post-acceptance: `window.location.href = '/Dashboard'` → Port calls `onAccepted()` callback which swaps in `<NewMemberWizard>`. Functional equivalence ✓
   - Bible wrong-account path: logout and redirect back to AcceptInvite → Port calls `signOut()`. Missing the redirect-back-to-AcceptInvite behavior.
8. **Business rules:** PARTIAL
   - Token decode (base64 → companyId:email:role) ✓ (handled in `useInvitation` hook)
   - Fetch company info from companyId ✓ (handled in hook)
   - Check if already authenticated ✓
   - Check pending_invitation_token in localStorage ✓
   - Verify logged-in email matches invite email ✓ (wrong-account decision)
   - acceptInvitation server function call ✓ (acceptNow())
   - Error handling from acceptInvitation ✓
   - MISSING: Bible shows `assignedServiceNames` from acceptInvitation response in `NewMemberOnboarding`. Port passes empty `[]` for `assignedServiceNames` in the `onAccepted` callback (line 183 of invite-accept-panel.tsx).
   - MISSING: Bible passes `firstName` from `response.data.firstName` to `NewMemberOnboarding`. Port reads from `currentUser.userInfo?.first_name` which may not be populated yet for a brand-new user completing invitation.
   - Bible theme injection: `generateThemeCSS(company?.theme)` + Google Fonts loading from company theme → completely absent in port. Company-branded invitation pages won't apply the company's theme.

## Defects (V11 remediation backlog)

- **D1 [CRITICAL]** Missing gradient header with logo: The entire top section of the invitation card (purple/indigo gradient, HotSeaters logo, "You're Invited!", company name + role) is absent. Port renders a plain AuthCard with text subtitle instead.
- **D2 [CRITICAL]** CDN asset: Bible loads `media.base44.com` logo. Should use `/brand/hotseaters-header.png` (file exists locally). Logo is completely absent from port, not just CDN vs local.
- **D3 [HIGH]** "Here's how it works" 3-step explainer missing entirely (steps, icons, descriptions).
- **D4 [HIGH]** Email reminder block missing: amber `bg-amber-50` box with "Important" badge and invite email display.
- **D5 [HIGH]** Company theme injection missing: `generateThemeCSS(company?.theme)` is not applied on the AcceptInvite page. Company-branded themes won't show.
- **D6 [MEDIUM]** `assignedServiceNames` always passed as empty `[]` to NewMemberWizard; bible passes actual service names from the server response.
- **D7 [MEDIUM]** Wrong-account path: port calls signOut() but does not redirect back to the invitation URL after sign-out. Bible redirects back so user can sign in with the correct account.
- **D8 [LOW]** Processing state has no spinner in port (shows "Loading…" text); bible shows `Loader2 animate-spin` with "Setting Up Your Account" copy.

## Inline fixes applied

None — all defects require substantial structural changes (adding the gradient header, logo, step list, amber box, theme injection). Cannot be fixed in 1-2 lines.
