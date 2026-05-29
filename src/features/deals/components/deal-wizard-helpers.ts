/**
 * deal-wizard-helpers.ts — pure helpers extracted from deal-wizard.tsx to keep
 * the component under the RULE A 800-line limit. No React, no I/O (RULE J).
 *
 *   • hydrateServiceInstances — edit-mode reconstruction of the wizard's
 *     pre/in-trial service-instance arrays + detected rate overrides from the
 *     saved `trial_service` rows.
 *   • the derived client/contact list filters (sales-scoped clients, FRP
 *     clients, client/FRP contacts, sales consultants).
 *
 * HotSeatersMVP is the bible.
 */

import { parseISO } from 'date-fns';
import { MS_PER_DAY } from '@/features/deals/business-rules/build-trial-services';
import type { ServiceRecord } from '@/features/company/hooks/use-services';
import type { ClientRow } from '@/features/clients/stores/clients-store';
import type { AttorneyRow } from '@/features/lead-radar/stores/lead-radar-store';
import type { LookupRow } from '@/shared/db/lookups-selectors';
import type { TrialService, TrialSegment } from '@/features/trials/entities';
import type { DealWizardConsultant } from '@/features/deals/hooks/use-deal-wizard-data';
import type { ClientServiceOverrideRow } from '@/features/clients/stores/clients-store';
import type { PreTrialServiceInstance, InTrialServiceInstance } from './deal-wizard-types';

/** Rate-drift epsilon: a saved rate this far off the computed rate is an override. */
const RATE_EPSILON = 0.01;

// ── Pricing leaf calcs (pure; the component supplies the live deps) ──

/** Resolve a service rate: instance override → client override → client-type multiplier. */
export function resolveRate(params: {
  serviceId: string;
  baseRate: number;
  clientId: string;
  instanceId: number | string | null;
  overriddenRates: Record<string, number>;
  clientOverrides: ClientServiceOverrideRow[];
  clients: ClientRow[];
  clientTypes: LookupRow[];
}): number {
  const { serviceId, baseRate, clientId, instanceId, overriddenRates, clientOverrides, clients, clientTypes } =
    params;
  if (instanceId !== null && overriddenRates[String(instanceId)] !== undefined) {
    return overriddenRates[String(instanceId)]!;
  }
  if (clientId) {
    const override = clientOverrides.find((o) => o.service_id === serviceId);
    if (override && override.custom_rate != null) {
      return typeof override.custom_rate === 'number'
        ? override.custom_rate
        : parseFloat(override.custom_rate) || baseRate;
    }
  }
  const client = clients.find((c) => c.id === clientId);
  const clientType = clientTypes.find((t) => t.id === client?.client_type_id);
  return baseRate * (clientType?.multiplier || 1);
}

/** Inclusive day count between two ISO dates; weekdays-only when !billForWeekends. */
export function countDays(start: string, end: string, billForWeekends: boolean): number {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  let total = Math.ceil((e.getTime() - s.getTime()) / MS_PER_DAY) + 1;
  if (!billForWeekends) {
    let wc = 0;
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) wc++;
    }
    total = wc;
  }
  return total;
}

/** Travel cost: eligible hours × rate × travel multiplier (0 when not eligible). */
export function travelCost(
  inst: { travel_eligible?: boolean | undefined; estimated_travel_hours?: number | null | undefined },
  svcRate: number,
  travelMultiplier: number,
): number {
  return inst.travel_eligible && (inst.estimated_travel_hours ?? 0) > 0
    ? (inst.estimated_travel_hours ?? 0) * svcRate * travelMultiplier
    : 0;
}

/** Pre-trial subtotal: Σ rate × quantity + travel cost over the pre-trial instances. */
export function computePreTrialSubtotal(params: {
  instances: PreTrialServiceInstance[];
  services: ServiceRecord[];
  clientId: string;
  rateFor: (serviceId: string, baseRate: number, clientId: string, instanceId: number | string) => number;
  travelCostFor: (inst: PreTrialServiceInstance, svcRate: number) => number;
}): number {
  const { instances, services, clientId, rateFor, travelCostFor } = params;
  return instances.reduce((sum, ps) => {
    const svc = services.find((s) => s.id === ps.service_id);
    if (!svc) return sum;
    const r = rateFor(svc.id, svc.base_rate, clientId, ps.id);
    return sum + r * (ps.quantity || 1) + travelCostFor(ps, r);
  }, 0);
}

export interface HydratedServiceInstances {
  preList: PreTrialServiceInstance[];
  inList: InTrialServiceInstance[];
  detectedOverrides: Record<string, number>;
}

/**
 * Reconstruct the wizard's pre/in-trial service-instance arrays from the saved
 * `trial_service` rows for the trial being edited. Mirrors the bible
 * DealWizard.jsx edit-mode service-hydration block exactly.
 */
