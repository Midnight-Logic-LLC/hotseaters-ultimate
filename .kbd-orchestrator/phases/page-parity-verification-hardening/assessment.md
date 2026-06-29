# Assessment — page-parity-verification-hardening

_Updated: 2026-06-28 (Claude Sonnet 4.6) — Deep 5-agent parallel gap analysis vs HotSeatersMVP bible_
_Prior: 2026-05-29 (Claude Opus 4.8) — initial assessment_

---

## Executive Summary (2026-06-28 Update)

Five parallel agents performed a full functional gap analysis across all 40+ bible pages. Findings are organized below. The port has **all routes registered** and **all bible pages structurally present**. The gap is not missing pages — it is missing *depth* inside those pages.

Three root blockers account for ~80% of the functional debt:

1. **Billing store not landed** → Approvals, Invoices, Bills, Collections all render correct business-rule logic and dialogs against empty arrays. Sub-components (InvoiceForm, RecordPaymentContent, KanbanColumn, PdfPreviewDialog, etc.) are stub placeholders.
2. **Timeline and TimeAndExpenses are skeleton stubs** → Both pages have layout frames, preferences, and empty-state UI, but zero Gantt rendering, zero mutations, and zero Tier-2 data wiring.
3. **HSH Tier-2 data + mutations not wired** → HSHDirectory, HelpWanted, PotentialGigs all have correct filter/derivation logic running against empty arrays. All mutation handlers are stubs (favorite, block, respond, cancel, decline).

---

## Page-by-Page Gap Inventory

### ✅ PARITY / NEAR-PARITY (≤10% functional gap)

| Page | Status | Notes |
|---|---|---|
| Landing | ~24.5% visual drift (desktop) | Functional parity OK; visual residual is vertical-offset (rem-base fixed); ongoing V03 |
| ReferralLanding | ~24.1% visual drift (desktop) | Functional parity OK; visual residual is in progress (V03 TODO) |
| PrivacyPolicy | ~7–13% | MDX content audit pending (RULE 7 / V03) |
| TermsOfService | ~7–13% | MDX content audit pending (RULE 7 / V03) |
| Pricing | ✅ | Anon access fixed and verified live |
| Login / Register / ForgotPassword / MagicLinkSent / AuthCallback | ✅ | Not bible-page ported (bible uses base44 auth); port implements equivalent flows |
| PendingApproval / AccountRejected / AccountDeactivated | ✅ | Present in port; not in bible |
| PaymentSuccess / PaymentCancelled | ✅ | Present and render correctly |
| MobileMore | 🔴 10 defects | See critical section — 6 role-gate bugs, 1 missing item, 1 extra item, 2 wrong icons |
| UserManual + all Manual sub-pages | ✅ | All 7 manual pages present with real MDX content |
| ManualBilling | ✅ | 100% parity — verbatim content verified |
| Settings | ~98% | 12 tabs all substantive; only `DownloadBillingMatrixButtons` missing |
| Projections | ~85% (functional) | Deals-path logic wired; HSH + billing inputs explicitly deferred (D06) |
| SignDocument | ~90% | All logic present; only `DocumentDisplay` sub-component stubbed |
| ViewDocument | ~90% | Same — only `DocumentDisplay` stubbed |

---

### 🔴 CRITICAL — MobileMore Role-Gate Defects

The MobileMore page has **10 distinct defects** that break role-based navigation:

| Defect | Bible Rule | Port Bug |
|---|---|---|
| Projections gate | `isOwner` only | `isOwnerOrAdmin` — admins incorrectly see Projections |
| V2 Blueprint / Dev Docs item | Appended for admin role | Missing entirely |
| Sales section: sales role | `(!isTrialConsultant \|\| hasSalesAccess) && !isSales` | `!isOwner && (!isTrialConsultant \|\| hasSalesAccess)` — sales role excluded |
| DealTracker gate | `!isOwner && userRole !== "admin"` within Sales | Always shown when Sales section renders |
| LeadRadar item | Does NOT appear in bible's MobileMore | Port adds it — spurious |
| Operations section excludes sales | `!isOwner && !isSales` | `!isOwner` only — sales role incorrectly sees Operations |
| Billing: Invoices/Payments gated from admin | `userRole !== "admin"` gates Invoices/Payments | Port shows all three for `isOwnerOrAdmin && !isOwner` |
| HSH section role | `isOwnerOrAdmin \|\| isSales` | `isOwnerOrAdmin && !isOwner` — sales role and owners lose HSH |
| HSHIcon component | Custom `<HSHIcon>` after "HotSeatHub" text | Substituted with `<Orbit>` — wrong visual |
| HSH Directory icon | `BookUser` | Port uses `Orbit` — wrong icon |

