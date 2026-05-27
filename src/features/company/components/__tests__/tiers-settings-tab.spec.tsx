import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import type { LookupRow } from '@/shared/db/lookups-selectors';

// ── Mocks ──────────────────────────────────────────────────────────────────
const createTierMock = vi.fn().mockResolvedValue(undefined);
const updateTierMock = vi.fn().mockResolvedValue(undefined);
const deleteTierMock = vi.fn().mockResolvedValue(undefined);

const consultantTiersFixture: LookupRow[] = [
  {
    id: 'tier-1',
    name: 'Senior',
    is_active: true,
    order: 0,
    company_id: 'c1',
    extra_schema: { multiplier: 1.2, description: 'Senior rate' },
    multiplier: 1.2,
  },
  {
    id: 'tier-2',
    name: 'Junior',
    is_active: true,
    order: 1,
    company_id: 'c1',
    extra_schema: { multiplier: 0.8 },
    multiplier: 0.8,
  },
];

const tiersHookMock = {
  value: {
    consultantTiers: consultantTiersFixture,
    companyId: 'c1',
    saving: false,
    error: null as string | null,
    createTier: createTierMock,
    updateTier: updateTierMock,
    deleteTier: deleteTierMock,
  },
};

vi.mock('@/features/company/hooks/use-tiers', () => ({
  useTiers: () => tiersHookMock.value,
}));

import { TiersSettingsTab } from '../tiers-settings-tab';

describe('TiersSettingsTab', () => {
  beforeEach(() => {
    createTierMock.mockClear();
    updateTierMock.mockClear();
    deleteTierMock.mockClear();
    tiersHookMock.value = {
      ...tiersHookMock.value,
      consultantTiers: consultantTiersFixture,
      saving: false,
    };
  });

  it('renders each consultant tier with its name and multiplier', () => {
    render(<TiersSettingsTab />);
    expect(screen.getByText('Senior')).toBeInTheDocument();
    expect(screen.getByText('Junior')).toBeInTheDocument();
    expect(screen.getByText('×1.2')).toBeInTheDocument();
    expect(screen.getByText('×0.8')).toBeInTheDocument();
  });

  it('clicking edit on a tier reveals the inline-edit form', () => {
    render(<TiersSettingsTab />);
    const editBtn = screen.getByRole('button', { name: /edit senior/i });
    fireEvent.click(editBtn);
    const nameInput = screen.getByLabelText('Tier Name *') as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();
    expect(nameInput.value).toBe('Senior');
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('clicking Add Tier shows the create form with empty defaults', () => {
    render(<TiersSettingsTab />);
    fireEvent.click(screen.getByRole('button', { name: /add tier/i }));
    expect(
      screen.getByRole('button', { name: /create/i }),
    ).toBeInTheDocument();
    const multiplierInput = screen.getByLabelText(
      'Price Multiplier *',
    ) as HTMLInputElement;
    expect(multiplierInput.value).toBe('1');
  });

  it('renders the empty-state copy when there are no tiers', () => {
    tiersHookMock.value = {
      ...tiersHookMock.value,
      consultantTiers: [],
    };
    render(<TiersSettingsTab />);
    expect(
      screen.getByText('No consultant tiers configured'),
    ).toBeInTheDocument();
  });

  it('clicking delete opens the confirm dialog', () => {
    render(<TiersSettingsTab />);
    fireEvent.click(screen.getByRole('button', { name: /delete senior/i }));
    expect(screen.getByText(/Delete this tier\?/i)).toBeInTheDocument();
  });
});
