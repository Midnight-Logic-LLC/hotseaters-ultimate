/**
 * clients-store.ts — single PGlite seam for the clients aggregate.
 *
 * Per RULE 3: only `shared/db` and `features/(feature)/stores` may touch PGlite.
 * The store exposes plain async functions (`loadClients`, `loadAddresses`,
 * `createClient`, `updateClient`, `deleteClient`, `createAddress`,
 * `updateAddress`, `deleteAddress`) that read from / write to the local
 * `client` and `client_address` views. Reads see the synced+local merged
 * view; writes trigger the INSTEAD-OF triggers which queue the change in
 * `local_writes` for the write-sync drain.
 *
 * The override sub-aggregate uses Supabase REST because
 * `client_service_override` is not synced in v0.1 (see entities.ts).
 */

import { getCurrentLocalDB } from '@/shared/db/pglite-client';
import { supabase } from '@/shared/db/supabase-client';

// ── Types mirroring the PGlite view columns ────────────────────────────────

export interface ClientRow {
  id: string;
  legacy_id: string | null;
  company_id: string;
  client_type_id: string | null;
  firm_name: string | null;
  phone: string | null;
  website: string | null;
  sales_lead: string | null;
  is_lead: boolean | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_sample: boolean | null;
  created_by_id: string | null;
  created_by: string | null;
}

export interface ClientAddressRow {
  id: string;
  legacy_id: string | null;
  company_id: string;
  client_id: string;
  label: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  is_primary: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  is_sample: boolean | null;
  created_by_id: string | null;
  created_by: string | null;
}

