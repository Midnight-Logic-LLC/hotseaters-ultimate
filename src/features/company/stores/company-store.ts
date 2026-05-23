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
}

export async function updateCompany(
  companyId: string,
  patch: UpdateCompanyInput,
): Promise<void> {
  const { error } = await supabase.from('company').update(patch).eq('id', companyId);
  if (error) throw error;
}

export async function updateUserInfo(
  userInfoId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from('user_info').update(patch).eq('id', userInfoId);
  if (error) throw error;
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
