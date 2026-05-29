import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockUseTier1 = vi.fn();
const mockUseCurrentUser = vi.fn();
const mockUseClientsList = vi.fn();
const mockUseDealsTrialsData = vi.fn();
const mockUseSalesActivities = vi.fn();

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));
vi.mock('@/features/auth/hooks/use-current-user', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));
vi.mock('@/features/clients/hooks/use-clients-list', () => ({
  useClientsList: () => mockUseClientsList(),
}));
vi.mock('@/features/deals/hooks/use-deals-trials-data', () => ({
  useDealsTrialsData: () => mockUseDealsTrialsData(),
}));
vi.mock('@/features/deals/hooks/use-sales-activities', () => ({
  useSalesActivities: () => mockUseSalesActivities(),
}));

import { useNeedsAttention } from '../use-needs-attention';

const NOW = new Date(2026, 2, 15); // 2026-03-15
const tier1Sales = { company: { id: 'co', name: 'Co' }, role: 'sales' };
const tier1Owner = { company: { id: 'co', name: 'Co' }, role: 'owner' };

const stages = [
  { id: 'sales', type: 'sales' },
  { id: 'ops', type: 'operations' },
];

const clients = [
  { id: 'cl-mine', sales_lead: 'me' },
  { id: 'cl-other', sales_lead: 'someone-else' },
];

beforeEach(() => {
  mockUseTier1.mockReturnValue(tier1Sales);
  mockUseCurrentUser.mockReturnValue({ userInfo: { id: 'me' }, isLoading: false });
  mockUseClientsList.mockReturnValue({ clients, isLoading: false });
  mockUseDealsTrialsData.mockReturnValue({
    trials: [],
    pipelineStages: stages,
    isLoading: false,
  });
  mockUseSalesActivities.mockReturnValue({
    attorneys: [],
    salesActivities: [],
    isLoading: false,
  });
});

describe('useNeedsAttention', () => {
  it('returns empty when no company', () => {
    mockUseTier1.mockReturnValue({ company: null, role: 'sales' });
    const { result } = renderHook(() => useNeedsAttention({ now: NOW }));
    expect(result.current.myCount).toBe(0);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.shouldRender).toBe(false);
  });

  it('counts deals + prospects mine vs total via the stale-deals rule', () => {
    mockUseDealsTrialsData.mockReturnValue({
      trials: [
        { id: 'd1', pipeline_stage_id: 'sales', consultant_id: 'me' }, // stale, mine
        { id: 'd2', pipeline_stage_id: 'sales', consultant_id: 'other' }, // stale, theirs
        { id: 'd3', pipeline_stage_id: 'ops', consultant_id: 'me' }, // not a deal
      ],
      pipelineStages: stages,
      isLoading: false,
    });
    mockUseSalesActivities.mockReturnValue({
      attorneys: [{ id: 'a1', client_id: 'cl-mine', is_active_prospect: true }], // stale, mine
      salesActivities: [],
      isLoading: false,
    });
    const { result } = renderHook(() => useNeedsAttention({ now: NOW }));
    expect(result.current.totalCount).toBe(3); // d1 + d2 + a1
    expect(result.current.myCount).toBe(2); // d1 + a1
  });

  it('uses sales (non-owner) copy and gates on myCount', () => {
    mockUseDealsTrialsData.mockReturnValue({
      trials: [{ id: 'd1', pipeline_stage_id: 'sales', consultant_id: 'me' }],
      pipelineStages: stages,
      isLoading: false,
    });
    const { result } = renderHook(() => useNeedsAttention({ now: NOW }));
    expect(result.current.shouldRender).toBe(true);
    expect(result.current.headline).toBe('1 deal item needs attention');
    expect(result.current.subhead).toBe(
      'Overdue or no next step scheduled — open Deal Tracker to follow up.',
    );
  });

  it('pluralizes the sales copy for multiple items', () => {
    mockUseDealsTrialsData.mockReturnValue({
      trials: [
        { id: 'd1', pipeline_stage_id: 'sales', consultant_id: 'me' },
        { id: 'd2', pipeline_stage_id: 'sales', consultant_id: 'me' },
      ],
      pipelineStages: stages,
      isLoading: false,
    });
    const { result } = renderHook(() => useNeedsAttention({ now: NOW }));
    expect(result.current.headline).toBe('2 deal items need attention');
  });

  it('uses owner copy (my / total) and renders on total>0 even when myCount is 0', () => {
    mockUseTier1.mockReturnValue(tier1Owner);
    mockUseDealsTrialsData.mockReturnValue({
      trials: [{ id: 'd2', pipeline_stage_id: 'sales', consultant_id: 'other' }], // theirs
      pipelineStages: stages,
      isLoading: false,
    });
    const { result } = renderHook(() => useNeedsAttention({ now: NOW }));
    expect(result.current.myCount).toBe(0);
    expect(result.current.totalCount).toBe(1);
    expect(result.current.shouldRender).toBe(true);
    expect(result.current.headline).toBe('0 of yours / 1 total need attention');
    expect(result.current.subhead).toBe(
      'Overdue or missing a next step — open Deal Tracker to follow up.',
    );
  });

  it('excludes deals with a future next step', () => {
    mockUseDealsTrialsData.mockReturnValue({
      trials: [{ id: 'd1', pipeline_stage_id: 'sales', consultant_id: 'me' }],
      pipelineStages: stages,
      isLoading: false,
    });
    mockUseSalesActivities.mockReturnValue({
      attorneys: [],
      salesActivities: [
        { trial_id: 'd1', scheduled_date: '2026-03-20', status: 'pending' },
      ],
      isLoading: false,
    });
    const { result } = renderHook(() => useNeedsAttention({ now: NOW }));
    expect(result.current.totalCount).toBe(0);
    expect(result.current.shouldRender).toBe(false);
  });
});
