/**
 * PolicyViewerModal — modal display for Privacy Policy and Terms of Service.
 *
 * Bible: `HotSeatersMVP/src/components/settings/PolicyViewerModal.jsx`
 * (23 lines). Verbatim shape: title + scrollable body region.
 *
 * Content sources (Wave-1 work in the page-parity port):
 *   - 'privacy' → `<PrivacyPolicyContent>` (MDX-derived; ports of bible's
 *     `HotSeatersMVP/src/components/settings/PrivacyPolicyContent.jsx`)
 *   - 'terms'   → `<TermsOfServiceContent>` (ports of bible's
 *     `HotSeatersMVP/src/components/settings/TermsOfServiceContent.jsx`)
 *
 * Until the content components land, both branches render a placeholder so
 * the modal at least opens cleanly and the visual contract is testable.
 *
 * HotSeatersMVP is the bible. Self-hosted Supabase only.
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface PolicyViewerModalProps {
  open: boolean;
  onClose: () => void;
  policyType: 'privacy' | 'terms';
  title: string;
}

function PolicyPlaceholder({ kind }: { kind: 'privacy' | 'terms' }) {
  return (
    <div className="px-6 py-6 space-y-4">
      <p
        className="text-sm"
        style={{
          fontFamily: 'var(--theme-font-body)',
          color: 'var(--theme-stone-600)',
        }}
      >
        {kind === 'privacy'
          ? 'Privacy policy content is being ported from the bible. Until the dedicated content component lands (Wave 1 of the page-parity port), this placeholder appears.'
          : 'Terms of Service content is being ported from the bible. Until the dedicated content component lands (Wave 1 of the page-parity port), this placeholder appears.'}
      </p>
      <p
        className="text-xs"
        style={{
          fontFamily: 'var(--theme-font-body)',
          color: 'var(--theme-stone-500)',
        }}
      >
        Bible source:{' '}
        {kind === 'privacy'
          ? 'HotSeatersMVP/src/components/settings/PrivacyPolicyContent.jsx'
          : 'HotSeatersMVP/src/components/settings/TermsOfServiceContent.jsx'}
      </p>
    </div>
  );
}

export function PolicyViewerModal({
  open,
  onClose,
  policyType,
  title,
}: PolicyViewerModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b" style={{ borderColor: 'var(--theme-stone-200)' }}>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto" style={{ height: '70vh' }}>
          <PolicyPlaceholder kind={policyType} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
