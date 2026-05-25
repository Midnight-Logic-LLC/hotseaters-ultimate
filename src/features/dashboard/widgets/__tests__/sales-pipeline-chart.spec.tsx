import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockUsePipelineSummary = vi.fn();
vi.mock('@/features/dashboard/hooks/use-pipeline-summary', () => ({
  usePipelineSummary: () => mockUsePipelineSummary(),
}));

import { SalesPipelineChart } from '../sales-pipeline-chart';

beforeEach(() => {
  mockUsePipelineSummary.mockReset();
});

describe('SalesPipelineChart', () => {
  it('renders empty-state when no deals', () => {
    mockUsePipelineSummary.mockReturnValue({
      pipelineValue: 0,
      weightedValue: 0,
      dealCount: 0,
      dealsByStage: [],
      isLoading: false,
    });
    render(<SalesPipelineChart />);
    expect(screen.getByTestId('sales-pipeline-chart')).toBeTruthy();
    expect(screen.getByText('No active sales deals')).toBeTruthy();
  });

  it('renders a skeleton while loading with no data', () => {
    mockUsePipelineSummary.mockReturnValue({
      pipelineValue: 0,
      weightedValue: 0,
      dealCount: 0,
      dealsByStage: [],
      isLoading: true,
    });
    render(<SalesPipelineChart />);
    expect(screen.getByLabelText('Sales pipeline chart loading')).toBeTruthy();
  });

  it('mounts without throwing when there is data', () => {
    mockUsePipelineSummary.mockReturnValue({
      pipelineValue: 150_000,
      weightedValue: 35_000,
      dealCount: 2,
      dealsByStage: [
        { id: 's1', name: 'Lead', count: 1, value: 100_000 },
        { id: 's2', name: 'Proposal', count: 1, value: 50_000 },
      ],
      isLoading: false,
    });
    expect(() => render(<SalesPipelineChart />)).not.toThrow();
  });
});
