/**
 * trials-store.pglite.test.ts — end-to-end CRUD against a real PGlite engine.
 *
 * Regression guard for the change-403 fallout (see the clients-store sibling
 * test). The trials store routed every insert/update/delete through
 * `getLocalDB()` with no argument, which threw. The fix points it at
 * `getCurrentLocalDB()`; this test mocks that accessor to a real in-memory
 * PGlite and proves createTrial / fetchTrials run.
 */

import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const db = new PGlite();

vi.mock('@/shared/db/pglite-client', () => ({
  getCurrentLocalDB: () => Promise.resolve(db),
}));

import {
  createTrial,
  deleteTrial,
  fetchTrialById,
  fetchTrials,
  updateTrial,
} from '../trials-store';

const COMPANY = '22222222-2222-2222-2222-222222222222';

beforeAll(async () => {
  await db.exec(`
    CREATE TABLE trial (
      id text PRIMARY KEY,
      company_id text NOT NULL,
      case_name text,
      courthouse text,
      start_date text
    );
  `);
});

afterAll(async () => {
  await db.close();
});

describe('trials-store CRUD against PGlite', () => {
  it('createTrial inserts and returns the row', async () => {
    const trial = await createTrial({
      id: '33333333-3333-3333-3333-333333333333',
      company_id: COMPANY,
      case_name: 'State v. Defendant',
      start_date: '2026-06-01',
    });

    expect(trial.id).toBe('33333333-3333-3333-3333-333333333333');
    expect(trial.case_name).toBe('State v. Defendant');

    const fetched = await fetchTrialById('33333333-3333-3333-3333-333333333333');
    expect(fetched).not.toBeNull();
  });

  it('updateTrial patches the row', async () => {
    const updated = await updateTrial('33333333-3333-3333-3333-333333333333', {
      courthouse: 'Travis County',
    });
    expect(updated.courthouse).toBe('Travis County');
  });

  it('fetchTrials returns rows scoped by company, then deleteTrial removes', async () => {
    const rows = await fetchTrials(COMPANY);
    expect(rows.length).toBe(1);

    await deleteTrial('33333333-3333-3333-3333-333333333333');
    const after = await fetchTrials(COMPANY);
    expect(after.length).toBe(0);
  });
});
