import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { PipelineStage } from '@/shared/db/lookups-selectors';
import { DealTrackerKanbanGrid } from '../deal-tracker-kanban-grid';
import type { DealRow, SharedCardProps } from '../deal-card-types';

// Force desktop so the grid renders the side-by-side columns + DnD path.
vi.mock('@/shared/hooks/use-mobile', () => ({ useIsMobile: () => false }));

// The Deal Tracker cards now consume the sales-activity surface. Stub the hook
// + the two cross-cutting reads the cards use so a card can render without a
// live Tier-1 provider / auth session / Supabase env in the unit-test env.
vi.mock('@/features/deals/hooks/use-sales-activities', () => ({
  useSalesActivities: () => ({
    salesActivities: [],
    attorneys: [],
    prospects: [],
    isLoading: false,
    error: null,
    reload: vi.fn(),
    createSalesActivity: vi.fn(),
    updateSalesActivity: vi.fn(),
    deleteSalesActivity: vi.fn(),
    resolveAnchors: vi.fn(),
    setAttorneyProspectStatus: vi.fn(),
    countSalesActivitiesForTrial: vi.fn(),
    deleteSalesActivitiesForTrial: vi.fn(),
  }),
}));
vi.mock('@/features/auth/hooks/use-current-user', () => ({
  useCurrentUser: () => ({ userInfo: null, isLoading: false }),
}));
vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => ({ company: null }),
}));
vi.mock('@/shared/db/supabase-client', () => {
  const queryStub: Record<string, unknown> = {
    select: () => queryStub,
    eq: () => queryStub,
    in: () => queryStub,
    order: () => queryStub,
    range: () => Promise.resolve({ data: [], error: null }),
    update: () => queryStub,
    insert: () => queryStub,
    delete: () => queryStub,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
  };
  return {
    supabase: { from: () => queryStub },
    getCurrentSession: () => Promise.resolve(null),
  };
});

const STAGES: PipelineStage[] = [
  { id: 's1', name: 'Lead', type: 'sales', revenue_probability: 1, is_active: true, order: 1, company_id: null },
  { id: 's2', name: 'LOE Sent', type: 'sales', revenue_probability: 1, is_active: true, order: 2, company_id: null },
];

function deal(p: Partial<DealRow> & { id: string }): DealRow {
  return {
    company_id: 'c1',
    bill_for_weekends: false,
    is_sample: false,
    daysUntilTrial: null,
    ...p,
  } as DealRow;
}

const sharedCardProps: SharedCardProps = {
  clients: [],
  pipelineStages: STAGES,
  attorneys: [],
  documents: [],
  documentSigners: [],
  consultants: [],
  salesActivities: [],
  onSelectTrial: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());

describe('DealTrackerKanbanGrid', () => {
  it('renders the trial_date columns with bible labels', () => {
    render(
      <DealTrackerKanbanGrid
        viewMode="trial_date"
        deals={[]}
        pipelineStages={STAGES}
        salesActivities={[]}
        sharedCardProps={sharedCardProps}
      />,
    );
    expect(screen.getByText('< 10 Days')).toBeInTheDocument();
    expect(screen.getByText('10 – 30 Days')).toBeInTheDocument();
    expect(screen.getByText('30 – 90 Days')).toBeInTheDocument();
    expect(screen.getByText('90+ Days')).toBeInTheDocument();
  });

  it('renders the next_step columns with bible labels', () => {
    render(
      <DealTrackerKanbanGrid
        viewMode="next_step"
        deals={[]}
        pipelineStages={STAGES}
        salesActivities={[]}
        sharedCardProps={sharedCardProps}
      />,
    );
    expect(screen.getByText('Needs Attention')).toBeInTheDocument();
    expect(screen.getByText('Due Soon')).toBeInTheDocument();
    expect(screen.getByText('On Deck')).toBeInTheDocument();
    expect(screen.getByText('Planned')).toBeInTheDocument();
  });

  it('renders one column per active sales stage in sales_stage view', () => {
    render(
      <DealTrackerKanbanGrid
        viewMode="sales_stage"
        deals={[deal({ id: 'd1', case_name: 'Acme v. Beta', pipeline_stage_id: 's1', daysUntilTrial: 40 })]}
        pipelineStages={STAGES}
        salesActivities={[]}
        sharedCardProps={sharedCardProps}
        onDragEnd={vi.fn()}
      />,
    );
    // column headers render as <h3> (card stage badges share the label text)
    expect(screen.getByRole('heading', { name: 'Lead' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'LOE Sent' })).toBeInTheDocument();
    // the deal card renders its case name
    expect(screen.getByText('Acme v. Beta')).toBeInTheDocument();
  });

  it('buckets a trial-date deal into the matching column', () => {
    render(
      <DealTrackerKanbanGrid
        viewMode="trial_date"
        deals={[deal({ id: 'urgent', case_name: 'Urgent Case', daysUntilTrial: 3, pipeline_stage_id: 's1' })]}
        pipelineStages={STAGES}
        salesActivities={[]}
        sharedCardProps={sharedCardProps}
      />,
    );
    // the "< 10 Days" column header sits in the same column frame as the card
    const urgentHeader = screen.getByText('< 10 Days');
    const column = urgentHeader.closest('div.bg-white');
    expect(column).not.toBeNull();
    expect(within(column as HTMLElement).getByText('Urgent Case')).toBeInTheDocument();
  });
});
