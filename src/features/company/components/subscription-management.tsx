/**
 * subscription-management.tsx — full-parity port of
 * `HotSeatersMVP/src/components/settings/SubscriptionManagement.jsx`.
 *
 * Displays the tenant's current subscription state:
 *   - Trial: "X days remaining in your 14-day trial" (calculated from
 *     `company.created_date` / `created_at`).
 *   - Active: "HotSeaters" plan card with status badge + manage button
 *     that opens the Stripe Customer Portal.
 *   - None: "No active subscription found" empty-state with a link to
 *     `/Pricing`.
 *
 * Bible's `useQuery(['subscription', company.id])` round-trips to a
 * `getSubscriptionDetails` Edge Function; the port currently derives
 * subscription presence from `company.stripe_customer_id` (truthy →
 * active) and defers the renewal-date / plan-name lookup until the
 * `useSubscription()` hook lands in change-S13. Until then we show the
 * trial countdown when `stripe_customer_id` is null and a generic
 * active-plan card when it's set.
 *
 * Components → hooks only (RULE B). All I/O lives in `useTier1()` (the
 * company row) and (later) `useSubscription()`.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Calendar,
  CreditCard,
  Users,
} from 'lucide-react';

import { useTier1 } from '@/app/tier1-provider';

const TRIAL_LENGTH_DAYS = 14;
const PLAN_NAME = 'HotSeaters';
const PRICING_PATH = '/Pricing';

interface TrialStatus {
  daysRemaining: number;
  totalDays: number;
  expired: boolean;
}

function calculateTrialStatus(createdIso: string | null | undefined): TrialStatus {
  if (!createdIso) {
    return { daysRemaining: TRIAL_LENGTH_DAYS, totalDays: TRIAL_LENGTH_DAYS, expired: false };
  }
  const created = new Date(createdIso);
  if (Number.isNaN(created.getTime())) {
    return { daysRemaining: TRIAL_LENGTH_DAYS, totalDays: TRIAL_LENGTH_DAYS, expired: false };
  }
  const now = Date.now();
  const elapsedMs = now - created.getTime();
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const remaining = TRIAL_LENGTH_DAYS - elapsedDays;
  return {
    daysRemaining: Math.max(0, remaining),
    totalDays: TRIAL_LENGTH_DAYS,
    expired: remaining <= 0,
  };
}

export function SubscriptionManagement() {
  const { company } = useTier1();

  const hasActiveSubscription = Boolean(
    (company as { stripe_customer_id?: string | null } | null)?.stripe_customer_id,
  );

  const trialStatus = useMemo(() => {
    const createdDate =
      (company as { created_date?: string | null } | null)?.created_date ??
      (company as { created_at?: string | null } | null)?.created_at ??
      null;
    return calculateTrialStatus(createdDate);
  }, [company]);

  const handleManageBilling = () => {
    // Until the `useSubscription()` hook lands (change-S13), open the
    // canonical billing portal at the marketing site. The bible POSTs to
    // a `createPortalSession` edge function and redirects to the
    // tenant-scoped Stripe portal URL.
    if (typeof window !== 'undefined') {
      window.open('https://prometheusags.ai/billing', '_blank', 'noreferrer');
    }
  };

  const handleViewPricing = () => {
    if (typeof window !== 'undefined') {
      window.location.href = PRICING_PATH;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--theme-card-gap)',
      }}
    >
      {/* ── Current Plan Card ───────────────────────────────────────── */}
      <div
        className="border-2 border-indigo-200 rounded-lg bg-gradient-to-br from-white to-indigo-50"
        style={{ padding: 'var(--theme-card-padding)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3
                className="font-bold"
                style={{
                  fontSize: 'var(--theme-text-card-title)',
                  color: 'var(--theme-stone-900)',
                }}
              >
                {PLAN_NAME}
              </h3>
              <p
                style={{
                  fontSize: 'var(--theme-text-caption)',
                  color: 'var(--theme-stone-600)',
                }}
              >
                {hasActiveSubscription
                  ? 'Your current plan'
                  : trialStatus.expired
                    ? 'Trial expired'
                    : 'Free trial'}
              </p>
            </div>
          </div>
          {hasActiveSubscription && (
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" aria-hidden="true" />
              Active
            </Badge>
          )}
          {!hasActiveSubscription && !trialStatus.expired && (
            <Badge className="bg-amber-100 text-amber-700">
              <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
              Trial
            </Badge>
          )}
        </div>

        {!hasActiveSubscription && (
          <div className="space-y-3 mb-4">
            <div
              className="flex items-center gap-2"
              style={{
                fontSize: 'var(--theme-text-body)',
                color: 'var(--theme-stone-600)',
              }}
            >
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span data-testid="trial-status-text">
                {trialStatus.expired
                  ? `Your ${trialStatus.totalDays}-day trial has ended`
                  : `${trialStatus.daysRemaining} days remaining in your ${trialStatus.totalDays}-day trial`}
              </span>
            </div>
          </div>
        )}

        {hasActiveSubscription ? (
          <Button
            onClick={handleManageBilling}
            className="w-full hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: 'var(--theme-brand-primary)',
              color: 'white',
            }}
          >
            <CreditCard className="w-4 h-4 mr-2" aria-hidden="true" />
            Manage Billing & Subscription
          </Button>
        ) : (
          <Button
            onClick={handleViewPricing}
            className="w-full hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: 'var(--theme-brand-primary)',
              color: 'white',
            }}
          >
            {trialStatus.expired ? 'Upgrade to Continue' : 'View Pricing Plans'}
          </Button>
        )}

        <p
          className="text-center"
          style={{
            fontSize: 'var(--theme-text-caption)',
            color: 'var(--theme-stone-500)',
            marginTop: 'var(--theme-element-gap)',
          }}
        >
          {hasActiveSubscription
            ? 'Update payment methods, change plans, or cancel subscription'
            : 'Upgrade anytime to unlock unlimited trials and HotSeatHub access'}
        </p>
      </div>
    </div>
  );
}

export default SubscriptionManagement;
