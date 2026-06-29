/**
 * features/company/stores/company-store.ts — company-settings and team
 * server actions. Stores own the Supabase seam (RULE 3).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { supabase } from '@/shared/db/supabase-client';
import { COMPANY_FEATURE_ENTITY_SCHEMAS } from '@/features/company/entities';

import { registerEntityJsonSchema } from '@prometheus-ags/prometheus-entity-management';

// ─── Entity registration (idempotent, module-level) ───────────────────────
let registered = false;
function ensureRegistered() {
  if (registered) return;
  for (const [entityType, schema] of Object.entries(COMPANY_FEATURE_ENTITY_SCHEMAS)) {
    registerEntityJsonSchema({ entityType, schema, source: 'static' });
  }
  registered = true;
}
ensureRegistered();

// ─── Read fetchers (used by hooks as REST fallback for the entity graph) ──

export async function fetchCompanyById(id: string): Promise<unknown> {
  const { data, error } = await supabase
    .from('company')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchUserInfoById(id: string): Promise<unknown> {
  const { data, error } = await supabase
    .from('user_info')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface TeamFetchResult {
  items: unknown[];
  total: number | null;
  nextCursor: string | null;
}

export async function fetchTeamForCompany(companyId: string): Promise<TeamFetchResult> {
  const { data, error, count } = await supabase
    .from('user_info')
    .select('*', { count: 'exact' })
    .eq('company_id', companyId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return { items: data ?? [], total: count ?? null, nextCursor: null };
}

// ─── Mutations ────────────────────────────────────────────────────────────

export interface UpdateCompanyInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  theme?: Record<string, unknown> | null;
  marketplace_post_jobs?: boolean;
  marketplace_fill_jobs?: boolean;
  logo?: string | null;
  show_debug_info?: boolean;
  // ── Bible generalSettings shape (Settings.jsx lines 32–58). Persisted as
  // first-class columns on the `company` row so the rest of the app reads
  // them without a JSON-jab.
  default_tax_rate?: string | number | null;
  invoice_number_format?: string | null;
  invoice_number_start?: string | number | null;
  job_number_format?: string | null;
  job_number_start?: string | number | null;
  default_daily_minimum_hours?: string | number | null;
  time_rounding_minutes?: string | number | null;
  clock_in_rounding?: string | null;
  clock_out_rounding?: string | null;
  invoice_due_days?: string | number | null;
  annual_revenue_target?: string | number | null;
  monthly_breakeven?: string | number | null;
  retainer_divisor?: string | number | null;
  retainer_multiplier?: string | number | null;
  retainer_minimum?: string | number | null;
  default_invoice_email_message?: string | null;
  sender_email?: string | null;
  fiscal_year_start_month?: number | null;
}

export async function updateCompany(
  companyId: string,
  patch: UpdateCompanyInput,
): Promise<void> {
  const { error } = await supabase.from('company').update(patch).eq('id', companyId);
  if (error) throw error;
}

/**
 * Patch a single column on the company row. Used by the settings tab for
 * immediate-save toggles (e.g. the admin "Show Debug Info" switch) where we
 * want to skip the dirty-form save flow.
 */
export async function updateCompanyImmediate(
  companyId: string,
  field: string,
  value: unknown,
): Promise<void> {
  const patch: Record<string, unknown> = { [field]: value };
  const { error } = await supabase.from('company').update(patch).eq('id', companyId);
  if (error) throw error;
}

/**
 * Upload a company logo to the `company-logos` bucket and return the public
 * URL. The caller is responsible for persisting the URL onto the company
 * row (so the upload and the row-patch can be undone independently).
 */
export async function uploadCompanyLogo(
  companyId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${companyId}/logo-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('company-logos')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('company-logos').getPublicUrl(path);
  return data.publicUrl;
}

export async function updateUserInfo(
  userInfoId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from('user_info').update(patch).eq('id', userInfoId);
  if (error) throw error;
}

// ─── Seed defaults publishing (superadmin-only) ──────────────────────────

export interface PublishSeedDefaultsInput {
  notes?: string;
}

export interface PublishSeedDefaultsResult {
  success: boolean;
  version?: number;
  error?: string;
}