---

### ⚠️ PARTIAL — STRUCTURE PRESENT, DATA/MUTATIONS STUBBED

#### Approvals
Missing: `ApproveTimeColumn`, `ApproveExpensesColumn`, `ApproveHSHInvoicesColumn` (all 3 sub-columns are inline stubs), `ApprovalsCompactSummary` bar, all Tier-2 data, real-time subscriptions, multi-select state.  
Working: `isOwnerOrAdmin` gate, `isPerTrial` business rule, `includeInProgress` toggle logic, `PageLoader`, page header copy.

#### Invoices
Missing: `InvoiceForm` dialog (stub), `BillingCompactSummary`, all 4 mutations (`createInvoiceMutation`, `saveInvoiceMutation`, `invalidateInvoiceMutation`, `sendInvoiceMutation`), PDF generation (`generateInvoicePdf`, `generateLineItemsTableHtml`, `tableDataToHtml`), all Tier-2 data, real-time subscriptions.  
Working: URL auto-open from `?trialId=&clientId=&from=trial`, derivation logic, all 4 dialog structures, mobile FAB.

#### Bills
Missing: All 3 payment mutations, `CollectionsCards`, `CollectionsList`, `InvoiceListTable`, `PaymentsFilterSheet`, `GrandTotalBar`, `PageToolbar`, `CollectionsSortHeader`, `PdfPreviewDialog`, `RecordPaymentContent`, all Tier-2 data, real-time subscriptions.  
Working: All business rules (`isBillPaid`, `isOverdue`, `isOpenStatus`, `groupBills`, `buildColumns`, 8-mode date filter, `paymentsByInvoice`), sort/groupBy/tab state, dialog structures.

#### Collections
Missing: All 3 mutations (`resendInvoiceMutation`, `markPaidMutation`, `markZeroBalanceMutation`), `CollectionsCards`, `CollectionsList`, `InvoiceListTable`, `PaymentsFilterSheet`, `PdfPreviewDialog`, `RecordPaymentContent`, `runPacedQueriesClient`, all Tier-2 data, real-time subscriptions.  
Working: All business rules, status overrides (`hsh_paid` → `'Payment Sent'`), localStorage prefs, `PageToolbar` (FULLY RENDERED), Resend Invoice dialog, Zero-balance dialog.

---

### 🔴 BLOCKING — MAJOR FUNCTIONAL GAPS

#### Timeline (1211 lines bible → 445 lines port)
Skeleton only. ALL Gantt sub-components missing: `TimelineHeader`, `TodayIndicator`, `TimelineBars`, `TimelineSidebar`, `TimelineRevenueChart`, `MobileTimelineListView`. All mutations missing (updateServiceDates, updateTrialDates, updateSegmentDates, assignConsultant). All dialogs missing (ServiceAssignmentModal, TrialSummaryModal, SplitBillingDialog, TimelineUndoBar). All realtime subscriptions (5 entities) missing. groupBy toggle, timeScale persistence, drag-to-reschedule, undo/redo — all absent.

#### TimeAndExpenses (270 lines bible → 222 lines port)
Skeleton only. All 5 sub-tab views are stubs: `TimeClockInterface`, `TimeTableTab`, `TimeKPICards`, `ExpensesTab`, `ExpenseReportsTab`, `TimeOffTab`. `useTimeTrackingData()`, `useTimeTrackingMutations()`, `useTimeTrackingPreferences()` — all no-ops or empty.

#### Team (1763 lines bible → 740 lines port)
Missing: `ConsultantForm` (primary edit surface), `InviteTeamMemberWizard` (3-step), all 6 mutations (send/cancel invite, create/update member, reactivate, role change), `calendarHealth` check per consultant, Calendar OAuth popup listener, non-admin own-profile edit branch, `showViewOnly` read-only mode, viewType + showHshFavorites persistence, real invitation data, real favoriteUserInfos data.

