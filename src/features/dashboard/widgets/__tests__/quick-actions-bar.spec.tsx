import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Clock } from 'lucide-react';

const mockUseQuickActions = vi.fn();
const mockUseDashboardLayout = vi.fn();

vi.mock('@/features/dashboard/hooks/use-quick-actions', () => ({
  useQuickActions: () => mockUseQuickActions(),
}));

vi.mock('@/features/dashboard/hooks/use-dashboard-widgets', () => ({
  useDashboardLayout: () => mockUseDashboardLayout(),
}));

import { QuickActionsBar } from '../quick-actions-bar';

beforeEach(() => {
  mockUseDashboardLayout.mockReturnValue({
    kpiGridClass: 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6',
    quickActionsGridClass: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  });
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

  it('uses the grid class returned by useDashboardLayout', () => {
    mockUseDashboardLayout.mockReturnValue({
      kpiGridClass: 'grid grid-cols-2',
      quickActionsGridClass: 'grid grid-cols-2 sm:grid-cols-4',
    });
    render(<QuickActionsBar />);
    const wrapper = screen.getByTestId('quick-actions-bar');
    expect(wrapper.querySelector('.sm\\:grid-cols-4')).not.toBeNull();
  });
});
