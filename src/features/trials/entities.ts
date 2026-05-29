/**
 * features/trials/entities.ts — JSON Schema definitions for the trial trio
 * (plus TrialSegment and TrialServiceAssignment). Pure data only.
 *
 * Registration side-effects (`registerEntityJsonSchema`) happen from a
 * store-tier bootstrap, NOT here. RULE 3 forbids feature-entities from
 * importing the entity-management package.
 *
 * Schema columns are derived from
 *   latest-data/supabase/migrations/20260523000008_v2_schema_trials.sql
 *   latest-data/supabase/migrations/20260523000010_v2_schema_subcontracting.sql
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

type JsonSchemaObject = {
  type?: string | string[];
  required?: string[];
  properties?: Record<string, JsonSchemaObject>;
  enum?: ReadonlyArray<unknown>;
  format?: string;
  items?: JsonSchemaObject;
  additionalProperties?: boolean | JsonSchemaObject;
};

const uuidNullable: JsonSchemaObject = {
  type: ['string', 'null'],
  format: 'uuid',
};
const stringNullable: JsonSchemaObject = { type: ['string', 'null'] };
const numberNullable: JsonSchemaObject = { type: ['number', 'null'] };
const dateNullable: JsonSchemaObject = {
  type: ['string', 'null'],
  format: 'date',
};
const dateTimeNullable: JsonSchemaObject = {
  type: ['string', 'null'],
  format: 'date-time',
};
const intNullable: JsonSchemaObject = { type: ['integer', 'null'] };

export const TrialSchema: JsonSchemaObject = {
  type: 'object',
  required: ['id', 'company_id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    legacy_id: stringNullable,
    company_id: { type: 'string', format: 'uuid' },
    client_id: uuidNullable,
    pipeline_stage_id: uuidNullable,
    deal_document_id: uuidNullable,
    primary_contact_id: uuidNullable,
    frp_client_id: uuidNullable,
    frp_contact_id: uuidNullable,
    consultant_id: uuidNullable,

    case_name: stringNullable,
    case_number: stringNullable,
    case_type: stringNullable,
    case_style: stringNullable,
    job_number: stringNullable,
    side: stringNullable,
    judge: stringNullable,
    courthouse: stringNullable,
    court: stringNullable,
    city: stringNullable,
    state: stringNullable,
    notes: stringNullable,

    start_date: dateNullable,
    end_date: dateNullable,
    completion_date: dateNullable,
    continued_date_precision: stringNullable,

    estimated_value: numberNullable,
    retainer_value: numberNullable,
    daily_minimum_hours: numberNullable,
    bill_for_weekends: { type: 'boolean' },

    won_date: dateNullable,
    lost_date: dateNullable,
    completion_type: stringNullable,

    invoice_recipient_preferences: { type: ['object', 'null'] },

    updated_by: uuidNullable,
    created_by_id: uuidNullable,
    created_by: stringNullable,
    is_sample: { type: 'boolean' },
    created_at: dateTimeNullable,
    updated_at: dateTimeNullable,
  },
};

export const TrialServiceSchema: JsonSchemaObject = {
  type: 'object',
  required: ['id', 'company_id', 'trial_id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    legacy_id: stringNullable,
    company_id: { type: 'string', format: 'uuid' },
    trial_id: { type: 'string', format: 'uuid' },
    service_id: uuidNullable,
    segment_id: uuidNullable,

    service_name: stringNullable,
    service_phase: stringNullable,
    custom_description: stringNullable,
    rate_type: stringNullable,
    rate: numberNullable,
    travel_eligible: { type: 'boolean' },
    display_order: intNullable,
    final_billing_method: stringNullable,
    split_billing_at_threshold: { type: ['boolean', 'null'] },

    start_date: dateNullable,
    end_date: dateNullable,
    days_before_trial: intNullable,

    estimated_quantity: numberNullable,
    estimated_total: numberNullable,
    estimated_travel_hours: numberNullable,
    pre_trial_estimated_hours: numberNullable,
    projected_daily_revenue: numberNullable,
    in_trial_projected_daily_revenue: numberNullable,
    pre_trial_projected_daily_revenue: numberNullable,

    updated_by: uuidNullable,
    created_by_id: uuidNullable,
    created_by: stringNullable,
    is_sample: { type: 'boolean' },
    created_at: dateTimeNullable,
    updated_at: dateTimeNullable,
  },
};

export const TrialContactSchema: JsonSchemaObject = {
  type: 'object',
  required: ['id', 'company_id', 'trial_id', 'attorney_id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    legacy_id: stringNullable,
    company_id: { type: 'string', format: 'uuid' },
    trial_id: { type: 'string', format: 'uuid' },
    attorney_id: { type: 'string', format: 'uuid' },
    is_sample: { type: 'boolean' },
    created_at: dateTimeNullable,
    updated_at: dateTimeNullable,
    created_by_id: uuidNullable,
    created_by: stringNullable,
  },
};

export const TrialSegmentSchema: JsonSchemaObject = {
  type: 'object',
  required: ['id', 'company_id', 'trial_id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    legacy_id: stringNullable,
    company_id: { type: 'string', format: 'uuid' },
    trial_id: { type: 'string', format: 'uuid' },
    segment_number: intNullable,
    label: stringNullable,
    start_date: dateNullable,
    end_date: dateNullable,
    notes: stringNullable,
    is_sample: { type: 'boolean' },
    created_at: dateTimeNullable,
    updated_at: dateTimeNullable,
    created_by_id: uuidNullable,
    created_by: stringNullable,
  },
};

export const TrialServiceAssignmentSchema: JsonSchemaObject = {
  type: 'object',
  required: ['id', 'company_id', 'trial_id', 'trial_service_id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    legacy_id: stringNullable,
    company_id: { type: 'string', format: 'uuid' },
    trial_id: { type: 'string', format: 'uuid' },
    trial_service_id: { type: 'string', format: 'uuid' },
    consultant_id: uuidNullable,
    subcontract_assignment_id: uuidNullable,
    google_calendar_event_id: stringNullable,
    assigned_by: uuidNullable,
    inactive_reason: stringNullable,
    is_subcontractor: { type: 'boolean' },
    status: stringNullable,
    is_sample: { type: 'boolean' },
    created_at: dateTimeNullable,
    updated_at: dateTimeNullable,
    created_by_id: uuidNullable,
    created_by: stringNullable,
  },
};

export const TRIALS_FEATURE_ENTITY_SCHEMAS: Record<string, JsonSchemaObject> = {
  Trial: TrialSchema,
  TrialService: TrialServiceSchema,
  TrialContact: TrialContactSchema,
  TrialSegment: TrialSegmentSchema,
  TrialServiceAssignment: TrialServiceAssignmentSchema,
};

// Lightweight row interfaces for TypeScript consumers (hooks, components).
// These mirror the schemas above but are TS interfaces — handy for typing
// `useEntityList<Trial>(…)` results without re-deriving from JSON Schema.
export interface Trial {
  id: string;
  legacy_id?: string | null;
  company_id: string;
  client_id?: string | null;
  pipeline_stage_id?: string | null;
  primary_contact_id?: string | null;
  frp_client_id?: string | null;
  frp_contact_id?: string | null;
  consultant_id?: string | null;
  case_name?: string | null;
  case_number?: string | null;
  case_type?: string | null;
  case_style?: string | null;
  job_number?: string | null;
  side?: string | null;
  judge?: string | null;
  courthouse?: string | null;
  court?: string | null;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  completion_date?: string | null;
  continued_date_precision?: string | null;
  estimated_value?: number | null;
  retainer_value?: number | null;
  daily_minimum_hours?: number | null;
  bill_for_weekends: boolean;
  won_date?: string | null;
  lost_date?: string | null;
  completion_type?: string | null;
  is_sample: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TrialService {
  id: string;
  legacy_id?: string | null;
  company_id: string;
  trial_id: string;
  service_id?: string | null;
  segment_id?: string | null;
  service_name?: string | null;
  service_phase?: string | null;
  custom_description?: string | null;
  rate_type?: string | null;
  rate?: number | null;
  travel_eligible: boolean;
  display_order?: number | null;
  final_billing_method?: string | null;
  split_billing_at_threshold?: boolean | null;
  pre_trial_estimated_hours?: number | null;
  estimated_travel_hours?: number | null;
  days_before_trial?: number | null;
  projected_daily_revenue?: number | null;
  pre_trial_projected_daily_revenue?: number | null;
  in_trial_projected_daily_revenue?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  estimated_quantity?: number | null;
  estimated_total?: number | null;
  is_sample: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TrialContact {
  id: string;
  company_id: string;
  trial_id: string;
  attorney_id: string;
  is_sample: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TrialSegment {
  id: string;
  legacy_id?: string | null;
  company_id: string;
  trial_id: string;
  segment_number?: number | null;
  label?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  is_sample: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TrialServiceAssignment {
  id: string;
  legacy_id?: string | null;
  company_id: string;
  trial_id: string;
  trial_service_id: string;
  consultant_id?: string | null;
  subcontract_assignment_id?: string | null;
  assigned_by?: string | null;
  inactive_reason?: string | null;
  is_subcontractor: boolean;
  status?: string | null;
  is_sample: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}
