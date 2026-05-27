import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ──────────────────────────────────────────────────────────────────

const hookMock: {
  value: {
    userId: string | null;
    status: {
      pgliteActive: boolean;
      schemaVersion: string;
      tenantId: string | null;
      hydratedAt: string | null;
    } | null;
    isLoading: boolean;
    loadError: string | null;
    actionState: 'idle' | 'working' | 'done' | 'error';
    actionError: string | null;
    reload: ReturnType<typeof vi.fn>;
    clearLocal: ReturnType<typeof vi.fn>;
    forceSync: ReturnType<typeof vi.fn>;
  };
} = {
  value: {
    userId: 'u1',
    status: {
      pgliteActive: true,
      schemaVersion: '20260525000004',
      tenantId: '00000000-0000-0000-0000-000000000001',
      hydratedAt: '2026-05-26T12:00:00.000Z',
    },
    isLoading: false,
    loadError: null,
    actionState: 'idle',
    actionError: null,
    reload: vi.fn().mockResolvedValue(undefined),
    clearLocal: vi.fn().mockResolvedValue(undefined),
    forceSync: vi.fn().mockResolvedValue(undefined),
  },
};

vi.mock('@/features/company/hooks/use-database-status', () => ({
  useDatabaseStatus: () => hookMock.value,
}));

import { DatabaseSettingsTab } from '../database-settings-tab';

describe('DatabaseSettingsTab', () => {
  beforeEach(() => {
    hookMock.value = {
      ...hookMock.value,
      isLoading: false,
      loadError: null,
      actionState: 'idle',
      actionError: null,
      status: {
        pgliteActive: true,
        schemaVersion: '20260525000004',
        tenantId: '00000000-0000-0000-0000-000000000001',
        hydratedAt: '2026-05-26T12:00:00.000Z',
      },
    };
  });

  it('renders PGlite local-database status when active', () => {
    render(<DatabaseSettingsTab />);
    expect(screen.getByText(/local database: active/i)).toBeInTheDocument();
    expect(screen.getByText('20260525000004')).toBeInTheDocument();
  });

  it('renders Electric sync status with the last-hydrated timestamp', () => {
    render(<DatabaseSettingsTab />);
    expect(screen.getByText(/electric sync/i)).toBeInTheDocument();
    expect(screen.getByText(/last hydrated/i)).toBeInTheDocument();
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
  });

  it('renders both Clear Local Data and Force Sync action buttons', () => {
    render(<DatabaseSettingsTab />);
    expect(
      screen.getByRole('button', { name: /clear local data/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /force sync/i }),
    ).toBeInTheDocument();
  });

  it('shows a loading state while status is being read', () => {
    hookMock.value = { ...hookMock.value, isLoading: true, status: null };
    render(<DatabaseSettingsTab />);
    expect(
      screen.getByText(/reading local database status/i),
    ).toBeInTheDocument();
  });
});