#### Trials Pipeline
Missing from **trials-list-page.tsx**: Kanban pipeline view (`PipelineTabContent`) — port is a flat table, `TrialDetails` overlay (in-page), `DealWizardV2` multi-step form overlay, all trial status mutations (complete, restore, revert, won, lost, settled, delete), HSH trial detection + HSHTrialDetails overlay, `isCompletedTrial`/`isDeal`/`isTrial`/`isLostDeal` derived booleans, `editLaunchedFromCard` flag, `?edit=`/`?trialId=` deep links, `overlayActive` mounting pattern, all Tier-2 data.

Missing from **trial-detail-page.tsx**: Time entries tab, Expenses panel, Invoices panel, all action buttons (Mark as Completed/Won/Lost/Settled, Revert to Deal, Restore, Delete), client firm name display, `isDeal/isTrial/isLostDeal` pill badges, stage-name badge.

#### HSHDirectory
Missing: `handleToggleFavorite`, `handleToggleBlock` — both stubs. View type persistence (`UserInfo.preferences.hshDirectoryViewType`). Full `HSHCompanyCard` (action buttons). `HSHProfileModal` (replaced with "Coming soon" dialog). `ReferralInviteForm` dialog. All Tier-2 data (allCompanies, favorites — empty arrays).

#### HelpWanted
Missing: All 5 view renderers (Manage, Map, Kanban, Card, List) — all stubs. All 3 mutations (`cancelRequestMutation`, `deleteRequestMutation`, `cancelAgreementMutation`) — all no-ops. `handleAccept`, `handleDeclineResponse`, `handleCounterOffer` via `useHSHNegotiation`. `AcceptConfirmationModal`. Real-time subscriptions (3 entities). `ReferralInviteForm`. `HWBulkAssignDialog`. All Tier-2 data.

#### PotentialGigs
Missing: All 3 view renderers (Kanban, Card, List) — all stubs. `handleSubmitResponse` mutation — stub. `handleDeclineRequest` mutation — stub. Real-time subscriptions (3 entities). `myConsultants`/`myServices` Tier-1 derivations (stubbed empty). View pref load/save. All Tier-2 data.

#### HotSeatHubMarketing
`src/features/marketing/pages/hot-seat-hub-marketing-page.tsx` does NOT exist. The route in `app-router.tsx` imports from `src/features/hsh/pages/hot-seat-hub-marketing-page.tsx` which DOES exist — verify the import path is correct. If wrong, the route resolves to a 404.

---

## Missing Components (Cross-Cutting)

| Component | Bible Location | Port Status | Impact |
|---|---|---|---|
| `DownloadBillingMatrixButtons` | Settings.jsx + Dashboard.jsx | MISSING | Settings tab incomplete, Dashboard widget gap |
| `DocumentDisplay` | SignDocument.jsx + ViewDocument.jsx | STUBBED | Document rendering non-functional |
| `KanbanColumn` / pipeline view | Invoices.jsx | STUBBED | Invoice workflow non-functional |
| `InvoiceForm` | Invoices.jsx | STUBBED | Invoice creation non-functional |
| `RecordPaymentContent` | Bills.jsx + Collections.jsx | MISSING | Payment recording non-functional |
| `PdfPreviewDialog` | Invoices + Bills + Collections | STUBBED | PDF preview non-functional |
| `ConsultantForm` | Team.jsx | MISSING | Team member editing non-functional |
| `InviteTeamMemberWizard` | Team.jsx | STUBBED (toast.info) | Invitations non-functional |
| `TimelineBar*` (all Gantt sub-components) | Timeline.jsx | MISSING | Timeline is a skeleton |
| All TimeAndExpenses sub-tabs | TimeAndExpenses.jsx | MISSING | T&E is a skeleton |
| `HSHCompanyCard` (with actions) | HSHDirectory.jsx | PARTIAL | No actions available |
| `HSHProfileModal` | HSHDirectory.jsx | STUBBED | Profile viewing impossible |
| `RequestsManageView/Kanban/Card/List/Map` | HelpWanted.jsx + PotentialGigs.jsx | MISSING | Content-free pages |

---

## Root Cause Analysis

### RC-1: Billing store not landed
Affects: Approvals, Invoices, Bills, Collections, Dashboard (revenue KPIs), Projections (realized revenue), Trials detail (Invoices tab).  
Fix: Land billing store with `invoice`, `billPayment`, `collection`, `timeEntry` reads. Wire all stub handlers → real mutations.

### RC-2: Tier-2 store wiring incomplete for operational pages
Affects: Timeline, TimeAndExpenses, Team, HSH pages, Trials pipeline.  
Fix: Wire `useTimeTrackingData()`, HSH data hooks, complete `trials` Tier-2 data.

