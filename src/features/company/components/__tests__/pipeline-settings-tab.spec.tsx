/**
 * pipeline-settings-tab.spec.tsx — unit tests for the Settings → Pipeline
 * Stages tab.
 *
 * Mocks `useTier1` and `usePipelineStages` so the component renders against
 * a deterministic in-memory stage set. Verifies:
 *   • stage list renders for both pipeline types
 *   • delete-with-deals path surfaces the warning and does NOT call remove()
 *   • delete-without-deals path surfaces the confirm dialog with a Delete CTA
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Mocks ──────────────────────────────────────────────────────────────────
const removeMock = vi.fn().mockResolvedValue(undefined);
const updateMock = vi.fn().mockResolvedValue(undefined);
const createMock = vi.fn().mockResolvedValue(undefined);
const reorderMock = vi.fn().mockResolvedValue(undefined);
const countDealsMock = vi.fn();

type SettingsStage = import(
  '@/features/company/hooks/use-pipeline-stages'
).SettingsPipelineStage;

const stagesMock: { stages: SettingsStage[] } = {
  stages: [
    {
      id: 'sales-1',
      name: 'Lead',
      type: 'sales',
      color: '#3b82f6',
      revenue_probability: 0.25,
      order: 0,
      company_id: 'c1',
      auto_move_on_document_sent_category_id: null,
      auto_move_on_document_signed_category_id: null,
      auto_move_on_earliest_task_start: false,
      auto_move_on_trial_start: false,
    },
    {
      id: 'sales-2',
      name: 'Proposal Sent',
      type: 'sales',
      color: '#a855f7',
      revenue_probability: 0.5,
      order: 1,
      company_id: 'c1',
      auto_move_on_document_sent_category_id: null,
      auto_move_on_document_signed_category_id: null,
      auto_move_on_earliest_task_start: false,
      auto_move_on_trial_start: false,
    },
    {
      id: 'ops-1',
      name: 'Pre-Trial',
      type: 'operations',
      color: '#22c55e',
      revenue_probability: 1,
      order: 0,
      company_id: 'c1',
      auto_move_on_document_sent_category_id: null,
      auto_move_on_document_signed_category_id: null,
      auto_move_on_earliest_task_start: false,
      auto_move_on_trial_start: false,
    },
  ],
};

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => ({
    user: { id: 'u1', email: 'admin@example.com' },
    userInfo: { id: 'ui1', company_id: 'c1', company_role: 'admin' },
    company: { id: 'c1', name: 'Acme' },
    role: 'admin',
    isLoading: false,
    isError: false,
    pipelineStages: [],
    serviceCategories: [],
    consultantTiers: [],
    clientTypes: [],
  }),
}));

vi.mock('@/features/company/hooks/use-pipeline-stages', () => ({
  usePipelineStages: () => {
    const stages = stagesMock.stages;
    return {
      stages,
      salesStages: stages.filter((s) => s.type === 'sales'),
      opsStages: stages.filter((s) => s.type === 'operations'),
      isMutating: false,
      stageCount: stages.length,
      countDeals: countDealsMock,
      create: createMock,
      update: updateMock,
      remove: removeMock,
      reorder: reorderMock,
    };
  },
}));

import { PipelineSettingsTab } from '../pipeline-settings-tab';

describe('PipelineSettingsTab', () => {
  beforeEach(() => {
    removeMock.mockClear();
    updateMock.mockClear();
    createMock.mockClear();
    reorderMock.mockClear();
    countDealsMock.mockReset();
  });

  it('renders the sales and operations stage lists', () => {
    render(<PipelineSettingsTab />);
    expect(screen.getByText('Sales Pipeline Stages')).toBeInTheDocument();
    expect(screen.getByText('Operations Pipeline Stages')).toBeInTheDocument();
    // Stage badges (visible labels).
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.getByText('Proposal Sent')).toBeInTheDocument();
    expect(screen.getByText('Pre-Trial')).toBeInTheDocument();
  });

  it('blocks delete when deals reference the stage and shows a warning', async () => {
    countDealsMock.mockResolvedValue(3);
    render(<PipelineSettingsTab />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Lead' }));

    await waitFor(() =>
      expect(
        screen.getByText('Cannot delete this stage'),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/3 deals in this stage — reassign or close them first/i),
    ).toBeInTheDocument();
    // No Delete CTA exposed in the blocked state.
    expect(
      screen.queryByRole('button', { name: 'Delete' }),
    ).not.toBeInTheDocument();
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('confirms and removes the stage when no deals reference it', async () => {
    countDealsMock.mockResolvedValue(0);
    render(<PipelineSettingsTab />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Lead' }));

    await waitFor(() =>
      expect(screen.getByText('Delete Pipeline Stage?')).toBeInTheDocument(),
    );

    const confirmBtn = await screen.findByRole('button', { name: 'Delete' });
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(removeMock).toHaveBeenCalledWith('sales-1'));
  });

  it('disables the delete button when only one stage of the type remains', () => {
    stagesMock.stages = [
      {
        id: 'ops-only',
        name: 'Only Ops',
        type: 'operations',
        color: '#22c55e',
        revenue_probability: 1,
        order: 0,
        company_id: 'c1',
        auto_move_on_document_sent_category_id: null,
        auto_move_on_document_signed_category_id: null,
        auto_move_on_earliest_task_start: false,
        auto_move_on_trial_start: false,
      },
    ];
    render(<PipelineSettingsTab />);
    const deleteBtn = screen.getByRole('button', { name: 'Delete Only Ops' });
    expect(deleteBtn).toBeDisabled();
    // Reset for other tests in the file (note: vitest reorders, so this is
    // defensive only).
    stagesMock.stages = [];
  });
});
