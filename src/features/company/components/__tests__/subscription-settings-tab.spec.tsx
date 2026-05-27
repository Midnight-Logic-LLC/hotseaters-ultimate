import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const tier1Mock = {
  value: {
    user: { id: 'u1', email: 'owner@example.com' },
    userInfo: { id: 'ui1', company_id: 'c1', company_role: 'owner' as const },
    company: {
      id: 'c1',
      name: 'Acme',
      stripe_customer_id: null,
      // 5 days into a 14-day trial
      created_date: new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
    role: 'owner' as const,
    isLoading: false,
    isError: false,
    pipelineStages: [],
    serviceCategories: [],
    consultantTiers: [],
    clientTypes: [],
  } as unknown as ReturnType<typeof import('@/app/tier1-provider').useTier1>,
};

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => tier1Mock.value,
}));

import { SubscriptionSettingsTab } from '../subscription-settings-tab';

describe('SubscriptionSettingsTab', () => {
  it('renders without crashing and shows the card title', () => {
    render(<SubscriptionSettingsTab />);
    expect(screen.getByText('Subscription & Billing')).toBeInTheDocument();
    expect(screen.getByText('HotSeaters')).toBeInTheDocument();
  });

  it('shows trial countdown when stripe_customer_id is null', () => {
    render(<SubscriptionSettingsTab />);
    const status = screen.getByTestId('trial-status-text');
    // 14 - 5 = 9 days remaining
    expect(status.textContent).toMatch(/9 days remaining in your 14-day trial/);
    expect(screen.getByText(/free trial/i)).toBeInTheDocument();
  });

  it('renders the Privacy Policy and Terms of Service link buttons', () => {
    render(<SubscriptionSettingsTab />);
    expect(
      screen.getByRole('button', { name: /privacy policy/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /terms of service/i }),
    ).toBeInTheDocument();
  });

  it('opens the PolicyViewerModal when Privacy Policy link is clicked', () => {
    render(<SubscriptionSettingsTab />);
    fireEvent.click(
      screen.getByRole('button', { name: /privacy policy/i }),
    );
    expect(
      screen.getByText(/HotSeaters Privacy Policy/i),
    ).toBeInTheDocument();
  });

  it('opens the PolicyViewerModal with Terms content when Terms link is clicked', () => {
    render(<SubscriptionSettingsTab />);
    fireEvent.click(
      screen.getByRole('button', { name: /terms of service/i }),
    );
    expect(
      screen.getByText(/HotSeaters Terms of Service/i),
    ).toBeInTheDocument();
  });
});
