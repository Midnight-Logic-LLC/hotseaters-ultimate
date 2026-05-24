/**
 * ClientAddressList — list of addresses for one client, with edit/delete.
 * Ported from `HotSeatersMVP/src/components/clients/ClientAddressesSection.jsx`.
 */

import { useState } from 'react';
import { useClientAddresses } from '@/features/clients/hooks/use-client-addresses';
import { useClientAddressCrud } from '@/features/clients/hooks/use-client-address-crud';
import { ClientAddressFormSheet } from './client-address-form-sheet';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, MapPin, Star } from 'lucide-react';
import type { ClientAddressRow } from '@/features/clients/stores/clients-store';

export function ClientAddressList({ clientId }: { clientId: string }) {
  const { addresses, isLoading } = useClientAddresses(clientId);
  const crud = useClientAddressCrud(clientId);
  const [editing, setEditing] = useState<ClientAddressRow | null>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading) return <p className="text-sm text-stone-500">Loading addresses…</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-900">Addresses</h3>
        <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add address
        </Button>
      </div>
      {addresses.length === 0 ? (
        <p className="text-sm text-stone-500">No addresses yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between rounded-lg border border-stone-200 bg-white p-3"
            >
              <div className="flex items-start gap-2">
                <MapPin className="mt-1 h-4 w-4 text-stone-400" />
                <div className="text-sm">
                  <div className="flex items-center gap-1 font-medium text-stone-900">
                    {a.label ?? 'Address'}
                    {a.is_primary && (
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-500" />
                    )}
                  </div>
                  <div className="text-stone-600">
                    {a.address}
                    {a.address ? ', ' : ''}
                    {a.city}
                    {a.city && a.state ? ', ' : ''}
                    {a.state} {a.zip ?? ''}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditing(a)}
                  aria-label="Edit address"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void crud.deleteEntity(a.id)}
                  aria-label="Delete address"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {creating && (
        <ClientAddressFormSheet
          open
          onClose={() => setCreating(false)}
          clientId={clientId}
        />
      )}
      {editing && (
        <ClientAddressFormSheet
          open
          onClose={() => setEditing(null)}
          clientId={clientId}
          initial={editing}
        />
      )}
    </div>
  );
}
