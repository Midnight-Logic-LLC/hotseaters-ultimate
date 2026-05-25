import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockUseQuickStats = vi.fn();
vi.mock('@/features/dashboard/hooks/use-quick-stats', () => ({
  useQuickStats: () => mockUseQuickStats(),
}));

import { QuickStatsCard } from '../quick-stats-card';

beforeEach(() => {
  mockUseQuickStats.mockReset();
});

describe('QuickStatsCard', () => {
  it('renders the 4 always-on counters when not loading', () => {
    mockUseQuickStats.mockReturnValue({
      activeClients: 5,
      teamMembers: 3,
      outstandingAmount: 12_500,
      avgHoursPerWeek: 4.25,
      openHshPosts: undefined,
      activeHshGigs: undefined,
      isLoading: false,
    });
    render(<QuickStatsCard />);
    expect(screen.getByText('Active Clients')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('Team Members')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('$12,500')).toBeTruthy();
    expect(screen.getByText('4.3')).toBeTruthy();
    expect(screen.queryByText('HSH Posts')).toBeNull();
    expect(screen.queryByText('HSH Gigs')).toBeNull();
  });

  it('renders HSH rows when company flags are set', () => {
    mockUseQuickStats.mockReturnValue({
      activeClients: 0,
      teamMembers: 0,
      outstandingAmount: 0,
      avgHoursPerWeek: 0,
      openHshPosts: 2,
      activeHshGigs: 1,
      isLoading: false,
    });
    render(<QuickStatsCard />);
    expect(screen.getByText('HSH Posts')).toBeTruthy();
    expect(screen.getByText('HSH Gigs')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('renders a skeleton when loading', () => {
    mockUseQuickStats.mockReturnValue({
      activeClients: 0,
      teamMembers: 0,
      outstandingAmount: 0,
      avgHoursPerWeek: 0,
      openHshPosts: undefined,
      activeHshGigs: undefined,
      isLoading: true,
    });
    render(<QuickStatsCard />);
    expect(screen.getByLabelText('Quick stats loading')).toBeTruthy();
  });
});
