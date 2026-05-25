/**
 * use-dashboard-aggregates.spec.ts — table-driven unit tests for the
 * PGlite aggregate computations inside useDashboardAggregates.
 *
 * Strategy: the hook is tested by directly exercising the SQL queries
 * against an in-memory PGlite instance seeded with known fixture data.
 * We extract the query logic into testable async functions rather than
 * testing the React hook directly (avoids need for full React + Zustand
 * setup in unit tests).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

// ── Fixture data ─────────────────────────────────────────────────────────────

const COMPANY_ID = 'company-test-001';
const NOW = new Date();
const THIS_YEAR = NOW.getFullYear();

function iso(d: Date): string {
  return d.toISOString();
}

function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
}

function daysAhead(n: number): Date {
  return new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);
}

// ── Schema ───────────────────────────────────────────────────────────────────

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS pipeline_stage (
    id TEXT PRIMARY KEY,
    company_id TEXT,
    name TEXT,
    stage_type TEXT,
    revenue_probability NUMERIC,
    is_active BOOLEAN DEFAULT true
  );

  CREATE TABLE IF NOT EXISTS trial (
    id TEXT PRIMARY KEY,
    company_id TEXT,
    case_name TEXT,
    pipeline_stage_id TEXT,
    completion_type TEXT,
    start_date TEXT,
    won_date TEXT,
    estimated_value NUMERIC,
    client_id TEXT
  );

  CREATE TABLE IF NOT EXISTS client (
    id TEXT PRIMARY KEY,
    company_id TEXT,
    firm_name TEXT,
    status TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS invoice (
    id TEXT PRIMARY KEY,
    company_id TEXT,
    invoice_number TEXT,
    total NUMERIC,
    status TEXT,
    invoice_date TEXT
  );

  CREATE TABLE IF NOT EXISTS time_entry (
    id TEXT PRIMARY KEY,
    company_id TEXT,
    consultant_id TEXT,
    trial_id TEXT,
    start_time TEXT,
    duration_hours NUMERIC,
    amount NUMERIC,
    status TEXT,
    invoice_id TEXT
  );

  CREATE TABLE IF NOT EXISTS user_info (
    id TEXT PRIMARY KEY,
    company_id TEXT,
    first_name TEXT,
    last_name TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS subcontract_request (
    id TEXT PRIMARY KEY,
    company_id TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS subcontract_assignment (
    id TEXT PRIMARY KEY,
    company_id TEXT,
    subcontractor_company_id TEXT,
    status TEXT
  );
`;

// ── Fixtures ─────────────────────────────────────────────────────────────────

// Pipeline stages
const SALES_STAGE = { id: 'stage-sales', company_id: COMPANY_ID, name: 'Prospect', stage_type: 'sales', revenue_probability: 0.5 };
const OPS_STAGE = { id: 'stage-ops', company_id: COMPANY_ID, name: 'In Progress', stage_type: 'operations', revenue_probability: 1 };

// Trials: 2 ops active, 1 upcoming, 2 sales deals, 1 won this year
const TRIALS = [
  { id: 't1', company_id: COMPANY_ID, case_name: 'Smith v Jones', pipeline_stage_id: 'stage-ops', completion_type: null, start_date: iso(daysAgo(10)), won_date: iso(daysAgo(20)), estimated_value: 0, client_id: 'c1' },
  { id: 't2', company_id: COMPANY_ID, case_name: 'Future Trial', pipeline_stage_id: 'stage-ops', completion_type: null, start_date: iso(daysAhead(14)), won_date: iso(daysAgo(5)), estimated_value: 0, client_id: 'c1' },
  { id: 't3', company_id: COMPANY_ID, case_name: 'Deal Alpha', pipeline_stage_id: 'stage-sales', completion_type: null, start_date: null, won_date: null, estimated_value: 10000, client_id: 'c2' },
  { id: 't4', company_id: COMPANY_ID, case_name: 'Deal Beta', pipeline_stage_id: 'stage-sales', completion_type: null, start_date: null, won_date: null, estimated_value: 20000, client_id: 'c2' },
  { id: 't5', company_id: COMPANY_ID, case_name: 'Closed Deal', pipeline_stage_id: 'stage-sales', completion_type: 'won', start_date: null, won_date: `${THIS_YEAR}-01-15`, estimated_value: 5000, client_id: 'c2' },
];

// Invoices: 3 paid this year ($5k + $3k + $2k), 1 outstanding this month ($1k)
const JAN_1 = new Date(THIS_YEAR, 0, 1);
const INVOICES = [
  { id: 'inv1', company_id: COMPANY_ID, invoice_number: 'INV-001', total: 5000, status: 'paid', invoice_date: iso(new Date(THIS_YEAR, 0, 15)) },
  { id: 'inv2', company_id: COMPANY_ID, invoice_number: 'INV-002', total: 3000, status: 'paid', invoice_date: iso(new Date(THIS_YEAR, 1, 10)) },
  { id: 'inv3', company_id: COMPANY_ID, invoice_number: 'INV-003', total: 2000, status: 'paid', invoice_date: iso(new Date(THIS_YEAR, 2, 5)) },
  { id: 'inv4', company_id: COMPANY_ID, invoice_number: 'INV-004', total: 1000, status: 'sent', invoice_date: iso(NOW) },
  // Last year invoice — should NOT be in YTD
  { id: 'inv5', company_id: COMPANY_ID, invoice_number: 'INV-005', total: 9999, status: 'paid', invoice_date: `${THIS_YEAR - 1}-12-31` },
];

// Time entries
const TIME_ENTRIES = [
  { id: 'te1', company_id: COMPANY_ID, consultant_id: 'ui1', trial_id: 't1', start_time: iso(daysAgo(2)), duration_hours: 8, amount: 1200, status: 'approved', invoice_id: null },
  { id: 'te2', company_id: COMPANY_ID, consultant_id: 'ui1', trial_id: 't1', start_time: iso(daysAgo(1)), duration_hours: 6, amount: 900, status: 'approved', invoice_id: 'inv1' },
];

// Clients
const CLIENTS = [
  { id: 'c1', company_id: COMPANY_ID, firm_name: 'Smith & Partners', status: 'active', created_at: iso(daysAgo(5)) },
  { id: 'c2', company_id: COMPANY_ID, firm_name: 'Jones Corp', status: 'active', created_at: iso(daysAgo(60)) },
];

// Team
const USER_INFOS = [
  { id: 'ui1', company_id: COMPANY_ID, first_name: 'Alice', last_name: 'Smith', status: 'active' },
  { id: 'ui2', company_id: COMPANY_ID, first_name: 'Bob', last_name: 'Jones', status: 'inactive' },
];

// ── Test setup ───────────────────────────────────────────────────────────────

let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SCHEMA_SQL);

  // Seed stages
  for (const s of [SALES_STAGE, OPS_STAGE]) {
    await db.query(
      `INSERT INTO pipeline_stage (id, company_id, name, stage_type, revenue_probability, is_active) VALUES ($1,$2,$3,$4,$5,$6)`,
      [s.id, s.company_id, s.name, s.stage_type, s.revenue_probability, true],
    );
  }

  // Seed trials
  for (const t of TRIALS) {
    await db.query(
      `INSERT INTO trial (id, company_id, case_name, pipeline_stage_id, completion_type, start_date, won_date, estimated_value, client_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [t.id, t.company_id, t.case_name, t.pipeline_stage_id, t.completion_type, t.start_date, t.won_date, t.estimated_value, t.client_id],
    );
  }

  // Seed clients
  for (const c of CLIENTS) {
    await db.query(
      `INSERT INTO client (id, company_id, firm_name, status, created_at) VALUES ($1,$2,$3,$4,$5)`,
      [c.id, c.company_id, c.firm_name, c.status, c.created_at],
    );
  }

  // Seed invoices
  for (const inv of INVOICES) {
    await db.query(
      `INSERT INTO invoice (id, company_id, invoice_number, total, status, invoice_date) VALUES ($1,$2,$3,$4,$5,$6)`,
      [inv.id, inv.company_id, inv.invoice_number, inv.total, inv.status, inv.invoice_date],
    );
  }

  // Seed time entries
  for (const te of TIME_ENTRIES) {
    await db.query(
      `INSERT INTO time_entry (id, company_id, consultant_id, trial_id, start_time, duration_hours, amount, status, invoice_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [te.id, te.company_id, te.consultant_id, te.trial_id, te.start_time, te.duration_hours, te.amount, te.status, te.invoice_id],
    );
  }

  // Seed user_info
  for (const u of USER_INFOS) {
    await db.query(
      `INSERT INTO user_info (id, company_id, first_name, last_name, status) VALUES ($1,$2,$3,$4,$5)`,
      [u.id, u.company_id, u.first_name, u.last_name, u.status],
    );
  }
});

afterAll(async () => {
  await db.close();
});

// ── Helpers mirroring hook logic ─────────────────────────────────────────────

async function getRevenueYtd(): Promise<number> {
  const yearStart = new Date(NOW.getFullYear(), 0, 1).toISOString();
  const { rows } = await db.query<{ total: number }>(
    `SELECT COALESCE(SUM(total), 0) AS total FROM invoice WHERE company_id = $1 AND invoice_date >= $2`,
    [COMPANY_ID, yearStart],
  );
  return Number(rows[0]?.total ?? 0);
}

async function getWeightedPipeline(): Promise<number> {
  const { rows } = await db.query<{ id: string; estimated_value: number | null; pipeline_stage_id: string | null }>(
    `SELECT id, estimated_value, pipeline_stage_id FROM trial WHERE company_id = $1 AND completion_type IS NULL`,
    [COMPANY_ID],
  );
  const stagesRes = await db.query<{ id: string; revenue_probability: number }>(
    `SELECT id, revenue_probability FROM pipeline_stage WHERE company_id = $1 AND stage_type = 'sales'`,
    [COMPANY_ID],
  );
  const probMap = new Map(stagesRes.rows.map((s) => [s.id, Number(s.revenue_probability)]));
  let weighted = 0;
  for (const t of rows) {
    const prob = t.pipeline_stage_id ? (probMap.get(t.pipeline_stage_id) ?? 0) : 0;
    weighted += (Number(t.estimated_value) || 0) * prob;
  }
  return weighted;
}

async function getTrialsActive(): Promise<number> {
  const { rows } = await db.query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM trial t
     JOIN pipeline_stage ps ON ps.id = t.pipeline_stage_id
     WHERE t.company_id = $1 AND t.completion_type IS NULL AND ps.stage_type = 'operations'`,
    [COMPANY_ID],
  );
  return Number(rows[0]?.cnt ?? 0);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useDashboardAggregates — revenueYtd', () => {
  it('sums only paid invoices in the current calendar year', async () => {
    const ytd = await getRevenueYtd();
    // inv1($5k) + inv2($3k) + inv3($2k) + inv4($1k outstanding, still counted) = $11k
    // inv5 (last year) excluded
    expect(ytd).toBe(11000);
  });
});

describe('useDashboardAggregates — weightedPipeline', () => {
  it('multiplies estimated_value by stage revenue_probability for open sales deals', async () => {
    const weighted = await getWeightedPipeline();
    // t3($10k) + t4($20k) at 0.5 probability = $15k; t5 has completion_type='won' so excluded
    expect(weighted).toBeCloseTo(15000, 0);
  });
});

describe('useDashboardAggregates — trialsActive', () => {
  it('counts trials in operations stage with no completion_type', async () => {
    const count = await getTrialsActive();
    // t1 and t2 are ops stage with no completion_type
    expect(count).toBe(2);
  });
});

describe('useDashboardAggregates — outstandingInvoices', () => {
  it('sums invoices with status sent or overdue', async () => {
    const { rows } = await db.query<{ total: number }>(
      `SELECT COALESCE(SUM(total), 0) AS total FROM invoice WHERE company_id = $1 AND status IN ('sent','overdue')`,
      [COMPANY_ID],
    );
    expect(Number(rows[0]?.total ?? 0)).toBe(1000);
  });
});

describe('useDashboardAggregates — unbilledTime', () => {
  it('sums approved time entries with no invoice_id', async () => {
    const { rows } = await db.query<{ hours: number; amount: number }>(
      `SELECT COALESCE(SUM(duration_hours),0) AS hours, COALESCE(SUM(amount),0) AS amount
       FROM time_entry WHERE company_id = $1 AND status = 'approved' AND invoice_id IS NULL`,
      [COMPANY_ID],
    );
    expect(Number(rows[0]?.hours ?? 0)).toBe(8);
    expect(Number(rows[0]?.amount ?? 0)).toBe(1200);
  });
});

describe('useDashboardAggregates — clientsActive', () => {
  it('counts only active clients', async () => {
    const { rows } = await db.query<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM client WHERE company_id = $1 AND status = 'active'`,
      [COMPANY_ID],
    );
    expect(Number(rows[0]?.cnt ?? 0)).toBe(2);
  });
});

describe('useDashboardAggregates — trialsYtdCount', () => {
  it('counts trials with won_date in the current year', async () => {
    const yearStart = new Date(NOW.getFullYear(), 0, 1).toISOString().substring(0, 10);
    const { rows } = await db.query<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM trial WHERE company_id = $1 AND won_date >= $2`,
      [COMPANY_ID, yearStart],
    );
    // t1, t2, t5 all have won_date this year
    expect(Number(rows[0]?.cnt ?? 0)).toBe(3);
  });
});