/**
 * Invoke the `publish-seed-defaults` Edge Function. The function takes the
 * caller's seed company snapshot and writes a new SeedSnapshot row that new
 * tenant onboarding will clone from. Server-side RLS + the function body
 * enforce that only the seed superadmin can call it; this client just makes
 * the call. Existing customers are not affected.
 */
export async function publishSeedDefaults(
  input: PublishSeedDefaultsInput,
): Promise<PublishSeedDefaultsResult> {
  const notes = input.notes ?? '';
  const { data, error } = await supabase.functions.invoke(
    'publish-seed-defaults',
    { body: { notes } },
  );
  if (error) {
    return { success: false, error: error.message };
  }
  const payload = (data ?? {}) as PublishSeedDefaultsResult;
  if (typeof payload.success !== 'boolean') {
    return { success: false, error: 'Invalid response from server' };
  }
  return payload;
}

// ─── Invitations ──────────────────────────────────────────────────────────

export interface SendInvitationPayload {
  email: string;
  role: 'Owner' | 'Admin' | 'Sales' | 'Trial Consultant';
  company_id: string;
}

export async function sendInvitation(payload: SendInvitationPayload): Promise<void> {
  const { error } = await supabase.functions.invoke('send-invitation', {
    body: payload,
  });
  if (error) throw error;
}

// ─── Invitation management (Team page Tier-2) ─────────────────────────────

export interface InvitationRow {
  id: string;
  company_id: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  status: string | null;
  invitation_type: string | null;
  created_at: string | null;
}

/** Fetch pending + accepted-referral invitations for the team page. */
export async function fetchPendingInvitations(companyId: string): Promise<InvitationRow[]> {
  const [pendingRes, acceptedReferralsRes] = await Promise.all([
    supabase
      .from('invitation')
      .select('id, company_id, email, first_name, last_name, role, status, invitation_type, created_at')
      .eq('company_id', companyId)
      .eq('status', 'pending'),
    supabase
      .from('invitation')
      .select('id, company_id, email, first_name, last_name, role, status, invitation_type, created_at')
      .eq('company_id', companyId)
      .eq('status', 'accepted')
      .eq('invitation_type', 'referral'),
  ]);
  if (pendingRes.error) throw pendingRes.error;
  if (acceptedReferralsRes.error) throw acceptedReferralsRes.error;
  return [...(pendingRes.data ?? []), ...(acceptedReferralsRes.data ?? [])] as InvitationRow[];
}

/** Send a team invite via the sendInvitationEmail Edge Function. */
export interface TeamInvitePayload {
  invitation_type: 'team';
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  consultant_tier_id: string;
  service_ids: string[];
  name: string;
}

export async function sendTeamInvite(payload: TeamInvitePayload): Promise<void> {
  const { data, error } = await supabase.functions.invoke('sendInvitationEmail', {
    body: payload,
  });
  if (error) throw error;
  const d = data as { error?: string } | null;
  if (d?.error) throw new Error(d.error);
}

/** Send an HSH referral invite via the sendInvitationEmail Edge Function. */
export interface ReferralInvitePayload {
  invitation_type: 'hsh_referral';
  email: string;
  first_name?: string;
  last_name?: string;
}

export async function sendReferralInvite(payload: ReferralInvitePayload): Promise<void> {
  const { data, error } = await supabase.functions.invoke('sendInvitationEmail', {
    body: payload,
  });
  if (error) throw error;
  const d = data as { error?: string } | null;
  if (d?.error) throw new Error(d.error);
}

/** Cancel a pending invitation via the cancelInvitation Edge Function. */
export async function cancelInvitation(inviteId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('cancelInvitation', {
    body: { invitation_id: inviteId },
  });
  if (error) throw error;
  const d = data as { error?: string } | null;
  if (d?.error) throw new Error(d.error);
}

/** Deactivate a team member (sets account_status to 'inactive'). */
export async function deactivateTeamMember(userInfoId: string): Promise<void> {
  const { error } = await supabase
    .from('user_info')
    .update({ account_status: 'inactive' })
    .eq('id', userInfoId);
  if (error) throw error;
}

// ─── Services & Categories (metadata_type scope='service'|'service_category') ─

