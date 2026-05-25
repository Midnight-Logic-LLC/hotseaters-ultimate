import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockUseTier1 = vi.fn();
vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));

import { useQuickActions } from '../use-quick-actions';

beforeEach(() => {
  mockNavigate.mockReset();
});

describe('useQuickActions', () => {
  it('owner without HSH gets 5 actions in bible order', () => {
    mockUseTier1.mockReturnValue({
      role: 'owner',
      company: { marketplace_post_jobs: false, marketplace_fill_jobs: false },
    });
    const { result } = renderHook(() => useQuickActions());
    expect(result.current.map((a) => a.id)).toEqual([
      'new-deal',
      'log-time',
      'add-client',
      'view-schedule',
      'new-invoice',
    ]);
  });

  it('owner with HSH gets 6 including hot-seat-hub with purple accent', () => {
    mockUseTier1.mockReturnValue({
      role: 'owner',
      company: { marketplace_post_jobs: true, marketplace_fill_jobs: false },
    });
    const { result } = renderHook(() => useQuickActions());
    expect(result.current.map((a) => a.id)).toEqual([
      'new-deal',
      'log-time',
      'add-client',
      'view-schedule',
      'hot-seat-hub',
      'new-invoice',
    ]);
    expect(result.current.find((a) => a.id === 'hot-seat-hub')?.accent).toBe('purple');
  });

  it('trial_consultant gets the fixed 4-action set', () => {
    mockUseTier1.mockReturnValue({
      role: 'trial_consultant',
      company: { marketplace_post_jobs: true, marketplace_fill_jobs: false },
    });
    const { result } = renderHook(() => useQuickActions());
    expect(result.current.map((a) => a.id)).toEqual([
      'log-time',
      'add-expense',
      'time-off',
      'view-schedule',
    ]);
  });

  it('onClick navigates to the bible route', () => {
    mockUseTier1.mockReturnValue({
      role: 'owner',
      company: { marketplace_post_jobs: false, marketplace_fill_jobs: false },
    });
    const { result } = renderHook(() => useQuickActions());
    const newDeal = result.current.find((a) => a.id === 'new-deal');
    act(() => {
      newDeal?.onClick();
    });
    expect(mockNavigate).toHaveBeenCalledWith('/DealTracker?tab=pipeline');
  });

  it('every action has a non-empty label + icon', () => {
    mockUseTier1.mockReturnValue({
      role: 'owner',
      company: { marketplace_post_jobs: true, marketplace_fill_jobs: false },
    });
    const { result } = renderHook(() => useQuickActions());
    for (const a of result.current) {
      expect(a.label.length).toBeGreaterThan(0);
      expect(typeof a.icon).toBe('object'); // lucide icons are React components
    }
  });
});
