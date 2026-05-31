/**
 * features/trials/stores/trials-store.ts — the ONLY trials-feature module
 * permitted to import PGlite (RULE 3). Exposes pure-ish fetch / mutate
 * functions used by the trials hooks.
 *
 * Reads come from the merged `trial` / `trial_service` / `trial_contact`
 * (etc.) PGlite views (`*_synced ∪ *_local`). Writes go through those views;
 * the INSTEAD-OF triggers append to `local_writes` and `pg_notify`, and
 * `write-sync.ts` pushes them to Supabase.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { getCurrentLocalDB } from '@/shared/db/pglite-client';
import type {
  Trial,
  TrialService,
  TrialContact,
  TrialSegment,
  TrialServiceAssignment,
} from '@/features/trials/entities';

type Row = Record<string, unknown>;

function quoteIdent(name: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`Invalid identifier: ${name}`);
  }
  return `"${name}"`;
}

async function selectAll<T>(
  table: string,
  where: Record<string, string | null> | undefined,
  orderBy: string | null,
): Promise<T[]> {
  const db = await getCurrentLocalDB();
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (where) {
    let i = 1;
    for (const [col, val] of Object.entries(where)) {
      if (val == null) continue;
      clauses.push(`${quoteIdent(col)} = $${i}`);
      params.push(val);
      i += 1;
    }
  }
  const sql =
    `SELECT * FROM ${quoteIdent(table)}` +
    (clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '') +
    (orderBy ? ` ORDER BY ${orderBy}` : '');
  const { rows } = await db.query<Row>(sql, params);
  return rows as unknown as T[];
}

async function selectById<T>(table: string, id: string): Promise<T | null> {
  const db = await getCurrentLocalDB();
  const { rows } = await db.query<Row>(
    `SELECT * FROM ${quoteIdent(table)} WHERE id = $1 LIMIT 1`,
    [id],
  );
  return (rows[0] as unknown as T) ?? null;
}

async function insertRow(
  table: string,
  data: Record<string, unknown>,
): Promise<Row> {
  const db = await getCurrentLocalDB();
  const cols = Object.keys(data);
  const vals = Object.values(data);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const colSql = cols.map(quoteIdent).join(', ');
  const sql = `INSERT INTO ${quoteIdent(table)} (${colSql}) VALUES (${placeholders}) RETURNING *`;
  const { rows } = await db.query<Row>(sql, vals);
  return rows[0]!;
}

async function updateRow(
  table: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<Row> {
  const db = await getCurrentLocalDB();
  const entries = Object.entries(patch).filter(([k]) => k !== 'id');
  if (entries.length === 0) {
    const row = await selectById<Row>(table, id);
    return row as Row;
  }
  const sets = entries.map(([k], i) => `${quoteIdent(k)} = $${i + 1}`).join(', ');
  const sql = `UPDATE ${quoteIdent(table)} SET ${sets} WHERE id = $${entries.length + 1} RETURNING *`;
  const { rows } = await db.query<Row>(
    sql,
    [...entries.map(([, v]) => v), id],
  );
  return rows[0]!;
}

async function deleteRow(table: string, id: string): Promise<void> {
  const db = await getCurrentLocalDB();
  await db.query(`DELETE FROM ${quoteIdent(table)} WHERE id = $1`, [id]);
}

// ── Trial ────────────────────────────────────────────────────────────────────
export async function fetchTrials(
  companyId: string,
): Promise<Trial[]> {
  return selectAll<Trial>(
    'trial',
    { company_id: companyId },
    'start_date DESC NULLS LAST',
  );
}
export async function fetchTrialById(id: string): Promise<Trial | null> {
  return selectById<Trial>('trial', id);
}
export async function createTrial(input: Partial<Trial>): Promise<Trial> {
  return (await insertRow('trial', input)) as unknown as Trial;
}
export async function updateTrial(
  id: string,
  patch: Partial<Trial>,
): Promise<Trial> {
  return (await updateRow('trial', id, patch)) as unknown as Trial;
}
export async function deleteTrial(id: string): Promise<void> {
  await deleteRow('trial', id);
}

// ── TrialService ─────────────────────────────────────────────────────────────
export async function fetchTrialServices(
  trialId: string,
): Promise<TrialService[]> {
  return selectAll<TrialService>(
    'trial_service',
    { trial_id: trialId },
    'display_order ASC NULLS LAST, created_at ASC',
  );
}
/**
 * Company-scoped variant — used by dashboard widgets that need the full
 * trial_service inventory across all trials (revenue projections,
 * trial-stats). Reads from the same PGlite view; Electric keeps the
 * tenant slice fresh.
 */
