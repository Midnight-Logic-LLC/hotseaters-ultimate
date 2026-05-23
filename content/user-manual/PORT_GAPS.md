# Port Gaps — Legacy `Doc*.jsx` → User Manual MDX

Walks every `Doc*.jsx` under `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/`
(~115 files) and classifies it into one of three buckets:

- **Covered** — topic already has a matching `.mdx` in this directory.
- **To port** — legitimate user-facing documentation, not yet ported. Awaiting
  conversion via `scripts/jsx-doc-to-mdx.mjs` + manual review.
- **Retire** — architecture/refactor/planning artifact. **Not** user-facing
  documentation. Do **not** port to the manual; these belong (if anywhere) in
  internal engineering docs.

> **HotSeatersMVP is the bible.** When the Next.js MDX corpus disagrees with MVP
> behavior, MVP wins. After porting, every `To port` row needs a behavior-vs-MVP
> review pass before it ships.

---

## Covered (34)

Already present as MDX in `content/user-manual/`.

| Legacy file | Manual slug | Notes |
|---|---|---|
| `Doc01AppOverview.jsx` | `app-overview` | |
| `Doc02DatabaseSchema.jsx` | `database-schema` | Verify against `latest-data/002_schema_v2.sql` |
| `Doc03UserWorkflows.jsx` | `user-workflows` | |
| `Doc04TechnicalReference.jsx` | `technical-reference` | |
| `Doc05DesignPatterns.jsx` | `design-patterns` | |
| `Doc06BackendFunctions.jsx` | `backend-functions` | |
| `Doc07ExternalIntegrations.jsx` | `external-integrations` | |
| `Doc08EnvironmentSetup.jsx` | `environment-setup` | Verify URLs match self-hosted Supabase / Electric |
| `Doc09LogoDesigns.jsx` | `logo-designs` | |
| `Doc10StyleGuide.jsx` | `style-guide` | |
| `Doc11NotificationSystemRefactor.jsx` | `notification-system` | Source is a refactor doc; review for user-facing behavior |
| `Doc12TravelTimeFeature.jsx` | `travel-time` | |
| `Doc13TimeClockWorkflows.jsx` | `time-clock-workflows` | |
| `Doc14QuickBooksIntegration.jsx` | `quickbooks-integration` | |
| `Doc15CloudStorageIntegration.jsx` | `cloud-storage` | |
| `Doc16ExpenseWorkflows.jsx` | `expense-workflows` | |
| `Doc17AutoExpenseReporting.jsx` | `auto-expense-reporting` | |
| `Doc18MobileDesignPlan.jsx` | `mobile-design` | |
| `DocPageDashboard.jsx` | `dashboard` | |
| `DocPageSalesHub.jsx` | `sales-hub` | |
| `DocPageDeals.jsx` | `deals` | |
| `DocPageClients.jsx` | `clients` | |
| `DocPageTrials.jsx` | `trials` | |
| `DocPageSchedule.jsx` | `schedule` | |
| `DocPageTimeTracking.jsx` | `time-tracking` | |
| `DocPageApprovals.jsx` | `approvals` | |
| `DocPageBilling.jsx` | `billing` | |
| `DocPageCollections.jsx` | `collections` | |
| `DocPagePotentialGigs.jsx` | `potential-gigs` | |
| `DocPageHelpWanted.jsx` | `help-wanted` | |
| `DocPageFavorites.jsx` | `favorites` | |
| `DocPageTeam.jsx` | `consultants` | Team page → Consultants concept in MVP |
| `DocPageSettings.jsx` | `settings` | Parent of Settings sub-tabs |
| *(none)* | `hello` | Pipeline smoke fragment, not from legacy |

> `Doc19TimelineRefactor.jsx` is **not** in the covered list — it is a refactor
> note, classified as Retire below.

---

## To port (30)

