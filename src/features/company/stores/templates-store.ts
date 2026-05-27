/**
 * features/company/stores/templates-store.ts — DocumentTemplate list /
 * create / delete actions. Stores own the Supabase seam (RULE D).
 *
 * S09 scope: list + create + delete only. Full editor (sections, page
 * settings, services-table, signature fields) is deferred to Wave W8.
 *
 * Bible: HotSeatersMVP/src/components/settings/DocumentTemplateManagement.jsx
 *   base44.entities.DocumentTemplate.{filter,create,delete}
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { supabase } from '@/shared/db/supabase-client';

export type TemplateType = 'document' | 'billing' | 'email';

export const TEMPLATE_TYPES: ReadonlyArray<{ value: TemplateType; label: string }> = [
  { value: 'document', label: 'Document' },
  { value: 'billing', label: 'Billing' },
  { value: 'email', label: 'Email' },
];

export interface DocumentTemplateRow {
  id: string;
  name: string;
  template_type: TemplateType | null;
  category_id: string | null;
  company_id: string | null;
  is_active: boolean;
  has_signature_fields: boolean;
  is_contract: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface TemplatesFetchResult {
  items: DocumentTemplateRow[];
  total: number | null;
  nextCursor: string | null;
}

export async function fetchTemplatesForCompany(
  companyId: string,
): Promise<TemplatesFetchResult> {
  const { data, error, count } = await supabase
    .from('document_template')
    .select('*', { count: 'exact' })
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return {
    items: (data ?? []) as DocumentTemplateRow[],
    total: count ?? null,
    nextCursor: null,
  };
}

export interface CreateTemplateInput {
  name: string;
  template_type: TemplateType;
  company_id: string;
}

export async function createTemplate(
  input: CreateTemplateInput,
): Promise<DocumentTemplateRow> {
  const { data, error } = await supabase
    .from('document_template')
    .insert({
      name: input.name,
      template_type: input.template_type,
      company_id: input.company_id,
      is_active: true,
      has_signature_fields: false,
      is_contract: false,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as DocumentTemplateRow;
}

/**
 * Soft-delete a template by flipping `is_active` to false. The bible deletes
 * unused templates outright and deactivates used ones — until usage detection
 * lands in W8 we always soft-delete to preserve historical references.
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  const { error } = await supabase
    .from('document_template')
    .update({ is_active: false })
    .eq('id', templateId);
  if (error) throw error;
}