export async function fetchTrialServicesForCompany(
  companyId: string,
): Promise<TrialService[]> {
  return selectAll<TrialService>(
    'trial_service',
    { company_id: companyId },
    'created_at ASC',
  );
}
export async function createTrialService(
  input: Partial<TrialService>,
): Promise<TrialService> {
  return (await insertRow('trial_service', input)) as unknown as TrialService;
}
export async function updateTrialService(
  id: string,
  patch: Partial<TrialService>,
): Promise<TrialService> {
  return (await updateRow('trial_service', id, patch)) as unknown as TrialService;
}
export async function deleteTrialService(id: string): Promise<void> {
  await deleteRow('trial_service', id);
}

// ── TrialContact ─────────────────────────────────────────────────────────────
export async function fetchTrialContacts(
  trialId: string,
): Promise<TrialContact[]> {
  return selectAll<TrialContact>(
    'trial_contact',
    { trial_id: trialId },
    'created_at ASC',
  );
}
export async function createTrialContact(
  input: Partial<TrialContact>,
): Promise<TrialContact> {
  return (await insertRow('trial_contact', input)) as unknown as TrialContact;
}
export async function deleteTrialContact(id: string): Promise<void> {
  await deleteRow('trial_contact', id);
}

// ── TrialSegment ─────────────────────────────────────────────────────────────
export async function fetchTrialSegments(
  trialId: string,
): Promise<TrialSegment[]> {
  return selectAll<TrialSegment>(
    'trial_segment',
    { trial_id: trialId },
    'segment_number ASC NULLS LAST',
  );
}
export async function createTrialSegment(
  input: Partial<TrialSegment>,
): Promise<TrialSegment> {
  return (await insertRow('trial_segment', input)) as unknown as TrialSegment;
}
export async function updateTrialSegment(
  id: string,
  patch: Partial<TrialSegment>,
): Promise<TrialSegment> {
  return (await updateRow('trial_segment', id, patch)) as unknown as TrialSegment;
}
export async function deleteTrialSegment(id: string): Promise<void> {
  await deleteRow('trial_segment', id);
}

// ── TrialServiceAssignment ───────────────────────────────────────────────────
export async function fetchTrialServiceAssignments(
  trialServiceId: string,
): Promise<TrialServiceAssignment[]> {
  return selectAll<TrialServiceAssignment>(
    'trial_service_assignment',
    { trial_service_id: trialServiceId },
    'created_at ASC',
  );
}
export async function fetchTrialServiceAssignmentsByTrial(
  trialId: string,
): Promise<TrialServiceAssignment[]> {
  return selectAll<TrialServiceAssignment>(
    'trial_service_assignment',
    { trial_id: trialId },
    'created_at ASC',
  );
}
export async function createTrialServiceAssignment(
  input: Partial<TrialServiceAssignment>,
): Promise<TrialServiceAssignment> {
  return (await insertRow(
    'trial_service_assignment',
    input,
  )) as unknown as TrialServiceAssignment;
}
export async function updateTrialServiceAssignment(
  id: string,
  patch: Partial<TrialServiceAssignment>,
): Promise<TrialServiceAssignment> {
  return (await updateRow(
    'trial_service_assignment',
    id,
    patch,
  )) as unknown as TrialServiceAssignment;
}
export async function deleteTrialServiceAssignment(id: string): Promise<void> {
  await deleteRow('trial_service_assignment', id);
}

/**
 * Register the trials-feature entity schemas with prometheus-entity-management.
 * Called once from the app root (sync-gate / app-providers). Idempotent.
 *
 * Lives in the store tier — feature components/hooks/entities don't import
 * the entity-management package directly (RULE 3).
 */
import { registerEntityJsonSchema } from '@prometheus-ags/prometheus-entity-management';
import { TRIALS_FEATURE_ENTITY_SCHEMAS } from '@/features/trials/entities';

let registered = false;
export function registerTrialsFeatureEntities(): void {
  if (registered) return;
  registered = true;
  for (const [entityType, schema] of Object.entries(
    TRIALS_FEATURE_ENTITY_SCHEMAS,
  )) {
    registerEntityJsonSchema({
      entityType,
      schema: schema as never,
    });
  }
}
