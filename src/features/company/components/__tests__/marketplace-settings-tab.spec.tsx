import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks ──────────────────────────────────────────────────────────────────
const updateCompanyImmediateMock = vi.fn().mockResolvedValue(undefined);
const savePreferencesMock = vi.fn().mockResolvedValue(undefined);

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

const companySettingsMock = {
  value: {
    company: {
      id: 'c1',
      name: 'Acme',
      marketplace_post_jobs: true,
      marketplace_fill_jobs: false,
      profit_margin_type: 'percentage',
      profit_margin_value: 10,
      has_hsh_addon: true,
    } as unknown as Record<string, unknown>,
    generalSettings: {} as unknown,
    isLoading: false,
    saving: false,
    error: null,
    save: vi.fn(),
    saveSettings: vi.fn(),
    updateCompanyImmediate: updateCompanyImmediateMock,
    uploadLogo: vi.fn(),
  },
};

const entitySettingMock = {
  value: {
    data: {
      hsh_decline_notifications: 'with_message_only',
      hsh_decline_notification_threshold: 10,
    } as Record<string, unknown>,
    isLoading: false,
    save: savePreferencesMock,
  },
};

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => tier1Mock.value,
}));

vi.mock('@/features/company/hooks/use-company-settings', () => ({
  useCompanySettings: () => companySettingsMock.value,
}));

vi.mock('@/features/settings/hooks/use-entity-setting', () => ({
  useEntitySetting: () => entitySettingMock.value,
}));

import { MarketplaceSettingsTab } from '../marketplace-settings-tab';

describe('MarketplaceSettingsTab', () => {
  beforeEach(() => {
    updateCompanyImmediateMock.mockClear();
    savePreferencesMock.mockClear();
    companySettingsMock.value.company = {
      id: 'c1',
      name: 'Acme',
      marketplace_post_jobs: true,
      marketplace_fill_jobs: false,
      profit_margin_type: 'percentage',
      profit_margin_value: 10,
      has_hsh_addon: true,
    };
    entitySettingMock.value = {
      data: {
        hsh_decline_notifications: 'with_message_only',
        hsh_decline_notification_threshold: 10,
      },
      isLoading: false,
      save: savePreferencesMock,
    };
  });

  it('renders the HotSeatHub Settings card without crashing', () => {
    render(<MarketplaceSettingsTab />);
    expect(screen.getByText('HotSeatHub Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Enable Help Wanted')).toBeInTheDocument();
    expect(screen.getByLabelText('Enable Potential Gigs')).toBeInTheDocument();
    // Profit margin region visible because marketplace_post_jobs is true.
    expect(screen.getByLabelText('Margin Type')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Notification Preference'),
    ).toBeInTheDocument();
  });

  it('toggles Enable Help Wanted immediately via updateCompanyImmediate', () => {
    companySettingsMock.value.company = {
      ...companySettingsMock.value.company,
      marketplace_post_jobs: false,
    };
    render(<MarketplaceSettingsTab />);
    const toggle = screen.getByLabelText('Enable Help Wanted');
    fireEvent.click(toggle);
    expect(updateCompanyImmediateMock).toHaveBeenCalledTimes(1);
    expect(updateCompanyImmediateMock).toHaveBeenCalledWith(
      'marketplace_post_jobs',
      true,
    );
  });

  it('saves decline notification preference via useEntitySetting.save', () => {
    render(<MarketplaceSettingsTab />);
    const select = screen.getByLabelText(
      'Notification Preference',
    ) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'none' } });
    expect(savePreferencesMock).toHaveBeenCalledTimes(1);
    expect(savePreferencesMock).toHaveBeenCalledWith({
      hsh_decline_notifications: 'none',
    });
  });

  it('saves profit margin type immediately via updateCompanyImmediate', () => {
    render(<MarketplaceSettingsTab />);
    const select = screen.getByLabelText('Margin Type') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'dollar' } });
    expect(updateCompanyImmediateMock).toHaveBeenCalledTimes(1);
    expect(updateCompanyImmediateMock).toHaveBeenCalledWith(
      'profit_margin_type',
      'dollar',
    );
  });

  it('hides profit-margin and decline-notification subregions when marketplace_post_jobs is false', () => {
    companySettingsMock.value.company = {
      ...companySettingsMock.value.company,
      marketplace_post_jobs: false,
    };
    render(<MarketplaceSettingsTab />);
    expect(screen.queryByLabelText('Margin Type')).toBeNull();
    expect(screen.queryByLabelText('Notification Preference')).toBeNull();
  });
});
