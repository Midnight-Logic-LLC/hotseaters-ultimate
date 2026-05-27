/**
 * use-pipeline-stages.ts — settings-tab facade hook for pipeline stages.
 *
 * Reads the live pipeline-stage list from Tier1 (already projected from
 * `MetadataType` rows with `scope = 'pipeline_stage'`), lifts the bible's
 * `color` field from `extra_schema` so the UI doesn't reach into raw JSON,
 * and exposes create/update/delete/reorder actions plus a lazy deal-count
 * lookup used by the delete-with-warning flow.
 *
 * Components → hooks only (RULE B). All I/O lives in the company store.
 *
 * BIBLE: HotSeatersMVP/src/components/settings/PipelineStageManagement.jsx
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useCallback, useMemo, useState } from 'react';

import { useTier1 } from '@/app/tier1-provider';
import {
  countDealsForStage,
  createPipelineStage,
  deletePipelineStage,
  updatePipelineStage,
  type PipelineStageInput,
} from '@/features/company/stores/company-store';
import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';

/**
 * Settings-tab view of a single pipeline stage. Extends the Tier1 projection
 * with the bible's `color`, `description`, and auto-move fields lifted from
 * `extra_schema` so the UI consumes a flat shape.
 */
export interface SettingsPipelineStage {
  id: string;
  name: string;
  type: 'sales' | 'operations' | '';
  color: string;
  revenue_probability: number;
  order: number;
  company_id: string | null;
  auto_move_on_document_sent_category_id: string | null;
  auto_move_on_document_signed_category_id: string | null;
  auto_move_on_earliest_task_start: boolean;
  auto_move_on_trial_start: boolean;
}

const DEFAULT_STAGE_COLOR = '#6366f1';

function readString(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

function readBool(v: unknown): boolean {
  return v === true || v === 'true';
}

interface RawMetadataRow {
  id?: string | null;
  scope?: string | null;
  name?: string | null;
  is_active?: string | null;
  order?: number | null;
  company_id?: string | null;
  extra_schema?: Record<string, unknown> | null;
}

export interface UsePipelineStagesResult {
  stages: SettingsPipelineStage[];
  salesStages: SettingsPipelineStage[];
  opsStages: SettingsPipelineStage[];
  /** Companion to the create/update/delete actions. */
  isMutating: boolean;
  /** Live count of stages. Components use this to enforce "≥1 stage". */
  stageCount: number;
  /** Returns the count of deals referencing this stage. */
  countDeals: (stageId: string) => Promise<number>;
  create: (input: PipelineStageInput) => Promise<void>;
  update: (id: string, patch: Partial<PipelineStageInput>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reorder: (ids: string[]) => Promise<void>;
}

export function usePipelineStages(): UsePipelineStagesResult {
  const { company } = useTier1();
  const [isMutating, setIsMutating] = useState(false);

  // Subscribe to the MetadataType slice directly so we get color + the
  // auto-move fields the Tier1 projection drops.
  const metadataTypeSlice = useGraphStore(
    (s) => (s.entities as Record<string, Record<string, unknown>>).MetadataType,
  );

  const stages = useMemo<SettingsPipelineStage[]>(() => {
    if (!metadataTypeSlice) return [];
    const out: SettingsPipelineStage[] = [];
    for (const raw of Object.values(metadataTypeSlice)) {
      const row = raw as RawMetadataRow;
      if (row.scope !== 'pipeline_stage') continue;
      if (!row.id) continue;
      if (row.is_active === 'false') continue;
      // Tenant scope: include system rows (company_id null) + this company.
      if (
        row.company_id &&
        company?.id &&
        row.company_id !== company.id
      ) {
        continue;
      }
      const extra = row.extra_schema ?? {};
      const typeRaw = readString(extra.type);
      const type: SettingsPipelineStage['type'] =
        typeRaw === 'sales' || typeRaw === 'operations' ? typeRaw : '';
      const colorRaw = readString(extra.color);
      const probabilityRaw = extra.revenue_probability;
      const probability =
        typeof probabilityRaw === 'number'
          ? probabilityRaw
          : typeof probabilityRaw === 'string'
            ? parseFloat(probabilityRaw)
            : 1;
      out.push({
        id: row.id,
        name: row.name ?? '',
        type,
        color: colorRaw ?? DEFAULT_STAGE_COLOR,
        revenue_probability: Number.isFinite(probability) ? probability : 1,
        order: row.order ?? 0,
        company_id: row.company_id ?? null,
        auto_move_on_document_sent_category_id: readString(
          extra.auto_move_on_document_sent_category_id,
        ),
        auto_move_on_document_signed_category_id: readString(
          extra.auto_move_on_document_signed_category_id,
        ),
        auto_move_on_earliest_task_start: readBool(
          extra.auto_move_on_earliest_task_start,
        ),
        auto_move_on_trial_start: readBool(extra.auto_move_on_trial_start),
      });
    }
    out.sort((a, b) => {
      const d = a.order - b.order;
      if (d !== 0) return d;
      return a.name.localeCompare(b.name);
    });
    return out;
  }, [metadataTypeSlice, company?.id]);

  const salesStages = useMemo(
    () => stages.filter((s) => s.type === 'sales'),
    [stages],
  );
  const opsStages = useMemo(
    () => stages.filter((s) => s.type === 'operations'),
    [stages],
  );

  const countDeals = useCallback(
    (stageId: string) => countDealsForStage(stageId),
    [],
  );

  const create = useCallback(
    async (input: PipelineStageInput) => {
      setIsMutating(true);
      try {
        await createPipelineStage({
          ...input,
          company_id: input.company_id ?? company?.id ?? null,
        });
      } finally {
        setIsMutating(false);
      }
    },
    [company?.id],
  );

  const update = useCallback(
    async (id: string, patch: Partial<PipelineStageInput>) => {
      setIsMutating(true);
      try {
        await updatePipelineStage(id, patch);
      } finally {
        setIsMutating(false);
      }
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    setIsMutating(true);
    try {
      await deletePipelineStage(id);
    } finally {
      setIsMutating(false);
    }
  }, []);

  const reorder = useCallback(async (ids: string[]) => {
    setIsMutating(true);
    try {
      // Sequential to keep server `order` writes deterministic.
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        if (!id) continue;
        await updatePipelineStage(id, { order: i });
      }
    } finally {
      setIsMutating(false);
    }
  }, []);

  return {
    stages,
    salesStages,
    opsStages,
    isMutating,
    stageCount: stages.length,
    countDeals,
    create,
    update,
    remove,
    reorder,
  };
}
