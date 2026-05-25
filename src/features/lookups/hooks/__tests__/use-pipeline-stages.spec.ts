/**
 * use-pipeline-stages.spec.ts — unit tests for usePipelineStages and
 * useSalesStages hooks.
 *
 * Seeds the graph store directly via useGraphStore.setState to avoid
 * PGlite / network I/O in unit tests. Uses renderHook for hook ergonomics.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';
import { usePipelineStages, useSalesStages } from '../use-pipeline-stages';

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

interface MetadataTypeRow {
  id: string;
  scope: string;
  name: string;
  order: number;
  is_active: string;
  extra_schema: Record<string, unknown> | null;
  company_id: string | null;
  description: string | null;
  is_default: string | null;
  is_sample: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by_id: string | null;
  created_by: string | null;
}

function seedMetadataTypes(rows: MetadataTypeRow[]): void {
  const entityMap: Record<string, unknown> = {};
  for (const row of rows) {
    entityMap[row.id] = row;
  }
  useGraphStore.setState((prev) => ({
    entities: {
      ...prev.entities,
      MetadataType: entityMap,
    },
  }));
}

function clearMetadataTypes(): void {
  useGraphStore.setState((prev) => ({
    entities: {
      ...prev.entities,
      MetadataType: {},
    },
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('usePipelineStages', () => {
  beforeEach(() => {
    clearMetadataTypes();
  });

  it('returns an empty array when no MetadataType rows are seeded', () => {
    const { result } = renderHook(() => usePipelineStages());
    expect(result.current).toHaveLength(0);
  });

  it('returns only pipeline_stage rows sorted by order ASC', () => {
    seedMetadataTypes([
      {
        id: 'stage-3',
        scope: 'pipeline_stage',
        name: 'Closed Won',
        order: 3,
        is_active: 'true',
        extra_schema: null,
        company_id: null,
        description: null,
        is_default: null,
        is_sample: null,
        created_at: null,
        updated_at: null,
        created_by_id: null,
        created_by: null,
      },
      {
        id: 'stage-1',
        scope: 'pipeline_stage',
        name: 'Prospect',
        order: 1,
        is_active: 'true',
        extra_schema: null,
        company_id: null,
        description: null,
        is_default: null,
        is_sample: null,
        created_at: null,
        updated_at: null,
        created_by_id: null,
        created_by: null,
      },
      {
        id: 'stage-2',
        scope: 'pipeline_stage',
        name: 'Qualification',
        order: 2,
        is_active: 'true',
        extra_schema: null,
        company_id: null,
        description: null,
        is_default: null,
        is_sample: null,
        created_at: null,
        updated_at: null,
        created_by_id: null,
        created_by: null,
      },
      // Different scope — should be excluded
      {
        id: 'svc-1',
        scope: 'service_category',
        name: 'Trial Services',
        order: 1,
        is_active: 'true',
        extra_schema: null,
        company_id: null,
        description: null,
        is_default: null,
        is_sample: null,
        created_at: null,
        updated_at: null,
        created_by_id: null,
        created_by: null,
      },
    ]);

    const { result } = renderHook(() => usePipelineStages());
    expect(result.current).toHaveLength(3);
    expect(result.current[0]?.id).toBe('stage-1');
    expect(result.current[1]?.id).toBe('stage-2');
    expect(result.current[2]?.id).toBe('stage-3');
  });

  it('excludes inactive rows (is_active === "false")', () => {
    seedMetadataTypes([
      {
        id: 'stage-active',
        scope: 'pipeline_stage',
        name: 'Active Stage',
        order: 1,
        is_active: 'true',
        extra_schema: null,
        company_id: null,
        description: null,
        is_default: null,
        is_sample: null,
        created_at: null,
        updated_at: null,
        created_by_id: null,
        created_by: null,
      },
      {
        id: 'stage-inactive',
        scope: 'pipeline_stage',
        name: 'Inactive Stage',
        order: 2,
        is_active: 'false',
        extra_schema: null,
        company_id: null,
        description: null,
        is_default: null,
        is_sample: null,
        created_at: null,
        updated_at: null,
        created_by_id: null,
        created_by: null,
      },
    ]);

    const { result } = renderHook(() => usePipelineStages());
    expect(result.current).toHaveLength(1);
    expect(result.current[0]?.id).toBe('stage-active');
  });
});

describe('useSalesStages', () => {
  beforeEach(() => {
    clearMetadataTypes();
  });

  it('returns all pipeline stages when no type field is present (graceful degradation)', () => {
    seedMetadataTypes([
      {
        id: 's1',
        scope: 'pipeline_stage',
        name: 'Stage A',
        order: 1,
        is_active: 'true',
        extra_schema: null,
        company_id: null,
        description: null,
        is_default: null,
        is_sample: null,
        created_at: null,
        updated_at: null,
        created_by_id: null,
        created_by: null,
      },
      {
        id: 's2',
        scope: 'pipeline_stage',
        name: 'Stage B',
        order: 2,
        is_active: 'true',
        extra_schema: null,
        company_id: null,
        description: null,
        is_default: null,
        is_sample: null,
        created_at: null,
        updated_at: null,
        created_by_id: null,
        created_by: null,
      },
    ]);

    const { result } = renderHook(() => useSalesStages());
    expect(result.current).toHaveLength(2);
  });

  it('filters to only sales-typed stages when the type field is present', () => {
    seedMetadataTypes([
      {
        id: 'sales-1',
        scope: 'pipeline_stage',
        name: 'Prospect',
        order: 1,
        is_active: 'true',
        extra_schema: { type: 'sales' },
        company_id: null,
        description: null,
        is_default: null,
        is_sample: null,
        created_at: null,
        updated_at: null,
        created_by_id: null,
        created_by: null,
      },
      {
        id: 'ops-1',
        scope: 'pipeline_stage',
        name: 'Active Trial',
        order: 2,
        is_active: 'true',
        extra_schema: { type: 'operations' },
        company_id: null,
        description: null,
        is_default: null,
        is_sample: null,
        created_at: null,
        updated_at: null,
        created_by_id: null,
        created_by: null,
      },
    ]);

    const { result } = renderHook(() => useSalesStages());
    expect(result.current).toHaveLength(1);
    expect(result.current[0]?.id).toBe('sales-1');
  });
});
