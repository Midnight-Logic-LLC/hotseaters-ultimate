# Assessment — page-parity-verification-hardening

_Generated: 2026-05-29 (Claude Opus 4.8)_

---

## Executive Summary

The prior phase (`hotseaters-page-parity-port`) **delivered** every bible
application page onto the port (Waves S + W1–W8), plus the Electric Pattern 4
local-first rewrite and the PGliteProvider crash fix. But it delivered fast:
Waves W1–W8 shipped as single `feat(wave-N)` squash commits with **no per-page
acceptance audit recorded** (RULE 0 gate asserted, not proven), and the
ledger never tracked them.

This phase does the verification the port skipped. It is **not** a re-port —
the code exists and the gate trio is green. It is a parity-hardening pass:
reconcile the ledger to reality, stand up the visual-parity (VR) harness with
real bible baselines, run the per-page RULE-0 acceptance gate at 1440×900 and
375×667 across all ported pages, and fix any copy/color/missing-section drift
surfaced.

---

## 1. Reconciled Page Inventory (ledger reconcile — Debt #4)

### 1.1 Bible application pages (parity targets)

The bible has ~150 `.jsx` files, but ~107 are `Doc*` documentation pages →
served via `/manual/<slug>` per RULE 7, **not** React pages to port. The real
application surfaces are the 43 non-Doc pages.

### 1.2 Port coverage

The port wires **78 routes** in `src/app/app-router.tsx` and ships **53 page
components** under `src/features/*/pages/`. Every bible app surface has a
corresponding ported page:

| Bible page | Port page | Route | Status |
|------------|-----------|-------|--------|
| Landing / Home | `landing/pages/landing-page.tsx` | `/` `/Landing` | ✅ ported, VR spec exists |
| PrivacyPolicy | `marketing/.../privacy-policy-page.tsx` | `/PrivacyPolicy` | ✅ ported |
| TermsOfService | `marketing/.../terms-of-service-page.tsx` | `/TermsOfService` | ✅ ported |
| Pricing | `marketing/.../pricing-page.tsx` | `/Pricing` | ✅ ported |
| ReferralLanding | `marketing/.../referral-landing-page.tsx` | `/ReferralLanding` | ✅ ported |
| Onboarding | `onboarding/pages/onboarding-page.tsx` | `/Onboarding` | ✅ ported |
| AcceptInvite | `auth/pages/accept-invite-page.tsx` | `/AcceptInvite` | ✅ ported |
| PaymentSuccess | `marketing/.../payment-success-page.tsx` | `/PaymentSuccess` | ✅ ported |
| PaymentCancelled | `marketing/.../payment-cancelled-page.tsx` | `/PaymentCancelled` | ✅ ported |
| AccountDeactivated | `auth/pages/account-deactivated-page.tsx` | `/AccountDeactivated` | ✅ ported |
| Dashboard | `dashboard/pages/dashboard-page.tsx` | `/Dashboard` | ✅ ported, VR spec exists |
| MobileMore | `mobile/pages/mobile-more-page.tsx` | `/MobileMore` | ✅ ported |
| Clients | `clients/pages/clients-list-page.tsx` + detail + create | `/Clients` `/Clients/:id` `/Clients/new` | ✅ ported, VR spec exists |
| DealTracker | `deals/pages/deal-tracker-page.tsx` | `/DealTracker` | ✅ ported |
| Sales | `sales/pages/sales-page.tsx` | `/Sales` | ✅ ported |
| LeadRadar | `lead-radar/pages/lead-radar-page.tsx` | `/LeadRadar` | ✅ ported |
| Trials | `trials/pages/trials-list-page.tsx` + detail + edit | `/Trials` `/trials/:id` `/trials/:id/edit` | ✅ ported, VR spec exists |
| Timeline | `trials/pages/timeline-page.tsx` | `/Timeline` | ✅ ported |
| TimeAndExpenses | `trials/pages/time-and-expenses-page.tsx` | `/TimeAndExpenses` | ✅ ported |
| Team | `company/pages/team-page.tsx` (+ sections, card) | `/Team` | ✅ ported |
| Approvals | `approvals/pages/approvals-page.tsx` | `/Approvals` | ✅ ported |
| Invoices | `invoices/pages/invoices-page.tsx` | `/Invoices` | ✅ ported |
| Bills | `bills/pages/bills-page.tsx` | `/Bills` | ✅ ported |
| Collections | `collections/pages/collections-page.tsx` | `/Collections` | ✅ ported |
| PotentialGigs | `hsh/pages/potential-gigs-page.tsx` | `/PotentialGigs` | ✅ ported |
| HelpWanted | `hsh/pages/help-wanted-page.tsx` | `/HelpWanted` | ✅ ported |
| HSHDirectory | `hsh/pages/hsh-directory-page.tsx` | `/HSHDirectory` | ✅ ported |
| HotSeatHubMarketing | `hsh/pages/hot-seat-hub-marketing-page.tsx` | `/HotSeatHubMarketing` | ✅ ported |
| Projections | `sales/pages/projections-page.tsx` | `/Projections` | ✅ ported |
| Settings | `settings/pages/settings-page.tsx` (12 tabs) | `/Settings` | ✅ ported, VR spec exists |
| UserManual | `manual/pages/user-manual-page.tsx` (+ 6 manual pages) | `/UserManual` | ✅ ported |
| SignDocument | `documents/pages/sign-document-page.tsx` | `/SignDocument` | ✅ ported |
| ViewDocument | `documents/pages/view-document-page.tsx` | `/ViewDocument` | ✅ ported |

