import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { PipelineStage } from '@/shared/db/lookups-selectors';
import { DealTrackerTab } from '../deal-tracker-tab';
import type { DealRow } from '../deal-card-types';

// Force desktop so the labeled Add Contact / Add Deal buttons + My/All toggle render.
vi.mock('@/shared/hooks/use-mobile', () => ({ useIsMobile: () => false }));

const STAGES: PipelineStage[] = [
  { id: 's1', name: 'Lead', type: 'sales', revenue_probability: 1, is_active: true, order: 1, company_id: null },
];

const sharedProps = {
  allDeals: [] as DealRow[],
  clients: [],
  pipelineStages: STAGES,
  attorneys: [],
  documents: [],
  documentSigners: [],
  consultants: [],
  salesActivities: [],
  userInfo: null,
  onSelectTrial: vi.fn(),
  viewMode: 'next_step' as const,
  onViewModeChange: vi.fn(),
  dateFilter: 'this_year' as const,
  onDateFilterChange: vi.fn(),
  statusFilter: 'active' as const,
  onStatusFilterChange: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());

describe('DealTrackerTab toolbar', () => {
  it('fires distinct callbacks for Add Contact and Add Deal', () => {
    const onAddContact = vi.fn();
    const onAddDeal = vi.fn();
    render(<DealTrackerTab {...sharedProps} onAddContact={onAddContact} onAddDeal={onAddDeal} />);

    // Both a mobile (icon-only, title) and desktop (labeled) button render in
    // the DOM (visibility is CSS-only); the desktop one carries the text.
    fireEvent.click(screen.getByText('Add Contact'));
    expect(onAddContact).toHaveBeenCalledTimes(1);
    expect(onAddDeal).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Add Deal'));
    expect(onAddDeal).toHaveBeenCalledTimes(1);
    expect(onAddContact).toHaveBeenCalledTimes(1);
  });

  it('hides the salesperson filter for non-owner/admin users', () => {
    render(
      <DealTrackerTab
        {...sharedProps}
        userInfo={{ id: 'u1', company_role: 'sales' }}
        consultants={[{ id: 'u1', first_name: 'Sam', last_name: 'Sales' } as never]}
      />,
    );
    expect(screen.queryByLabelText('Salesperson')).not.toBeInTheDocument();
  });

  it('shows the salesperson filter for owner/admin when viewing All Deals', () => {
    render(
      <DealTrackerTab
        {...sharedProps}
        showMyDeals={false}
        userInfo={{ id: 'u1', company_role: 'owner' }}
        consultants={[{ id: 'u1', first_name: 'Olive', last_name: 'Owner' } as never]}
      />,
    );
    expect(screen.getByLabelText('Salesperson')).toBeInTheDocument();
  });
});
