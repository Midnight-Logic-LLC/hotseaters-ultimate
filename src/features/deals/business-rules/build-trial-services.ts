/**
 * build-trial-services.ts — pure port of the bible DealWizard.jsx
 * `buildServicesFromAnswers` + the retainer / estimated-value calc in
 * `handleSaveOrSubmit`. No I/O, no React (RULE J).
 *
 * Turns the wizard's pre-trial / in-trial service-instance arrays into the
 * `trial_service` rows that get persisted, computing each row's dates, billing
 * method, totals and projected-daily-revenue exactly as the bible does.
 *
 * HotSeatersMVP is the bible.
 */

import { format, parseISO, subDays } from 'date-fns';
import { calculateProjectedDailyRevenue } from './pdr-calculations';
import type {
  DealFormData,
  PreTrialServiceInstance,
  InTrialServiceInstance,
} from '@/features/deals/components/deal-wizard-types';

/** Minimal service-registry shape the builder reads. */
export interface BuilderService {
  id: string;
  name: string;
  base_rate: number;
  rate_type?: string | null;
  has_daily_minimum?: boolean;
}

export interface BuilderSegment {
  id: string;
  start_date?: string | null;
  end_date?: string | null;
}

/** A built trial_service row (port equivalent of the bible's `serviceObj`). */
export interface BuiltTrialService {
  id?: string | undefined;
  service_id: string;
  service_name: string;
  custom_description: string;
  rate: number;
  rate_type?: string | null | undefined;
  estimated_quantity: number;
  estimated_total: number;
  start_date?: string | undefined;
  end_date?: string | undefined;
  days_before_trial?: number | null | undefined;
  split_billing_at_threshold?: boolean | undefined;
  pre_trial_estimated_hours?: number | null | undefined;
  final_billing_method: 'hourly' | 'daily_minimum' | 'split';
  service_phase: 'pre_trial' | 'in_trial' | 'split';
  has_daily_minimum?: boolean | undefined;
  is_instance_in_trial: boolean;
  display_order: number;
  travel_eligible: boolean;
  estimated_travel_hours: number | null;
  segment_id: string | null;
  /** Per-service daily-minimum hours snapshot — feeds the PDR daily_min/split branches. */
  dailyMinimumHours?: number | undefined;
  projected_daily_revenue?: number | null | undefined;
  pre_trial_projected_daily_revenue?: number | undefined;
  in_trial_projected_daily_revenue?: number | undefined;
}

export interface BuildContext {
  dealData: DealFormData;
  services: BuilderService[];
  segments: BuilderSegment[];
  preTrialServices: PreTrialServiceInstance[];
  inTrialServices: InTrialServiceInstance[];
  /** Resolves the rate for a service instance (honors overrides). */
  calculateRate: (
    serviceId: string,
    baseRate: number,
    clientId: string,
    instanceId?: number | string | null,
  ) => number;
  /** Effective daily-minimum hours for the trial. */
  dailyMinimumHours: number;
  /** True when editing an operations-stage trial (date floor disabled). */
  isExistingTrial: boolean;
  /** Inclusive day count over the trial range (honors bill-for-weekends). */
  calculateTrialDays: () => number;
  /** Inclusive day count for an in-trial service window. */
  calculateServiceDays: (
    serviceId: string,
    arrivalDate?: string | null,
    segmentId?: string | null,
  ) => number;
  billForWeekends: boolean;
}