### RC-3: Major sub-components not yet implemented
Affects: Timeline (all Gantt), TimeAndExpenses (all tab views), Team (ConsultantForm + wizard), Invoices (InvoiceForm), Bills/Collections (RecordPaymentContent), Documents (DocumentDisplay).  
Fix: Port each sub-component — each is a large individual task.

### RC-4: HSH mutation layer absent
Affects: HSHDirectory (favorite/block), HelpWanted (cancel/delete/accept/decline), PotentialGigs (respond/decline).  
Fix: Wire mutation handlers to stores once Tier-2 HSH data is wired.

### RC-5: MobileMore role-gate defects
Affects: All roles on mobile.  
Fix: Correct 10 defects directly from bible's conditional logic.

---

## Prioritized Gap Closure Plan

### P0 — Blocking (user cannot use the feature at all)

| Gap | Effort |
|---|---|
| Fix MobileMore 10 role-gate + icon defects | Low |
| Verify `HotSeatHubMarketing` route import path | Low |
| `DownloadBillingMatrixButtons` — port + wire | Low |
| `DocumentDisplay` — port for Sign/ViewDocument | Medium |
| Billing store landing (invoice, billPayment, collection reads) | High |
| Wire billing mutations (10 invoice/bill/collection handlers) | Medium |
| `InvoiceForm` sub-component | High |
| `RecordPaymentContent` sub-component | Medium |
| Approval sub-columns (ApproveTime, ApproveExpenses, ApproveHSHInvoices) | Medium |

### P1 — High (feature exists but key workflows broken)

| Gap | Effort |
|---|---|
| `ConsultantForm` — port from bible Team.jsx | High |
| `InviteTeamMemberWizard` — port 3-step wizard | High |
| Team mutations (create, update, invite send/cancel, deactivate/reactivate, role change) | Medium |
| Trials pipeline view (Kanban `PipelineTabContent`) | High |
| Trials status mutations (complete, restore, revert, won, lost, settled, delete) | Medium |
| Trial detail action buttons + Time/Expenses/Invoices tabs | High |
| HSH mutations (favorite, block, respond, cancel, decline) | Medium |
| HSHProfileModal | Medium |
| PotentialGigs view renderers (List/Card/Kanban) | High |
| HelpWanted view renderers (Manage/Map/Kanban/Card/List) | High |

### P2 — Medium (feature navigable but content-less)

| Gap | Effort |
|---|---|
| TimeAndExpenses sub-tabs (Clock, Time Table, Expenses, Reports, TimeOff) | Very High |
| Timeline Gantt rendering (bars, header, today marker) | Very High |
| Timeline drag + undo | Very High |
| `PdfPreviewDialog` — port shared component | Medium |
| Projections realized revenue (D06 deferral close) | Medium |

### P3 — Low / Visual (functional but has drift)

| Gap | Effort |
|---|---|
| ReferralLanding desktop 24.1% visual drift (V03) | Low |
| Landing residual 24.5% desktop spacing pass | Low |
| PrivacyPolicy / TermsOfService MDX content audit (RULE 7) | Low |
| Onboarding: loading spinner vs null + Tier-1 error bounce | Low |
| AcceptInvite: company theme/fonts injection on welcome screen | Low |
| HSHDirectory + HelpWanted + PotentialGigs view type pref persistence | Low |

---

## Page Inventory: Route Coverage

