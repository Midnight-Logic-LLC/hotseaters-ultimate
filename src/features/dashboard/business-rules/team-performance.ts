/**
 * team-performance.ts — weekly + monthly per-consultant aggregation.
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 209–219, 540–577, 617–658.
 *
 * Captures the bible's HSH-subcontractor merge: in addition to staff
 * consultants on the company roster, time entries authored by HSH
 * subcontractors (per `subcontract_assignment.consultant_id`) are
 * folded into the team stats under the assignment's
 * `consultant_first_name` + `consultant_last_name` snapshot.
 *
 * Pure. Caller supplies pre-filtered time entries for the window.
 */

import { parseISO } from 'date-fns';

export interface ConsultantLike {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  status?: string | null;
}

export interface TimeEntryRow {
  consultant_id?: string | null;
  start_time?: string | null;
  trial_id?: string | null;
  duration_hours?: number | null;
  amount?: number | null;
}

export interface SubcontractAssignmentRow {
  consultant_id?: string | null;
  consultant_first_name?: string | null;
  consultant_last_name?: string | null;
  status?: string | null;
}

export interface TeamMemberStat {
  /** Display name. */
  name: string;
  /** Total hours in the window. */
  hours: number;
  /** Total revenue $$ in the window. */
  revenue: number;
  /** True when this row comes from an HSH subcontractor assignment. */
  isHsh: boolean;
}

/** Bible lines 215–217 — narrow time entries to the [start, end] window. */
export function filterTimeEntriesInWindow(
  entries: ReadonlyArray<TimeEntryRow>,
  start: Date,
  end: Date,
): TimeEntryRow[] {
  return entries.filter((t) => {
    if (!t.start_time) return false;
    const d = parseISO(t.start_time);
    return d >= start && d <= end;
  });
}

/** Active consultants only — bible line 209. */
export function activeConsultants<T extends ConsultantLike>(
  consultants: ReadonlyArray<T>,
): T[] {
  return consultants.filter((c) => c.status === 'active');
}

/**
 * Aggregate hours + revenue per active consultant, then merge in HSH
 * subcontractors that authored entries in the window. Bible lines 542–577.
 */
export function aggregateTeamStats(args: {
  consultants: ReadonlyArray<ConsultantLike>;
  windowEntries: ReadonlyArray<TimeEntryRow>;
  subcontractAssignments: ReadonlyArray<SubcontractAssignmentRow>;
}): TeamMemberStat[] {
  const { consultants, windowEntries, subcontractAssignments } = args;
  const active = activeConsultants(consultants);

  // 1) staff consultants
  const staff: TeamMemberStat[] = active.map((c) => {
    const mine = windowEntries.filter((t) => t.consultant_id === c.id);
    return {
      name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Unknown',
      hours: mine.reduce((sum, t) => sum + (t.duration_hours ?? 0), 0),
      revenue: mine.reduce((sum, t) => sum + (t.amount ?? 0), 0),
      isHsh: false,
    };
  });

  // 2) HSH subcontractor consultant ids (any assignment, any status — the
  //    bible uses `subcontract_assignments` unfiltered for ID set, then merges
  //    a per-time-entry assignment lookup for the display name).
  const hshIds = new Set<string>(
    subcontractAssignments
      .map((a) => a.consultant_id)
      .filter((id): id is string => typeof id === 'string'),
  );
  const staffIds = new Set(active.map((c) => c.id));

  const hsh: TeamMemberStat[] = [];
  for (const entry of windowEntries) {
    const cid = entry.consultant_id;
    if (!cid) continue;
    if (staffIds.has(cid)) continue; // already in staff
    if (!hshIds.has(cid)) continue;
    const assignment = subcontractAssignments.find((a) => a.consultant_id === cid);
    if (!assignment) continue;
    const name = `${assignment.consultant_first_name ?? ''} ${assignment.consultant_last_name ?? ''}`.trim() || 'HSH';
    const existing = hsh.find((row) => row.name === name);
    if (existing) {
      existing.hours += entry.duration_hours ?? 0;
      existing.revenue += entry.amount ?? 0;
    } else {
      hsh.push({
        name,
        hours: entry.duration_hours ?? 0,
        revenue: entry.amount ?? 0,
        isHsh: true,
      });
    }
  }

  return [...staff, ...hsh];
}

/**
 * Avg hours per active consultant for the window. Bible lines 218–220.
 * Returns 0 when no active consultants (avoids divide-by-zero).
 */
export function avgHoursPerActiveConsultant(args: {
  consultants: ReadonlyArray<ConsultantLike>;
  windowEntries: ReadonlyArray<TimeEntryRow>;
}): number {
  const active = activeConsultants(args.consultants);
  if (active.length === 0) return 0;
  const total = args.windowEntries.reduce((sum, t) => sum + (t.duration_hours ?? 0), 0);
  return total / active.length;
}

export interface ActiveTrialStat {
  id: string;
  name: string;
  client: string;
  hours: number;
  revenue: number;
}

export interface TrialForStats {
  id: string;
  case_name?: string | null;
  client_id?: string | null;
}

export interface ClientForStats {
  id: string;
  firm_name?: string | null;
}

/** Bible lines 661–670 — hours+revenue per active trial, sorted by revenue desc. */
export function computeActiveTrialStats(args: {
  activeTrials: ReadonlyArray<TrialForStats>;
  timeEntries: ReadonlyArray<TimeEntryRow>;
  clients: ReadonlyArray<ClientForStats>;
}): ActiveTrialStat[] {
  const clientById = new Map(args.clients.map((c) => [c.id, c]));
  return args.activeTrials
    .map((trial) => {
      const mine = args.timeEntries.filter((t) => t.trial_id === trial.id);
      const client = trial.client_id ? clientById.get(trial.client_id) : undefined;
      return {
        id: trial.id,
        name: trial.case_name ?? '',
        client: client?.firm_name ?? 'Unknown',
        hours: mine.reduce((sum, t) => sum + (t.duration_hours ?? 0), 0),
        revenue: mine.reduce((sum, t) => sum + (t.amount ?? 0), 0),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}