function todayFloor(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

/**
 * Build the persisted `trial_service` rows from the wizard's service
 * instances. Port of `buildServicesFromAnswers`.
 */
export function buildTrialServices(ctx: BuildContext): BuiltTrialService[] {
  const {
    dealData,
    services,
    segments,
    preTrialServices,
    inTrialServices,
    calculateRate,
    dailyMinimumHours,
    isExistingTrial,
    calculateServiceDays,
    billForWeekends,
  } = ctx;

  const out: BuiltTrialService[] = [];
  const trialData = {
    start_date: dealData.start_date,
    end_date: dealData.end_date,
    default_daily_minimum_hours: dailyMinimumHours,
  };

  preTrialServices.forEach((data, index) => {
    if (data.split_billing) return; // pre-trial portion of a split lives on the in-trial row
    const service = services.find((s) => s.id === data.service_id);
    if (!service) return;

    const rate = calculateRate(service.id, service.base_rate, dealData.client_id, data.id);
    let startDate: string | undefined;
    let endDate: string | undefined;
    const preSeg = data.segment_id ? segments.find((s) => s.id === data.segment_id) : null;
    const preSegStart = preSeg?.start_date || dealData.start_date;
    if (data.lead_days && preSegStart) {
      const calculatedStartDate = subDays(parseISO(preSegStart), data.lead_days);
      const actualStartDate =
        !isExistingTrial && calculatedStartDate < todayFloor() ? todayFloor() : calculatedStartDate;
      startDate = format(actualStartDate, 'yyyy-MM-dd');
      endDate = data.end_date || format(subDays(parseISO(preSegStart), 1), 'yyyy-MM-dd');
    }

    const serviceObj: BuiltTrialService = {
      ...(typeof data.id === 'string' ? { id: data.id } : {}),
      service_id: service.id,
      service_name: service.name,
      custom_description: data.custom_description || '',
      rate,
      rate_type: service.rate_type,
      estimated_quantity: data.quantity || 1,
      estimated_total: rate * (data.quantity || 1),
      start_date: startDate,
      end_date: endDate,
      final_billing_method: 'hourly',
      service_phase: 'pre_trial',
      has_daily_minimum: service.has_daily_minimum,
      is_instance_in_trial: false,
      dailyMinimumHours,
      display_order: index,
      travel_eligible: data.travel_eligible || false,
      estimated_travel_hours: data.estimated_travel_hours || null,
      segment_id: data.segment_id || null,
    };
    const { pdr } = calculateProjectedDailyRevenue(serviceObj, trialData, segments);
    serviceObj.projected_daily_revenue = pdr !== null ? parseFloat(pdr.toFixed(2)) : null;
    out.push(serviceObj);
  });

  inTrialServices.forEach((data, index) => {
    const service = services.find((s) => s.id === data.service_id);
    if (!service) return;

    const rate = calculateRate(service.id, service.base_rate, dealData.client_id, data.id);
    const useDailyMinimum = service.has_daily_minimum;
    let preTrialHours = data.pre_trial_hours;
    const seg = data.segment_id ? segments.find((s) => s.id === data.segment_id) : null;
    const segStart = seg?.start_date || dealData.start_date;
    const segEnd = seg?.end_date || dealData.end_date;
    let serviceStartDate = data.arrival_date || segStart;

    if (data.split_billing) {
      const matchingPreTrial = preTrialServices.find((pts) => pts.service_id === data.service_id);
      if (matchingPreTrial) {
        preTrialHours = matchingPreTrial.quantity;
        if (matchingPreTrial.lead_days && dealData.start_date) {
          const calculatedStartDate = subDays(parseISO(dealData.start_date), matchingPreTrial.lead_days);
          serviceStartDate = format(
            !isExistingTrial && calculatedStartDate < todayFloor() ? todayFloor() : calculatedStartDate,
            'yyyy-MM-dd',
          );
        }
      }
    }

    let totalHours: number;
    let serviceDays: number;
    if (useDailyMinimum) {
      if (data.split_billing && segStart && data.end_date) {
        const start = new Date(`${segStart}T00:00:00`);
        const end = new Date(`${seg?.end_date || data.end_date}T00:00:00`);
        serviceDays = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
        if (!billForWeekends) {
          let wc = 0;
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            if (d.getDay() !== 0 && d.getDay() !== 6) wc++;
          }
          serviceDays = wc;
        }
      } else {
        serviceDays = calculateServiceDays(data.service_id, data.arrival_date, data.segment_id);
      }
      totalHours = serviceDays * dailyMinimumHours;
    } else {
      totalHours = data.quantity || 1;
      if (data.days_before_trial && segStart) {
        const calculatedStartDate = subDays(parseISO(segStart), data.days_before_trial);
        serviceStartDate = format(
          !isExistingTrial && calculatedStartDate < todayFloor() ? todayFloor() : calculatedStartDate,
          'yyyy-MM-dd',
        );
      }
    }

    let daysBefore: number | null = null;
    if (data.arrival_date && dealData.start_date) {
      const ad = parseISO(data.arrival_date);
      const ts = parseISO(dealData.start_date);
      if (ad < ts) daysBefore = Math.ceil((ts.getTime() - ad.getTime()) / 86400000);
    }

    const finalBillingMethod: BuiltTrialService['final_billing_method'] = data.split_billing
      ? 'split'
      : useDailyMinimum
        ? 'daily_minimum'
        : 'hourly';
    const finalQuantity = data.split_billing ? (preTrialHours || 0) + (totalHours || 0) : totalHours;

    const serviceObj: BuiltTrialService = {
      ...(typeof data.id === 'string' ? { id: data.id } : {}),
      service_id: service.id,
      service_name: service.name,
      custom_description: data.custom_description || '',
      rate,
      rate_type: service.rate_type,
      estimated_quantity: finalQuantity,
      estimated_total: rate * finalQuantity,
      start_date: serviceStartDate,
      end_date: data.split_billing ? data.end_date || segEnd : segEnd,
      days_before_trial: daysBefore,
      split_billing_at_threshold: data.split_billing || false,
      pre_trial_estimated_hours: data.split_billing ? preTrialHours : null,
      final_billing_method: finalBillingMethod,
      service_phase: data.split_billing ? 'split' : 'in_trial',
      has_daily_minimum: service.has_daily_minimum,
      is_instance_in_trial: true,
      dailyMinimumHours,
      display_order: preTrialServices.length + index,
      travel_eligible: data.travel_eligible || false,
      estimated_travel_hours: data.estimated_travel_hours || null,
      segment_id: data.segment_id || null,
    };
    const { pdr, preTrialPdr, inTrialPdr } = calculateProjectedDailyRevenue(
      serviceObj,
      trialData,
      segments,
    );
    serviceObj.projected_daily_revenue = pdr !== null ? parseFloat(pdr.toFixed(2)) : null;
    if (preTrialPdr !== undefined && preTrialPdr !== null) {
      serviceObj.pre_trial_projected_daily_revenue = parseFloat(preTrialPdr.toFixed(2));
    }
    if (inTrialPdr !== undefined && inTrialPdr !== null) {
      serviceObj.in_trial_projected_daily_revenue = parseFloat(inTrialPdr.toFixed(2));
    }
    out.push(serviceObj);
  });

  return out;
}

export interface RetainerInputs {
  retainer_divisor?: number | null;
  retainer_multiplier?: number | null;
  retainer_minimum?: number | null;
}

/**
 * Auto-calculated retainer from an estimated value. Port of the bible's
 * `Math.max(minimum, Math.floor(estimatedValue / divisor) * multiplier)`.
 */
export function calculateRetainer(estimatedValue: number, company: RetainerInputs): number {
  const divisor = company.retainer_divisor || 15000;
  const multiplier = company.retainer_multiplier || 5000;
  const minimum = company.retainer_minimum || 1000;
  return Math.max(minimum, Math.floor(estimatedValue / divisor) * multiplier);
}
