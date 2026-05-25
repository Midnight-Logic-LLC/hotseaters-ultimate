import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockUseUpcoming = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/features/dashboard/hooks/use-upcoming-trials', () => ({
  useUpcomingTrials: () => mockUseUpcoming(),
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import { UpcomingTrialsCard } from '../upcoming-trials-card';

beforeEach(() => {
  mockNavigate.mockReset();
});

describe('UpcomingTrialsCard', () => {
  it('renders bible empty-state copy when there are no upcoming trials', () => {
    mockUseUpcoming.mockReturnValue({ items: [], isLoading: false });
    render(<UpcomingTrialsCard />);
    expect(screen.getByText('No upcoming trials scheduled')).toBeTruthy();
  });

  it('renders one row per trial with case_name + client', () => {
    mockUseUpcoming.mockReturnValue({
      items: [
        { id: 't1', case_name: 'Acme v. Doe', start_date: '2099-12-31', client_id: 'c1', client_firm_name: 'Acme LLP' },
      ],
      isLoading: false,
    });
    render(<UpcomingTrialsCard />);
    expect(screen.getByTestId('upcoming-trial-t1')).toBeTruthy();
    expect(screen.getByText('Acme v. Doe')).toBeTruthy();
    expect(screen.getByText(/Acme LLP/)).toBeTruthy();
  });

  it('header "View Schedule" navigates to /Timeline', () => {
    mockUseUpcoming.mockReturnValue({ items: [], isLoading: false });
    render(<UpcomingTrialsCard />);
    fireEvent.click(screen.getByTestId('upcoming-trials-view-schedule'));
    expect(mockNavigate).toHaveBeenCalledWith('/Timeline');
  });

  it('row click navigates to /Trials', () => {
    mockUseUpcoming.mockReturnValue({
      items: [{ id: 't1', case_name: 'A', start_date: '2099-01-01', client_id: null, client_firm_name: null }],
      isLoading: false,
    });
    render(<UpcomingTrialsCard />);
    fireEvent.click(screen.getByTestId('upcoming-trial-t1'));
    expect(mockNavigate).toHaveBeenCalledWith('/Trials');
  });
});