export function hydrateServiceInstances(params: {
  rows: TrialService[];
  trialId: string;
  trialStartDate: string | null | undefined;
  trialClientId: string | null | undefined;
  services: ServiceRecord[];
  trialSegments: TrialSegment[];
  calculateRate: (
    serviceId: string,
    baseRate: number,
    clientId: string,
    instanceId: number | string | null,
  ) => number;
}): HydratedServiceInstances {
  const { rows, trialId, trialStartDate, trialClientId, services, trialSegments, calculateRate } =
    params;

  const sorted = rows
    .filter((ts) => ts.trial_id === trialId)
    .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));

  const preList: PreTrialServiceInstance[] = [];
  const inList: InTrialServiceInstance[] = [];
  const detectedOverrides: Record<string, number> = {};

  sorted.forEach((ts) => {
    const service = services.find((s) => s.id === ts.service_id);
    if (!service) return;
    const expectedRate = calculateRate(service.id, service.base_rate, trialClientId || '', null);
    if (ts.rate != null && Math.abs(ts.rate - expectedRate) > RATE_EPSILON) {
      detectedOverrides[ts.id] = ts.rate;
    }
    const phase =
      ts.service_phase ||
      (ts.final_billing_method === 'split'
        ? 'split'
        : ts.final_billing_method === 'hourly'
          ? 'pre_trial'
          : 'in_trial');
    const seg = ts.segment_id ? trialSegments.find((s) => s.id === ts.segment_id) : null;
    const segStart = seg?.start_date || trialStartDate || '';

    if (phase === 'split') {
      const leadDays =
        segStart && ts.start_date
          ? Math.floor((parseISO(segStart).getTime() - parseISO(ts.start_date).getTime()) / MS_PER_DAY)
          : (service.default_lead_days ?? 0);
      preList.push({
        id: ts.id,
        service_id: ts.service_id ?? '',
        quantity: ts.pre_trial_estimated_hours ?? 1,
        lead_days: leadDays,
        split_billing: true,
        custom_description: ts.custom_description ?? '',
        travel_eligible: ts.travel_eligible || false,
        estimated_travel_hours: ts.estimated_travel_hours ?? 0,
        segment_id: ts.segment_id ?? null,
      });
      inList.push({
        id: ts.id,
        service_id: ts.service_id ?? '',
        arrival_date: ts.start_date !== segStart ? ts.start_date : null,
        split_billing: true,
        pre_trial_hours: ts.pre_trial_estimated_hours ?? 1,
        start_date: ts.start_date,
        end_date: ts.end_date,
        custom_description: ts.custom_description ?? '',
        travel_eligible: ts.travel_eligible || false,
        estimated_travel_hours: ts.estimated_travel_hours ?? 0,
        segment_id: ts.segment_id ?? null,
      });
    } else if (phase === 'in_trial') {
      inList.push({
        id: ts.id,
        service_id: ts.service_id ?? '',
        arrival_date: ts.start_date !== segStart ? ts.start_date : null,
        split_billing: false,
        end_date: ts.end_date,
        quantity: ts.final_billing_method === 'hourly' ? (ts.estimated_quantity ?? 1) : undefined,
        // Preserve the in-trial offset (bible DealWizard.jsx ~L377) so
        // buildTrialServices recomputes the correct start_date on next save.
        days_before_trial: ts.days_before_trial ?? undefined,
        custom_description: ts.custom_description ?? '',
        travel_eligible: ts.travel_eligible || false,
        estimated_travel_hours: ts.estimated_travel_hours ?? 0,
        segment_id: ts.segment_id ?? null,
      });
    } else {
      const leadDays =
        segStart && ts.start_date
          ? Math.floor((parseISO(segStart).getTime() - parseISO(ts.start_date).getTime()) / MS_PER_DAY)
          : (service.default_lead_days ?? 0);
      const durationDays =
        ts.start_date && ts.end_date
          ? Math.floor((parseISO(ts.end_date).getTime() - parseISO(ts.start_date).getTime()) / MS_PER_DAY) + 1
          : (service.default_duration_days ?? 1);
      preList.push({
        id: ts.id,
        service_id: ts.service_id ?? '',
        quantity: ts.estimated_quantity ?? 1,
        lead_days: leadDays,
        duration_days: durationDays,
        split_billing: false,
        start_date: ts.start_date,
        end_date: ts.end_date,
        custom_description: ts.custom_description ?? '',
        travel_eligible: ts.travel_eligible || false,
        estimated_travel_hours: ts.estimated_travel_hours ?? 0,
        segment_id: ts.segment_id ?? null,
      });
    }
  });

  return { preList, inList, detectedOverrides };
}

// ── Derived client/contact list filters (bible DealWizard.jsx) ──

/** Sales leads: owner/admin/sales role + active status. */
export function filterSalesConsultants(
  consultants: DealWizardConsultant[],
): DealWizardConsultant[] {
  return consultants.filter(
    (c) => ['owner', 'admin', 'sales'].includes(c.company_role ?? '') && c.status === 'active',
  );
}

/** Clients scoped to the chosen sales lead (plus the currently-selected client). */
export function filterClientsForLead(
  clients: ClientRow[],
  consultantId: string,
  selectedClientId: string,
): ClientRow[] {
  return consultantId
    ? clients.filter((c) => c.id === selectedClientId || c.sales_lead === consultantId)
    : clients;
}

/** Clients whose client-type is the Financially Responsible Party. */
export function filterFrpClients(clients: ClientRow[], clientTypes: LookupRow[]): ClientRow[] {
  return clients.filter((c) => {
    const ct = clientTypes.find((t) => t.id === c.client_type_id);
    return ct?.name === 'Financially Responsible Party';
  });
}

/** Attorneys (contacts) belonging to a given client. */
export function filterContactsForClient(attorneys: AttorneyRow[], clientId: string): AttorneyRow[] {
  return attorneys.filter((a) => a.client_id === clientId);
}
