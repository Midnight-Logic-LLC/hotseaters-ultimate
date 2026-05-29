/**
 * inline-sales-activity-form.tsx — port of
 * HotSeatersMVP/src/components/sales/InlineSalesActivityForm.jsx.
 *
 * Unified inline activity form — handles new / edit / complete modes against
 * the `sales_activity` table. When called from the contact context
 * (`attorneyId` set, `trialId` not set) the activity anchors to the
 * Attorney + Client pair; from a deal it also carries `trial_id`.
 *
 * Adaptation (RULE 0/C/D): the bible's two `useMutation`s become direct async
 * calls through `useSalesActivities()` (a hook — RULE B compliant). The
 * Google-Tasks sync the bible fires after each write is a backend automation
 * with no port equivalent (see the TODO markers). Date helpers, status
 * resolution, today-disambiguation buttons, inline validation, and the
 * delete-permission rule are reproduced verbatim.
 *
 * HotSeatersMVP is the bible.
 */

import { useEffect, useState } from 'react';
import {
  Phone, Mail, Users, StickyNote, X, Loader2, Trash2, CheckCircle2,
  CalendarPlus, Calendar as CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

import { useSalesActivities, type SalesActivityRow } from '@/features/deals/hooks/use-sales-activities';
import { isOwnerOrAdmin } from '@/shared/lib/role-mapping';
import {
  formatPickedDateForUtcStorage,
  parseStoredDateForLocalPicker,
} from '@/features/deals/business-rules/activity-date-utils';
import { NoNextStepConfirmModal } from './no-next-step-confirm-modal';
import { CompleteActivitySteps } from './complete-activity-steps';

type ActivityType = 'Call' | 'Email' | 'Meeting' | 'Note';

const ACTIVITY_TYPES: Array<{
  value: ActivityType;
  icon: typeof Phone;
  color: string;
  activeBg: string;
  border: string;
}> = [
  { value: 'Call', icon: Phone, color: 'text-blue-600', activeBg: 'bg-blue-100', border: 'border-blue-300' },
  { value: 'Email', icon: Mail, color: 'text-amber-600', activeBg: 'bg-amber-100', border: 'border-amber-300' },
  { value: 'Meeting', icon: Users, color: 'text-green-600', activeBg: 'bg-green-100', border: 'border-green-300' },
  { value: 'Note', icon: StickyNote, color: 'text-stone-500', activeBg: 'bg-stone-100', border: 'border-stone-300' },
];

export type InlineFormMode = 'new' | 'edit' | 'complete';

export interface InlineFormUser {
  id?: string;
  company_role?: string | null;
}

/**
 * The minimal activity shape the form reads. Both the store's full
 * `SalesActivityRow` and the cards' lean `SalesActivityRow` (deal-card-types)
 * satisfy this, so the form accepts whichever the caller has on hand.
 */
export interface InlineFormActivity {
  id: string;
  activity_type?: string | null;
  scheduled_date?: string | null;
  content?: string | null;
  status?: string | null;
  author_id?: string | null;
  attorney_id?: string | null;
  trial_id?: string | null;
  client_id?: string | null;
  company_id?: string | null;
}

interface InlineSalesActivityFormProps {
  mode: InlineFormMode;
  activity?: InlineFormActivity | null;
  attorneyId?: string | null;
  clientId?: string | null;
  trialId?: string | null;
  companyId?: string | null | undefined;
  userInfo: InlineFormUser | null;
  contactName?: string | undefined;
  onDone?: () => void;
  onCancel?: () => void;
  skipLabel?: string | undefined;
  showActivityTypeLabels?: boolean;
}

export function InlineSalesActivityForm({
  mode,
  activity = null,
  attorneyId,
  clientId,
  trialId,
  companyId,
  userInfo,
  contactName,
  onDone,
  onCancel,
  skipLabel,
  showActivityTypeLabels = false,
}: InlineSalesActivityFormProps) {
  const {
    createSalesActivity,
    updateSalesActivity,
    deleteSalesActivity,
    resolveAnchors,
  } = useSalesActivities();

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [activityType, setActivityType] = useState<ActivityType>('Email');
  const [date, setDate] = useState(todayStr);
  const [content, setContent] = useState('');
  const [completionNote, setCompletionNote] = useState('');

  const [wantsNext, setWantsNext] = useState(false);
  const [nextType, setNextType] = useState<ActivityType>('Email');
  const [nextDate, setNextDate] = useState('');
  const [nextNotes, setNextNotes] = useState('');
  const [showNoNextStepConfirm, setShowNoNextStepConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [nextDateError, setNextDateError] = useState(false);
  const [nextNotesError, setNextNotesError] = useState(false);
  const [newContentError, setNewContentError] = useState(false);

  const [isPending, setIsPending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const attId = attorneyId || activity?.attorney_id || null;
  const tId = trialId || activity?.trial_id || null;

  useEffect(() => {
    if (mode === 'edit' && activity) {
      setActivityType((activity.activity_type as ActivityType) || 'Email');
      setDate(activity.scheduled_date || todayStr);
      setContent(activity.content || '');
    } else if (mode === 'complete') {
      setContent('');
      setCompletionNote('');
      // Default "Schedule a future activity" to ON to prevent stale leads.
      setWantsNext(true);
      setNextDate('');
      setNextNotes('');
      setNextType('Email');
    } else {
      setActivityType('Email');
      setDate(todayStr);
      setContent('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, activity?.id]);

  // Past dates → done. Future → pending. Today → caller picks.
  const resolveStatus = (dateStr: string, intent?: 'log' | 'schedule'): 'done' | 'pending' => {
    if (dateStr < todayStr) return 'done';
    if (dateStr > todayStr) return 'pending';
    return intent === 'schedule' ? 'pending' : 'done';
  };

  const submit = async (intents: { newIntent?: 'log' | 'schedule'; nextIntent?: 'log' | 'schedule' } = {}) => {
    if (!userInfo?.id) return;
    setIsPending(true);
    try {
      if (mode === 'new') {
        const status = resolveStatus(date, intents.newIntent);
        const anchors = await resolveAnchors(attId, clientId);
        await createSalesActivity({
          company_id: companyId ?? null,
          ...anchors,
          trial_id: tId ?? null,
          content: content.trim(),
          activity_type: activityType,
          date: new Date().toISOString(),
          author_id: userInfo.id,
          scheduled_date: date,
          status,
          ...(status === 'done'
            ? { completed_date: new Date().toISOString(), completed_by: userInfo.id }
            : {}),
        });
        // TODO: Google Tasks sync (backend automation, not ported).
      } else if (mode === 'edit') {
        if (!activity) return;
        await updateSalesActivity(activity.id, {
          activity_type: activityType,
          scheduled_date: date,
          content: content.trim(),
        });
        // TODO: Google Tasks sync (backend automation, not ported).
      } else if (mode === 'complete') {
        if (!activity) return;
        const updateData: Partial<SalesActivityRow> = {
          status: 'done',
          completed_date: new Date().toISOString(),
          completed_by: userInfo.id,
        };
        if (completionNote.trim()) updateData.completion_note = completionNote.trim();
        await updateSalesActivity(activity.id, updateData);

        if (wantsNext && nextDate) {
          const anchors = await resolveAnchors(attId, activity.client_id);
          const nextStatus = resolveStatus(nextDate, intents.nextIntent);
          await createSalesActivity({
            company_id: companyId ?? activity.company_id ?? null,
            ...anchors,
            trial_id: activity.trial_id ?? tId ?? null,
            content: nextNotes.trim() || '',
            activity_type: nextType,
            date: new Date().toISOString(),
            author_id: userInfo.id,
            scheduled_date: nextDate,
            status: nextStatus,
            ...(nextStatus === 'done'
              ? { completed_date: new Date().toISOString(), completed_by: userInfo.id }
              : {}),
          });
        }
        // TODO: Google Tasks sync (backend automation, not ported).
      }
      onDone?.();
    } catch (err: unknown) {
      // Surface create/update/anchor failures; do NOT close the form on error.
      toast.error(err instanceof Error ? err.message : 'Failed to save activity.');
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!activity?.id) return;
    setIsDeleting(true);
    try {
      // Bible pre-deletes the Google Task; the port has no Google Tasks sync,
      // so we delete the row directly.
      // TODO: Google Tasks cleanup (backend automation, not ported).
      await deleteSalesActivity(activity.id);
      setShowDeleteConfirm(false);
      onDone?.();
    } finally {
      setIsDeleting(false);
    }
  };

  const canSubmitEdit = (): boolean => !!date;

  const validateNextStep = (): boolean => {
    if (!wantsNext) return true;
    const missingDate = !nextDate;
    const missingNotes = !nextNotes.trim();
    setNextDateError(missingDate);
    setNextNotesError(missingNotes);
    return !missingDate && !missingNotes;
  };

  const validateNew = (): boolean => {
    const missingContent = !content.trim();
    setNewContentError(missingContent);
    return !!date && !missingContent;
  };

  const handleNewSubmit = (intent: 'log' | 'schedule') => {
    if (!validateNew()) return;
    void submit({ newIntent: intent });
  };

  const handleCompleteSubmit = (nextIntent?: 'log' | 'schedule') => {
    if (!wantsNext) {
      setShowNoNextStepConfirm(true);
      return;
    }
    if (!validateNextStep()) return;
    void submit(nextIntent ? { nextIntent } : {});
  };

  const isFutureDate = date > todayStr;
  const isPastDate = date < todayStr;
  const isTodayDate = date === todayStr;
  const isNextFutureDate = nextDate > todayStr;
  const isNextPastDate = !!nextDate && nextDate < todayStr;
  const isNextTodayDate = nextDate === todayStr;

  const renderTypePicker = (
    selected: ActivityType,
    onSelect: (t: ActivityType) => void,
    compact: boolean,
  ) => (
    <div className="flex gap-1 flex-wrap items-center">
      {ACTIVITY_TYPES.map((t) => {
        const Icon = t.icon;
        const isActive = selected === t.value;
        if (compact) {
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onSelect(t.value)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
                isActive
                  ? `${t.activeBg} ${t.border} ${t.color}`
                  : 'bg-white border-transparent text-stone-400 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-3 h-3" />
              {isActive && <span>{t.value}</span>}
            </button>
          );
        }
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onSelect(t.value)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
              isActive
                ? `${t.activeBg} ${t.border} ${t.color}`
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
            title={t.value}
          >
            <Icon className="w-3.5 h-3.5" />
            {showActivityTypeLabels && <span className="hidden sm:inline">{t.value}</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-2 p-2.5">
      {mode !== 'complete' && (
        <div className="flex gap-1 flex-wrap items-center">
          {renderTypePicker(activityType, setActivityType, false)}
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className="text-xs h-8 w-32 flex-shrink-0 ml-auto px-2 justify-between"
                  style={{
                    borderRadius: 'var(--theme-input-radius)',
                    borderWidth: 'var(--theme-input-border)',
                    backgroundColor: 'var(--theme-input-bg)',
                    color: 'var(--theme-stone-700)',
                  }}
                >
                  <span>{date}</span>
                  <CalendarIcon className="w-3.5 h-3.5" />
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                {...(() => {
                  const sel = parseStoredDateForLocalPicker(date);
                  return sel ? { selected: sel } : {};
                })()}
                onSelect={(selectedDate) => {
                  if (selectedDate) setDate(formatPickedDateForUtcStorage(selectedDate));
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {mode !== 'complete' && (
        <>
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setNewContentError(false);
            }}
            placeholder="Notes..."
            rows={2}
            autoFocus
            className="text-xs"
            style={{
              borderRadius: 'var(--theme-input-radius)',
              borderWidth: 'var(--theme-input-border)',
              backgroundColor: 'var(--theme-input-bg)',
              borderColor: newContentError ? '#dc2626' : undefined,
            }}
          />
          {newContentError && (
            <p className="text-[11px]" style={{ color: '#dc2626' }}>
              Add a note for this activity.
            </p>
          )}
        </>
      )}

      {mode === 'complete' && (
        <CompleteActivitySteps
          plannedContent={activity?.content}
          completionNote={completionNote}
          onCompletionNoteChange={setCompletionNote}
          wantsNext={wantsNext}
          onWantsNextChange={setWantsNext}
          nextType={nextType}
          onNextTypeChange={setNextType}
          nextDate={nextDate}
          onNextDateChange={setNextDate}
          nextNotes={nextNotes}
          onNextNotesChange={setNextNotes}
          nextDateError={nextDateError}
          onNextDateErrorChange={setNextDateError}
          nextNotesError={nextNotesError}
          onNextNotesErrorChange={setNextNotesError}
          renderTypePicker={renderTypePicker}
        />
      )}

      {/* Submit area — varies by mode + selected date */}
      <div className="flex items-center gap-1.5 pt-1 flex-wrap">
        {mode === 'edit' && activity?.id && (() => {
          const isCompleted = activity.status === 'done';
          const ownerOrAdmin = isOwnerOrAdmin(userInfo?.company_role);
          const isAuthor = activity.author_id === userInfo?.id;
          const canDelete = isCompleted ? ownerOrAdmin : isAuthor || ownerOrAdmin;
          if (!canDelete) return null;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-7 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={isPending || isDeleting}
            >
              <Trash2 className="w-3 h-3 mr-1" /> Delete
            </Button>
          );
        })()}

        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-7 text-xs px-2 mr-auto"
            style={{ color: 'var(--theme-stone-500)' }}
          >
            <X className="w-3 h-3 mr-1" /> Cancel
          </Button>
        )}

        {mode === 'edit' && (
          <Button
            size="sm"
            onClick={() => {
              if (canSubmitEdit()) void submit();
            }}
            disabled={!canSubmitEdit() || isPending}
            className="h-7 text-xs px-3 hover:opacity-90"
            style={{
              backgroundColor: 'var(--theme-brand-primary)',
              color: 'white',
              borderRadius: 'var(--theme-button-radius)',
            }}
          >
            {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        )}

        {mode === 'new' && (
          <>
            {skipLabel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isPending}
                className="h-7 text-xs px-2 mr-auto"
                style={{ color: 'var(--theme-stone-500)' }}
              >
                {skipLabel}
              </Button>
            )}
            {(isPastDate || isTodayDate) && (
              <Button
                size="sm"
                onClick={() => handleNewSubmit('log')}
                disabled={isPending}
                className="h-7 text-xs px-2 hover:opacity-90"
                style={{
                  backgroundColor: 'var(--theme-brand-primary)',
                  color: 'white',
                  borderRadius: 'var(--theme-button-radius)',
                }}
              >
                {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Log
              </Button>
            )}
            {(isFutureDate || isTodayDate) && (
              <Button
                size="sm"
                onClick={() => handleNewSubmit('schedule')}
                disabled={isPending}
                className="h-7 text-xs px-2 hover:opacity-90"
                style={{
                  backgroundColor: 'var(--theme-brand-primary)',
                  color: 'white',
                  borderRadius: 'var(--theme-button-radius)',
                }}
              >
                {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                <CalendarPlus className="w-3 h-3 mr-1" />
                Schedule
              </Button>
            )}
          </>
        )}

        {mode === 'complete' && (
          <>
            {!wantsNext && (
              <Button
                size="sm"
                onClick={() => handleCompleteSubmit()}
                disabled={isPending}
                className="h-7 text-xs px-3 hover:opacity-90"
                style={{ backgroundColor: '#16a34a', color: 'white', borderRadius: 'var(--theme-button-radius)' }}
              >
                {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Mark Done
              </Button>
            )}
            {wantsNext && isNextPastDate && (
              <Button
                size="sm"
                onClick={() => handleCompleteSubmit('log')}
                disabled={isPending}
                className="h-7 text-xs px-3 hover:opacity-90"
                style={{ backgroundColor: '#16a34a', color: 'white', borderRadius: 'var(--theme-button-radius)' }}
              >
                {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Mark Done + Log
              </Button>
            )}
            {wantsNext && isNextFutureDate && (
              <Button
                size="sm"
                onClick={() => handleCompleteSubmit('schedule')}
                disabled={isPending}
                className="h-7 text-xs px-3 hover:opacity-90"
                style={{ backgroundColor: '#16a34a', color: 'white', borderRadius: 'var(--theme-button-radius)' }}
              >
                {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Mark Done + Schedule
              </Button>
            )}
            {wantsNext && isNextTodayDate && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleCompleteSubmit('log')}
                  disabled={isPending}
                  className="h-7 text-xs px-3 hover:opacity-90"
                  style={{ backgroundColor: '#16a34a', color: 'white', borderRadius: 'var(--theme-button-radius)' }}
                >
                  {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                  Mark Done + Log Today
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleCompleteSubmit('schedule')}
                  disabled={isPending}
                  className="h-7 text-xs px-3 hover:opacity-90"
                  style={{ backgroundColor: '#16a34a', color: 'white', borderRadius: 'var(--theme-button-radius)' }}
                >
                  {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                  Mark Done + Schedule Today
                </Button>
              </>
            )}
            {wantsNext && !nextDate && (
              <Button
                size="sm"
                onClick={() => handleCompleteSubmit('schedule')}
                disabled={isPending}
                className="h-7 text-xs px-3 hover:opacity-90"
                style={{ backgroundColor: '#16a34a', color: 'white', borderRadius: 'var(--theme-button-radius)' }}
              >
                {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Mark Done + Schedule
              </Button>
            )}
          </>
        )}
      </div>

      <NoNextStepConfirmModal
        open={showNoNextStepConfirm}
        onOpenChange={setShowNoNextStepConfirm}
        contactName={contactName}
        onScheduleNext={() => setWantsNext(true)}
        onContinueAnyway={() => void submit({})}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this activity from the history. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
