import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockUseTier1 = vi.fn();
const mockUseNeedsAttention = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));
vi.mock('@/features/dashboard/hooks/use-needs-attention', () => ({
  useNeedsAttention: () => mockUseNeedsAttention(),
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import { NeedsAttentionBanner } from '../needs-attention-banner';

beforeEach(() => {
  mockNavigate.mockReset();
});

describe('NeedsAttentionBanner', () => {
  it('renders nothing when loading', () => {
    mockUseTier1.mockReturnValue({ role: 'sales' });
    mockUseNeedsAttention.mockReturnValue({ myCount: 5, totalCount: 10, isLoading: true });
    const { container } = render(<NeedsAttentionBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('hides for sales user with zero personal stale leads', () => {
    mockUseTier1.mockReturnValue({ role: 'sales' });
    mockUseNeedsAttention.mockReturnValue({ myCount: 0, totalCount: 100, isLoading: false });
    const { container } = render(<NeedsAttentionBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('shows totals copy for owner even when their personal count is 0', () => {
    mockUseTier1.mockReturnValue({ role: 'owner' });
    mockUseNeedsAttention.mockReturnValue({ myCount: 0, totalCount: 7, isLoading: false });
    render(<NeedsAttentionBanner />);
    expect(screen.getByText(/0 of yours \/ 7 total need attention/i)).toBeTruthy();
  });

  it('shows singular vs plural copy for sales', () => {
    mockUseTier1.mockReturnValue({ role: 'sales' });
    mockUseNeedsAttention.mockReturnValue({ myCount: 1, totalCount: 1, isLoading: false });
    const { rerender } = render(<NeedsAttentionBanner />);
    expect(screen.getByText(/1 lead needs attention/)).toBeTruthy();
    mockUseNeedsAttention.mockReturnValue({ myCount: 3, totalCount: 3, isLoading: false });
    rerender(<NeedsAttentionBanner />);
    expect(screen.getByText(/3 leads need attention/)).toBeTruthy();
  });

  it('navigates to /LeadRadar on click', () => {
    mockUseTier1.mockReturnValue({ role: 'sales' });
    mockUseNeedsAttention.mockReturnValue({ myCount: 2, totalCount: 2, isLoading: false });
    render(<NeedsAttentionBanner />);
    fireEvent.click(screen.getByTestId('needs-attention-banner'));
    expect(mockNavigate).toHaveBeenCalledWith('/LeadRadar');
  });
});
