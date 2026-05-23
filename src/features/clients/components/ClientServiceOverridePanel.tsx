/**
 * ClientServiceOverridePanel — per-client custom rate overrides.
 *
 * MVP shows this as part of `ClientForm` (ServiceOverridesSection.jsx).
 * In v0.1 the override row lives only in Supabase (it is not in
 * `sync-config.ts`), so we surface it as a detail-page panel that fetches
 * lazily via the store and writes back through REST. Component never
 * touches Supabase directly — it consumes a thin local hook.
 */

import { useEffect, useState } from 'react';
import * as clientsStore from '@/features/clients/stores/clients-store';
import type { ClientServiceOverrideRow } from '@/features/clients/stores/clients-store';

export function ClientServiceOverridePanel({ clientId }: { clientId: string }) {
  const [rows, setRows] = useState<ClientServiceOverrideRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    void (async () => {
      try {
        const data = await clientsStore.loadOverrides(clientId);
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Failed to load');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (rows === null) return <p className="text-sm text-stone-500">Loading overrides…</p>;
  if (rows.length === 0)
    return (
      <p className="text-sm text-stone-500">
        No custom service rates for this client.
      </p>
    );

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((o) => (
        <li
          key={o.id}
          className="flex items-center justify-between rounded-md border border-stone-200 bg-white px-3 py-2 text-sm"
        >
          <span className="font-mono text-xs text-stone-500">
            service:{o.service_id.slice(0, 8)}
          </span>
          <span>
            {o.custom_rate ?? '—'}{' '}
            <span className="text-stone-500">({o.rate_type ?? 'flat'})</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
