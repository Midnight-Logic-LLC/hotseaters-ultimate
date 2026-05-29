/**
 * complete-activity-steps.tsx — the complete-mode two-step body of
 * InlineSalesActivityForm.
 *
 * Extracted verbatim from inline-sales-activity-form.tsx (RULE A file-size
 * split). Renders Step 1 ("What happened?" — the planned-note recap +
 * completion note) and Step 2 ("What's next?" — the optional next-step
 * scheduler with type picker, quick-pick chips, date popover, and notes).
 * Behaviour is identical to the inline original; all state lives in the parent
 * and is threaded through props.
 *
 * HotSeatersMVP is the bible.
 */

import type { ReactNode } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import {
  formatPickedDateForUtcStorage,
  parseStoredDateForLocalPicker,
} from '@/features/deals/business-rules/activity-date-utils';
import { QuickPickDateChips } from './quick-pick-date-chips';

type ActivityType = 'Call' | 'Email' | 'Meeting' | 'Note';

interface CompleteActivityStepsProps {
  plannedContent?: string | null | undefined;
  completionNote: string;
  onCompletionNoteChange: (value: string) => void;
  wantsNext: boolean;
  onWantsNextChange: (value: boolean) => void;
  nextType: ActivityType;
  onNextTypeChange: (value: ActivityType) => void;
  nextDate: string;
  onNextDateChange: (value: string) => void;
  nextNotes: string;
  onNextNotesChange: (value: string) => void;
  nextDateError: boolean;
  onNextDateErrorChange: (value: boolean) => void;
  nextNotesError: boolean;
  onNextNotesErrorChange: (value: boolean) => void;
  renderTypePicker: (
    selected: ActivityType,
    onSelect: (t: ActivityType) => void,
    compact: boolean,
  ) => ReactNode;
}

export function CompleteActivitySteps({
  plannedContent,
  completionNote,
  onCompletionNoteChange,
  wantsNext,
  onWantsNextChange,
  nextType,
  onNextTypeChange,
  nextDate,
  onNextDateChange,
  nextNotes,
  onNextNotesChange,
  nextDateError,
  onNextDateErrorChange,
  nextNotesError,
  onNextNotesErrorChange,
  renderTypePicker,
}: CompleteActivityStepsProps) {
  return (
    <div className="space-y-2">
      {/* Step 1 — What happened? */}
      <div className="flex gap-2">
        <div className="flex-col items-center pt-0.5 hidden sm:flex">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
          >
            1
          </div>
          {wantsNext && (
            <div className="w-px flex-1 mt-1" style={{ backgroundColor: 'var(--theme-stone-200)' }} />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 sm:hidden"
              style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
            >
              1
            </div>
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--theme-stone-500)' }}
            >
              What happened?
            </span>
          </div>
          {plannedContent && (
            <div
              className="text-xs px-2.5 py-2 rounded-md border-l-2 italic"
              style={{
                borderColor: 'var(--theme-stone-300)',
                backgroundColor: 'var(--theme-stone-50, #fafaf9)',
                color: 'var(--theme-stone-600)',
              }}
            >
              <span className="not-italic font-medium" style={{ color: 'var(--theme-stone-500)' }}>
                Planned:{' '}
              </span>
              {plannedContent}
            </div>
          )}
          <Textarea
            value={completionNote}
            onChange={(e) => onCompletionNoteChange(e.target.value)}
            placeholder="Notes on what happened (optional)..."
            rows={2}
            autoFocus
            className="text-xs"
            style={{
              borderRadius: 'var(--theme-input-radius)',
              borderWidth: 'var(--theme-input-border)',
              backgroundColor: 'var(--theme-input-bg)',
            }}
          />
        </div>
      </div>

      {/* Step 2 — What's next? */}
      <div className="flex gap-2">
        <div className="flex-col items-center pt-0.5 hidden sm:flex">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{
              backgroundColor: wantsNext ? 'var(--theme-brand-primary)' : 'var(--theme-stone-300)',
              color: 'white',
            }}
          >
            2
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 sm:hidden"
                style={{
                  backgroundColor: wantsNext ? 'var(--theme-brand-primary)' : 'var(--theme-stone-300)',
                  color: 'white',
                }}
              >
                2
              </div>
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--theme-stone-500)' }}
              >
                What&apos;s next?
              </span>
            </div>
            {wantsNext ? (
              <button
                type="button"
                onClick={() => {
                  onWantsNextChange(false);
                  onNextDateErrorChange(false);
                  onNextNotesErrorChange(false);
                }}
                className="text-[11px] underline hover:no-underline"
                style={{ color: 'var(--theme-stone-500)' }}
              >
                Skip — no next step
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onWantsNextChange(true)}
                className="text-[11px] underline hover:no-underline"
                style={{ color: 'var(--theme-brand-primary)' }}
              >
                + Schedule next step
              </button>
            )}
          </div>
          {wantsNext && (
            <div className="space-y-1.5">
              {renderTypePicker(nextType, onNextTypeChange, true)}
              <QuickPickDateChips
                value={nextDate}
                onPick={(v) => {
                  onNextDateChange(v);
                  onNextDateErrorChange(false);
                }}
              />
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className="text-xs h-8 w-32 px-2 justify-between"
                      style={{
                        borderRadius: 'var(--theme-input-radius)',
                        borderWidth: 'var(--theme-input-border)',
                        backgroundColor: 'var(--theme-input-bg)',
                        borderColor: nextDateError ? '#dc2626' : undefined,
                        color: nextDate ? 'var(--theme-stone-700)' : 'var(--theme-stone-400)',
                      }}
                    >
                      <span>{nextDate || 'Pick date'}</span>
                      <CalendarIcon className="w-3.5 h-3.5" />
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    {...(() => {
                      const sel = parseStoredDateForLocalPicker(nextDate);
                      return sel ? { selected: sel } : {};
                    })()}
                    onSelect={(selectedDate) => {
                      if (selectedDate) {
                        onNextDateChange(formatPickedDateForUtcStorage(selectedDate));
                        onNextDateErrorChange(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
              {nextDateError && (
                <p className="text-[11px]" style={{ color: '#dc2626' }}>
                  Pick a date for the next step.
                </p>
              )}
              <Textarea
                value={nextNotes}
                onChange={(e) => {
                  onNextNotesChange(e.target.value);
                  onNextNotesErrorChange(false);
                }}
                placeholder="Next step notes..."
                rows={2}
                className="text-xs"
                style={{
                  borderRadius: 'var(--theme-input-radius)',
                  borderWidth: 'var(--theme-input-border)',
                  backgroundColor: 'var(--theme-input-bg)',
                  borderColor: nextNotesError ? '#dc2626' : undefined,
                }}
              />
              {nextNotesError && (
                <p className="text-[11px]" style={{ color: '#dc2626' }}>
                  Add a note for the next step.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
