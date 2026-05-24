/**
 * ClientTierPicker — combo-box over `entity_metadata` rows scoped to
 * `client_tier`. Tiers share the multiplier mechanism with types but are a
 * separate scope (see `latest-data/CLAUDE.md` → metadata pattern).
 */

import { useClientTiers } from '@/features/clients/hooks/use-client-metadata';

export function ClientTierPicker({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (id: string) => void;
}) {
  const tiers = useClientTiers();
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm"
    >
      <option value="">No tier</option>
      {tiers.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
