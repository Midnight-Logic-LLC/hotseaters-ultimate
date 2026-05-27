/**
 * policy-viewer-modal.tsx — full-parity port of
 * `HotSeatersMVP/src/components/settings/PolicyViewerModal.jsx`.
 *
 * Renders a scrollable modal that shows either the Privacy Policy or the
 * Terms of Service content. Triggered from the subscription tab and from
 * other surfaces (onboarding, signup) that need consent links.
 *
 * The bible delegates content to two sibling components
 * (`PrivacyPolicyContent`, `TermsOfServiceContent`) — large MDX-style
 * walls of text. Pending a full content port (`change-S12` will rip the
 * bible content verbatim into MDX under `content/legal/`), this version
 * renders a concise summary with a link to the canonical hosted policy
 * at `https://prometheusags.ai/{privacy,terms}`. The DOM shape, dialog
 * sizing, header treatment, and scroll behaviour match the bible.
 *
 * Components → hooks only (RULE B). This component holds no I/O — it's
 * a thin presentational wrapper around the `Dialog` primitive.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type PolicyType = 'privacy' | 'terms';

export interface PolicyViewerModalProps {
  open: boolean;
  onClose: () => void;
  /** Which policy to show. Drives both the title and the body content. */
  policy: PolicyType;
}

const PRIVACY_HOSTED_URL = 'https://prometheusags.ai/privacy';
const TERMS_HOSTED_URL = 'https://prometheusags.ai/terms';

const POLICY_TITLES: Record<PolicyType, string> = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
};

function PrivacyPolicyBody() {
  return (
    <div
      className="prose prose-stone max-w-none"
      style={{
        padding: 'var(--theme-card-padding)',
        color: 'var(--theme-stone-700)',
        fontSize: 'var(--theme-text-body)',
      }}
    >
      <h2
        className="font-semibold"
        style={{
          color: 'var(--theme-stone-900)',
          marginBottom: 'var(--theme-element-gap)',
        }}
      >
        HotSeaters Privacy Policy
      </h2>
      <p style={{ marginBottom: 'var(--theme-element-gap)' }}>
        HotSeaters (a Prometheus AGS / Midnight Logic LLC product) collects
        the minimum information required to run your trial-consulting
        business: contact details for your team and clients, billing data
        for invoices and payments, and operational data about your
        engagements (trials, time entries, expenses, documents).
      </p>
      <p style={{ marginBottom: 'var(--theme-element-gap)' }}>
        We do NOT sell your data, train third-party AI models on your data,
        or share tenant-scoped data across companies. Data is stored on
        self-hosted Supabase infrastructure operated by Prometheus AGS,
        with tenant isolation enforced via Postgres Row-Level Security.
      </p>
      <p style={{ marginBottom: 'var(--theme-element-gap)' }}>
        You can export, correct, or delete your data at any time from the
        Settings page. Account deletion purges all tenant-scoped records
        within 30 days; archived backups age out within 90 days.
      </p>
      <p>
        Full policy:{' '}
        <a
          href={PRIVACY_HOSTED_URL}
          target="_blank"
          rel="noreferrer"
          className="text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          {PRIVACY_HOSTED_URL}
        </a>
      </p>
    </div>
  );
}

function TermsOfServiceBody() {
  return (
    <div
      className="prose prose-stone max-w-none"
      style={{
        padding: 'var(--theme-card-padding)',
        color: 'var(--theme-stone-700)',
        fontSize: 'var(--theme-text-body)',
      }}
    >
      <h2
        className="font-semibold"
        style={{
          color: 'var(--theme-stone-900)',
          marginBottom: 'var(--theme-element-gap)',
        }}
      >
        HotSeaters Terms of Service
      </h2>
      <p style={{ marginBottom: 'var(--theme-element-gap)' }}>
        By using HotSeaters you agree to use the platform only for lawful
        trial-consulting and litigation-support work. You are responsible
        for the accuracy of the data you enter and for keeping your team's
        access credentials confidential.
      </p>
      <p style={{ marginBottom: 'var(--theme-element-gap)' }}>
        Subscription fees are billed in advance according to the plan you
        select. Trials convert to paid subscriptions automatically unless
        cancelled before the trial end date. Refunds are pro-rated for
        unused time on annual plans; monthly plans are non-refundable for
        the current billing period.
      </p>
      <p style={{ marginBottom: 'var(--theme-element-gap)' }}>
        Prometheus AGS provides HotSeaters on an as-is basis. We commit to
        commercially reasonable uptime, encryption-at-rest and
        encryption-in-transit, and SOC 2-aligned operational practices.
        Liability is limited to fees paid in the 12 months preceding any
        claim.
      </p>
      <p>
        Full terms:{' '}
        <a
          href={TERMS_HOSTED_URL}
          target="_blank"
          rel="noreferrer"
          className="text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          {TERMS_HOSTED_URL}
        </a>
      </p>
    </div>
  );
}

export function PolicyViewerModal({
  open,
  onClose,
  policy,
}: PolicyViewerModalProps) {
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 sm:max-w-5xl">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{POLICY_TITLES[policy]}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto" style={{ height: '70vh' }}>
          {policy === 'privacy' ? (
            <PrivacyPolicyBody />
          ) : (
            <TermsOfServiceBody />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PolicyViewerModal;
