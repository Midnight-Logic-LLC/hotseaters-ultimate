/**
 * TrialSegmentFormSheet — create/edit a TrialSegment.
 * Mirrors HotSeatersMVP/src/components/trials/TrialSegmentsSection.jsx.
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTrialSegmentCRUD } from '@/features/trials/hooks/use-trial-segment-crud';
import type { TrialSegment } from '@/features/trials/entities';

const Schema = z.object({
  segment_number: z
    .union([z.string(), z.number()])
    .transform((v) =>
      v === '' || v === null || v === undefined ? null : Number(v),
    ),
  label: z.string().nullable().optional(),
  start_date: z.string().min(1, 'Required'),
  end_date: z.string().min(1, 'Required'),
  notes: z.string().nullable().optional(),
});
type FormValues = z.infer<typeof Schema>;

export interface TrialSegmentFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trialId: string;
  companyId: string;
  segment?: TrialSegment | null;
}

export function TrialSegmentFormSheet({
  open,
  onOpenChange,
  trialId,
  companyId,
  segment,
}: TrialSegmentFormSheetProps) {
  const { create, update } = useTrialSegmentCRUD();
  const isEdit = !!segment;

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema) as Resolver<FormValues>,
    defaultValues: {
      segment_number: segment?.segment_number ?? 1,
      label: segment?.label ?? '',
      start_date: segment?.start_date ?? '',
      end_date: segment?.end_date ?? '',
      notes: segment?.notes ?? '',
    },
  });

  useEffect(() => {
    if (open) form.reset();
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (isEdit && segment) {
      await update.mutate({
        id: segment.id,
        patch: values as Partial<TrialSegment>,
      });
    } else {
      await create.mutate({
        ...(values as Partial<TrialSegment>),
        company_id: companyId,
        trial_id: trialId,
      });
    }
    onOpenChange(false);
  });

  return (
    <ResponsiveModal
      open={open}
      onClose={() => onOpenChange(false)}
      title={isEdit ? 'Edit segment' : 'Add segment'}
    >
      <form onSubmit={onSubmit} className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="segment_number">Segment #</Label>
            <Input
              id="segment_number"
              type="number"
              {...form.register('segment_number')}
            />
          </div>
          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              placeholder="Original / Continuation / …"
              {...form.register('label')}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="start_date">Start</Label>
            <Input id="start_date" type="date" {...form.register('start_date')} />
            {form.formState.errors.start_date ? (
              <p className="text-xs text-red-600">
                {form.formState.errors.start_date.message}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="end_date">End</Label>
            <Input id="end_date" type="date" {...form.register('end_date')} />
            {form.formState.errors.end_date ? (
              <p className="text-xs text-red-600">
                {form.formState.errors.end_date.message}
              </p>
            ) : null}
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" {...form.register('notes')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
