/**
 * use-templates.ts — list of DocumentTemplate rows for the current tenant,
 * plus create / delete actions. S09 scope only; the full per-template
 * editor lands in Wave W8.
 *
 * Components → hooks → stores (RULE B / RULE C). All I/O lives in
 * `templates-store.ts`.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useMemo, useState } from 'react';
import { useEntityList } from '@prometheus-ags/prometheus-entity-management';

import {
  fetchTemplatesForCompany,
  createTemplate as createTemplateAction,
  deleteTemplate as deleteTemplateAction,
  type CreateTemplateInput,
  type DocumentTemplateRow,
} from '@/features/company/stores/templates-store';

export interface UseTemplatesResult {
  templates: DocumentTemplateRow[];
  isLoading: boolean;
  total: number | null;
  refetch: () => void;
  create: (input: Omit<CreateTemplateInput, 'company_id'>) => Promise<DocumentTemplateRow>;
  remove: (templateId: string) => Promise<void>;
  mutating: boolean;
  error: string | null;
}

export function useTemplates(companyId: string | null): UseTemplatesResult {
  const list = useEntityList<DocumentTemplateRow, DocumentTemplateRow>({
    type: 'DocumentTemplate',
    queryKey: ['document-templates', companyId ?? 'none'],
    enabled: !!companyId,
    fetch: async () => {
      const res = await fetchTemplatesForCompany(companyId ?? '');
      return {
        items: res.items,
        total: res.total,
        nextCursor: res.nextCursor,
      };
    },
    normalize: (raw) => ({ id: String(raw.id), data: raw }),
  });

  // Stabilize the destructure to keep the React 19 getSnapshot contract happy
  // (see use-team.ts for the same pattern).
  const { templates, isLoading, total, refetch } = useMemo(
    () => ({
      templates: list.items,
      isLoading: list.isLoading,
      total: list.total,
      refetch: list.refetch,
    }),
    [list.items, list.isLoading, list.total, list.refetch],
  );

  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (
    input: Omit<CreateTemplateInput, 'company_id'>,
  ): Promise<DocumentTemplateRow> => {
    if (!companyId) throw new Error('Cannot create template: missing company id');
    setMutating(true);
    setError(null);
    try {
      const created = await createTemplateAction({ ...input, company_id: companyId });
      refetch();
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create template';
      setError(msg);
      throw err;
    } finally {
      setMutating(false);
    }
  };

  const remove = async (templateId: string): Promise<void> => {
    setMutating(true);
    setError(null);
    try {
      await deleteTemplateAction(templateId);
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not delete template';
      setError(msg);
      throw err;
    } finally {
      setMutating(false);
    }
  };

  return { templates, isLoading, total, refetch, create, remove, mutating, error };
}
