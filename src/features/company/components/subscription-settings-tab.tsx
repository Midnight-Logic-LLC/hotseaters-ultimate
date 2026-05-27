/**
 * subscription-settings-tab.tsx — owner-facing Subscription tab on the
 * `/Settings` page. Renders `SubscriptionManagement` inside the same
 * card-chrome shell the bible uses (`Settings.jsx:279-346`), and adds
 * the "By using HotSeaters, you agree to our terms and policies" footer
 * with Privacy / Terms links that open `PolicyViewerModal`.
 *
 * Owner-only gating is wired in the settings tab registry (change-S14);
 * this component renders unconditionally so it can also be reached from
 * deep links and tests.
 *
 * Components → hooks only (RULE B). Local `useState` is for UI-only
 * modal toggling.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

import { PolicyViewerModal, type PolicyType } from './policy-viewer-modal';
import { SubscriptionManagement } from './subscription-management';

interface PolicyModalState {
  open: boolean;
  policy: PolicyType;
}

const INITIAL_MODAL_STATE: PolicyModalState = {
  open: false,
  policy: 'privacy',
};

export function SubscriptionSettingsTab() {
  const [modal, setModal] = useState<PolicyModalState>(INITIAL_MODAL_STATE);

  const openPolicy = (policy: PolicyType) => {
    setModal({ open: true, policy });
  };

  const closePolicy = () => {
    setModal((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader
          style={{
            backgroundColor: 'var(--theme-card-header-bg)',
            padding: 'var(--theme-card-header-padding)',
          }}
        >
          <CardTitle
            className="flex items-center"
            style={{
              gap: 'var(--theme-element-gap)',
              fontSize: 'var(--theme-text-card-title)',
              color: 'var(--theme-stone-900)',
            }}
          >
            <CreditCard
              className="w-5 h-5"
              style={{ color: 'var(--theme-brand-primary)' }}
              aria-hidden="true"
            />
            Subscription & Billing
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
          <SubscriptionManagement />

          <div
            style={{
              marginTop: 'var(--theme-card-gap)',
              paddingTop: 'var(--theme-card-gap)',
              borderTop:
                'var(--theme-card-border) solid var(--theme-stone-200)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--theme-text-body)',
                color: 'var(--theme-stone-600)',
                marginBottom: 'var(--theme-element-gap)',
              }}
            >
              By using HotSeaters, you agree to our terms and policies:
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => openPolicy('privacy')}
                className="text-indigo-600 hover:text-indigo-700 hover:underline text-sm cursor-pointer bg-transparent border-none p-0"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => openPolicy('terms')}
                className="text-indigo-600 hover:text-indigo-700 hover:underline text-sm cursor-pointer bg-transparent border-none p-0"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PolicyViewerModal
        open={modal.open}
        onClose={closePolicy}
        policy={modal.policy}
      />
    </>
  );
}

export default SubscriptionSettingsTab;