export interface ServiceRowInput {
  name: string;
  description?: string | null;
  category_id?: string | null;
  base_rate?: number | null;
  rate_type?: 'hourly' | 'daily' | 'flat' | null;
  has_daily_minimum?: boolean | null;
  service_availability?: 'both' | 'pre_trial_only' | 'in_trial_only' | null;
  default_lead_days?: number | null;
  default_duration_days?: number | null;
  travel_multiplier?: number | null;
  is_active?: boolean;
  is_default?: boolean;
  order?: number;
  company_id?: string | null;
}

/**
 * Service rows live in `metadata_type` with `scope='service'`. Bible-only
 * fields that don't exist as columns (base_rate, rate_type, category_id,
 * has_daily_minimum, service_availability, lead/duration days, multiplier)
 * are folded into the `extra_schema` JSON blob and re-projected by the read
 * hooks.
 */
function projectServiceToMetadataRow(input: ServiceRowInput): Record<string, unknown> {
  const {
    name,
    description,
    is_active,
    is_default,
    order,
    company_id,
    ...extras
  } = input;
  return {
    scope: 'service',
    name,
    description: description ?? null,
    is_active: is_active === false ? 'false' : 'true',
    is_default: is_default ? 'true' : 'false',
    order: order ?? 0,
    company_id: company_id ?? null,
    extra_schema: extras,
  };
}

