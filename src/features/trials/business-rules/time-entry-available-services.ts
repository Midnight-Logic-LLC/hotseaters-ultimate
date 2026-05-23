/**
 * time-entry-available-services.ts — TypeScript port of
 * HotSeatersMVP/src/lib/timeEntryAvailableServices.js (the bible).
 *
 * Pure function. Builds the list of services shown in the service-selector
 * dropdown for a given TimeEntry, based on entry_type and the trial's
 * TrialServiceAssignments / TrialServices / SubcontractAssignments.
 *
 * See MVP file header for the key-shape rules.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

export interface AvailEntry {
  entry_type?: 'regular' | 'subcontractor' | 'hiring_company' | string | null;
  trial_id?: string | null;
  consultant_id?: string | null;
  service_id?: string | null;
  trial_service_id?: string | null;
  original_trial_service_id?: string | null;
}

export interface AvailService {
  id: string;
  name?: string | null;
  base_rate?: number | null;
  is_active?: boolean | null;
  travel_multiplier?: number | null;
}

export interface AvailTrialService {
  id: string;
  trial_id?: string | null;
  service_id?: string | null;
  rate?: number | null;
  travel_eligible?: boolean | null;
}

export interface AvailTrialServiceAssignment {
  trial_id?: string | null;
  consultant_id?: string | null;
  trial_service_id: string;
}

export interface AvailSubcontractAssignment {
  id: string;
  consultant_id?: string | null;
  trial_id?: string | null;
  status?: string | null;
  mapped_service_id?: string | null;
  agreed_rate?: number | null;
  trial_service_id?: string | null;
}

export interface AvailServiceItem {
  id: string;
  name?: string | null;
  base_rate?: number | null;
  is_active?: boolean | null;
  travel_multiplier?: number | null;
  _virtualId?: string;
  _trialServiceId?: string;
  _subcontractAssignmentId?: string;
  isTravelTime?: boolean;
  originalTrialServiceId?: string;
  trialService?: AvailTrialService;
  subcontractAssignment?: AvailSubcontractAssignment;
}

export interface GetAvailableServicesOptions {
  services: AvailService[];
  trialServices: AvailTrialService[];
  trialServiceAssignments: AvailTrialServiceAssignment[];
  subcontractAssignments: AvailSubcontractAssignment[];
}

export function getAvailableServicesForEntry(
  entry: AvailEntry,
  {
    services,
    trialServices,
    trialServiceAssignments,
    subcontractAssignments,
  }: GetAvailableServicesOptions,
): AvailServiceItem[] {
  const travelTimeService = services.find((s) => s.name === 'Travel Time');

  // ── hiring_company ──────────────────────────────────────────────────────
  if (entry.entry_type === 'hiring_company') {
    const trialTS = trialServices.filter((ts) => ts.trial_id === entry.trial_id);
    const result: AvailServiceItem[] = [];
    const seen = new Set<string>();
    for (const ts of trialTS) {
      if (seen.has(ts.id)) continue;
      seen.add(ts.id);
      const svc = services.find((s) => s.id === ts.service_id);
      if (svc && svc.is_active !== false) {
        result.push({
          ...svc,
          _trialServiceId: ts.id,
          _virtualId: `ts-${ts.id}`,
          base_rate: ts.rate ?? svc.base_rate ?? null,
          trialService: ts,
        });
      }
    }
    if (travelTimeService) {
      for (const ts of trialTS) {
        if (ts.travel_eligible) {
          const parent = services.find((s) => s.id === ts.service_id);
          if (parent) {
            result.push({
              ...travelTimeService,
              _virtualId: `travel-${ts.id}`,
              name: `Travel Time for ${parent.name}`,
              isTravelTime: true,
              originalTrialServiceId: ts.id,
              base_rate:
                (ts.rate ?? parent.base_rate ?? 0) *
                (travelTimeService.travel_multiplier ?? 1.0),
              trialService: ts,
            });
          }
        }
      }
    }
    if (
      entry.trial_service_id &&
      !entry.original_trial_service_id &&
      !result.find((s) => s._trialServiceId === entry.trial_service_id)
    ) {
      const ts = trialServices.find((t) => t.id === entry.trial_service_id);
      const svc = ts ? services.find((s) => s.id === ts.service_id) : null;
      if (ts && svc) {
        result.push({
          ...svc,
          _trialServiceId: ts.id,
          _virtualId: `ts-${ts.id}`,
          base_rate: ts.rate ?? svc.base_rate ?? null,
          trialService: ts,
        });
      }
    }
    if (
      entry.original_trial_service_id &&
      travelTimeService &&
      !result.find(
        (s) =>
          s.isTravelTime &&
          s.originalTrialServiceId === entry.original_trial_service_id,
      )
    ) {
      const parentTs = trialServices.find(
        (ts) => ts.id === entry.original_trial_service_id,
      );
      if (parentTs?.travel_eligible) {
        const parent = parentTs
          ? services.find((s) => s.id === parentTs.service_id)
          : null;
        result.push({
          ...travelTimeService,
          _virtualId: `travel-${entry.original_trial_service_id}`,
          name: `Travel Time for ${parent?.name ?? 'Unknown'}`,
          isTravelTime: true,
          originalTrialServiceId: entry.original_trial_service_id ?? undefined,
          base_rate:
            (parentTs?.rate ?? parent?.base_rate ?? 0) *
            (travelTimeService.travel_multiplier ?? 1.0),
          trialService: parentTs,
        });
      }
    }
    return result;
  }

  // ── subcontractor ───────────────────────────────────────────────────────
  if (entry.entry_type === 'subcontractor') {
    const seenAssignmentIds = new Set<string>();
    const relevantAssignments = subcontractAssignments.filter((a) => {
      if (
        a.consultant_id !== entry.consultant_id ||
        a.trial_id !== entry.trial_id ||
        a.status !== 'active'
      )
        return false;
      if (seenAssignmentIds.has(a.id)) return false;
      seenAssignmentIds.add(a.id);
      return true;
    });

    const result: AvailServiceItem[] = [];
    for (const a of relevantAssignments) {
      if (!a.mapped_service_id) continue;
      const svc = services.find((s) => s.id === a.mapped_service_id);
      if (!svc) continue;
      result.push({
        ...svc,
        _virtualId: `sa-${a.id}`,
        _subcontractAssignmentId: a.id,
        base_rate: a.agreed_rate ?? null,
        subcontractAssignment: a,
      });
    }

    if (travelTimeService) {
      for (const a of relevantAssignments) {
        const ts = trialServices.find((t) => t.id === a.trial_service_id);
        if (ts?.travel_eligible) {
          const parent = services.find((s) => s.id === a.mapped_service_id);
          if (parent) {
            result.push({
              ...travelTimeService,
              _virtualId: `travel-sa-${a.id}`,
              _subcontractAssignmentId: a.id,
              name: `Travel Time for ${parent.name}`,
              isTravelTime: true,
              originalTrialServiceId: ts.id,
              base_rate:
                (a.agreed_rate ?? ts.rate ?? parent.base_rate ?? 0) *
                (travelTimeService.travel_multiplier ?? 1.0),
              subcontractAssignment: a,
            });
          }
        }
      }
    }

    if (
      entry.service_id &&
      !entry.original_trial_service_id &&
      !result.find((s) => s.id === entry.service_id)
    ) {
      const currentService = services.find((s) => s.id === entry.service_id);
      if (currentService) result.push(currentService);
    }
    if (
      entry.original_trial_service_id &&
      travelTimeService &&
      !result.find(
        (s) =>
          s.isTravelTime &&
          s.originalTrialServiceId === entry.original_trial_service_id,
      )
    ) {
      const parentTs = trialServices.find(
        (ts) => ts.id === entry.original_trial_service_id,
      );
      if (parentTs?.travel_eligible) {
        const parent = parentTs
          ? services.find((s) => s.id === parentTs.service_id)
          : null;
        result.push({
          ...travelTimeService,
          _virtualId: `travel-${entry.original_trial_service_id}`,
          name: `Travel Time for ${parent?.name ?? 'Unknown'}`,
          isTravelTime: true,
          originalTrialServiceId: entry.original_trial_service_id ?? undefined,
          base_rate:
            (parentTs?.rate ?? parent?.base_rate ?? 0) *
            (travelTimeService.travel_multiplier ?? 1.0),
        });
      }
    }
    return result;
  }

  // ── regular ─────────────────────────────────────────────────────────────
  const assignedTrialServiceIds = trialServiceAssignments
    .filter(
      (a) =>
        a.trial_id === entry.trial_id && a.consultant_id === entry.consultant_id,
    )
    .map((a) => a.trial_service_id);
  const assignedTrialServices = trialServices.filter((ts) =>
    assignedTrialServiceIds.includes(ts.id),
  );

  const seenTsIds = new Set<string>();
  const result: AvailServiceItem[] = [];
  for (const ts of assignedTrialServices) {
    if (seenTsIds.has(ts.id)) continue;
    seenTsIds.add(ts.id);
    const svc = services.find((s) => s.id === ts.service_id);
    if (svc && svc.is_active !== false) {
      result.push({
        ...svc,
        _trialServiceId: ts.id,
        _virtualId: `ts-${ts.id}`,
        base_rate: ts.rate ?? svc.base_rate ?? null,
        trialService: ts,
      });
    }
  }

  if (travelTimeService) {
    for (const ts of assignedTrialServices.filter((t) => t.travel_eligible)) {
      const parent = services.find((s) => s.id === ts.service_id);
      if (parent) {
        result.push({
          ...travelTimeService,
          _virtualId: `travel-${ts.id}`,
          name: `Travel Time for ${parent.name}`,
          isTravelTime: true,
          originalTrialServiceId: ts.id,
          base_rate:
            (ts.rate ?? parent.base_rate ?? 0) *
            (travelTimeService.travel_multiplier ?? 1.0),
          trialService: ts,
        });
      }
    }
  }

  if (
    entry.service_id &&
    !entry.original_trial_service_id &&
    !result.find((s) => s.id === entry.service_id || s._trialServiceId)
  ) {
    const fallbackTs = trialServices.find(
      (ts) =>
        ts.trial_id === entry.trial_id && ts.service_id === entry.service_id,
    );
    if (fallbackTs) {
      const currentService = services.find((s) => s.id === entry.service_id);
      if (currentService) {
        result.push({
          ...currentService,
          _trialServiceId: fallbackTs.id,
          _virtualId: `ts-${fallbackTs.id}`,
          base_rate: fallbackTs.rate ?? currentService.base_rate ?? null,
          trialService: fallbackTs,
        });
      }
    } else {
      const currentService = services.find((s) => s.id === entry.service_id);
      if (currentService) result.push(currentService);
    }
  }

  if (entry.original_trial_service_id && travelTimeService) {
    const hasTravelItem = result.find(
      (s) =>
        s.isTravelTime &&
        s.originalTrialServiceId === entry.original_trial_service_id,
    );
    if (!hasTravelItem) {
      const parentTs = trialServices.find(
        (ts) => ts.id === entry.original_trial_service_id,
      );
      if (parentTs?.travel_eligible) {
        const parent = parentTs
          ? services.find((s) => s.id === parentTs.service_id)
          : null;
        result.push({
          ...travelTimeService,
          _virtualId: `travel-${entry.original_trial_service_id}`,
          name: `Travel Time for ${parent?.name ?? 'Unknown'}`,
          isTravelTime: true,
          originalTrialServiceId: entry.original_trial_service_id ?? undefined,
          base_rate:
            (parentTs?.rate ?? parent?.base_rate ?? 0) *
            (travelTimeService.travel_multiplier ?? 1.0),
        });
      }
    }
  }

  return result;
}
