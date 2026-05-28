/**
 * Tier1Provider tests — assert that the four lookup arrays
 * (pipelineStages, serviceCategories, consultantTiers, clientTypes)
 * surface from PGlite MetadataType rows (Pattern 4), update when rows
 * change, and preserve referential identity across unrelated mutations.
 *
 * Pattern 4: MetadataType is now read via `useMetadataTypeRows` (useLiveQuery
 * from PGlite), not from the Zustand entity graph. Tests mock the hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';

// ── Auth hook mocks ──────────────────────────────────────────────────────────
const mockUseAuth = vi.fn();
const mockUseCurrentUser = vi.fn();
const mockUseCurrentCompany = vi.fn();

vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/features/auth/hooks/use-current-user', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

vi.mock('@/features/auth/hooks/use-current-company', () => ({
  useCurrentCompany: () => mockUseCurrentCompany(),
}));

// Theme applier is a side-effect; stub to avoid touching document.
vi.mock('@/shared/lib/theme', () => ({
  applyThemeVars: vi.fn(),
}));

// ── Pattern 4: mock useMetadataTypeRows instead of Zustand graph ─────────────
// Tier1Provider reads MetadataType via PGlite live query (Pattern 4).
// We mock the hook so tests can supply any row set without a real PGlite DB.
let mockMetadataRows: Array<Record<string, unknown>> = [];

vi.mock('@/shared/hooks/use-tier-a-query', () => ({
  useMetadataTypeRows: () => ({
    rows: mockMetadataRows,
    loading: false,
  }),
}));

import { Tier1Provider, useTier1 } from '../tier1-provider';

const COMPANY = 'co-current';
const OTHER = 'co-other';

function Wrapper({ children }: PropsWithChildren) {
  return <Tier1Provider>{children}</Tier1Provider>;
}

function seedMetadataType(rows: Array<Record<string, unknown>>): void {
  mockMetadataRows = rows;
}

function clearMetadataType(): void {
  mockMetadataRows = [];
}

beforeEach(() => {
  clearMetadataType();
  mockUseAuth.mockReturnValue({ user: { id: 'u-1', email: 'u@example.com' }, isLoading: false });
  mockUseCurrentUser.mockReturnValue({
    userInfo: { id: 'ui-1', company_id: COMPANY, company_role: 'Owner', is_sales: false, status: 'active' },
    isLoading: false,
  });
  mockUseCurrentCompany.mockReturnValue({
    company: {
      id: COMPANY,
      name: 'Current Co',
      theme: null,
      marketplace_fill_jobs: false,
      marketplace_post_jobs: false,
    },
    isLoading: false,
  });
});

describe('Tier1Provider — lookups (Pattern 4 / PGlite)', () => {
  it('exposes pipelineStages projected from MetadataType + scope filter', () => {
    seedMetadataType([
      {
        id: 'p1',
        scope: 'pipeline_stage',
        name: 'Prospect',
        order: 1,
        is_active: 'true',
        extra_schema: { type: 'sales', revenue_probability: 0.4 },
        company_id: null,
      },
      {
        id: 'p2',
        scope: 'pipeline_stage',
        name: 'Trial',
        order: 2,
        is_active: 'true',
        extra_schema: { type: 'operations' },
        company_id: COMPANY,
      },
      {
        id: 'other-co',
        scope: 'pipeline_stage',
        name: 'Other',
        order: 1,
        is_active: 'true',
        extra_schema: null,
        company_id: OTHER,
      },
    ]);
    const { result } = renderHook(() => useTier1(), { wrapper: Wrapper });
    expect(result.current.pipelineStages.map((s) => s.id)).toEqual(['p1', 'p2']);
    expect(result.current.pipelineStages[0]).toMatchObject({
      type: 'sales',
      revenue_probability: 0.4,
    });
  });

  it('updates pipelineStages when mock rows change and component re-renders', () => {
    seedMetadataType([
      {
        id: 'p1',
        scope: 'pipeline_stage',
        name: 'Prospect',
        order: 1,
        is_active: 'true',
        extra_schema: null,
        company_id: null,
      },
    ]);
    const { result, rerender } = renderHook(() => useTier1(), { wrapper: Wrapper });
    expect(result.current.pipelineStages).toHaveLength(1);

    act(() => {
      mockMetadataRows = [
        ...mockMetadataRows,
        {
          id: 'p2',
          scope: 'pipeline_stage',
          name: 'Won',
          order: 2,
          is_active: 'true',
          extra_schema: null,
          company_id: null,
        },
      ];
    });
    rerender();
    expect(result.current.pipelineStages).toHaveLength(2);
    expect(result.current.pipelineStages.map((s) => s.id)).toEqual(['p1', 'p2']);
  });

  it('preserves referential identity when rows array reference is unchanged', () => {
    seedMetadataType([
      {
        id: 'p1',
        scope: 'pipeline_stage',
        name: 'Prospect',
        order: 1,
        is_active: 'true',
        extra_schema: null,
        company_id: null,
      },
    ]);
    const { result, rerender } = renderHook(() => useTier1(), { wrapper: Wrapper });
    const firstRef = result.current.pipelineStages;

    // Re-render without changing mockMetadataRows — memoization must hold.
    rerender();

    expect(result.current.pipelineStages).toBe(firstRef);
  });

  it('exposes serviceCategories, consultantTiers, clientTypes from the same rows', () => {
    seedMetadataType([
      {
        id: 'sc-1',
        scope: 'service_category',
        name: 'Strategy',
        order: 1,
        is_active: 'true',
        extra_schema: null,
        company_id: null,
      },
      {
        id: 'tier-1',
        scope: 'consultant_tier',
        name: 'Senior',
        order: 1,
        is_active: 'true',
        extra_schema: { multiplier: 1.25 },
        company_id: null,
      },
      {
        id: 'ct-1',
        scope: 'client_type',
        name: 'Law Firm',
        order: 1,
        is_active: 'true',
        extra_schema: null,
        company_id: null,
      },
    ]);
    const { result } = renderHook(() => useTier1(), { wrapper: Wrapper });
    expect(result.current.serviceCategories.map((r) => r.id)).toEqual(['sc-1']);
    expect(result.current.consultantTiers[0]?.multiplier).toBe(1.25);
    expect(result.current.clientTypes.map((r) => r.id)).toEqual(['ct-1']);
  });
});

describe('Tier1Provider — render contract', () => {
  it('renders children even when no MetadataType rows are seeded', () => {
    const { container } = render(
      <Tier1Provider>
        <div data-testid="ok">child</div>
      </Tier1Provider>,
    );
    expect(container.querySelector('[data-testid="ok"]')).not.toBeNull();
  });
});
