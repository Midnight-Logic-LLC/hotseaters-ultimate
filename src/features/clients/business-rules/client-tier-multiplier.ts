/**
 * client-tier-multiplier.ts — resolve the effective pricing multiplier for
 * a client.
 *
 * In V1 (MVP) the multiplier hung off `ClientType.default_multiplier`.
 * In V2 the same data lives on `entity_metadata` rows scoped to
 * `client_type`, with the multiplier stored in the shared `multiplier`
 * column (per `metadata_type` / `entity_metadata` plan in
 * `latest-data/CLAUDE.md`).
 *
 * The rule from MVP `Clients.jsx` getTypeColor / pricing surfaces is:
 *
 *   • If the client has a `client_type_id` and we can resolve the
 *     corresponding metadata row, use its `multiplier`.
 *   • Otherwise fall back to `1.0` (standard pricing).
 *
 * Pure. Takes already-loaded rows; never fetches. Callers wire the lookup.
 */

export interface ClientLike {
  client_type_id: string | null | undefined;
}

export interface ClientTypeMetadata {
  id: string;
  /** Shared numeric multiplier from `entity_metadata.multiplier`. */
  multiplier: number | string | null | undefined;
}

const DEFAULT_MULTIPLIER = 1.0;

/**
 * @returns the effective tier multiplier (a non-NaN finite number).
 */
export function clientTierMultiplier(
  client: ClientLike | null | undefined,
  types: ReadonlyArray<ClientTypeMetadata> | null | undefined,
): number {
  if (!client?.client_type_id || !types?.length) return DEFAULT_MULTIPLIER;
  const match = types.find((t) => t.id === client.client_type_id);
  if (!match) return DEFAULT_MULTIPLIER;
  const raw = typeof match.multiplier === 'string'
    ? parseFloat(match.multiplier)
    : match.multiplier;
  if (raw == null || !Number.isFinite(raw)) return DEFAULT_MULTIPLIER;
  return raw;
}

/**
 * MVP's pill color rule — kept here so the UI imports the rule, not the
 * literal class strings. Matches `Clients.jsx#getTypeColor`.
 */
export function clientTierBadgeClass(multiplier: number): string {
  if (multiplier < 0.9) return 'bg-purple-100 text-purple-700';
  if (multiplier < 1.0) return 'bg-blue-100 text-blue-700';
  return 'bg-stone-100 text-stone-700';
}
