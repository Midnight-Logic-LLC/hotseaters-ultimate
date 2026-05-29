/**
 * sales-activity-history-dialog.tsx — port of
 * HotSeatersMVP/src/components/sales/SalesActivityHistoryDialog.jsx.
 *
 * Shows activity history for a deal (by trialId) or a contact (by attorneyId),
 * split into a "Scheduled Activities" section (pending/upcoming) and an
 * "Activity Log" (instant logs + completed scheduled). Paginates 50 at a time.
 *
 * Adaptation (RULE 0/C/D): the bible reads via react-query
 * (`SalesActivity.filter`) and consults a Tier-1 `userInfos` cache for the
 * "Completed by" name. The port fetches the filtered slice over Supabase REST
 * through the sales-activity store (on open) and takes `consultants` as a prop
 * (the page sources them from `useTeam`). The bible's `ResponsiveSidePanel`
 * becomes the port's `ResponsiveModal` (same responsive behavior). Pagination
 * trims the in-memory list client-side rather than re-querying with a limit,
 * the same rendered output.
 *
 * HotSeatersMVP is the bible.
 */

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Phone, Mail, Users, StickyNote } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import {
  useSalesActivities,
  type SalesActivityRow,
} from '@/features/deals/hooks/use-sales-activities';

const HISTORY_PAGE_SIZE = 50;

const TYPE_ICONS: Record<string, { icon: typeof Phone; color: string }> = {
  Call: { icon: Phone, color: 'text-blue-600' },
  Email: { icon: Mail, color: 'text-amber-600' },
  Meeting: { icon: Users, color: 'text-green-600' },
  Note: { icon: StickyNote, color: 'text-stone-500' },
};

export interface HistoryConsultant {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
}

interface SalesActivityHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trialId?: string | null;
  attorneyId?: string | null;
  consultants?: HistoryConsultant[];
}

