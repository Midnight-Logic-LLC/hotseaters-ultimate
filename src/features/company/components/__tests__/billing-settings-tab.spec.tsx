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
      invoice_period: 'monthly',
      monthly_billing_date: 15,
      weekly_billing_day: 'Friday',
      per_trial_billing_days_after_end: 7,
      invoice_number_reset_yearly: false,
      job_number_reset_yearly: false,
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

import { BillingSettingsTab } from '../billing-settings-tab';

describe('BillingSettingsTab', () => {
  beforeEach(() => {
    saveSettingsMock.mockClear();
    updateCompanyImmediateMock.mockClear();
    uploadLogoMock.mockClear();
  });

  it('renders the three card titles without crashing', () => {
    render(<BillingSettingsTab />);
    expect(screen.getByText('Billing Settings')).toBeInTheDocument();
    expect(screen.getByText('Email Settings')).toBeInTheDocument();
    expect(screen.getByText('Retainer Formula')).toBeInTheDocument();
  });

  it('shows the Monthly Billing Date input when invoice_period is monthly', () => {
    render(<BillingSettingsTab />);
    expect(screen.getByLabelText('Monthly Billing Date')).toBeInTheDocument();
    expect(screen.queryByLabelText('Weekly Billing Day')).toBeNull();
    expect(screen.queryByLabelText('Days After Trial End')).toBeNull();
  });

  it('invoice_period change calls updateCompanyImmediate immediately', () => {
    render(<BillingSettingsTab />);
    const select = screen.getByLabelText(
      'Billing Frequency',
    ) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'weekly' } });
    expect(updateCompanyImmediateMock).toHaveBeenCalledWith(
      'invoice_period',
      'weekly',
    );
  });

  it('retainer calculator updates live when the budget changes', () => {
    render(<BillingSettingsTab />);
    const result = screen.getByLabelText(
      'Calculated Retainer',
    ) as HTMLInputElement;
    // Initial: budget = 0 → minimum $1,000
    expect(result.value).toBe('$1,000');

    const budget = screen.getByLabelText(
      'Hypothetical Budget',
    ) as HTMLInputElement;
    // 45000 / 15000 = 3 tiers * 5000 = 15000
    fireEvent.change(budget, { target: { value: '45000' } });
    expect(result.value).toBe('$15,000');
  });

  it('retainer calculator updates live when a formula input changes', () => {
    render(<BillingSettingsTab />);
    const budget = screen.getByLabelText(
      'Hypothetical Budget',
    ) as HTMLInputElement;
    fireEvent.change(budget, { target: { value: '30000' } });
    // Default: floor(30000/15000) * 5000 = 10000
    const result = screen.getByLabelText(
      'Calculated Retainer',
    ) as HTMLInputElement;
    expect(result.value).toBe('$10,000');

    // The retainer-minimum input is wrapped in prose ("Every retainer will
    // have a minimum value of $") rather than a <Label htmlFor>, so look it
    // up by ID — matches the bible's markup pattern.
    const minimumInput = document.getElementById(
      'retainer_minimum',
    ) as HTMLInputElement;
    fireEvent.change(minimumInput, { target: { value: '25000' } });
    expect(result.value).toBe('$25,000');
  });

  it('save button calls saveSettings with the current draft', () => {
    render(<BillingSettingsTab />);
    const saveBtn = screen.getByRole('button', {
      name: /save billing settings/i,
    });
    fireEvent.click(saveBtn);
    expect(saveSettingsMock).toHaveBeenCalledTimes(1);
    const arg = saveSettingsMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(arg.invoice_number_format).toBe('INV-0000');
    expect(arg.retainer_divisor).toBe('15000');
  });
});
