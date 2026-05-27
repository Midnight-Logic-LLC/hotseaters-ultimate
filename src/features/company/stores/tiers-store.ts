/**
 * tiers-store.ts — CRUD for `metadata_type` rows with `scope='consultant_tier'`.
 *
 * Tier1Provider's `consultantTiers` projection (via
 * `selectConsultantTiers`) reads from the entity-graph `MetadataType` slice
 * which is hydrated by Electric. The mutations here go through Supabase
 * (self-hosted only — RULE 1) and Electric will fan the canonical row
 * back into the graph, so consumers see the update automatically.
 *
 * The multiplier and description live in `extra_schema` (JSONB) — that's
 * what the bible's `ConsultantTier.create()` writes into.
 *
 * Stores own all I/O (RULE D). HotSeatersMVP is the bible.
 */

import { supabase } from '@/shared/db/supabase-client';

const TIER_SCOPE = 'consultant_tier';

export interface CreateConsultantTierInput {
  companyId: string;
  name: string;
  multiplier: number;
  description?: string;
  is_active?: boolean;
}

export interface UpdateConsultantTierInput {
  name?: string;
  multiplier?: number;
  description?: string;
  is_active?: boolean;
}

interface ExtraSchema extends Record<string, unknown> {
  multiplier?: number;
  description?: string;
}

function buildExtraSchema(
  input: { multiplier?: number; description?: string },
  base: ExtraSchema = {},
): ExtraSchema {
  const next: ExtraSchema = { ...base };
  if (input.multiplier !== undefined) next.multiplier = input.multiplier;
  if (input.description !== undefined) next.description = input.description;
  return next;
}

export async function createConsultantTier(
  input: CreateConsultantTierInput,
): Promise<void> {
  const extra_schema = buildExtraSchema({
    multiplier: input.multiplier,
    description: input.description ?? '',
  });
  const row = {
    company_id: input.companyId,
    scope: TIER_SCOPE,
    name: input.name,
    is_active: input.is_active === false ? 'false' : 'true',
    extra_schema,
  };
  const { error } = await supabase.from('metadata_type').insert(row);
  if (error) throw error;
}

export async function updateConsultantTier(
  id: string,
  patch: UpdateConsultantTierInput,
): Promise<void> {
  // Read current extras so we don't blow away unrelated keys (e.g. `key`).
  const { data, error: readError } = await supabase
    .from('metadata_type')
    .select('extra_schema')
    .eq('id', id)
    .maybeSingle();
  if (readError) throw readError;

  const baseExtras =
    (data?.extra_schema as ExtraSchema | null | undefined) ?? {};

  const extrasPatch: { multiplier?: number; description?: string } = {};
  if (patch.multiplier !== undefined) extrasPatch.multiplier = patch.multiplier;
  if (patch.description !== undefined) extrasPatch.description = patch.description;
  const nextExtras = buildExtraSchema(extrasPatch, baseExtras);

  const update: Record<string, unknown> = {
    extra_schema: nextExtras,
  };
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.is_active !== undefined) {
    update.is_active = patch.is_active ? 'true' : 'false';
  }

  const { error } = await supabase
    .from('metadata_type')
    .update(update)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteConsultantTier(id: string): Promise<void> {
  const { error } = await supabase.from('metadata_type').delete().eq('id', id);
  if (error) throw error;
}
