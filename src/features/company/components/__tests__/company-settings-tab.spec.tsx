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
      logo: null,
      show_debug_info: false,
    } as unknown as Record<string, unknown>,
    generalSettings: {
      company_name: 'Acme',
      website: 'https://acme.test',
      email: 'hi@acme.test',
      phone: '',
      address: '1 Main St',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      default_tax_rate: '8.25',
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

import { CompanySettingsTab } from '../company-settings-tab';

describe('CompanySettingsTab', () => {
  beforeEach(() => {
    saveSettingsMock.mockClear();
    updateCompanyImmediateMock.mockClear();
    uploadLogoMock.mockClear();
    // Reset to admin defaults
    tier1Mock.value = {
      ...tier1Mock.value,
      userInfo: { id: 'ui1', company_id: 'c1', company_role: 'admin' },
      role: 'admin',
    } as unknown as ReturnType<typeof import('@/app/tier1-provider').useTier1>;
  });

  it('renders company name with the value from settings', () => {
    render(<CompanySettingsTab />);
    const input = screen.getByLabelText('Company Name') as HTMLInputElement;
    expect(input.value).toBe('Acme');
  });

  it('applies formatPhone masking when phone is edited', () => {
    render(<CompanySettingsTab />);
    const phone = screen.getByLabelText('Phone Number') as HTMLInputElement;
    fireEvent.change(phone, { target: { value: '5551234567' } });
    expect(phone.value).toBe('(555) 123-4567');
  });

  it('shows the admin Show Debug Info toggle for admin role', () => {
    render(<CompanySettingsTab />);
    expect(screen.getByText('Show Debug Info')).toBeInTheDocument();
  });

  it('hides the Show Debug Info toggle for non-admin (trial_consultant) role', () => {
    tier1Mock.value = {
      ...tier1Mock.value,
      userInfo: {
        id: 'ui2',
        company_id: 'c1',
        company_role: 'trial_consultant',
      },
      role: 'trial_consultant',
    } as unknown as ReturnType<typeof import('@/app/tier1-provider').useTier1>;
    render(<CompanySettingsTab />);
    expect(screen.queryByText('Show Debug Info')).toBeNull();
  });

  it('save button calls saveSettings with the current field values', async () => {
    render(<CompanySettingsTab />);
    const saveBtn = screen.getByRole('button', {
      name: /save company settings/i,
    });
    fireEvent.click(saveBtn);
    expect(saveSettingsMock).toHaveBeenCalledTimes(1);
    const arg = saveSettingsMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(arg.company_name).toBe('Acme');
    expect(arg.email).toBe('hi@acme.test');
    expect(arg.invoice_number_format).toBe('INV-0000');
  });
});
