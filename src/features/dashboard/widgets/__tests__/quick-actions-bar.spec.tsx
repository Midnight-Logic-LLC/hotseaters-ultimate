import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Clock } from 'lucide-react';

const mockUseTier1 = vi.fn();
const mockUseQuickActions = vi.fn();

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));

vi.mock('@/features/dashboard/hooks/use-quick-actions', () => ({
  useQuickActions: () => mockUseQuickActions(),
}));

import { QuickActionsBar } from '../quick-actions-bar';

beforeEach(() => {
  mockUseTier1.mockReturnValue({ role: 'owner' });
  mockUseQuickActions.mockReturnValue([
    { id: 'log-time', label: 'Log Time', icon: Clock, onClick: vi.fn() },
    { id: 'hot-seat-hub', label: 'HotSeatHub', icon: Clock, onClick: vi.fn(), accent: 'purple' },
  ]);
});

describe('QuickActionsBar', () => {
  it('renders one button per action from the hook', () => {
    render(<QuickActionsBar />);
    expect(screen.getByTestId('quick-actions-bar')).toBeTruthy();
    expect(screen.getByTestId('quick-action-log-time')).toBeTruthy();
    expect(screen.getByTestId('quick-action-hot-seat-hub')).toBeTruthy();
    expect(screen.getByText('Log Time')).toBeTruthy();
    expect(screen.getByText('HotSeatHub')).toBeTruthy();
  });

  it('calls the action onClick when clicked', () => {
    const onClick = vi.fn();
    mockUseQuickActions.mockReturnValue([
      { id: 'log-time', label: 'Log Time', icon: Clock, onClick },
    ]);
    render(<QuickActionsBar />);
    fireEvent.click(screen.getByTestId('quick-action-log-time'));
    expect(onClick).toHaveBeenCalled();
  });

  it('applies trial_consultant 4-column grid class when role matches', () => {
    mockUseTier1.mockReturnValue({ role: 'trial_consultant' });
    render(<QuickActionsBar />);
    // grid class on the inner div — find it via testid wrapper
    const wrapper = screen.getByTestId('quick-actions-bar');
    expect(wrapper.querySelector('.sm\\:grid-cols-4')).not.toBeNull();
  });
});