Legitimate user-facing content not yet in the manual. Each gets a stub MDX via
`node scripts/jsx-doc-to-mdx.mjs <legacy.jsx>`, then a human review pass against
MVP.

| Legacy file | Proposed slug | Section | Description |
|---|---|---|---|
| `DocEmailTemplates.jsx` | `email-templates` | `detailed` | Catalog of system-sent email templates (verify against MVP) |
| `DocOnboarding.jsx` | `onboarding` | `foundation` | Company / user onboarding flow |
| `DocInviteWizard.jsx` | `invite-wizard` | `per-page` | Team-member invite mini-wizard |
| `DocLeadRadar.jsx` | `lead-radar` | `per-page` | Lead Radar feature page docs |
| `DocWorkflowOverview.jsx` | `workflow-overview` | `core` | Standard vs HSH workflow pathway (prose portion only) |
| `DocUserDataSync.jsx` | `user-data-sync` | `detailed` | Cross-device sync behavior (user-facing portion only) |
| `DocUserLifecycleAndDomainOwnership.jsx` | `user-lifecycle` | `detailed` | User lifecycle + domain ownership rules |
| `DocAccountingIndex.jsx` | `accounting-overview` | `detailed` | Index page for accounting docs (rewrite as overview) |
| `DocAcctOverview.jsx` | `accounting-principles` | `detailed` | Accounting principles + philosophy |
| `DocAcctEntities.jsx` | `accounting-entities` | `detailed` | Accounting entity model |
| `DocAcctLedger.jsx` | `accounting-ledger` | `detailed` | Ledger / GL model |
| `DocAcctBanking.jsx` | `accounting-banking` | `detailed` | Banking workflows |
| `DocAcctBillPayments.jsx` | `accounting-bill-payments` | `detailed` | Bill-pay workflows |
| `DocAcctVendorBills.jsx` | `accounting-vendor-bills` | `detailed` | Vendor bills |
| `DocAcctStrategy.jsx` | `accounting-strategy` | `detailed` | Accounting strategy overview |
| `DocQBOOverview.jsx` | `qbo-overview` | `detailed` | QBO integration overview |
| `DocQBOMapping.jsx` | `qbo-mapping` | `detailed` | QBO entity ↔ MVP entity mapping |
| `DocQBOEntities.jsx` | `qbo-entities` | `detailed` | QBO entity reference |
| `DocQBODomains.jsx` | `qbo-domains` | `detailed` | QBO domain breakdown |
| `DocQBOUI.jsx` | `qbo-ui` | `detailed` | QBO UI surfaces |
| `DocQBOReference.jsx` | `qbo-reference` | `detailed` | QBO reference tables |
| `DocPageSettingsAdmin.jsx` | `settings-admin` | `per-page` | Settings → Admin tab |
| `DocPageSettingsBilling.jsx` | `settings-billing` | `per-page` | Settings → Billing |
| `DocPageSettingsCompany.jsx` | `settings-company` | `per-page` | Settings → Company |
| `DocPageSettingsTeam.jsx` | `settings-team` | `per-page` | Settings → Team |
| `DocPageSettingsServices.jsx` | `settings-services` | `per-page` | Settings → Services |
| `DocPageSettingsTimeTracking.jsx` | `settings-time-tracking` | `per-page` | Settings → Time Tracking |
| `DocPageSettingsTiers.jsx` | `settings-tiers` | `per-page` | Settings → Tiers |
| `DocPageSettingsTemplates.jsx` | `settings-templates` | `per-page` | Settings → Templates |
| `DocPageSettingsHSH.jsx` | `settings-hsh` | `per-page` | Settings → HSH marketplace config |
| `DocPageSettingsPipeline.jsx` | `settings-pipeline` | `per-page` | Settings → Pipeline configuration |
| `DocPageSettingsTheme.jsx` | `settings-theme` | `per-page` | Settings → Theme |
| `DocPageSettingsSubscription.jsx` | `settings-subscription` | `per-page` | Settings → Subscription |
| `DocPageSettingsDatabase.jsx` | `settings-database` | `per-page` | Settings → Database tools (verify is user-facing, not admin-only) |

