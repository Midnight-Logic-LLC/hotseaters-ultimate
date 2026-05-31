/**
 * clients-store.pglite.test.ts — end-to-end CRUD against a real PGlite engine.
 *
 * Regression guard for the change-403 fallout: the store functions called
 * `getLocalDB()` with no argument, which throws ("requires a userId"). The fix
 * routes them through `getCurrentLocalDB()` (resolves the signed-in user's
 * per-user instance). Here we mock that single accessor to hand back an
 * in-memory PGlite so the store's SQL runs against a real engine — proving
 * createClient actually inserts a row instead of throwing on db resolution.
 */

import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const db = new PGlite();

vi.mock('@/shared/db/pglite-client', () => ({
  getCurrentLocalDB: () => Promise.resolve(db),
}));

// The store imports the supabase client for the override sub-aggregate CRUD,
// which this test never exercises. Mock it so the module loads without a real
// supabase client (which throws under Node without a WebSocket polyfill).
vi.mock('@/shared/db/supabase-client', () => ({
  supabase: {},
}));

import { createClient, loadClient, loadClients } from '../clients-store';

beforeAll(async () => {
  await db.exec(`
    CREATE TABLE client (
      id text PRIMARY KEY,
      legacy_id text,
      company_id text NOT NULL,
      client_type_id text,
      firm_name text,
      phone text,
      website text,
      sales_lead text,
      is_lead boolean,
      status text,
      notes text,
      created_at text,
      updated_at text,
      is_sample boolean,
      created_by_id text,
      created_by text
    );
  `);
});

afterAll(async () => {
  await db.close();
});

describe('clients-store CRUD against PGlite', () => {
  it('createClient inserts a row and returns its id', async () => {
    const id = await createClient({
      company_id: '11111111-1111-1111-1111-111111111111',
      firm_name: 'Acme Trial Co',
      phone: '555-0100',
    });

    expect(id).toMatch(/[0-9a-f-]{36}/);

    const row = await loadClient(id);
    expect(row).not.toBeNull();
    expect(row?.firm_name).toBe('Acme Trial Co');
    expect(row?.status).toBe('active'); // store default
    expect(row?.is_lead).toBe(false); // store default
  });

  it('loadClients returns the inserted row scoped by company', async () => {
    const rows = await loadClients('11111111-1111-1111-1111-111111111111');
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows.every((r) => r.company_id === '11111111-1111-1111-1111-111111111111')).toBe(true);
  });
});
