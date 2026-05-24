/**
 * TrialEditPage — full-form edit. MVP keeps in-place tab editing as primary,
 * but exposes a "wizard"-style edit page; this is the v0.1 equivalent.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTrial } from '@/features/trials/hooks/use-trial';
import { useTrialCRUD } from '@/features/trials/hooks/use-trial-crud';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { Trial } from '@/features/trials/entities';

const Schema = z.object({
  case_name: z.string().nullable().optional(),
  case_number: z.string().nullable().optional(),
  case_type: z.string().nullable().optional(),
  side: z.string().nullable().optional(),
  judge: z.string().nullable().optional(),
  courthouse: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  estimated_value: z
    .union([z.string(), z.number(), z.null()])
    .transform((v) =>
      v === null || v === '' || v === undefined ? null : Number(v),
    )
    .nullable()
    .optional(),
  retainer_value: z
    .union([z.string(), z.number(), z.null()])
    .transform((v) =>
      v === null || v === '' || v === undefined ? null : Number(v),
    )
    .nullable()
    .optional(),
  daily_minimum_hours: z
    .union([z.string(), z.number(), z.null()])
    .transform((v) =>
      v === null || v === '' || v === undefined ? null : Number(v),
    )
    .nullable()
    .optional(),
  bill_for_weekends: z.boolean().default(false),
  notes: z.string().nullable().optional(),
});
type FormValues = z.infer<typeof Schema>;

export function TrialEditPage() {
  const { trialId } = useParams<{ trialId: string }>();
  const navigate = useNavigate();
  const { data: trial } = useTrial(trialId);
  const { update } = useTrialCRUD();

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema) as Resolver<FormValues>,
    defaultValues: {
      case_name: trial?.case_name ?? '',
      case_number: trial?.case_number ?? '',
      case_type: trial?.case_type ?? '',
      side: trial?.side ?? '',
      judge: trial?.judge ?? '',
      courthouse: trial?.courthouse ?? '',
      city: trial?.city ?? '',
      state: trial?.state ?? '',
      start_date: trial?.start_date ?? '',
      end_date: trial?.end_date ?? '',
      estimated_value: trial?.estimated_value ?? null,
      retainer_value: trial?.retainer_value ?? null,
      daily_minimum_hours: trial?.daily_minimum_hours ?? null,
      bill_for_weekends: trial?.bill_for_weekends ?? false,
      notes: trial?.notes ?? '',
    },
  });

  useEffect(() => {
    if (trial) {
      form.reset({
        case_name: trial.case_name ?? '',
        case_number: trial.case_number ?? '',
        case_type: trial.case_type ?? '',
        side: trial.side ?? '',
        judge: trial.judge ?? '',
        courthouse: trial.courthouse ?? '',
        city: trial.city ?? '',
        state: trial.state ?? '',
        start_date: trial.start_date ?? '',
        end_date: trial.end_date ?? '',
        estimated_value: trial.estimated_value ?? null,
        retainer_value: trial.retainer_value ?? null,
        daily_minimum_hours: trial.daily_minimum_hours ?? null,
        bill_for_weekends: trial.bill_for_weekends ?? false,
        notes: trial.notes ?? '',
      });
    }
  }, [trial, form]);

  if (!trial) {
    return <p className="p-6 text-sm text-stone-500">Loading trial…</p>;
  }

  const onSubmit = form.handleSubmit(async (values) => {
    await update.mutate({
      id: trial.id,
      patch: values as Partial<Trial>,
    });
    navigate(`/trials/${trial.id}`);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Edit trial</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="case_name">Case name</Label>
          <Input id="case_name" {...form.register('case_name')} />
        </div>
        <div>
          <Label htmlFor="case_number">Case number</Label>
          <Input id="case_number" {...form.register('case_number')} />
        </div>
        <div>
          <Label htmlFor="case_type">Type</Label>
          <Input id="case_type" {...form.register('case_type')} />
        </div>
        <div>
          <Label htmlFor="side">Side</Label>
          <Input id="side" {...form.register('side')} />
        </div>
        <div>
          <Label htmlFor="judge">Judge</Label>
          <Input id="judge" {...form.register('judge')} />
        </div>
        <div>
          <Label htmlFor="courthouse">Courthouse</Label>
          <Input id="courthouse" {...form.register('courthouse')} />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" {...form.register('city')} />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input id="state" {...form.register('state')} />
        </div>
        <div>
          <Label htmlFor="start_date">Start</Label>
          <Input id="start_date" type="date" {...form.register('start_date')} />
        </div>
        <div>
          <Label htmlFor="end_date">End</Label>
          <Input id="end_date" type="date" {...form.register('end_date')} />
        </div>
        <div>
          <Label htmlFor="estimated_value">Estimated value</Label>
          <Input
            id="estimated_value"
            type="number"
            step="0.01"
            {...form.register('estimated_value')}
          />
        </div>
        <div>
          <Label htmlFor="retainer_value">Retainer</Label>
          <Input
            id="retainer_value"
            type="number"
            step="0.01"
            {...form.register('retainer_value')}
          />
        </div>
        <div>
          <Label htmlFor="daily_minimum_hours">Daily min hours</Label>
          <Input
            id="daily_minimum_hours"
            type="number"
            step="0.25"
            {...form.register('daily_minimum_hours')}
          />
        </div>
        <div className="flex items-center justify-between pt-6">
          <Label htmlFor="bill_for_weekends">Bill weekends</Label>
          <Switch
            id="bill_for_weekends"
            checked={form.watch('bill_for_weekends')}
            onCheckedChange={(checked) =>
              form.setValue('bill_for_weekends', checked)
            }
          />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...form.register('notes')} />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate(`/trials/${trial.id}`)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  );
}

export default TrialEditPage;