---

## Retire (50+)

Architecture, refactor planning, test checklists, migration scaffolding. **Do
not** port to the user manual. If any of these prose chunks describe shipped
user-facing behavior, capture that behavior in the matching topical doc instead.

| Legacy file | Reason |
|---|---|
| `Doc19TimelineRefactor.jsx` | Refactor note |
| `DocDealTrackerRefactor.jsx` | Refactor note |
| `DocDealTrackerHookTest.jsx` | Test checklist |
| `DocEventArchitecture.jsx` | Architecture |
| `DocEventArchTestingChecklist.jsx` | Test checklist |
| `DocExpenseSegmentIdRefactor.jsx` | Refactor note |
| `DocFollowupTodos.jsx` | TODO list |
| `DocGoogleArtifacts.jsx` | Migration artifact |
| `DocGoogleImplementationPlan.jsx` | Implementation plan |
| `DocGooglePrompt.jsx` | Internal prompt |
| `DocGoogleSkill.jsx` | Skill spec |
| `DocGoogleTasks.jsx` | Task list |
| `DocGoogleWalkthrough.jsx` | Engineering migration walkthrough |
| `DocHSHArchitectureRefactor.jsx` | Architecture refactor |
| `DocHSHTravelRateArchitecture.jsx` | Architecture |
| `DocInlineRichTextEditing.jsx` | Editor refactor |
| `DocInvoiceVoidRefactor.jsx` | Refactor note |
| `DocLeadRadarRefactor.jsx` | Refactor note (`DocLeadRadar.jsx` carries the user-facing content) |
| `DocPipelineViewTest.jsx` | Test checklist |
| `DocQBOImplementation.jsx` | Implementation plan |
| `DocQBOSyncArchitecture.jsx` | Architecture |
| `DocQBOIndex.jsx` | Nav index, not content |
| `DocAcctIndex.jsx` | Nav index, not content |
| `DocQueryBudget.jsx` | Performance engineering |
| `DocQuillEditorUnification.jsx` | Refactor note |
| `DocReadSideArchitecture.jsx` | Architecture |
| `DocReadSideArchitectureV2.jsx` | Architecture |
| `DocSalesActivityEventArchitecture.jsx` | Architecture |
| `DocSeedCompany.jsx` | Dev/ops seeding artifact |
| `DocTierEngineMigration.jsx` | Migration note |
| `DocTrialServiceIdRefactor.jsx` | Refactor note |
| `DocUnifiedPipelineRefactor.jsx` | Refactor note |
| `DocV2ComponentTree.jsx` | Architecture (component tree) |
| `DocV2Index.jsx` | Nav index |
| `DocV2S01Architecture.jsx` | V2 architecture series — engineering planning |
| `DocV2S02PublicPages.jsx` | V2 planning |
| `DocV2S03Dashboard.jsx` | V2 planning |
| `DocV2S04Sales.jsx` | V2 planning |
| `DocV2S05Operations.jsx` | V2 planning |
| `DocV2S06TimeExpenses.jsx` | V2 planning |
| `DocV2S07Billing.jsx` | V2 planning |
| `DocV2S08HSH.jsx` | V2 planning |
| `DocV2S09Documents.jsx` | V2 planning |
| `DocV2S10Team.jsx` | V2 planning |
| `DocV2S11Settings.jsx` | V2 planning |
| `DocV2S12Notifications.jsx` | V2 planning |
| `DocPages.jsx` | Nav index |
| `Docs.jsx` | Nav index |

> If a V2S* doc contains shipped-behavior copy that the user-facing per-page doc
> is missing, lift only that prose into the corresponding `DocPage*` port.

---

## Bucket totals

- Covered: **34**
- To port: **30**
- Retire: **51**