### 1.3 Known gaps (low priority)

| Bible page | Status | Disposition |
|------------|--------|-------------|
| NewMemberOnboardingPreview | not ported | Dev/admin preview utility — defer or confirm out of scope |
| OwnerOnboardingPreview | not ported | Same |
| ReferralOnboardingPreview | not ported | Same |
| RunMigration | not ported | Admin/dev migration utility — likely intentionally omitted (port uses psql + Electric, not in-app migration) |

The port also **adds** an explicit auth-flow surface the bible handled inline
(`login`, `register`, `forgot-password`, `magic-link-sent`, `pending-approval`,
`account-rejected`, `auth/callback`) — net-positive, not a parity gap.

**Conclusion:** page coverage is complete for all bible app surfaces. The open
question is **fidelity**, not coverage.

---

## 2. Verification State

### 2.1 What exists

| Asset | State |
|-------|-------|
| Gate trio (typecheck/lint/test) | ✅ Green (0/0/407) as of 2026-05-29 |
| VR specs in `tests/visual-parity/specs/` | ⚠️ 7 specs exist: `bible-vs-port`, `clients-parity`, `dashboard-parity`, `landing-parity`, `settings-parity`, `trials-parity`, `font-diagnostic` |
| VR baselines | ❌ Not captured (needs bible app running locally) |
| Per-page RULE-0 audit record | ❌ None for W1–W8 |

### 2.2 The gap

1. **No VR baselines.** The 7 specs can run but have nothing to diff against.
   The ≤5% drift gate (RULE 0.1) is currently manual-eyeball only.
2. **VR coverage is partial.** Specs exist for 5 surfaces (landing, dashboard,
   clients, trials, settings). The other ~28 ported pages have no VR spec.
3. **No per-page acceptance audit.** RULE 0's gate (bible read end-to-end,
   every visible string verified verbatim, deep links checked, business rules
   confirmed) was applied by implementing agents but never recorded per page.
4. **37 `react-hooks/exhaustive-deps` warnings** on heavy ported pages
   (HSH projections, dashboard widgets) — correctness-adjacent stale-closure
   risk.

---

## 3. Recommended Wave Structure (for the plan phase)

| Wave | Scope |
|------|-------|
| V0 | Ledger reconcile (this assessment) + enable pre-commit hook + stand up VR harness with bible baselines |
| V1 | Per-page RULE-0 audit + VR spec + baseline for the **public/auth** surface (Landing, Pricing, Privacy, Terms, Referral, Onboarding, AcceptInvite, Payment*, AccountDeactivated) |
| V2 | Per-page audit + VR for the **app core** (Dashboard, MobileMore, Settings 12 tabs) |
| V3 | Per-page audit + VR for **sales + operations** (Clients, DealTracker, Sales, LeadRadar, Trials, Timeline, TimeAndExpenses, Team) |
| V4 | Per-page audit + VR for **billing + HSH + documents** (Approvals, Invoices, Bills, Collections, PotentialGigs, HelpWanted, HSHDirectory, HotSeatHubMarketing, Projections, UserManual, SignDocument, ViewDocument) |
| V5 | Fix all drift surfaced in V1–V4; pay down exhaustive-deps warnings; final gate trio + full VR diff green |

Each per-page audit follows the RULE 0 acceptance gate: bible read end-to-end,
rendered DOM region/hierarchy match, every visible string verbatim, all
`var(--theme-*)` tokens referenced, animations reproduced, deep links/CTAs
route identically, all business rules/calculations preserved.

---

## 4. Prerequisites / Blockers

- **Bible app must run locally** to capture VR baselines. This is the gating
  dependency for V0. (Same blocker noted in prior-phase deferred items.)
- Confirm disposition of the 4 unported pages (§1.3) with the user — likely
  out of scope, but should be explicit.

---

## 5. Out of Scope

- entity-management 2.0 transport-registry redesign (separate track,
  `foamy-marinating-hollerith.md`)
- Porting `Doc*` bible pages as React (RULE 7 — they are `/manual` content)
- New features beyond bible parity
