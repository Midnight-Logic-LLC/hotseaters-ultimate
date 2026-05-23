/**
 * TrialServiceFormSheet — create/edit a TrialService.
 *
 * Mobile-first responsive modal (bottom sheet on small viewports per RULE 4).
 * Form managed by react-hook-form + zod. All mutations go through
 * `useTrialServiceCRUD` — no direct store/PGlite access.
 *
 * Faithful to HotSeatersMVP/src/components/trials/ServiceSelector.jsx and
 * the trial-service section of TrialInfoPanel.jsx.
 *
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
import { Switch } from '@/components/ui/switch';
import { useTrialServiceCRUD } from '@/features/trials/hooks/use-trial-service-crud';
import type { TrialService } from '@/features/trials/entities';

const Schema = z.object({
  service_name: z.string().min(1, 'Required'),
  service_phase: z.string().nullable().optional(),
  custom_description: z.string().nullable().optional(),
  rate_type: z.string().nullable().optional(),
  rate: z
    .union([z.string(), z.number(), z.null()])
    .transform((v) =>
      v === null || v === '' || v === undefined ? null : Number(v),
    )
    .nullable()
    .optional(),
  final_billing_method: z.string().nullable().optional(),
  travel_eligible: z.boolean().default(false),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  estimated_quantity: z
    .union([z.string(), z.number(), z.null()])
    .transform((v) =>
      v === null || v === '' || v === undefined ? null : Number(v),
    )
    .nullable()
    .optional(),
  estimated_total: z
    .union([z.string(), z.number(), z.null()])
    .transform((v) =>
      v === null || v === '' || v === undefined ? null : Number(v),
    )
    .nullable()
    .optional(),
});

type FormValues = z.infer<typeof Schema>;

export interface TrialServiceFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trialId: string;
  companyId: string;
  service?: TrialService | null;
}

export function TrialServiceFormSheet({
  open,
  onOpenChange,
  trialId,
  companyId,
  service,
}: TrialServiceFormSheetProps) {
  const { create, update } = useTrialServiceCRUD();
  const isEdit = !!service;

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema) as Resolver<FormValues>,
    defaultValues: {
      service_name: service?.service_name ?? '',
      service_phase: service?.service_phase ?? '',
      custom_description: service?.custom_description ?? '',
      rate_type: service?.rate_type ?? '',
      rate: service?.rate ?? null,
      final_billing_method: service?.final_billing_method ?? '',
      travel_eligible: service?.travel_eligible ?? false,
      start_date: service?.start_date ?? '',
      end_date: service?.end_date ?? '',
      estimated_quantity: service?.estimated_quantity ?? null,
      estimated_total: service?.estimated_total ?? null,
    },
  });

  useEffect(() => {
    if (open) form.reset();
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (isEdit && service) {
      await update.mutate({ id: service.id, patch: values as Partial<TrialService> });
    } else {
      await create.mutate({
        ...(values as Partial<TrialService>),
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
      title={isEdit ? 'Edit service' : 'Add service'}
    >
      <form onSubmit={onSubmit} className="space-y-3 p-4">
        <div>
          <Label htmlFor="service_name">Service name</Label>
          <Input id="service_name" {...form.register('service_name')} />
          {form.formState.errors.service_name ? (
            <p className="text-xs text-red-600">
              {form.formState.errors.service_name.message}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="rate_type">Rate type</Label>
            <Input id="rate_type" {...form.register('rate_type')} />
          </div>
          <div>
            <Label htmlFor="rate">Rate</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              {...form.register('rate')}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="final_billing_method">Billing method</Label>
          <Input
            id="final_billing_method"
            placeholder="hourly | daily_minimum | split | flat"
            {...form.register('final_billing_method')}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="start_date">Start date</Label>
            <Input id="start_date" type="date" {...form.register('start_date')} />
          </div>
          <div>
            <Label htmlFor="end_date">End date</Label>
            <Input id="end_date" type="date" {...form.register('end_date')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="estimated_quantity">Est. quantity</Label>
            <Input
              id="estimated_quantity"
              type="number"
              step="0.01"
              {...form.register('estimated_quantity')}
            />
          </div>
          <div>
            <Label htmlFor="estimated_total">Est. total</Label>
            <Input
              id="estimated_total"
              type="number"
              step="0.01"
              {...form.register('estimated_total')}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="travel_eligible">Travel eligible</Label>
          <Switch
            id="travel_eligible"
            checked={form.watch('travel_eligible')}
            onCheckedChange={(checked) =>
              form.setValue('travel_eligible', checked)
            }
          />
        </div>
        <div>
          <Label htmlFor="custom_description">Description</Label>
          <Textarea
            id="custom_description"
            {...form.register('custom_description')}
          />
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