export interface ClientServiceOverrideRow {
  id: string;
  company_id: string;
  client_id: string;
  service_id: string;
  rate_type: string | null;
  custom_rate: number | string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ── Reads ──────────────────────────────────────────────────────────────────

export async function loadClients(companyId: string): Promise<ClientRow[]> {
  const db = await getCurrentLocalDB();
  const { rows } = await db.query<ClientRow>(
    `SELECT * FROM client
     WHERE company_id = $1
     ORDER BY firm_name ASC NULLS LAST`,
    [companyId],
  );
  return rows;
}

export async function loadClient(id: string): Promise<ClientRow | null> {
  const db = await getCurrentLocalDB();
  const { rows } = await db.query<ClientRow>(
    `SELECT * FROM client WHERE id = $1 LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function loadAddresses(
  companyId: string,
  clientId?: string,
): Promise<ClientAddressRow[]> {
  const db = await getCurrentLocalDB();
  const sql = clientId
    ? `SELECT * FROM client_address WHERE company_id = $1 AND client_id = $2 ORDER BY is_primary DESC NULLS LAST, label ASC`
    : `SELECT * FROM client_address WHERE company_id = $1 ORDER BY is_primary DESC NULLS LAST, label ASC`;
  const args = clientId ? [companyId, clientId] : [companyId];
  const { rows } = await db.query<ClientAddressRow>(sql, args);
  return rows;
}

// ── Writes — clients ───────────────────────────────────────────────────────

export interface CreateClientInput {
  company_id: string;
  firm_name: string;
  client_type_id?: string | null;
  sales_lead?: string | null;
  phone?: string | null;
  website?: string | null;
  notes?: string | null;
  status?: string | null;
  is_lead?: boolean | null;
  created_by_id?: string | null;
  created_by?: string | null;
}

export async function createClient(input: CreateClientInput): Promise<string> {
  const db = await getCurrentLocalDB();
  const now = new Date().toISOString();
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO client
       (id, company_id, client_type_id, firm_name, phone, website,
        sales_lead, is_lead, status, notes,
        created_at, updated_at, is_sample, created_by_id, created_by)
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9,
             $10, $10, false, $11, $12)
     RETURNING id`,
    [
      input.company_id,
      input.client_type_id ?? null,
      input.firm_name,
      input.phone ?? null,
      input.website ?? null,
      input.sales_lead ?? null,
      input.is_lead ?? false,
      input.status ?? 'active',
      input.notes ?? null,
      now,
      input.created_by_id ?? null,
      input.created_by ?? null,
    ],
  );
  const first = rows[0];
  if (!first) throw new Error('createClient: insert returned no rows');
  return first.id;
}

export async function updateClient(
  id: string,
  patch: Partial<CreateClientInput>,
): Promise<void> {
  const db = await getCurrentLocalDB();
  const now = new Date().toISOString();
  // Pull the current row, splat in the patch, write the merged row back
  // through the view so the INSTEAD-OF trigger receives a complete tuple.
  const current = await loadClient(id);
  if (!current) throw new Error(`client ${id} not found`);
  const merged: ClientRow = {
    ...current,
    ...patch,
    id: current.id,
    company_id: current.company_id,
    updated_at: now,
  };
  await db.query(
    `UPDATE client SET
       client_type_id = $2,
       firm_name = $3,
       phone = $4,
       website = $5,
       sales_lead = $6,
       is_lead = $7,
       status = $8,
       notes = $9,
       updated_at = $10
     WHERE id = $1`,
    [
      merged.id,
      merged.client_type_id,
      merged.firm_name,
      merged.phone,
      merged.website,
      merged.sales_lead,
      merged.is_lead ?? false,
      merged.status,
      merged.notes,
      merged.updated_at,
    ],
  );
}

export async function deleteClient(id: string): Promise<void> {
  const db = await getCurrentLocalDB();
  await db.query(`DELETE FROM client WHERE id = $1`, [id]);
}

// ── Writes — addresses ─────────────────────────────────────────────────────

export interface CreateAddressInput {
  company_id: string;
  client_id: string;
  label?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  is_primary?: boolean | null;
}

export async function createAddress(input: CreateAddressInput): Promise<string> {
  const db = await getCurrentLocalDB();
  const now = new Date().toISOString();
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO client_address
       (id, company_id, client_id, label, address, city, state, zip,
        is_primary, created_at, updated_at, is_sample)
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8,
             $9, $9, false)
     RETURNING id`,
    [
      input.company_id,
      input.client_id,
      input.label ?? 'Main Office',
      input.address ?? null,
      input.city ?? null,
      input.state ?? null,
      input.zip ?? null,
      input.is_primary ?? false,
      now,
    ],
  );
  const first = rows[0];
  if (!first) throw new Error('createAddress: insert returned no rows');
  return first.id;
}

export async function updateAddress(
  id: string,
  patch: Partial<CreateAddressInput>,
): Promise<void> {
  const db = await getCurrentLocalDB();
  const now = new Date().toISOString();
  const { rows: existing } = await db.query<ClientAddressRow>(
    `SELECT * FROM client_address WHERE id = $1`,
    [id],
  );
  const current = existing[0];
  if (!current) throw new Error(`client_address ${id} not found`);
  const merged: ClientAddressRow = {
    ...current,
    ...patch,
    id: current.id,
    company_id: current.company_id,
    client_id: current.client_id,
    updated_at: now,
  };
  await db.query(
    `UPDATE client_address SET
       label = $2, address = $3, city = $4, state = $5, zip = $6,
       is_primary = $7, updated_at = $8
     WHERE id = $1`,
    [
      merged.id,
      merged.label,
      merged.address,
      merged.city,
      merged.state,
      merged.zip,
      merged.is_primary ?? false,
      merged.updated_at,
    ],
  );
}

export async function deleteAddress(id: string): Promise<void> {
  const db = await getCurrentLocalDB();
  await db.query(`DELETE FROM client_address WHERE id = $1`, [id]);
}

// ── client_type metadata reads (Tier-A; from local PGlite) ─────────────────

export interface ClientTypeMetadataRow {
  id: string;
  name: string;
  multiplier: number | string | null;
  company_id: string | null;
}

export async function loadClientTypes(
  companyId: string,
): Promise<ClientTypeMetadataRow[]> {
  const db = await getCurrentLocalDB();
  const { rows } = await db.query<ClientTypeMetadataRow>(
    `SELECT em.id, em.name, em.multiplier, em.company_id
       FROM entity_metadata em
       JOIN metadata_type mt ON mt.id = em.metadata_type_id
      WHERE mt.scope = 'client_type'
        AND (em.company_id = $1 OR em.company_id IS NULL)
      ORDER BY em.name ASC NULLS LAST`,
    [companyId],
  );
  return rows;
}

export async function loadClientTiers(
  companyId: string,
): Promise<ClientTypeMetadataRow[]> {
  // Tiers share the metadata_type/entity_metadata pattern with a different scope.
  const db = await getCurrentLocalDB();
  const { rows } = await db.query<ClientTypeMetadataRow>(
    `SELECT em.id, em.name, em.multiplier, em.company_id
       FROM entity_metadata em
       JOIN metadata_type mt ON mt.id = em.metadata_type_id
      WHERE mt.scope = 'client_tier'
        AND (em.company_id = $1 OR em.company_id IS NULL)
      ORDER BY em.name ASC NULLS LAST`,
    [companyId],
  );
  return rows;
}

// ── client_service_override (server-only — Supabase REST) ──────────────────

export async function loadOverrides(
  clientId: string,
): Promise<ClientServiceOverrideRow[]> {
  const { data, error } = await supabase
    .from('client_service_override')
    .select('*')
    .eq('client_id', clientId);
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientServiceOverrideRow[];
}

export async function createOverride(
  input: Omit<ClientServiceOverrideRow, 'id' | 'created_at' | 'updated_at'>,
): Promise<ClientServiceOverrideRow> {
  const { data, error } = await supabase
    .from('client_service_override')
    .insert(input)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as ClientServiceOverrideRow;
}

export async function updateOverride(
  id: string,
  patch: Partial<ClientServiceOverrideRow>,
): Promise<void> {
  const { error } = await supabase
    .from('client_service_override')
    .update(patch)
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteOverride(id: string): Promise<void> {
  const { error } = await supabase
    .from('client_service_override')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}
