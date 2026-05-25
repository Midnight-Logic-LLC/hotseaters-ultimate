/**
 * useDashboardAggregates — PGlite-backed dashboard aggregate hook.
 *
 * Queries the local PGlite DB (via `getLocalDB()`) for every aggregate the
 * full dashboard needs. Returns zero/empty-array defaults gracefully when
 * tables don't exist yet (schema split in change-403). Refreshes every 30 s
 * or whenever the entity graph changes.
 *
 * Bible: `HotSeatersMVP/src/pages/Dashboard.jsx` lines 48–690.
 *
 * Architecture rule: hooks read from stores or PGlite directly.
 * No store imports in components.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useState, useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';
import { getLocalDB } from '@/shared/db/pglite-client';
import { useTier1 } from '@/app/tier1-provider';

// ---------------------------------------------------------------------------
// Public shape
// ---------------------------------------------------------------------------

export interface RecentInvoice {
  id: string;
  invoice_number: string | null;
  total: number;
  status: string | null;
  invoice_date: string | null;
}

export interface RecentlyWonDeal {
  id: string;
  case_name: string | null;
  won_date: string | null;
}

export interface UpcomingTrial {
  id: string;
  case_name: string | null;
  start_date: string | null;
  client_id: string | null;
  client_firm_name: string | null;
}

export interface TeamStat {
  name: string;
  hours: number;
  revenue: number;
  isHsh: boolean;
}

export interface TrialStat {
  id: string;
  name: string;
  client: string;
  hours: number;
  revenue: number;
}

export interface PipelineStageStat {
  name: string;
  count: number;
  value: number;
}

export interface DashboardAggregates {
  // Financial
  revenueYtd: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueChange: number; // % change month-on-month
  revenuePerTrialYtd: number;
  outstandingAmount: number;
  outstandingCount: number;
  unbilledAmount: number;
  unbilledHours: number;
  recentInvoices: RecentInvoice[];

  // Trials / pipeline
  trialsActive: number;
  trialsUpcoming: number;
  trialsYtdCount: number;
  dealsActive: number;
  pipelineValue: number;
  pipelineWeighted: number;
  dealsByStage: PipelineStageStat[];
  upcomingTrials: UpcomingTrial[];
  recentlyWonDeals: RecentlyWonDeal[];
  trialStats: TrialStat[];

  // Clients
  clientsActive: number;
  clientsTotal: number;
  clientsRecentCount: number; // added in last 30 days

  // Team
  teamActive: number;
  weeklyTeamStats: TeamStat[];
  monthlyTeamStats: TeamStat[];
  avgHoursPerConsultantWeek: number;
  activeConsultantsCount: number;

  // Marketplace
  openHshPosts: number;
  activeHshGigs: number;

  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Zero baseline — returned while loading or when tables absent
// ---------------------------------------------------------------------------

const ZERO: DashboardAggregates = {
  revenueYtd: 0,
  revenueThisMonth: 0,
  revenueLastMonth: 0,
  revenueChange: 0,
  revenuePerTrialYtd: 0,
  outstandingAmount: 0,
  outstandingCount: 0,
  unbilledAmount: 0,
  unbilledHours: 0,
  recentInvoices: [],
  trialsActive: 0,
  trialsUpcoming: 0,
  trialsYtdCount: 0,
  dealsActive: 0,
  pipelineValue: 0,
  pipelineWeighted: 0,
  dealsByStage: [],
  upcomingTrials: [],
  recentlyWonDeals: [],
  trialStats: [],
  clientsActive: 0,
  clientsTotal: 0,
  clientsRecentCount: 0,
  teamActive: 0,
  weeklyTeamStats: [],
  monthlyTeamStats: [],
  avgHoursPerConsultantWeek: 0,
  activeConsultantsCount: 0,
  openHshPosts: 0,
  activeHshGigs: 0,
  isLoading: true,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safe query — returns empty array when the table doesn't exist. */
async function safeQuery<T extends Record<string, unknown>>(
  db: Awaited<ReturnType<typeof getLocalDB>>,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  try {
    const { rows } = await db.query<T>(sql, params);
    return rows;
  } catch {
    return [];
  }
}

