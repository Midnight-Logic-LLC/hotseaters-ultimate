/**
 * TrialServicesPanel — sub-list of TrialService rows for the active trial.
 *
 * Layout faithful to HotSeatersMVP/src/components/trials/TrialInfoPanel.jsx
 * "Services" section: one card per service with rate / dates / billing method
 * and an edit affordance.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTrialServices } from '@/features/trials/hooks/use-trial-services';
import { useTrialServiceCRUD } from '@/features/trials/hooks/use-trial-service-crud';
import { TrialServiceFormSheet } from './TrialServiceFormSheet';
import type { TrialService } from '@/features/trials/entities';

export interface TrialServicesPanelProps {
  trialId: string;
  companyId: string;
  canEdit: boolean;
}

const fmtMoney = (n: number | null | undefined) =>
  n == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(n);

export function TrialServicesPanel({
  trialId,
  companyId,
  canEdit,
}: TrialServicesPanelProps) {
  const { items: services, isLoading } = useTrialServices(trialId);
  const { remove } = useTrialServiceCRUD();
  const [editing, setEditing] = useState<TrialService | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return <p className="p-4 text-sm text-stone-500">Loading services…</p>;
  }

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Services</h2>
        {canEdit ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setIsOpen(true);
            }}
          >
            <Plus className="mr-1 size-4" /> Add service
          </Button>
        ) : null}
      </header>

      {services.length === 0 ? (
        <p className="text-sm text-stone-500">No services on this trial yet.</p>
      ) : (
        <ul className="space-y-2">
          {services.map((s) => (
            <Card key={s.id} className="flex items-start justify-between p-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.service_name ?? '—'}</span>
                  {s.travel_eligible ? <Badge>Travel</Badge> : null}
                  {s.final_billing_method ? (
                    <Badge variant="outline">{s.final_billing_method}</Badge>
                  ) : null}
                </div>
                <div className="text-xs text-stone-500">
                  {s.rate_type ?? 'rate'}: {fmtMoney(s.rate)} • est.{' '}
                  {fmtMoney(s.estimated_total)}
                </div>
                {s.start_date || s.end_date ? (
                  <div className="text-xs text-stone-500">
                    {s.start_date ?? '?'} → {s.end_date ?? '?'}
                  </div>
                ) : null}
              </div>
              {canEdit ? (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit"
                    onClick={() => {
                      setEditing(s);
                      setIsOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    onClick={() => {
                      void remove.mutate({ id: s.id });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </ul>
      )}

      {canEdit ? (
        <TrialServiceFormSheet
          open={isOpen}
          onOpenChange={setIsOpen}
          trialId={trialId}
          companyId={companyId}
          service={editing}
        />
      ) : null}
    </section>
  );
}
