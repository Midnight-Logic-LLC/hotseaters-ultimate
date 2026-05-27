# change-S11 — Subscription tab + PolicyViewerModal

## Why

The bible's Subscription tab wraps `SubscriptionManagement.jsx` (140 LOC) in a
Card and adds Privacy Policy + Terms of Service modal links. The `PolicyViewerModal`
component is shared with the landing page. Neither is ported.

The tab is owner-gated (`userInfo.company_role === 'owner'`).

## What changes

1. NEW `src/features/company/components/policy-viewer-modal.tsx`
   - Port of `PolicyViewerModal.jsx` from `HotSeatersMVP/src/components/settings/`
   - Shows Privacy Policy or Terms of Service content in a modal Dialog
   - Uses `src/features/landing/components/privacy-policy-content.tsx` + `terms-of-service-content.tsx` (create stubs if not yet ported)
   - Props: `{ open, onClose, type: 'privacy' | 'terms', title }`

2. NEW `src/features/company/components/subscription-settings-tab.tsx`
   - Card "Subscription & Billing":
     - CreditCard icon in CardTitle
     - `<SubscriptionManagement company={company} />` (create basic port below)
     - Divider section: "By using HotSeaters, you agree to our terms and policies:"
     - Two text buttons: "Privacy Policy" + "Terms of Service" → open `PolicyViewerModal`
   - Local state: `policyModalOpen`, `policyModalData` (type + title)

3. NEW `src/features/company/components/subscription-management.tsx`
   - Port of `SubscriptionManagement.jsx` (140 LOC)
   - Shows current plan, billing period, upgrade/downgrade CTAs
   - Read company subscription fields from entity

## Acceptance

- PolicyViewerModal opens with correct content for both privacy and terms
- Subscription tab only visible to owners
- SubscriptionManagement renders current plan info
