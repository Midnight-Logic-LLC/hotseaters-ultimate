/**
 * ClientTypePicker — combo-box backed by `entity_metadata` rows scoped to
 * `client_type`. Reads through `useClientTypes`, which routes to the
 * clients store (the only PGlite seam).
 */

import { useClientTypes } from '@/features/clients/hooks/use-client-metadata';

export function ClientTypePicker({
  value,
  onChange,
  required,
}: {
  value: string | null | undefined;
  onChange: (id: string) => void;
  required?: boolean;
}) {
  const types = useClientTypes();
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm"
    >
      <option value="" disabled>
        Select a client type…
      </option>
      {types.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
