import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ──────────────────────────────────────────────────────────────────

const tier1Mock = {
  value: {
    user: { id: 'u1', email: 'admin@example.com' },
    userInfo: { id: 'ui1', company_id: 'c1', company_role: 'admin' as const },
    company: { id: 'c1', name: 'Acme' },
    role: 'admin' as const,
    isLoading: false,
    isError: false,
    pipelineStages: [],
    serviceCategories: [],
    consultantTiers: [],
    clientTypes: [],
  } as unknown as ReturnType<typeof import('@/app/tier1-provider').useTier1>,
};

const teamMock = {
  value: {
    members: [
      {
        id: 'm1',
        email: 'alice@example.com',
        first_name: 'Alice',
        last_name: 'A',
        company_role: 'owner',
        account_status: 'active' as const,
        is_sales: false,
      },
    ],
    isLoading: false,
    total: 1,
    refetch: vi.fn(),
    invite: vi.fn(),
    invitePending: false,
    inviteError: null,
    updateMember: vi.fn(),
  },
};

const dbStatusMock = {
  value: {
    userId: 'u1',
    status: {
      pgliteActive: true,
      schemaVersion: '20260525000004',
      tenantId: 'c1',
      hydratedAt: '2026-05-26T12:00:00.000Z',
    },
    isLoading: false,
    loadError: null,
    actionState: 'idle' as const,
    actionError: null,
    reload: vi.fn(),
    clearLocal: vi.fn(),
    forceSync: vi.fn(),
  },
};

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => tier1Mock.value,
}));

vi.mock('@/features/company/hooks/use-team', () => ({
  useTeam: () => teamMock.value,
}));

vi.mock('@/features/company/hooks/use-database-status', () => ({
  useDatabaseStatus: () => dbStatusMock.value,
}));

import { AdminSettingsTab } from '../admin-settings-tab';

describe('AdminSettingsTab', () => {
  beforeEach(() => {
    tier1Mock.value = {
      ...tier1Mock.value,
      role: 'admin',
    } as unknown as ReturnType<typeof import('@/app/tier1-provider').useTier1>;
  });

  it('renders without crashing for admin role', () => {
    render(<AdminSettingsTab />);
    expect(screen.getByText(/admin tools/i)).toBeInTheDocument();
    expect(screen.getByText(/team members/i)).toBeInTheDocument();
    expect(screen.getByText(/system diagnostics/i)).toBeInTheDocument();
  });

  it('renders the team member row from the team hook', () => {
    render(<AdminSettingsTab />);
    expect(screen.getByText('Alice A')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('hides admin tooling for non-admin roles', () => {
    tier1Mock.value = {
      ...tier1Mock.value,
      role: 'trial_consultant',
    } as unknown as ReturnType<typeof import('@/app/tier1-provider').useTier1>;
    render(<AdminSettingsTab />);
    expect(screen.queryByText(/team members/i)).toBeNull();
    expect(
      screen.getByText(/only available to platform administrators/i),
    ).toBeInTheDocument();
  });
});
