/**
 * no-next-step-confirm-modal.tsx — port of
 * HotSeatersMVP/src/components/sales/NoNextStepConfirmModal.jsx.
 *
 * Confirms with the user when they Mark Done without scheduling a future
 * activity. Fires every time — there is no "don't warn me again" toggle.
 *
 * Adaptation (RULE 0/H): the bible uses `ResponsiveModal` (centered dialog on
 * desktop, bottom drawer on mobile). The port's `ResponsiveModal` carries the
 * same responsive behavior and renders the title/body; the footer buttons live
 * in the body. HotSeatersMVP is the bible.
 */

import { AlertTriangle, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface NoNextStepConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduleNext?: () => void;
  onContinueAnyway?: () => void;
  contactName?: string | undefined;
}

export function NoNextStepConfirmModal({
  open,
  onOpenChange,
  onScheduleNext,
  onContinueAnyway,
  contactName,
}: NoNextStepConfirmModalProps) {
  const subject = contactName?.trim() || 'This contact';

  return (
    <ResponsiveModal open={open} onClose={() => onOpenChange(false)} title="No next step scheduled">
      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm" style={{ color: 'var(--theme-stone-600)' }}>
            {subject} will have no scheduled follow-up and will be flagged as needing attention.
            Continue anyway?
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onContinueAnyway?.();
            }}
            className="text-sm"
          >
            Continue without next step
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onScheduleNext?.();
            }}
            className="text-sm hover:opacity-90"
            style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
          >
            <CalendarPlus className="w-4 h-4 mr-1.5" />
            Schedule a future activity
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
