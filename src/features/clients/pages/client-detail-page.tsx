/**
 * ClientDetailPage — header + tabs (Overview, Addresses, Service Overrides,
 * Trials). Mirrors `HotSeatersMVP/src/components/clients/ClientDetails.jsx`.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, ArrowLeft, Phone, Globe } from 'lucide-react';
import { useClient } from '@/features/clients/hooks/use-client';
import { useClientAddresses } from '@/features/clients/hooks/use-client-addresses';
import {
  useClientTypes,
  useClientTiers,
} from '@/features/clients/hooks/use-client-metadata';
import {
  clientTierBadgeClass,
  clientTierMultiplier,
} from '@/features/clients/business-rules/client-tier-multiplier';
import {
  displayClientWebsite,
  cleanClientWebsite,
} from '@/features/clients/business-rules/clean-client-website';
import { formatPhoneNumber } from '@/features/clients/business-rules/clean-phone-number';
import { ClientAddressList } from '@/features/clients/components/client-address-list';
import { ClientServiceOverridePanel } from '@/features/clients/components/client-service-override-panel';
import { ClientFormSheet } from '@/features/clients/components/client-form-sheet';

export function ClientDetailPage() {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  const { client, isLoading, error } = useClient(clientId ?? null);
  const { addresses } = useClientAddresses(clientId ?? null);
  const types = useClientTypes();
  const tiers = useClientTiers();
  const [editing, setEditing] = useState(false);

  if (isLoading) return <div className="p-6 text-sm text-stone-500">Loading…</div>;
  if (error || !client)
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/Clients')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <p className="mt-4 text-sm text-red-600">
          {error ?? 'Client not found.'}
        </p>
      </div>
    );

  const typeName = types.find((t) => t.id === client.client_type_id)?.name;
  const tierMult = clientTierMultiplier(client, tiers);
  const tierName =
    tiers.find((t) => t.id === client.client_type_id)?.name ?? null;
  const primaryAddress =
    addresses.find((a) => a.is_primary) ?? addresses[0] ?? null;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <Button variant="ghost" onClick={() => navigate('/Clients')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Clients
        </Button>
      </div>
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            {client.firm_name ?? 'Unnamed firm'}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-600">
            {typeName && <Badge>{typeName}</Badge>}
            <Badge className={clientTierBadgeClass(tierMult)}>
              {tierName ?? `${tierMult.toFixed(2)}×`}
            </Badge>
            {client.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" /> {formatPhoneNumber(client.phone)}
              </span>
            )}
            {client.website && (
              <a
                href={cleanClientWebsite(client.website)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                <Globe className="h-3 w-3" /> {displayClientWebsite(client.website)}
              </a>
            )}
          </div>
          {primaryAddress && (
            <p className="mt-1 text-sm text-stone-500">
              {primaryAddress.address}
              {primaryAddress.address ? ', ' : ''}
              {primaryAddress.city}
              {primaryAddress.city && primaryAddress.state ? ', ' : ''}
              {primaryAddress.state} {primaryAddress.zip ?? ''}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="mr-1 h-4 w-4" /> Edit
        </Button>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="overrides">Service Overrides</TabsTrigger>
          <TabsTrigger value="trials">Trials</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Status" value={client.status ?? '—'} />
            <Field label="Sales lead" value={client.sales_lead ?? '—'} />
            <Field label="Notes" value={client.notes ?? '—'} />
          </dl>
        </TabsContent>
        <TabsContent value="addresses">
          <ClientAddressList clientId={client.id} />
        </TabsContent>
        <TabsContent value="overrides">
          <ClientServiceOverridePanel clientId={client.id} />
        </TabsContent>
        <TabsContent value="trials">
          <p className="text-sm text-stone-500">
            Trials feature lands in Change 7. Once available, this tab will
            list trials joined by <code>client_id</code>.
          </p>
        </TabsContent>
      </Tabs>

      {editing && (
        <ClientFormSheet
          open
          initial={client}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-stone-900">{value}</dd>
    </div>
  );
}