| Bible Page | Route | Depth |
|---|---|---|
| Landing.jsx | `/` `/Landing` | 🟡 Visual drift |
| PrivacyPolicy.jsx | `/PrivacyPolicy` | 🟡 Content audit |
| TermsOfService.jsx | `/TermsOfService` | 🟡 Content audit |
| Pricing.jsx | `/Pricing` | ✅ |
| ReferralLanding.jsx | `/ReferralLanding` | 🟡 Visual drift |
| AcceptInvite.jsx | `/AcceptInvite` | 🟡 Theme injection |
| Onboarding.jsx | `/Onboarding` | 🟡 Minor gaps |
| PaymentSuccess.jsx | `/PaymentSuccess` | ✅ |
| PaymentCancelled.jsx | `/PaymentCancelled` | ✅ |
| Dashboard.jsx | `/Dashboard` | 🟡 Widget arch OK; billing data deferred |
| MobileMore.jsx | `/MobileMore` | 🔴 10 role-gate defects |
| Clients.jsx | `/Clients` | 🔴 List UX missing (groups/card/import/filters) |
| DealTracker.jsx | `/DealTracker` | 🟡 TrialDetails overlay stub; date filter not applied |
| LeadRadar.jsx | `/LeadRadar` | 🟡 Copy drift on subtitle |
| Trials.jsx | `/Trials` | 🔴 Pipeline view missing |
| Trials/:id | `/trials/:id` | 🔴 Actions/tabs missing |
| Timeline.jsx | `/Timeline` | 🔴 Skeleton |
| TimeAndExpenses.jsx | `/TimeAndExpenses` | 🔴 Skeleton |
| Team.jsx | `/Team` | 🔴 Forms/mutations missing |
| Approvals.jsx | `/Approvals` | 🟡 Sub-columns stubbed |
| Invoices.jsx | `/Invoices` | 🟡 Form + mutations stubbed |
| Bills.jsx | `/Bills` | 🟡 Content views stubbed |
| Collections.jsx | `/Collections` | 🟡 Content views stubbed |
| HSHDirectory.jsx | `/HSHDirectory` | 🔴 Actions + data absent |
| HelpWanted.jsx | `/HelpWanted` | 🔴 All views + mutations absent |
| HotSeatHubMarketing.jsx | `/HotSeatHubMarketing` | ❓ Verify import path |
| PotentialGigs.jsx | `/PotentialGigs` | 🔴 Views + mutations absent |
| Projections.jsx | `/Projections` | 🟡 D06 billing deferred |
| Settings.jsx | `/Settings` | 🟡 1 component missing |
| UserManual.jsx | `/UserManual` | ✅ |
| ManualSales–ManualCompany | 6 routes | ✅ |
| SignDocument.jsx | `/SignDocument` | 🟡 DocumentDisplay stub |
| ViewDocument.jsx | `/ViewDocument` | 🟡 DocumentDisplay stub |

**Legend:** ✅ Parity | 🟡 Partial (usable shell, some gaps) | 🔴 Blocking gap | ❓ Needs verification

`assessment_complete: true` (updated 2026-06-28)

---

## Dashboard, Clients, DealTracker, LeadRadar — Detailed Gaps

### Dashboard
Widget registry architecture is correct and substantive. All core business-rule calculations are present. Single gap: `DownloadBillingMatrixButtons` not in widget registry (owner-only footer widget). Weighted pipeline KPI tile: verify secondary sub-caption (weighted value) renders per bible.

### Clients — BLOCKING LIST UX GAPS
| Missing | Detail |
|---|---|
| Search includes contact names/emails | Port searches firm_name only — users cannot find by attorney name |
| Active/Inactive "Show Inactive" switch | Port has no filter |
| ClientType grouping + collapse/expand per group | Port is a flat table |
| Drag-to-reorder ClientTypes | No drag capability |
| Card view mode | Port is list-only |
| `ClientImportWizard` | Missing |
| All Sales People filter dropdown | Missing |
| Hide Empty Types toggle | Missing |
| ClientType CRUD (add/edit/delete) | Missing |
| `CascadeDeleteDialog` for type and firm deletion | Missing |
| Contacts/Attorneys column in list + overview tab | Missing |
| `is_lead` firms excluded from list | Port shows them |
| `?clientId=` URL param auto-open | Missing |
| Trials tab in detail page | Placeholder stub |

### DealTracker — KEY GAPS
| Missing | Detail |
|---|---|
| Lost-view date filter logic | Range filtering exists in UI but is NOT applied in the deal pool derivation memo |
| `TrialDetails` overlay | `TrialDetailsStub` — all actions (mark-won/lost/settled/completed, restore, delete) are unreachable via overlay |
| `HSHTrialDetails` overlay | Missing |
| `documents`, `documentSigners`, `templates`, `trialContacts` | Passed as `[]` to `DealTrackerTab` |
| RTS sync of `selectedTrial` on underlying data change | Missing |
| Scroll-to-top on mobile when detail opens | Missing |

### LeadRadar — COPY DRIFT
- Subtitle: port says "Track potential leads and follow up before they go cold" — bible says "Track potential trials and opportunities from external sources"
- All extra widgets (LeadFollowUpBanner, NewLeadWizard, useLeadRadarData) are port-only additions that are ahead of the bible, not violations


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
