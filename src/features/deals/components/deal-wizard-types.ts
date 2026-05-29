/**
 * deal-wizard-types.ts — shared TypeScript shapes for the deal wizard's
 * internal form state. Pure types (no runtime). Mirrors the bible's `dealData`
 * object and the pre-trial / in-trial service-instance shapes used across
 * DealWizard.jsx, WizardStep1/2, AvailableServicesColumn and the step 3/4 grids.
 *
 * HotSeatersMVP is the bible.
 */

/** The wizard's primary form object (bible `dealData`). */
export interface DealFormData {
  client_id: string;
  primary_contact_id: string;
  secondary_contact_ids: string[];
  consultant_id: string;
  case_name: string;
  case_style: string;
  case_number: string;
  court: string;
  judge: string;
  case_type: string;
  side: string;
  retainer_value: number | string;
  override_daily_minimum_hours: number | string;
  courthouse: string;
  city: string;
  state: string;
  start_date: string;
  end_date: string;
  frp_client_id: string;
  frp_contact_id: string;
  /** Always [] in the wizard; services live in pre/in-trial instance arrays. */
  services: unknown[];
}

/** A pre-trial service instance (bible `preTrialServices[]`). */
export interface PreTrialServiceInstance {
  /** number (Date.now()+random) for new rows; string (uuid) for saved rows. */
  id: number | string;
  service_id: string;
  quantity?: number | undefined;
  lead_days?: number | undefined;
  duration_days?: number | undefined;
  split_billing?: boolean | undefined;
  start_date?: string | null | undefined;
  end_date?: string | null | undefined;
  custom_description?: string | undefined;
  travel_eligible?: boolean | undefined;
  estimated_travel_hours?: number | null | undefined;
  segment_id?: string | null | undefined;
}

/** An in-trial service instance (bible `inTrialServices[]`). */
export interface InTrialServiceInstance {
  id: number | string;
  service_id: string;
  arrival_date?: string | null | undefined;
  split_billing?: boolean | undefined;
  pre_trial_hours?: number | undefined;
  start_date?: string | null | undefined;
  end_date?: string | null | undefined;
  quantity?: number | undefined;
  days_before_trial?: number | undefined;
  custom_description?: string | undefined;
  travel_eligible?: boolean | undefined;
  estimated_travel_hours?: number | null | undefined;
  segment_id?: string | null | undefined;
}

export type RangePickerSide = 'from' | 'to';

export interface DateRangeValue {
  from?: Date | undefined;
  to?: Date | undefined;
}
