/**
 * TrialServiceAssignmentMatrix — consultants × services for a trial.
 *
 * Each cell shows whether the (consultant, trial_service) pair has an active
 * TrialServiceAssignment. Click a cell to toggle (canEdit only).
 *
 * v0.1 uses the assignment rows already seeded for the trial — a consultant
 * picker / team list arrives with the team feature.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useMemo } from 'react';
import { useTrialServices } from '@/features/trials/hooks/use-trial-services';
import { useTrialServiceAssignmentsByTrial } from '@/features/trials/hooks/use-trial-service-assignments';
import { useTrialServiceAssignmentCRUD } from '@/features/trials/hooks/use-trial-service-assignment-crud';
import { Button } from '@/components/ui/button';

export interface TrialServiceAssignmentMatrixProps {
  trialId: string;
  companyId: string;
  canEdit: boolean;
}

export function TrialServiceAssignmentMatrix({
  trialId,
  companyId,
  canEdit,
}: TrialServiceAssignmentMatrixProps) {
  const { items: services } = useTrialServices(trialId);
  const { items: assignments } = useTrialServiceAssignmentsByTrial(trialId);
  const { create, remove } = useTrialServiceAssignmentCRUD();

  const consultantIds = useMemo(() => {
    const set = new Set<string>();
    for (const a of assignments) {
      if (a.consultant_id) set.add(a.consultant_id);
    }
    return [...set];
  }, [assignments]);

  if (services.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        Add services first to see the assignment matrix.
      </p>
    );
  }

  if (consultantIds.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        No assignments yet — the team picker lands with the team feature.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border p-2 text-left text-stone-500">Consultant</th>
            {services.map((s) => (
              <th key={s.id} className="border p-2 text-left">
                {s.service_name ?? '—'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {consultantIds.map((cid) => (
            <tr key={cid}>
              <td className="border p-2 font-mono text-xs">
                {cid.slice(0, 8)}…
              </td>
              {services.map((s) => {
                const existing = assignments.find(
                  (a) =>
                    a.consultant_id === cid &&
                    a.trial_service_id === s.id &&
                    a.status !== 'inactive',
                );
                return (
                  <td key={s.id} className="border p-2">
                    {existing ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!canEdit}
                        onClick={() => {
                          void remove.mutate({ id: existing.id });
                        }}
                      >
                        Assigned
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canEdit}
                        onClick={() => {
                          void create.mutate({
                            company_id: companyId,
                            trial_id: trialId,
                            trial_service_id: s.id,
                            consultant_id: cid,
                            status: 'active',
                            is_subcontractor: false,
                          });
                        }}
                      >
                        + Assign
                      </Button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
