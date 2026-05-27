/**
 * use-tiers.ts — hook surface for the Tiers settings tab.
 *
 * Reads `consultantTiers` from Tier1Provider (already hydrated from the
 * entity graph), exposes a `saving` flag and three mutating actions that
 * delegate to `tiers-store`.
 *
 * Components → hooks only (RULE B); hooks → stores only (RULE C).
 * HotSeatersMVP is the bible.
 */

import { useState } from 'react';

import { useTier1 } from '@/app/tier1-provider';
import {
  createConsultantTier,
  updateConsultantTier,
  deleteConsultantTier,
  type CreateConsultantTierInput,
  type UpdateConsultantTierInput,
} from '@/features/company/stores/tiers-store';
import type { LookupRow } from '@/shared/db/lookups-selectors';

export interface ConsultantTierDraft {
  name: string;
  multiplier: number;
  description: string;
  is_active: boolean;
}

export interface UseTiersResult {
  consultantTiers: LookupRow[];
  companyId: string | null;
  saving: boolean;
  error: string | null;
  createTier: (draft: ConsultantTierDraft) => Promise<void>;
  updateTier: (id: string, patch: Partial<ConsultantTierDraft>) => Promise<void>;
  deleteTier: (id: string) => Promise<void>;
}

export function useTiers(): UseTiersResult {
  const { company, consultantTiers } = useTier1();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const companyId = company?.id ?? null;

  const wrap = async (fn: () => Promise<void>): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save tier';
      setError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const createTier = (draft: ConsultantTierDraft) =>
    wrap(async () => {
      if (!companyId) throw new Error('No company in context');
      const payload: CreateConsultantTierInput = {
        companyId,
        name: draft.name,
        multiplier: draft.multiplier,
        description: draft.description,
        is_active: draft.is_active,
      };
      await createConsultantTier(payload);
    });

  const updateTier = (id: string, patch: Partial<ConsultantTierDraft>) =>
    wrap(async () => {
      const mapped: UpdateConsultantTierInput = {};
      if (patch.name !== undefined) mapped.name = patch.name;
      if (patch.multiplier !== undefined) mapped.multiplier = patch.multiplier;
      if (patch.description !== undefined) mapped.description = patch.description;
      if (patch.is_active !== undefined) mapped.is_active = patch.is_active;
      await updateConsultantTier(id, mapped);
    });

  const deleteTier = (id: string) =>
    wrap(async () => {
      await deleteConsultantTier(id);
    });

  return {
    consultantTiers,
    companyId,
    saving,
    error,
    createTier,
    updateTier,
    deleteTier,
  };
}
