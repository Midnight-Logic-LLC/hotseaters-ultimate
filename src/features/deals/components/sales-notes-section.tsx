/**
 * sales-notes-section.tsx — port of
 * HotSeatersMVP/src/components/sales/SalesNotesSection.jsx.
 *
 * Compact activity zone for the contact form: shows the next scheduled activity
 * (with mark-done + edit controls), an inline activity form, and a toolbar with
 * History + Add. Full history opens in the side panel.
 *
 * Adaptation (RULE 0/C): the bible reads activities via react-query; the port
 * consumes `useSalesActivities()` and filters to this attorney's activities
 * client-side. The inline form + history dialog + toolbar are the ported
 * components. HotSeatersMVP is the bible.
 */

import { useMemo, useState } from 'react';
import {
  Phone, Mail, CalendarDays, StickyNote, CheckCircle2, Pencil, AlertTriangle,
} from 'lucide-react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useSalesActivities } from '@/features/deals/hooks/use-sales-activities';
import { InlineSalesActivityForm, type InlineFormMode, type InlineFormUser } from './inline-sales-activity-form';
import { ActivityToolbar } from './activity-toolbar';
import { SalesActivityHistoryDialog, type HistoryConsultant } from './sales-activity-history-dialog';

const ACTIVITY_TYPE_ICONS: Record<string, { icon: typeof Phone; color: string }> = {
  Call: { icon: Phone, color: 'text-blue-600' },
  Email: { icon: Mail, color: 'text-amber-600' },
  Meeting: { icon: CalendarDays, color: 'text-green-600' },
  Note: { icon: StickyNote, color: 'text-stone-500' },
};

interface SalesNotesSectionProps {
  attorneyId?: string | null;
  companyId?: string | null;
  userInfo: InlineFormUser | null;
  consultants?: HistoryConsultant[];
}

export function SalesNotesSection({
  attorneyId,
  companyId,
  userInfo,
  consultants = [],
}: SalesNotesSectionProps) {
  const { salesActivities } = useSalesActivities();
  const [inlineFormMode, setInlineFormMode] = useState<InlineFormMode | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const activities = useMemo(
    () => (attorneyId ? salesActivities.filter((a) => a.attorney_id === attorneyId) : []),
    [salesActivities, attorneyId],
  );

  const pending = activities
    .filter((a) => a.status === 'pending' && a.scheduled_date)
    .sort((a, b) => (a.scheduled_date ?? '').localeCompare(b.scheduled_date ?? ''));
  const nextActivity = pending[0] ?? null;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const fuDate = nextActivity?.scheduled_date ?? null;
  const isOverdue = !!fuDate && fuDate < todayStr;
  const isDueToday = fuDate === todayStr;

  const getDaysLabel = (): string | null => {
    if (!fuDate) return null;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(`${fuDate}T00:00:00`);
    const diff = differenceInCalendarDays(target, today);
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Today';
    return `in ${diff}d`;
  };

  const handleFormDone = () => setInlineFormMode(null);

  if (!attorneyId) {
    return (
      <p
        className="text-center py-3 italic"
        style={{ color: 'var(--theme-stone-400)', fontSize: 'var(--theme-text-caption)' }}
      >
        Add a contact first to log activity.
      </p>
    );
  }

  const actInfo = nextActivity
    ? ACTIVITY_TYPE_ICONS[nextActivity.activity_type ?? 'Note'] ?? ACTIVITY_TYPE_ICONS.Note!
    : null;
  const ActIcon = actInfo?.icon;
  const daysLabel = getDaysLabel();

  return (
    <>
      <div
        className="rounded-lg overflow-hidden"
        style={{
          border: `1px solid ${isOverdue ? '#fca5a5' : isDueToday ? '#f87171' : 'var(--theme-stone-200)'}`,
          backgroundColor: isOverdue
            ? 'color-mix(in srgb, #dc2626 4%, white)'
            : isDueToday
              ? 'color-mix(in srgb, #ef4444 6%, white)'
              : 'color-mix(in srgb, var(--theme-brand-primary) 3%, white)',
        }}
      >
        {inlineFormMode !== 'edit' &&
          inlineFormMode !== 'complete' &&
          (nextActivity ? (
            <div className="p-2.5 flex items-start gap-2.5">
              <div className="flex-shrink-0 mt-0.5">
                {ActIcon && <ActIcon className={`w-4 h-4 ${actInfo?.color ?? 'text-stone-500'}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-xs font-semibold ${isOverdue ? 'text-red-700' : isDueToday ? 'text-red-600' : ''}`}
                    style={{ color: !isOverdue && !isDueToday ? 'var(--theme-stone-800)' : undefined }}
                  >
                    {nextActivity.activity_type} —{' '}
                    {fuDate && format(parseISO(`${fuDate}T00:00:00`), 'MMM d, yyyy')}
                  </span>
                  {daysLabel && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        isOverdue
                          ? 'bg-red-100 text-red-700'
                          : isDueToday
                            ? 'bg-red-100 text-red-600'
                            : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {daysLabel}
                    </span>
                  )}
                </div>
                {nextActivity.content && (
                  <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: 'var(--theme-stone-600)' }}>
                    {nextActivity.content}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:opacity-90 transition-opacity"
                          onClick={() => setInlineFormMode('complete')}
                          style={{
                            borderRadius: 'var(--theme-button-radius)',
                            backgroundColor: 'var(--theme-success)',
                            border: '0.5px solid var(--theme-success)',
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </Button>
                      }
                    />
                    <TooltipContent>Mark done</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-stone-50 bg-white"
                          onClick={() => setInlineFormMode('edit')}
                          style={{
                            borderRadius: 'var(--theme-button-radius)',
                            color: 'var(--theme-stone-400)',
                            border: '0.5px solid var(--theme-stone-200)',
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      }
                    />
                    <TooltipContent>Edit activity</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ) : (
            inlineFormMode !== 'new' && (
              <div className="flex items-center gap-1.5 px-2.5 py-2">
                <AlertTriangle className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-xs font-medium" style={{ color: 'var(--theme-stone-500)' }}>
                  No upcoming activity
                </span>
              </div>
            )
          ))}

        {inlineFormMode === 'new' && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5"
            style={{
              borderTop: `1px solid var(--theme-stone-200)`,
              borderBottom: `1px solid var(--theme-stone-200)`,
              backgroundColor: 'var(--theme-stone-100)',
            }}
          >
            <CalendarDays className="w-3 h-3" style={{ color: 'var(--theme-stone-400)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--theme-stone-500)' }}>
              Log New Activity
            </span>
          </div>
        )}

        {inlineFormMode && (
          <InlineSalesActivityForm
            mode={inlineFormMode}
            activity={inlineFormMode !== 'new' ? nextActivity : null}
            attorneyId={attorneyId}
            companyId={companyId}
            userInfo={userInfo}
            onDone={handleFormDone}
            onCancel={() => setInlineFormMode(null)}
          />
        )}

        {!inlineFormMode && (
          <ActivityToolbar
            isOverdue={isOverdue}
            isDueToday={isDueToday}
            activityCount={activities.length}
            onAddActivity={() => setInlineFormMode('new')}
            onShowHistory={() => setShowHistory(true)}
          />
        )}
      </div>

      <SalesActivityHistoryDialog
        open={showHistory}
        onOpenChange={setShowHistory}
        attorneyId={attorneyId}
        consultants={consultants}
      />
    </>
  );
}
