import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockUseRecent = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/features/dashboard/hooks/use-recent-activity', () => ({
  useRecentActivity: () => mockUseRecent(),
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import { RecentActivityCard } from '../recent-activity-card';

beforeEach(() => {
  mockNavigate.mockReset();
});

describe('RecentActivityCard', () => {
  it('renders bible empty-state copy when both lists are empty', () => {
    mockUseRecent.mockReturnValue({
      recentlyWon: [],
      recentInvoices: [],
      isLoading: false,
    });
    render(<RecentActivityCard />);
    expect(screen.getByText('No recent activity')).toBeTruthy();
  });

  it('renders win rows + invoice rows', () => {
    mockUseRecent.mockReturnValue({
      recentlyWon: [{ id: 'w1', case_name: 'Acme v. Doe', won_date: '2026-03-10' }],
      recentInvoices: [
        { id: 'i1', invoice_number: 'INV-001', total: 1000, status: 'paid', invoice_date: '2026-03-12' },
      ],
      isLoading: false,
    });
    render(<RecentActivityCard />);
    expect(screen.getByTestId('recent-win-w1')).toBeTruthy();
    expect(screen.getByTestId('recent-invoice-i1')).toBeTruthy();
    expect(screen.getByText('Acme v. Doe')).toBeTruthy();
    expect(screen.getByText('INV-001')).toBeTruthy();
  });

  it('navigates to /Invoices when invoice row is clicked', () => {
    mockUseRecent.mockReturnValue({
      recentlyWon: [],
      recentInvoices: [
        { id: 'i1', invoice_number: 'X', total: 0, status: null, invoice_date: null },
      ],
      isLoading: false,
    });
    render(<RecentActivityCard />);
    fireEvent.click(screen.getByTestId('recent-invoice-i1').querySelector('button')!);
    expect(mockNavigate).toHaveBeenCalledWith('/Invoices');
  });
});
