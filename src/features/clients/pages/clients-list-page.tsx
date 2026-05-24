/**
 * ClientsListPage — virtualized TanStack-Table list of clients.
 *
 * Mirrors `HotSeatersMVP/src/pages/Clients.jsx` behaviorally: search,
 * type/tier filters, primary-address column, click-to-detail. The MVP's
 * drag-to-reorder client-type sections + import wizard land in a follow-up
 * change — they are not part of the clients-feature acceptance gates.
 *
 * Component-only: data comes from `useClientsList`, table state through
 * `useEntityListAsTable` (which keeps `data` referentially stable), column
 * visibility persisted in `localStorage` per user.
 */

import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { useEntityListAsTable } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';
import * as clientsStore from '@/features/clients/stores/clients-store';
import {
  useClientTypes,
  useClientTiers,
} from '@/features/clients/hooks/use-client-metadata';
import { useClientAddresses } from '@/features/clients/hooks/use-client-addresses';
import { ClientFormSheet } from '@/features/clients/components/client-form-sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MapPin } from 'lucide-react';
import { formatPhoneNumber } from '@/features/clients/business-rules/clean-phone-number';
import {
  clientTierBadgeClass,
  clientTierMultiplier,
} from '@/features/clients/business-rules/client-tier-multiplier';
import type { ClientRow } from '@/features/clients/stores/clients-store';

const VISIBILITY_STORAGE_KEY = 'clients-list-column-visibility';

export function ClientsListPage() {
  const navigate = useNavigate();
  const { company, userInfo } = useTier1();
  const companyId = company?.id ?? null;

  const types = useClientTypes();
  const tiers = useClientTiers();
  const { addresses } = useClientAddresses();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [creating, setCreating] = useState(false);

  const userKey = userInfo?.id ?? 'anon';
  const [visibility, setVisibility] = useState<VisibilityState>(() => {
    try {
      const raw = localStorage.getItem(`${VISIBILITY_STORAGE_KEY}:${userKey}`);
      return raw ? (JSON.parse(raw) as VisibilityState) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        `${VISIBILITY_STORAGE_KEY}:${userKey}`,
        JSON.stringify(visibility),
      );
    } catch {
      // ignore quota / disabled storage
    }
  }, [visibility, userKey]);

  const tableProps = useEntityListAsTable<ClientRow, ClientRow>({
    type: 'Client',
    queryKey: ['Client', 'list', companyId ?? '__none__'],
    fetch: async () => {
      if (!companyId) return { items: [] as ClientRow[], total: 0 };
      const rows = await clientsStore.loadClients(companyId);
      return { items: rows, total: rows.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
    enabled: !!companyId,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tableProps.data
      .filter((c) => !c.is_lead)
      .filter((c) => (typeFilter === 'all' ? true : c.client_type_id === typeFilter))
      .filter((c) =>
        q.length === 0 ? true : (c.firm_name ?? '').toLowerCase().includes(q),
      );
  }, [tableProps.data, search, typeFilter]);

  const columns = useMemo<ColumnDef<ClientRow>[]>(
    () => [
      {
        id: 'firm_name',
        accessorKey: 'firm_name',
        header: 'Firm name',
        cell: (ctx) => (
          <span className="font-medium text-stone-900">
            {ctx.row.original.firm_name ?? '—'}
          </span>
        ),
      },
      {
        id: 'phone',
        accessorKey: 'phone',
        header: 'Phone',
        cell: (ctx) => formatPhoneNumber(ctx.row.original.phone) || '—',
      },
      {
        id: 'type',
        header: 'Type',
        accessorFn: (row) =>
          types.find((t) => t.id === row.client_type_id)?.name ?? '—',
      },
      {
        id: 'tier',
        header: 'Tier',
        cell: (ctx) => {
          const mult = clientTierMultiplier(ctx.row.original, tiers);
          const name =
            tiers.find((t) => t.id === ctx.row.original.client_type_id)?.name ??
            null;
          return (
            <Badge className={clientTierBadgeClass(mult)}>
              {name ?? `${mult.toFixed(2)}×`}
            </Badge>
          );
        },
      },
      {
        id: 'primary_location',
        header: 'Primary location',
        cell: (ctx) => {
          const candidate =
            addresses.find(
              (a) => a.client_id === ctx.row.original.id && a.is_primary,
            ) ?? addresses.find((a) => a.client_id === ctx.row.original.id);
          if (!candidate || (!candidate.city && !candidate.state)) return '—';
          return (
            <span className="inline-flex items-center gap-1 text-stone-600">
              <MapPin className="h-3 w-3" />
              {candidate.city}
              {candidate.city && candidate.state ? ', ' : ''}
              {candidate.state}
            </span>
          );
        },
      },
    ],
    [types, tiers, addresses],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility: visibility },
    onColumnVisibilityChange: setVisibility,
  });

  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    estimateSize: () => 56,
    getScrollElement: () => parentRef.current,
    overscan: 8,
  });

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Clients &amp; Contacts
          </h1>
          <p className="text-sm text-stone-600">
            Manage your clients and their contacts
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add New Client
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            placeholder="Search clients and contacts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-stone-200 bg-white px-2 py-1.5 text-xs"
        >
          <option value="all">All types</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div
        ref={parentRef}
        className="h-[60vh] overflow-auto rounded-lg border border-stone-200 bg-white"
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-stone-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="px-3 py-2 text-left text-xs font-semibold text-stone-600"
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((vRow) => {
              const row = table.getRowModel().rows[vRow.index];
              if (!row) return null;
              return (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/Clients/${row.original.id}`)}
                  className="cursor-pointer border-t border-stone-100 hover:bg-stone-50"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${vRow.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map((c) => (
                    <td key={c.id} className="px-3 py-3">
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && !tableProps.isLoading && (
          <div className="p-8 text-center text-sm text-stone-500">
            {search ? 'No matching clients.' : 'No clients yet.'}
          </div>
        )}
      </div>
      {creating && (
        <ClientFormSheet
          open
          onClose={() => setCreating(false)}
          onSaved={(c) => navigate(`/Clients/${c.id}`)}
        />
      )}
    </div>
  );
}
