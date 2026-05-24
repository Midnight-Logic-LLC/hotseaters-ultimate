/**
 * TrialSegmentsPanel — segments listing for a trial.
 * Uses business-rules/trial-segment-utils to render active windows.
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTrialSegments } from '@/features/trials/hooks/use-trial-segments';
import { useTrialSegmentCRUD } from '@/features/trials/hooks/use-trial-segment-crud';
import { TrialSegmentFormSheet } from './trial-segment-form-sheet';
import {
  getTotalActiveTrialDays,
  hasMultipleSegments,
} from '@/features/trials/business-rules/trial-segment-utils';
import type { TrialSegment, Trial } from '@/features/trials/entities';

export interface TrialSegmentsPanelProps {
  trial: Trial;
  canEdit: boolean;
}

export function TrialSegmentsPanel({ trial, canEdit }: TrialSegmentsPanelProps) {
  const { items: segments, isLoading } = useTrialSegments(trial.id);
  const { remove } = useTrialSegmentCRUD();
  const [editing, setEditing] = useState<TrialSegment | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return <p className="p-4 text-sm text-stone-500">Loading segments…</p>;
  }

  const totalDays = getTotalActiveTrialDays(trial, segments);

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Segments</h2>
          <p className="text-xs text-stone-500">
            {hasMultipleSegments(segments)
              ? `${segments.length} segments • ${totalDays} active days total`
              : 'Single span'}
          </p>
        </div>
        {canEdit ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setIsOpen(true);
            }}
          >
            <Plus className="mr-1 size-4" /> Add segment
          </Button>
        ) : null}
      </header>

      {segments.length === 0 ? (
        <p className="text-sm text-stone-500">
          No segments defined — billing uses trial bookends.
        </p>
      ) : (
        <ul className="space-y-2">
          {[...segments]
            .sort(
              (a, b) =>
                (a.segment_number ?? 0) - (b.segment_number ?? 0),
            )
            .map((s) => (
              <Card key={s.id} className="flex items-start justify-between p-3">
                <div className="space-y-1">
                  <div className="font-medium">
                    #{s.segment_number ?? '?'} —{' '}
                    {s.label ?? `Segment ${s.segment_number ?? ''}`}
                  </div>
                  <div className="text-xs text-stone-500">
                    {s.start_date ?? '?'} → {s.end_date ?? '?'}
                  </div>
                  {s.notes ? (
                    <p className="text-xs text-stone-600">{s.notes}</p>
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
        <TrialSegmentFormSheet
          open={isOpen}
          onOpenChange={setIsOpen}
          trialId={trial.id}
          companyId={trial.company_id}
          segment={editing}
        />
      ) : null}
    </section>
  );
}
