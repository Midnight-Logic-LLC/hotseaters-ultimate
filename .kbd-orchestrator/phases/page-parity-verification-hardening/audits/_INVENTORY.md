# Page parity inventory — page-parity-verification-hardening

Reconciled 2026-05-29. Closes prior-phase Technical Debt #4 (W1–W8 delivered
as squash commits without per-page tracking). VR mechanism: `drift` =
deployed-vs-deployed (`bible-vs-port`), `baseline` = authed `toHaveScreenshot`.

Audit status: PENDING (no audit note) → AUDITED (note exists) → PASS / FAIL.

## Public / marketing (V03 — drift mechanism)

| Bible | Port page | Route | VR | Audit | Latest drift |
|-------|-----------|-------|----|----|------|
| Landing/Home | `landing/pages/landing-page.tsx` | `/` `/Landing` | drift | 🔴 RE-PORT (V11) | Port built vs STALE bible; current bible has dark-hero redesign. 56-80% drift is REAL. audits/landing.md SUPERSEDED |
| Pricing | `marketing/pages/pricing-page.tsx` | `/Pricing` | drift | 🔴 RE-PORT (V11) | Same — 80-83% drift vs refreshed bible. audits/pricing.md SUPERSEDED |
| PrivacyPolicy | `marketing/pages/privacy-policy-page.tsx` | `/PrivacyPolicy` | drift | PENDING | 🟡 4.6%d / 7.2%m |
| TermsOfService | `marketing/pages/terms-of-service-page.tsx` | `/TermsOfService` | drift | PENDING | 🟡 4.2%d / 7.6%m |
| ReferralLanding | `marketing/pages/referral-landing-page.tsx` | `/ReferralLanding` | drift | PENDING | 🟡 5.6%d / 8.8%m |

## Auth / payment (V04 — mixed)

| Bible | Port page | Route | VR | Audit | Latest drift |
|-------|-----------|-------|----|----|------|
| Onboarding | `onboarding/pages/onboarding-page.tsx` | `/Onboarding` | baseline | PENDING | — |
| AcceptInvite | `auth/pages/accept-invite-page.tsx` | `/AcceptInvite` | drift | PENDING | 🟢 0.5%d / 2.3%m |
| PaymentSuccess | `marketing/pages/payment-success-page.tsx` | `/PaymentSuccess` | baseline | PENDING | — |
| PaymentCancelled | `marketing/pages/payment-cancelled-page.tsx` | `/PaymentCancelled` | baseline | PENDING | — |
| AccountDeactivated | `auth/pages/account-deactivated-page.tsx` | `/AccountDeactivated` | baseline | PENDING | — |
| (port-added) pending-approval | `auth/pages/pending-approval-page.tsx` | `/pending-approval` | drift | PENDING | 🟢 0.5%d / 2.3%m |
| (port-added) account-rejected | `auth/pages/account-rejected-page.tsx` | `/account-rejected` | drift | PENDING | 🟢 0.5%d / 2.3%m |
| (port-added) login | `auth/pages/login-page.tsx` | `/login` | drift | PENDING | 🟢 3.2%d / 🟡 8.9%m |

## App core (V05 — authed baseline)

| Bible | Port page | Route | VR | Audit |
|-------|-----------|-------|----|----|
| Dashboard | `dashboard/pages/dashboard-page.tsx` | `/Dashboard` | baseline | PENDING |
| MobileMore | `mobile/pages/mobile-more-page.tsx` | `/MobileMore` | baseline | PENDING |
| Settings (12 tabs) | `settings/pages/settings-page.tsx` | `/Settings` | baseline | PENDING |

## Sales (V06 — authed baseline)

| Bible | Port page | Route | Audit |
|-------|-----------|-------|----|
| Clients | `clients/pages/clients-list-page.tsx` | `/Clients` | PENDING |
| Clients detail | `clients/pages/client-detail-page.tsx` | `/Clients/:id` | PENDING |
| Clients new | `clients/pages/client-create-page.tsx` | `/Clients/new` | PENDING |
| DealTracker | `deals/pages/deal-tracker-page.tsx` | `/DealTracker` | PENDING |
| Sales | `sales/pages/sales-page.tsx` | `/Sales` | PENDING |
| LeadRadar | `lead-radar/pages/lead-radar-page.tsx` | `/LeadRadar` | PENDING |

