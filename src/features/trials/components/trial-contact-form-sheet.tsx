/**
 * TrialContactFormSheet — pick an attorney to add as a trial contact.
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useState } from 'react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTrialContactCRUD } from '@/features/trials/hooks/use-trial-contact-crud';

export interface TrialContactFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trialId: string;
  companyId: string;
}

export function TrialContactFormSheet({
  open,
  onOpenChange,
  trialId,
  companyId,
}: TrialContactFormSheetProps) {
  const { create } = useTrialContactCRUD();
  const [attorneyId, setAttorneyId] = useState('');

  return (
    <ResponsiveModal
      open={open}
      onClose={() => onOpenChange(false)}
      title="Add attorney"
    >
      <form
        className="space-y-3 p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!attorneyId) return;
          await create.mutate({
            company_id: companyId,
            trial_id: trialId,
            attorney_id: attorneyId,
          });
          setAttorneyId('');
          onOpenChange(false);
        }}
      >
        <div>
          <Label htmlFor="attorney_id">Attorney ID (UUID)</Label>
          <Input
            id="attorney_id"
            value={attorneyId}
            onChange={(e) => setAttorneyId(e.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000"
          />
          <p className="text-xs text-stone-500">
            v0.1 stub — attorney picker arrives with the attorneys feature.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!attorneyId}>
            Add
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