function isoStart(d: Date): string {
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDashboardAggregates(): DashboardAggregates {
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  // Subscribe to graph store so we re-run when entity graph changes
  const graphVersion = useGraphStore(
    useShallow((s) => Object.keys(s.entities).join(',')),
  );

  const [result, setResult] = useState<DashboardAggregates>(ZERO);

  const compute = useCallback(async () => {
    if (!companyId) {
      setResult({ ...ZERO, isLoading: false });
      return;
    }

    let db: Awaited<ReturnType<typeof getLocalDB>>;
    try {
      db = await getLocalDB();
    } catch {
      setResult({ ...ZERO, isLoading: false });
      return;
    }

    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);

    // ── Trials ─────────────────────────────────────────────────────────────
    // We query the view / merged table used by the entity graph.
    // PGlite table name convention: `<entity>_synced` (or just `trial` if a view).
    // We try `trial` first (view), then `trial_synced`.

    type TrialRow = {
      id: string;
      case_name: string | null;
      company_id: string | null;
      pipeline_stage_id: string | null;
      completion_type: string | null;
      start_date: string | null;
      won_date: string | null;
      estimated_value: number | null;
      client_id: string | null;
    };

    const trials = await safeQuery<TrialRow>(
      db,
      `SELECT id, case_name, company_id, pipeline_stage_id, completion_type,
              start_date, won_date, estimated_value, client_id
       FROM trial WHERE company_id = $1`,
      [companyId],
    );

    // ── Pipeline stages ────────────────────────────────────────────────────
    type StageRow = {
      id: string;
      name: string | null;
      stage_type: string | null;
      revenue_probability: number | null;
      is_active: boolean | null;
    };

    // V2 schema: pipeline_stage info lives in entity_metadata.extra
    // Try the entity_metadata + metadata_type join
    type MetaRow = {
      id: string;
      name: string | null;
      extra: Record<string, unknown> | null;
    };

    const metaRows = await safeQuery<MetaRow>(
      db,
      `SELECT em.id, mt.name, em.extra
       FROM entity_metadata em
       JOIN metadata_type mt ON mt.id = em.metadata_type_id
       WHERE mt.scope = 'pipeline_stage'
         AND (mt.company_id = $1 OR mt.company_id IS NULL)`,
      [companyId],
    );

    // Also try a direct pipeline_stage table if it exists
    const directStages = await safeQuery<StageRow>(
      db,
      `SELECT id, name, stage_type, revenue_probability, is_active
       FROM pipeline_stage WHERE company_id = $1 AND is_active = true`,
      [companyId],
    );

    interface StageInfo {
      name: string;
      type: string;
      probability: number;
    }

    const stageById = new Map<string, StageInfo>();

    // Prefer direct stages if available
    if (directStages.length > 0) {
      for (const s of directStages) {
        stageById.set(s.id, {
          name: s.name ?? '',
          type: s.stage_type ?? '',
          probability: Number(s.revenue_probability ?? 1),
        });
      }
    } else {
      // Fall back to entity_metadata.extra
      for (const m of metaRows) {
        const stageId = (m.extra?.legacy_id as string | undefined) ?? m.id;
        if (!stageId) continue;
        stageById.set(stageId, {
          name: m.name ?? ((m.extra?.name as string | undefined) ?? ''),
          type: (m.extra?.type as string | undefined) ?? '',
          probability: Number((m.extra?.revenue_probability ?? 1) as number) || 1,
        });
      }
    }

    // ── Derived trial metrics ───────────────────────────────────────────────
    const nowMs = now.getTime();
    const yearStartMs = yearStart.getTime();
    let trialsActive = 0;
    let trialsUpcoming = 0;
    let dealsActive = 0;
    let pipelineValue = 0;
    let pipelineWeighted = 0;
    const dealsByStageMap = new Map<string, { name: string; count: number; value: number }>();
    const upcomingTrials: UpcomingTrial[] = [];
    const recentlyWonDeals: RecentlyWonDeal[] = [];
    let trialsYtdCount = 0;

    for (const t of trials) {
      if (t.completion_type) continue;
      const stage = t.pipeline_stage_id ? stageById.get(t.pipeline_stage_id) : undefined;

      if (stage?.type === 'operations') {
        trialsActive += 1;
        if (t.start_date && new Date(t.start_date).getTime() > nowMs) {
          trialsUpcoming += 1;
          upcomingTrials.push({
            id: t.id,
            case_name: t.case_name,
            start_date: t.start_date,
            client_id: t.client_id,
            client_firm_name: null, // enriched below
          });
        }
      } else if (stage?.type === 'sales') {
        dealsActive += 1;
        const value = Number(t.estimated_value ?? 0) || 0;
        pipelineValue += value;
        pipelineWeighted += value * stage.probability;
        const stageId = t.pipeline_stage_id!;
        const existing = dealsByStageMap.get(stageId);
        if (existing) {
          existing.count += 1;
          existing.value += value;
        } else {
          dealsByStageMap.set(stageId, { name: stage.name, count: 1, value });
        }
      }

      if (t.won_date && new Date(t.won_date).getTime() >= yearStartMs) {
        trialsYtdCount += 1;
        recentlyWonDeals.push({ id: t.id, case_name: t.case_name, won_date: t.won_date });
      }
    }

    const dealsByStage: PipelineStageStat[] = Array.from(dealsByStageMap.values());
    recentlyWonDeals.sort((a, b) => (b.won_date ?? '').localeCompare(a.won_date ?? '')).splice(3);
    upcomingTrials.sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? '')).splice(5);

    // ── Clients ─────────────────────────────────────────────────────────────
    type ClientRow = { id: string; firm_name: string | null; status: string | null; created_at: string | null };
    const clients = await safeQuery<ClientRow>(
      db,
      `SELECT id, firm_name, status, created_at FROM client WHERE company_id = $1`,
      [companyId],
    );
    const clientsTotal = clients.length;
    const clientsActive = clients.filter((c) => c.status === 'active').length;
    const clientsRecentCount = clients.filter(
      (c) => c.created_at && new Date(c.created_at).getTime() >= thirtyDaysAgo.getTime(),
    ).length;

    // Enrich upcoming trials with client firm_name
    const clientMap = new Map(clients.map((c) => [c.id, c.firm_name]));
    for (const ut of upcomingTrials) {
      if (ut.client_id) ut.client_firm_name = clientMap.get(ut.client_id) ?? null;
    }

    // ── Invoices ────────────────────────────────────────────────────────────
    type InvoiceRow = {
      id: string;
      invoice_number: string | null;
      total: number | null;
      status: string | null;
      invoice_date: string | null;
    };
    const invoices = await safeQuery<InvoiceRow>(
      db,
      `SELECT id, invoice_number, total, status, invoice_date
       FROM invoice WHERE company_id = $1`,
      [companyId],
    );

    const yearStartIso = isoStart(yearStart);
    const monthStartIso = isoStart(monthStart);
    const nextMonthStartIso = isoStart(nextMonthStart);
    const lastMonthStartIso = isoStart(lastMonthStart);
    const lastMonthEndIso = isoStart(lastMonthEnd);

    const revenueYtd = invoices
      .filter((i) => i.invoice_date && i.invoice_date >= yearStartIso)
      .reduce((s, i) => s + (Number(i.total) || 0), 0);

    const revenueThisMonth = invoices
      .filter((i) => i.invoice_date && i.invoice_date >= monthStartIso && i.invoice_date < nextMonthStartIso)
      .reduce((s, i) => s + (Number(i.total) || 0), 0);

    const revenueLastMonth = invoices
      .filter((i) => i.invoice_date && i.invoice_date >= lastMonthStartIso && i.invoice_date <= lastMonthEndIso)
      .reduce((s, i) => s + (Number(i.total) || 0), 0);

    const revenueChange =
      revenueLastMonth > 0
        ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
        : 0;

    const outstandingInvs = invoices.filter(
      (i) => i.status === 'sent' || i.status === 'overdue',
    );
    const outstandingAmount = outstandingInvs.reduce((s, i) => s + (Number(i.total) || 0), 0);
    const outstandingCount = outstandingInvs.length;

    const recentInvoices: RecentInvoice[] = invoices
      .filter((i) => i.invoice_date)
      .sort((a, b) => (b.invoice_date ?? '').localeCompare(a.invoice_date ?? ''))
      .slice(0, 5)
      .map((i) => ({
        id: i.id,
        invoice_number: i.invoice_number,
        total: Number(i.total) || 0,
        status: i.status,
        invoice_date: i.invoice_date,
      }));

    const revenuePerTrialYtd = trialsYtdCount > 0 ? revenueYtd / trialsYtdCount : 0;

    // ── Time entries ────────────────────────────────────────────────────────
    type TimeRow = {
      id: string;
      consultant_id: string | null;
      trial_id: string | null;
      start_time: string | null;
      duration_hours: number | null;
      amount: number | null;
      status: string | null;
      invoice_id: string | null;
    };
    const timeEntries = await safeQuery<TimeRow>(
      db,
      `SELECT id, consultant_id, trial_id, start_time, duration_hours, amount, status, invoice_id
       FROM time_entry WHERE company_id = $1`,
      [companyId],
    );

    const unbilledTime = timeEntries.filter(
      (t) => t.status === 'approved' && !t.invoice_id,
    );
    const unbilledAmount = unbilledTime.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const unbilledHours = unbilledTime.reduce((s, t) => s + (Number(t.duration_hours) || 0), 0);

    // ── Team (user_info) ─────────────────────────────────────────────────────
    type UserInfoRow = {
      id: string;
      first_name: string | null;
      last_name: string | null;
      status: string | null;
    };
    const userInfos = await safeQuery<UserInfoRow>(
      db,
      `SELECT id, first_name, last_name, status FROM user_info WHERE company_id = $1`,
      [companyId],
    );
    const activeConsultants = userInfos.filter((u) => u.status === 'active');
    const activeConsultantsCount = activeConsultants.length;
    const teamActive = activeConsultantsCount;

    // Weekly team stats
    const weekStartIso = isoStart(weekStart);
    const weeklyTimeEntries = timeEntries.filter(
      (t) => t.start_time && t.start_time >= weekStartIso,
    );
    const weeklyTeamStats: TeamStat[] = activeConsultants.map((c) => {
      const entries = weeklyTimeEntries.filter((t) => t.consultant_id === c.id);
      return {
        name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Unknown',
        hours: entries.reduce((s, t) => s + (Number(t.duration_hours) || 0), 0),
        revenue: entries.reduce((s, t) => s + (Number(t.amount) || 0), 0),
        isHsh: false,
      };
    });

    const avgHoursPerConsultantWeek =
      activeConsultantsCount > 0
        ? weeklyTimeEntries.reduce((s, t) => s + (Number(t.duration_hours) || 0), 0) /
          activeConsultantsCount
        : 0;

    // Monthly team stats
    const monthlyTimeEntries = timeEntries.filter(
      (t) => t.start_time && t.start_time >= monthStartIso && t.start_time < nextMonthStartIso,
    );
    const monthlyTeamStats: TeamStat[] = activeConsultants.map((c) => {
      const entries = monthlyTimeEntries.filter((t) => t.consultant_id === c.id);
      return {
        name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Unknown',
        hours: entries.reduce((s, t) => s + (Number(t.duration_hours) || 0), 0),
        revenue: entries.reduce((s, t) => s + (Number(t.amount) || 0), 0),
        isHsh: false,
      };
    });

    // Trial performance stats (active trials only, all-time)
    const trialStats: TrialStat[] = trials
      .filter((t) => {
        if (t.completion_type) return false;
        const stage = t.pipeline_stage_id ? stageById.get(t.pipeline_stage_id) : undefined;
        return stage?.type === 'operations';
      })
      .map((t) => {
        const trialTime = timeEntries.filter((te) => te.trial_id === t.id);
        return {
          id: t.id,
          name: t.case_name ?? 'Unknown',
          client: clientMap.get(t.client_id ?? '') ?? 'Unknown',
          hours: trialTime.reduce((s, te) => s + (Number(te.duration_hours) || 0), 0),
          revenue: trialTime.reduce((s, te) => s + (Number(te.amount) || 0), 0),
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    // ── Marketplace / subcontract ────────────────────────────────────────────
    type SubReqRow = { id: string; status: string | null };
    const subRequests = await safeQuery<SubReqRow>(
      db,
      `SELECT id, status FROM subcontract_request WHERE company_id = $1`,
      [companyId],
    );
    const openHshPosts = subRequests.filter((r) => r.status === 'open').length;

    type SubAssignRow = { id: string };
    const subAssignments = await safeQuery<SubAssignRow>(
      db,
      `SELECT id FROM subcontract_assignment WHERE subcontractor_company_id = $1 AND status = 'active'`,
      [companyId],
    );
    const activeHshGigs = subAssignments.length;

    setResult({
      revenueYtd,
      revenueThisMonth,
      revenueLastMonth,
      revenueChange,
      revenuePerTrialYtd,
      outstandingAmount,
      outstandingCount,
      unbilledAmount,
      unbilledHours,
      recentInvoices,
      trialsActive,
      trialsUpcoming,
      trialsYtdCount,
      dealsActive,
      pipelineValue,
      pipelineWeighted,
      dealsByStage,
      upcomingTrials,
      recentlyWonDeals,
      trialStats,
      clientsActive,
      clientsTotal,
      clientsRecentCount,
      teamActive,
      weeklyTeamStats,
      monthlyTeamStats,
      avgHoursPerConsultantWeek,
      activeConsultantsCount,
      openHshPosts,
      activeHshGigs,
      isLoading: false,
    });
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Run on mount, every 30 s, and when graph changes
  useEffect(() => {
    void compute();
    const timer = setInterval(() => { void compute(); }, 30_000);
    return () => clearInterval(timer);
  }, [compute, graphVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  return result;
}