## Operations (V07 — authed baseline)

| Bible | Port page | Route | Audit |
|-------|-----------|-------|----|
| Trials | `trials/pages/trials-list-page.tsx` | `/Trials` | PENDING |
| Trial detail | `trials/pages/trial-detail-page.tsx` | `/trials/:id` | PENDING |
| Trial edit | `trials/pages/trial-edit-page.tsx` | `/trials/:id/edit` | PENDING |
| Timeline | `trials/pages/timeline-page.tsx` | `/Timeline` | PENDING |
| TimeAndExpenses | `trials/pages/time-and-expenses-page.tsx` | `/TimeAndExpenses` | PENDING |
| Team | `company/pages/team-page.tsx` | `/Team` | PENDING |

## Billing (V08 — authed baseline)

| Bible | Port page | Route | Audit |
|-------|-----------|-------|----|
| Approvals | `approvals/pages/approvals-page.tsx` | `/Approvals` | PENDING |
| Invoices | `invoices/pages/invoices-page.tsx` | `/Invoices` | PENDING |
| Bills | `bills/pages/bills-page.tsx` | `/Bills` | PENDING |
| Collections | `collections/pages/collections-page.tsx` | `/Collections` | PENDING |

## HotSeatHub (V09 — authed baseline)

| Bible | Port page | Route | Audit |
|-------|-----------|-------|----|
| PotentialGigs | `hsh/pages/potential-gigs-page.tsx` | `/PotentialGigs` | PENDING |
| HelpWanted | `hsh/pages/help-wanted-page.tsx` | `/HelpWanted` | PENDING |
| HSHDirectory | `hsh/pages/hsh-directory-page.tsx` | `/HSHDirectory` | PENDING |
| HotSeatHubMarketing | `hsh/pages/hot-seat-hub-marketing-page.tsx` | `/HotSeatHubMarketing` | PENDING |
| Projections | `sales/pages/projections-page.tsx` | `/Projections` | PENDING |

## Documents + Manual (V10)

| Bible | Port page | Route | Audit |
|-------|-----------|-------|----|
| UserManual | `manual/pages/user-manual-page.tsx` | `/UserManual` | PENDING |
| ManualBilling | `manual/pages/manual-billing-page.tsx` | `/ManualBilling` | PENDING |
| ManualCompany | `manual/pages/manual-company-page.tsx` | `/ManualCompany` | PENDING |
| ManualHSH | `manual/pages/manual-hsh-page.tsx` | `/ManualHSH` | PENDING |
| ManualOperations | `manual/pages/manual-operations-page.tsx` | `/ManualOperations` | PENDING |
| ManualSales | `manual/pages/manual-sales-page.tsx` | `/ManualSales` | PENDING |
| ManualTimeExpenses | `manual/pages/manual-time-expenses-page.tsx` | `/ManualTimeExpenses` | PENDING |
| SignDocument | `documents/pages/sign-document-page.tsx` | `/SignDocument` | PENDING |
| ViewDocument | `documents/pages/view-document-page.tsx` | `/ViewDocument` | PENDING |

## Out of scope (user-confirmed 2026-05-29)

| Bible | Disposition | Rationale |
|-------|-------------|-----------|
| NewMemberOnboardingPreview | OUT OF SCOPE | Dev/demo preview utility, not a customer surface |
| OwnerOnboardingPreview | OUT OF SCOPE | Same |
| ReferralOnboardingPreview | OUT OF SCOPE | Same |
| RunMigration | OUT OF SCOPE | In-app migrator; port replaces it with psql + Electric sync (RULE 1.2). Architecturally obsolete. |

## Doc* bible pages

~107 `Doc*` pages are documentation → served via `/manual/<slug>` per RULE 7.
Not React pages to port. Out of scope by rule.
