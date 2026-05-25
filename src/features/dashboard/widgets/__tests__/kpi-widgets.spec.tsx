/**
 * Smoke specs for the 6 KPI widgets. Each mocks its data hook(s) and
 * asserts the widget mounts with the bible-correct testid + value text.
 * Full visual parity is enforced by the change-409 Playwright harness.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ---- shared mocks -------------------------------------------------------
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockUseTier1 = vi.fn();
const mockUseTrialsList = vi.fn();
const mockUsePipelineSummary = vi.fn();
const mockUseQuickStats = vi.fn();
const mockUseRevenueTrend = vi.fn();
const mockUseRecentActivity = vi.fn();

vi.mock('@/app/tier1-provider', () => ({ useTier1: () => mockUseTier1() }));
vi.mock('@/features/trials/hooks/use-trials-list', () => ({
  useTrialsList: () => mockUseTrialsList(),
}));
vi.mock('@/features/dashboard/hooks/use-pipeline-summary', () => ({
  usePipelineSummary: () => mockUsePipelineSummary(),
}));
vi.mock('@/features/dashboard/hooks/use-quick-stats', () => ({
  useQuickStats: () => mockUseQuickStats(),
}));
vi.mock('@/features/dashboard/hooks/use-revenue-trend', () => ({
  useRevenueTrend: () => mockUseRevenueTrend(),
}));
vi.mock('@/features/dashboard/hooks/use-recent-activity', () => ({
  useRecentActivity: () => mockUseRecentActivity(),
}));

beforeEach(() => {
  mockNavigate.mockReset();
  mockUseTier1.mockReturnValue({
    company: { id: 'co' },
    pipelineStages: [
      { id: 'sales', name: 'Lead', type: 'sales', revenue_probability: 0.5, is_active: true, order: 1, company_id: null },
      { id: 'prep', name: 'Prep', type: 'operations', revenue_probability: 1, is_active: true, order: 1, company_id: null },
    ],
  });
  mockUseTrialsList.mockReturnValue({ items: [], isLoading: false });
  mockUsePipelineSummary.mockReturnValue({
    pipelineValue: 0,
    weightedValue: 0,
    dealCount: 0,
    dealsByStage: [],
    isLoading: false,
  });
  mockUseQuickStats.mockReturnValue({
    activeClients: 0,
    teamMembers: 0,
    outstandingAmount: 0,
    avgHoursPerWeek: 0,
    openHshPosts: undefined,
    activeHshGigs: undefined,
    isLoading: false,
  });
  mockUseRevenueTrend.mockReturnValue({
    data: [],
    period: 'month',
    fiscalYear: 2026,
    cumulative: false,
    availableFiscalYears: [2026],
    revenueGoal: 0,
    isLoading: false,
  });
  mockUseRecentActivity.mockReturnValue({
    recentlyWon: [],
    recentInvoices: [],
    isLoading: false,
  });
});

import { KpiRevenueYtd } from '../kpi-revenue-ytd';
import { KpiPipelineValue } from '../kpi-pipeline-value';
import { KpiOutstanding } from '../kpi-outstanding';
import { KpiActiveTrials } from '../kpi-active-trials';
import { KpiTrialsYtd } from '../kpi-trials-ytd';
import { KpiRevenuePerTrialYtd } from '../kpi-revenue-per-trial-ytd';

describe('KpiRevenueYtd', () => {
  it('renders $0 and the testid when no invoices exist', () => {
    render(<KpiRevenueYtd />);
    expect(screen.getByTestId('kpi-revenue-ytd')).toBeTruthy();
    expect(screen.getByText('Revenue YTD')).toBeTruthy();
    expect(screen.getByText('$0')).toBeTruthy();
  });
});

describe('KpiPipelineValue', () => {
  it('renders 0 deals + $0 weighted on empty pipeline', () => {
    render(<KpiPipelineValue />);
    expect(screen.getByTestId('kpi-pipeline-value')).toBeTruthy();
    expect(screen.getByText('Pipeline Value')).toBeTruthy();
    expect(screen.getByText(/0 active deals/)).toBeTruthy();
  });

  it('renders bible-correct $ + weighted format', () => {
    mockUsePipelineSummary.mockReturnValue({
      pipelineValue: 150_000,
      weightedValue: 35_000,
      dealCount: 2,
      dealsByStage: [],
      isLoading: false,
    });
    render(<KpiPipelineValue />);
    expect(screen.getByText('$150,000')).toBeTruthy();
    expect(screen.getByText('2 active deals • $35,000 weighted')).toBeTruthy();
  });
});

describe('KpiOutstanding', () => {
  it('renders Outstanding tile testid', () => {
    render(<KpiOutstanding />);
    expect(screen.getByTestId('kpi-outstanding')).toBeTruthy();
    expect(screen.getByText('Outstanding')).toBeTruthy();
  });
});

describe('KpiActiveTrials', () => {
  it('renders 0/0 active+upcoming on empty data', () => {
    render(<KpiActiveTrials />);
    expect(screen.getByTestId('kpi-active-trials')).toBeTruthy();
    expect(screen.getByText('Active Trials')).toBeTruthy();
    expect(screen.getByText('0 upcoming • 0 in progress')).toBeTruthy();
  });
});

describe('KpiTrialsYtd', () => {
  it('renders 0 trials YTD when none won', () => {
    render(<KpiTrialsYtd />);
    expect(screen.getByTestId('kpi-trials-ytd')).toBeTruthy();
    expect(screen.getByText('Trials YTD')).toBeTruthy();
  });
});

describe('KpiRevenuePerTrialYtd', () => {
  it('renders $0 when no trials won', () => {
    render(<KpiRevenuePerTrialYtd />);
    expect(screen.getByTestId('kpi-revenue-per-trial-ytd')).toBeTruthy();
    expect(screen.getByText('Revenue/Trial YTD')).toBeTruthy();
    expect(screen.getByText('$0')).toBeTruthy();
  });
});
