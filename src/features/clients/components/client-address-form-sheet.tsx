/**
 * ClientAddressFormSheet — create/edit a ClientAddress. MVP parity for the
 * inline "Main Office" form embedded in `ClientAddressesSection.jsx`.
 */

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useClientAddressCrud } from '@/features/clients/hooks/use-client-address-crud';
import type { ClientAddressRow } from '@/features/clients/stores/clients-store';

const schema = z.object({
  label: z.string().min(1, 'Label is required'),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  is_primary: z.boolean().default(false),
});

type AddressValues = z.infer<typeof schema>;

export function ClientAddressFormSheet({
  open,
  onClose,
  clientId,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  clientId: string;
  initial?: ClientAddressRow | null;
}) {
  const crud = useClientAddressCrud(clientId);
  const isEdit = !!initial?.id;
  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } =
    useForm<AddressValues>({
      resolver: zodResolver(schema) as Resolver<AddressValues>,
      defaultValues: {
        label: initial?.label ?? 'Main Office',
        address: initial?.address ?? '',
        city: initial?.city ?? '',
        state: initial?.state ?? '',
        zip: initial?.zip ?? '',
        is_primary: initial?.is_primary ?? false,
      },
    });

  const submit = async (values: AddressValues) => {
    if (isEdit && initial?.id) {
      crud.setFields(values as Partial<ClientAddressRow>);
      await crud.save();
    } else {
      crud.setCreateFields(values as Partial<ClientAddressRow>);
      await crud.create();
    }
    onClose();
  };

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Address' : 'New Address'}
    >
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="label">Label</Label>
          <Input id="label" {...register('label')} />
        </div>
        <div>
          <Label htmlFor="address">Street</Label>
          <Input id="address" {...register('address')} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register('city')} />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" {...register('state')} />
          </div>
          <div>
            <Label htmlFor="zip">ZIP</Label>
            <Input id="zip" {...register('zip')} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={!!watch('is_primary')}
            onCheckedChange={(c) => setValue('is_primary', !!c)}
          />
          Primary address
        </label>
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
