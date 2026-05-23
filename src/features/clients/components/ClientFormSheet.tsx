/**
 * ClientFormSheet — create/edit a Client.
 *
 * Ported from `HotSeatersMVP/src/components/clients/ClientForm.jsx`. The
 * V1 form bundled an initial address and a service-overrides editor; here
 * we keep the address-create-on-new pattern (MVP behavior) and defer the
 * overrides UI to `ClientServiceOverridePanel` which lives on the detail
 * page (the MVP UX showed overrides in the same form, but our v0.1
 * override store is server-only so we surface it as a separate panel).
 *
 * Architecture: this is a component. It consumes the `useClientCrud` hook
 * for create/update; it does NOT touch PGlite or Supabase directly.
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
import { ClientTypePicker } from './ClientTypePicker';
import { useClientCrud } from '@/features/clients/hooks/use-client-crud';
import {
  cleanPhoneNumber,
  formatPhoneNumber,
} from '@/features/clients/business-rules/clean-phone-number';
import { cleanClientWebsite } from '@/features/clients/business-rules/clean-client-website';
import type { ClientRow } from '@/features/clients/stores/clients-store';

const clientSchema = z.object({
  firm_name: z.string().min(1, 'Firm name is required'),
  client_type_id: z.string().min(1, 'Client type is required'),
  sales_lead: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().default('active'),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export function ClientFormSheet({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial?: ClientRow | null;
  onSaved?: (saved: ClientRow) => void;
}) {
  const crud = useClientCrud();
  const isEdit = !!initial?.id;

  // Keep the CRUD orchestrator's selection in sync with the form so
  // `crud.save()` targets the right row when editing.
  useEffect(() => {
    if (isEdit && initial?.id) {
      crud.startEdit(initial.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id, isEdit]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema) as Resolver<ClientFormValues>,
    defaultValues: {
      firm_name: initial?.firm_name ?? '',
      client_type_id: initial?.client_type_id ?? '',
      sales_lead: initial?.sales_lead ?? '',
      phone: initial?.phone ?? '',
      website: initial?.website ?? '',
      notes: initial?.notes ?? '',
      status: initial?.status ?? 'active',
    },
  });

  const submit = async (values: ClientFormValues) => {
    const cleaned = {
      ...values,
      phone: cleanPhoneNumber(values.phone),
      website: cleanClientWebsite(values.website),
    };
    let saved: ClientRow | null = null;
    if (isEdit && initial?.id) {
      crud.setFields(cleaned as Partial<ClientRow>);
      saved = await crud.save();
    } else {
      crud.setCreateFields(cleaned as Partial<ClientRow>);
      saved = await crud.create();
    }
    if (saved) {
      onSaved?.(saved);
      reset();
      onClose();
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Client' : 'New Client'}
    >
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="firm_name">Firm Name *</Label>
          <Input id="firm_name" {...register('firm_name')} />
          {errors.firm_name && (
            <p className="mt-1 text-xs text-red-600">
              {errors.firm_name.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="client_type_id">Client Type *</Label>
          <ClientTypePicker
            value={watch('client_type_id')}
            onChange={(id) =>
              setValue('client_type_id', id, { shouldValidate: true })
            }
            required
          />
          {errors.client_type_id && (
            <p className="mt-1 text-xs text-red-600">
              {errors.client_type_id.message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={watch('phone') ?? ''}
              onChange={(e) =>
                setValue('phone', formatPhoneNumber(e.target.value))
              }
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input id="website" {...register('website')} />
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={3} {...register('notes')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
