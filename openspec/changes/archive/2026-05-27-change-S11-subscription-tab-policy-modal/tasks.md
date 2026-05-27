# Tasks — change-S11

- [ ] T1. Read `HotSeatersMVP/src/components/settings/SubscriptionManagement.jsx` (140 LOC) and `PolicyViewerModal.jsx` in full.

- [ ] T2. NEW `src/features/company/components/policy-viewer-modal.tsx`:
  - Uses `Dialog, DialogContent, DialogHeader, DialogTitle` from `@/components/ui/dialog`
  - When `type === 'privacy'` → render PrivacyPolicyContent stub
  - When `type === 'terms'` → render TermsOfServiceContent stub
  - Content stubs: simple prose components with placeholder text ("Full policy content coming with public pages wave")

- [ ] T3. NEW `src/features/company/components/subscription-management.tsx`:
  - Port of SubscriptionManagement.jsx — replace base44 calls with company entity reads
  - Show: plan name, billing period, next billing date, seat count
  - Upgrade/downgrade buttons → external URL or future payment flow (link only for now)

- [ ] T4. NEW `src/features/company/components/subscription-settings-tab.tsx`:
  - Card wrapper with CreditCard icon in CardTitle (matches bible lines 279–345)
  - `<SubscriptionManagement company={company} />`
  - Divider + policy link buttons that open `PolicyViewerModal`
  - State: `policyModalOpen`, `policyModalData`

- [ ] T5. `pnpm typecheck && pnpm lint && pnpm test` green

## Acceptance

- Privacy Policy modal opens with prose content
- Terms of Service modal opens with prose content  
- Subscription info renders (plan, period, dates from company entity)
- Tab not visible when company_role !== 'owner'
