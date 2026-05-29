/**
 * cascade-delete-dialog.tsx — port of
 * HotSeatersMVP/src/components/sales/CascadeDeleteDialog.jsx (deal scope).
 *
 * The bible's dialog calls an edge function (`cascadeDeleteDeal`) twice — once
 * with `dry_run: true` to enumerate blockers/dependent-record counts, then
 * again to perform the cascade. The port has NO edge function, so the dialog
 * drives the cascade DIRECTLY through the deals hook:
 *   1. On open it counts the child rows it can reach (sales activities,
 *      trial services, trial contacts) and shows them as "dependent records".
 *   2. On confirm it deletes those children, then the trial row itself.
 *
 * Scope note (deferred): the bible's edge function also cascades DealDocument,
 * TrialServiceAssignment, SubcontractRequest/Assignment, TimeEntry, Expense,
 * Invoice and runs admin-override / typed-confirmation logic. Those entities
 * have no port store yet (documents / HSH / billing surfaces), so this dialog
 * deletes what the port owns and notes the remainder. See the inline
 * `DEFERRED` comment.
 *
 * HotSeatersMVP is the bible.
 */

import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSalesActivities } from '@/features/deals/hooks/use-sales-activities';
import {
  fetchTrialServices,
  fetchTrialContacts,
} from '@/features/trials/stores/trials-store';

interface DependentCounts {
  salesActivities: number;
  trialServices: number;
  trialContacts: number;
}

interface CascadeDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Trial id of the deal being deleted. */
  entityId: string;
  /** Display name (case name) shown in the copy. */
  entityName: string;
  /** Hard-delete the trial row (the deals hook's `deleteDeal`). */
  onDeleteTrial: (id: string) => Promise<void>;
  /** Delete the trial's child rows the trials-store owns. */
  onDeleteTrialChildren: (id: string) => Promise<void>;
  onSuccess?: () => void;
}

const HUMAN_LABEL: Record<keyof DependentCounts, string> = {
  salesActivities: 'Sales activities',
  trialServices: 'Services',
  trialContacts: 'Contact links',
};

export function CascadeDeleteDialog({
  open,
  onOpenChange,
  entityId,
  entityName,
  onDeleteTrial,
  onDeleteTrialChildren,
  onSuccess,
}: CascadeDeleteDialogProps) {
  const { countSalesActivitiesForTrial, deleteSalesActivitiesForTrial } = useSalesActivities();

  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<DependentCounts | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) {
      setCounts(null);
      setLoadError(null);
      setDeleting(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const [activityCount, services, contacts] = await Promise.all([
          countSalesActivitiesForTrial(entityId),
          fetchTrialServices(entityId),
          fetchTrialContacts(entityId),
        ]);
        if (cancelled) return;
        setCounts({
          salesActivities: activityCount,
          trialServices: services.length,
          trialContacts: contacts.length,
        });
      } catch (err: unknown) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to check dependencies.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, entityId, countSalesActivitiesForTrial]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Delete the children the port can reach, then the trial row.
      // DEFERRED: DealDocument, TrialServiceAssignment, SubcontractRequest/
      // Assignment, TimeEntry, Expense, Invoice cascades belong to the
      // documents / HSH / billing surfaces (no port store yet).
      await deleteSalesActivitiesForTrial(entityId);
      await onDeleteTrialChildren(entityId);
      await onDeleteTrial(entityId);
      toast.success('Deal deleted.');
      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete deal.');
    } finally {
      setDeleting(false);
    }
  };

  const dependentEntries = counts
    ? (Object.entries(counts) as Array<[keyof DependentCounts, number]>).filter(([, c]) => c > 0)
    : [];
  const hasDependents = dependentEntries.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            Delete Deal
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-stone-600">
            {loading && 'Checking dependencies…'}
            {loadError}
            {!loading && !loadError && counts && !hasDependents && (
              <>
                Permanently delete <strong>{entityName}</strong>? This action cannot be undone.
              </>
            )}
            {!loading && !loadError && counts && hasDependents && (
              <>
                Deleting <strong>{entityName}</strong> will also remove the dependent records listed
                below. This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="text-sm text-stone-600">
          {loading && (
            <div className="flex items-center gap-2 py-2 text-stone-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking dependencies…
            </div>
          )}
          {!loading && !loadError && counts && hasDependents && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-900">This cannot be undone.</div>
              </div>
              <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
                <div className="text-xs font-semibold text-stone-700 mb-1.5">Dependent records:</div>
                <ul className="text-xs text-stone-700 space-y-0.5">
                  {dependentEntries.map(([key, count]) => (
                    <li key={key} className="flex justify-between">
                      <span>{HUMAN_LABEL[key]}</span>
                      <span className="font-mono text-stone-500">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          {!loading && !loadError && counts && (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>Delete Deal</>
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
