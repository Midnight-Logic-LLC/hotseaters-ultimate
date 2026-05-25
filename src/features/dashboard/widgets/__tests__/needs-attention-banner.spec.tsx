import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockUseNeedsAttention = vi.fn();
const mockNavigate = vi.fn();

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
  it('renders nothing when shouldRender is false (loading or zero counts)', () => {
    mockUseNeedsAttention.mockReturnValue({
      myCount: 0,
      totalCount: 0,
      isLoading: false,
      shouldRender: false,
      headline: '',
      subhead: '',
    });
    const { container } = render(<NeedsAttentionBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the headline + subhead from the hook', () => {
    mockUseNeedsAttention.mockReturnValue({
      myCount: 2,
      totalCount: 5,
      isLoading: false,
      shouldRender: true,
      headline: '2 leads need attention',
      subhead: 'Overdue or no next step scheduled — open Lead Radar to follow up.',
    });
    render(<NeedsAttentionBanner />);
    expect(screen.getByText('2 leads need attention')).toBeTruthy();
    expect(screen.getByText(/open Lead Radar/i)).toBeTruthy();
  });

  it('navigates to /LeadRadar on click', () => {
    mockUseNeedsAttention.mockReturnValue({
      myCount: 1,
      totalCount: 1,
      isLoading: false,
      shouldRender: true,
      headline: '1 lead needs attention',
      subhead: 'sub',
    });
    render(<NeedsAttentionBanner />);
    fireEvent.click(screen.getByTestId('needs-attention-banner'));
    expect(mockNavigate).toHaveBeenCalledWith('/LeadRadar');
  });
});
