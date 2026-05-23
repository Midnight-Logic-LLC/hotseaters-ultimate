/**
 * TrialContactsPanel — attorneys associated with the trial.
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { useTrialContacts } from '@/features/trials/hooks/use-trial-contacts';
import { useTrialContactCRUD } from '@/features/trials/hooks/use-trial-contact-crud';
import { TrialContactFormSheet } from './TrialContactFormSheet';

export interface TrialContactsPanelProps {
  trialId: string;
  companyId: string;
  canEdit: boolean;
}

export function TrialContactsPanel({
  trialId,
  companyId,
  canEdit,
}: TrialContactsPanelProps) {
  const { items: contacts, isLoading } = useTrialContacts(trialId);
  const { remove } = useTrialContactCRUD();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return <p className="p-4 text-sm text-stone-500">Loading contacts…</p>;
  }

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Attorneys</h2>
        {canEdit ? (
          <Button size="sm" onClick={() => setIsOpen(true)}>
            <Plus className="mr-1 size-4" /> Add attorney
          </Button>
        ) : null}
      </header>

      {contacts.length === 0 ? (
        <p className="text-sm text-stone-500">
          No attorneys linked to this trial yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {contacts.map((c) => (
            <Card key={c.id} className="flex items-center justify-between p-3">
              <div className="text-sm">attorney_id: {c.attorney_id}</div>
              {canEdit ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove"
                  onClick={() => {
                    void remove.mutate({ id: c.id });
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </Card>
          ))}
        </ul>
      )}

      {canEdit ? (
        <TrialContactFormSheet
          open={isOpen}
          onOpenChange={setIsOpen}
          trialId={trialId}
          companyId={companyId}
        />
      ) : null}
    </section>
  );
}
