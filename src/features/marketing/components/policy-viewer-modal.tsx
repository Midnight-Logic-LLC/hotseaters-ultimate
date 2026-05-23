/**
 * PolicyViewerModal — modal display for Privacy Policy and Terms of Service.
 *
 * Bible: `HotSeatersMVP/src/components/settings/PolicyViewerModal.jsx`.
 * Verbatim shape: title + scrollable body region.
 *
 * Content sources:
 *   - 'privacy' → `<PrivacyPolicyContent>` (port of bible's
 *     `HotSeatersMVP/src/components/settings/PrivacyPolicyContent.jsx`)
 *   - 'terms'   → `<TermsOfServiceContent>` (port of bible's
 *     `HotSeatersMVP/src/components/settings/TermsOfServiceContent.jsx`)
 *
 * RULE 0 (pixel parity): the content components reproduce the bible's
 * markup verbatim. RULE G: uses shadcn `<Dialog>` primitive.
 *
 * HotSeatersMVP is the bible. Self-hosted Supabase only.
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PrivacyPolicyContent } from '@/features/marketing/components/privacy-policy-content';
import { TermsOfServiceContent } from '@/features/marketing/components/terms-of-service-content';

export interface PolicyViewerModalProps {
  open: boolean;
  onClose: () => void;
  policyType: 'privacy' | 'terms';
  title: string;
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
        <DialogHeader
          className="px-6 py-4 border-b"
          style={{ borderColor: 'var(--theme-stone-200)' }}
        >
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto p-6" style={{ height: '70vh' }}>
          {policyType === 'privacy' ? <PrivacyPolicyContent /> : <TermsOfServiceContent />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