export function SalesActivityHistoryDialog({
  open,
  onOpenChange,
  trialId,
  attorneyId,
  consultants = [],
}: SalesActivityHistoryDialogProps) {
  const { fetchActivitiesFor } = useSalesActivities();

  const [limit, setLimit] = useState(HISTORY_PAGE_SIZE);
  const [allRows, setAllRows] = useState<SalesActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || (!trialId && !attorneyId)) return;
    let cancelled = false;
    setIsLoading(true);
    setLimit(HISTORY_PAGE_SIZE);
    (async () => {
      try {
        const rows = await fetchActivitiesFor({ trialId, attorneyId });
        if (!cancelled) setAllRows(rows);
      } catch {
        if (!cancelled) setAllRows([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, trialId, attorneyId, fetchActivitiesFor]);

  const activities = useMemo(() => allRows.slice(0, limit), [allRows, limit]);
  const hasMore = allRows.length > limit;

  const getConsultantName = (id: string | null): string => {
    if (!id) return '';
    const c = consultants.find((x) => x.id === id);
    return c ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : '';
  };

  const scheduled = activities.filter((a) => a.scheduled_date && a.status !== 'done');
  const instant = activities.filter((a) => !a.scheduled_date || a.status === 'done');

  return (
    <ResponsiveModal open={open} onClose={() => onOpenChange(false)} title="Activity History">
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--theme-stone-500)' }}>
            Loading...
          </p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-center py-4 italic" style={{ color: 'var(--theme-stone-400)' }}>
            No activity recorded.
          </p>
        ) : (
          <>
            {scheduled.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--theme-stone-500)' }}>
                  Scheduled Activities
                </p>
                <div className="space-y-2">
                  {scheduled.map((a) => {
                    const typeInfo = TYPE_ICONS[a.activity_type ?? 'Note'] ?? TYPE_ICONS.Note!;
                    const TypeIcon = typeInfo.icon;
                    return (
                      <div
                        key={a.id}
                        className="flex items-start gap-3 p-3 rounded-lg border"
                        style={{
                          borderColor: a.status === 'done' ? 'var(--theme-stone-200)' : 'var(--theme-stone-300)',
                          backgroundColor: a.status === 'done' ? 'var(--theme-stone-50, #fafaf9)' : 'white',
                          opacity: a.status === 'done' ? 0.7 : 1,
                        }}
                      >
                        {a.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--theme-warning, #d97706)' }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <TypeIcon className={`w-3 h-3 ${typeInfo.color}`} />
                            <span className="text-sm font-medium" style={{ color: 'var(--theme-stone-900)' }}>
                              {a.scheduled_date && format(parseISO(`${a.scheduled_date}T00:00:00`), 'M/d/yyyy')}
                            </span>
                            {a.status === 'done' ? (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                Done
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                Pending
                              </Badge>
                            )}
                          </div>
                          {a.content && (
                            <p className="text-xs mt-1 whitespace-pre-wrap" style={{ color: 'var(--theme-stone-600)' }}>
                              <span className="font-medium" style={{ color: 'var(--theme-stone-500)' }}>
                                {a.status === 'done' ? 'Planned: ' : ''}
                              </span>
                              {a.content}
                            </p>
                          )}
                          {a.completion_note && (
                            <p className="text-xs mt-1 whitespace-pre-wrap" style={{ color: 'var(--theme-stone-700)' }}>
                              <span className="font-medium" style={{ color: 'var(--theme-stone-500)' }}>
                                Outcome:{' '}
                              </span>
                              {a.completion_note}
                            </p>
                          )}
                          {a.status === 'done' && a.completed_by && (
                            <p className="text-xs mt-1" style={{ color: 'var(--theme-stone-400)' }}>
                              Completed by {getConsultantName(a.completed_by)}
                              {a.completed_date && ` on ${format(parseISO(a.completed_date), 'M/d/yyyy')}`}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {instant.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--theme-stone-500)' }}>
                  Activity Log
                </p>
                <div className="space-y-2">
                  {instant.map((a) => {
                    const typeInfo = TYPE_ICONS[a.activity_type ?? 'Note'] ?? TYPE_ICONS.Note!;
                    const TypeIcon = typeInfo.icon;
                    const isDoneScheduled = !!a.scheduled_date && a.status === 'done';
                    return (
                      <div
                        key={a.id}
                        className="flex items-start gap-3 p-3 rounded-lg border"
                        style={{ borderColor: 'var(--theme-stone-200)', backgroundColor: 'white' }}
                      >
                        {isDoneScheduled ? (
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
                        ) : (
                          <TypeIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${typeInfo.color}`} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isDoneScheduled && <TypeIcon className={`w-3 h-3 ${typeInfo.color}`} />}
                            <span className="text-sm font-medium" style={{ color: 'var(--theme-stone-900)' }}>
                              {isDoneScheduled
                                ? format(parseISO(`${a.scheduled_date}T00:00:00`), 'M/d/yyyy')
                                : a.date
                                  ? format(parseISO(a.date), 'MMM d, yyyy h:mm a')
                                  : ''}
                            </span>
                            {isDoneScheduled && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                Done
                              </Badge>
                            )}
                            <span className="text-xs" style={{ color: 'var(--theme-stone-500)' }}>
                              {getConsultantName(a.author_id)}
                            </span>
                          </div>
                          {a.content && (
                            <p className="text-xs mt-1 whitespace-pre-wrap" style={{ color: 'var(--theme-stone-600)' }}>
                              {isDoneScheduled && (
                                <span className="font-medium" style={{ color: 'var(--theme-stone-500)' }}>
                                  Planned:{' '}
                                </span>
                              )}
                              {a.content}
                            </p>
                          )}
                          {a.completion_note && (
                            <p className="text-xs mt-1 whitespace-pre-wrap" style={{ color: 'var(--theme-stone-700)' }}>
                              <span className="font-medium" style={{ color: 'var(--theme-stone-500)' }}>
                                Outcome:{' '}
                              </span>
                              {a.completion_note}
                            </p>
                          )}
                          {isDoneScheduled && a.completed_by && (
                            <p className="text-xs mt-1" style={{ color: 'var(--theme-stone-400)' }}>
                              Completed by {getConsultantName(a.completed_by)}
                              {a.completed_date && ` on ${format(parseISO(a.completed_date), 'M/d/yyyy')}`}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {hasMore && (
              <div className="text-center pt-2 pb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  style={{ color: 'var(--theme-brand-primary)' }}
                  onClick={() => setLimit((prev) => prev + HISTORY_PAGE_SIZE)}
                >
                  Load more activities…
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ResponsiveModal>
  );
}
