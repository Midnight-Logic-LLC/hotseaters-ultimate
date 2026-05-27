import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks ──────────────────────────────────────────────────────────────────
const saveSettingsMock = vi.fn().mockResolvedValue(undefined);
const updateCompanyImmediateMock = vi.fn().mockResolvedValue(undefined);
const uploadLogoMock = vi.fn().mockResolvedValue('https://cdn/logo.png');

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
      hide_deals_from_time_clock: false,
    } as unknown as Record<string, unknown>,
    generalSettings: {
      company_name: 'Acme',
      website: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      default_tax_rate: '',
      invoice_number_format: 'INV-0000',
      invoice_number_start: '1',
      job_number_format: 'JOB-0000',
      job_number_start: '1',
      default_daily_minimum_hours: '8',
      time_rounding_minutes: '15',
      clock_in_rounding: 'nearest',
      clock_out_rounding: 'nearest',
      invoice_due_days: '30',
      annual_revenue_target: '0',
      monthly_breakeven: '0',
      retainer_divisor: '15000',
      retainer_multiplier: '5000',
      retainer_minimum: '1000',
      default_invoice_email_message: '',
      sender_email: '',
    },
    isLoading: false,
    saving: false,
    error: null,
    save: vi.fn(),
    saveSettings: saveSettingsMock,
    updateCompanyImmediate: updateCompanyImmediateMock,
    uploadLogo: uploadLogoMock,
  },
};

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => tier1Mock.value,
}));

vi.mock('@/features/company/hooks/use-company-settings', () => ({
  useCompanySettings: () => companySettingsMock.value,
}));

import { TimeTrackingSettingsTab } from '../time-tracking-settings-tab';

describe('TimeTrackingSettingsTab', () => {
  beforeEach(() => {
    saveSettingsMock.mockClear();
    updateCompanyImmediateMock.mockClear();
    uploadLogoMock.mockClear();
    tier1Mock.value = {
      ...tier1Mock.value,
      userInfo: { id: 'ui1', company_id: 'c1', company_role: 'admin' },
      role: 'admin',
    } as unknown as ReturnType<typeof import('@/app/tier1-provider').useTier1>;
  });

  it('renders the Time Tracking card without crashing', () => {
    render(<TimeTrackingSettingsTab />);
    expect(screen.getByText('Time Tracking')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Time Entry Rounding (minutes)'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Clock-In Rounding')).toBeInTheDocument();
    expect(screen.getByLabelText('Clock-Out Rounding')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Default Daily Minimum Hours'),
    ).toBeInTheDocument();
  });

  it('toggles hide_deals_from_time_clock immediately via updateCompanyImmediate', () => {
    render(<TimeTrackingSettingsTab />);
    const toggle = screen.getByLabelText('Hide Deals from Time Clock');
    fireEvent.click(toggle);
    expect(updateCompanyImmediateMock).toHaveBeenCalledTimes(1);
    expect(updateCompanyImmediateMock).toHaveBeenCalledWith(
      'hide_deals_from_time_clock',
      true,
    );
    expect(saveSettingsMock).not.toHaveBeenCalled();
  });

  it('Save button calls saveSettings with current draft values', () => {
    render(<TimeTrackingSettingsTab />);
    const saveBtn = screen.getByRole('button', {
      name: /save time tracking settings/i,
    });
    fireEvent.click(saveBtn);
    expect(saveSettingsMock).toHaveBeenCalledTimes(1);
    const arg = saveSettingsMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(arg.time_rounding_minutes).toBe('15');
    expect(arg.clock_in_rounding).toBe('nearest');
    expect(arg.clock_out_rounding).toBe('nearest');
    expect(arg.default_daily_minimum_hours).toBe('8');
  });

  it('hides the Hide-Deals admin toggle for non-admin roles', () => {
    tier1Mock.value = {
      ...tier1Mock.value,
      userInfo: {
        id: 'ui2',
        company_id: 'c1',
        company_role: 'trial_consultant',
      },
      role: 'trial_consultant',
    } as unknown as ReturnType<typeof import('@/app/tier1-provider').useTier1>;
    render(<TimeTrackingSettingsTab />);
    expect(screen.queryByText('Hide Deals from Time Clock')).toBeNull();
  });
});