export async function createService(input: ServiceRowInput): Promise<unknown> {
  const row = projectServiceToMetadataRow(input);
  const { data, error } = await supabase
    .from('metadata_type')
    .insert(row)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateService(
  id: string,
  patch: Partial<ServiceRowInput>,
): Promise<unknown> {
  // Need to read existing row to merge extra_schema (we don't want to clobber
  // unrelated keys with a partial patch).
  const { data: existing, error: readError } = await supabase
    .from('metadata_type')
    .select('extra_schema')
    .eq('id', id)
    .maybeSingle();
  if (readError) throw readError;

  const prevExtras = (existing?.extra_schema ?? {}) as Record<string, unknown>;
  const {
    name,
    description,
    is_active,
    is_default,
    order,
    company_id,
    ...extras
  } = patch;
  const merged = { ...prevExtras, ...extras };

  const row: Record<string, unknown> = { extra_schema: merged };
  if (name !== undefined) row.name = name;
  if (description !== undefined) row.description = description;
  if (is_active !== undefined) row.is_active = is_active === false ? 'false' : 'true';
  if (is_default !== undefined) row.is_default = is_default ? 'true' : 'false';
  if (order !== undefined) row.order = order;
  if (company_id !== undefined) row.company_id = company_id;

  const { data, error } = await supabase
    .from('metadata_type')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from('metadata_type').delete().eq('id', id);
  if (error) throw error;
}

export interface ServiceCategoryInput {
  name: string;
  is_active?: boolean;
  is_default?: boolean;
  order?: number;
  company_id?: string | null;
}

export async function createServiceCategory(
  input: ServiceCategoryInput,
): Promise<unknown> {
  const { data, error } = await supabase
    .from('metadata_type')
    .insert({
      scope: 'service_category',
      name: input.name,
      is_active: input.is_active === false ? 'false' : 'true',
      is_default: input.is_default ? 'true' : 'false',
      order: input.order ?? 0,
      company_id: input.company_id ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateServiceCategory(
  id: string,
  patch: Partial<ServiceCategoryInput>,
): Promise<unknown> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.is_active !== undefined) {
    row.is_active = patch.is_active === false ? 'false' : 'true';
  }
  if (patch.is_default !== undefined) {
    row.is_default = patch.is_default ? 'true' : 'false';
  }
  if (patch.order !== undefined) row.order = patch.order;
  const { data, error } = await supabase
    .from('metadata_type')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteServiceCategory(id: string): Promise<void> {
  const { error } = await supabase.from('metadata_type').delete().eq('id', id);
  if (error) throw error;
}

// ─── Pipeline Stages (metadata_type scope='pipeline_stage') ───────────────

export interface PipelineStageInput {
  name: string;
  type?: 'sales' | 'operations' | '';
  color?: string | null;
  revenue_probability?: number | null;
  auto_move_on_document_sent_category_id?: string | null;
  auto_move_on_document_signed_category_id?: string | null;
  auto_move_on_earliest_task_start?: boolean;
  auto_move_on_trial_start?: boolean;
  is_active?: boolean;
  order?: number;
  company_id?: string | null;
}

function projectPipelineStageRow(
  input: PipelineStageInput,
): Record<string, unknown> {
  const {
    name,
    is_active,
    order,
    company_id,
    type,
    color,
    revenue_probability,
    auto_move_on_document_sent_category_id,
    auto_move_on_document_signed_category_id,
    auto_move_on_earliest_task_start,
    auto_move_on_trial_start,
  } = input;
  const extra_schema: Record<string, unknown> = {};
  if (type !== undefined) extra_schema.type = type;
  if (color !== undefined) extra_schema.color = color;
  if (revenue_probability !== undefined) {
    extra_schema.revenue_probability = revenue_probability;
  }
  if (auto_move_on_document_sent_category_id !== undefined) {
    extra_schema.auto_move_on_document_sent_category_id =
      auto_move_on_document_sent_category_id;
  }
  if (auto_move_on_document_signed_category_id !== undefined) {
    extra_schema.auto_move_on_document_signed_category_id =
      auto_move_on_document_signed_category_id;
  }
  if (auto_move_on_earliest_task_start !== undefined) {
    extra_schema.auto_move_on_earliest_task_start =
      auto_move_on_earliest_task_start;
  }
  if (auto_move_on_trial_start !== undefined) {
    extra_schema.auto_move_on_trial_start = auto_move_on_trial_start;
  }
  return {
    scope: 'pipeline_stage',
    name,
    is_active: is_active === false ? 'false' : 'true',
    order: order ?? 0,
    company_id: company_id ?? null,
    extra_schema,
  };
}

export async function createPipelineStage(
  input: PipelineStageInput,
): Promise<unknown> {
  const { data, error } = await supabase
    .from('metadata_type')
    .insert(projectPipelineStageRow(input))
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updatePipelineStage(
  id: string,
  patch: Partial<PipelineStageInput>,
): Promise<unknown> {
  // Merge extra_schema so partial patches don't clobber sibling extras.
  const { data: existing, error: readError } = await supabase
    .from('metadata_type')
    .select('extra_schema')
    .eq('id', id)
    .maybeSingle();
  if (readError) throw readError;
  const prevExtras = (existing?.extra_schema ?? {}) as Record<string, unknown>;

  const row: Record<string, unknown> = {};
  const extra: Record<string, unknown> = { ...prevExtras };

  if (patch.name !== undefined) row.name = patch.name;
  if (patch.is_active !== undefined) {
    row.is_active = patch.is_active === false ? 'false' : 'true';
  }
  if (patch.order !== undefined) row.order = patch.order;
  if (patch.company_id !== undefined) row.company_id = patch.company_id;

  if (patch.type !== undefined) extra.type = patch.type;
  if (patch.color !== undefined) extra.color = patch.color;
  if (patch.revenue_probability !== undefined) {
    extra.revenue_probability = patch.revenue_probability;
  }
  if (patch.auto_move_on_document_sent_category_id !== undefined) {
    extra.auto_move_on_document_sent_category_id =
      patch.auto_move_on_document_sent_category_id;
  }
  if (patch.auto_move_on_document_signed_category_id !== undefined) {
    extra.auto_move_on_document_signed_category_id =
      patch.auto_move_on_document_signed_category_id;
  }
  if (patch.auto_move_on_earliest_task_start !== undefined) {
    extra.auto_move_on_earliest_task_start =
      patch.auto_move_on_earliest_task_start;
  }
  if (patch.auto_move_on_trial_start !== undefined) {
    extra.auto_move_on_trial_start = patch.auto_move_on_trial_start;
  }
  row.extra_schema = extra;

  const { data, error } = await supabase
    .from('metadata_type')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deletePipelineStage(id: string): Promise<void> {
  const { error } = await supabase.from('metadata_type').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Returns the count of `deal` rows whose `stage_id` references the given
 * pipeline stage. Used by the settings tab to block deletes that would
 * orphan deals.
 */
export async function countDealsForStage(stageId: string): Promise<number> {
  const { count, error } = await supabase
    .from('deal')
    .select('id', { count: 'exact', head: true })
    .eq('stage_id', stageId);
  if (error) throw error;
  return count ?? 0;
}
