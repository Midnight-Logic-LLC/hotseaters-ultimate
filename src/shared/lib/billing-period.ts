/**
 * billing-period.ts — Pure billing period calculations.
 *
 * Ported from HotSeatersMVP/src/components/billing/billingPeriodUtils.jsx
 * No I/O — only date math. Safe to use in business-rules layers.
 */
import { format, addDays, subDays } from 'date-fns';

export interface BillingPeriod {
  period_start: string; // yyyy-MM-dd
  period_end: string;   // yyyy-MM-dd
  period_label: string;
}

interface CompanyBillingSettings {
  invoice_period?: string | null;
  weekly_billing_day?: string | null;
  monthly_billing_date?: number | null;
  time_rounding_minutes?: number | null;
}

/**
 * Returns the most recently COMPLETED billing period for a company.
 */
export function getCurrentBillingPeriod(company: CompanyBillingSettings | null | undefined): BillingPeriod {
  const now = new Date();
  const invoicePeriod = company?.invoice_period ?? 'monthly';

  if (invoicePeriod === 'weekly') {
    const billingDay = company?.weekly_billing_day ?? 'Friday';
    const dayMap: Record<string, number> = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
    };
    const startDayIdx = dayMap[billingDay] ?? 5;
    const currentDay = now.getDay();
    const daysSinceStart = (currentDay - startDayIdx + 7) % 7;
    const currentWeekStart = subDays(now, daysSinceStart);
    const periodEnd = subDays(currentWeekStart, 1);
    const periodStart = subDays(periodEnd, 6);
    return {
      period_start: format(periodStart, 'yyyy-MM-dd'),
      period_end: format(periodEnd, 'yyyy-MM-dd'),
      period_label: `${format(periodStart, 'MMM d')} – ${format(periodEnd, 'MMM d, yyyy')}`,
    };
  }

  // Monthly
  const billingDate = company?.monthly_billing_date ?? 1;
  const currentDayOfMonth = now.getDate();
  let currentPeriodStart: Date;
  if (currentDayOfMonth >= billingDate) {
    currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), billingDate);
  } else {
    currentPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, billingDate);
  }
  const periodEndDate = subDays(currentPeriodStart, 1);
  const periodStartDate = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth() - 1, billingDate);

  return {
    period_start: format(periodStartDate, 'yyyy-MM-dd'),
    period_end: format(periodEndDate, 'yyyy-MM-dd'),
    period_label: format(periodStartDate, 'MMMM yyyy'),
  };
}

/**
 * Returns the current IN-PROGRESS billing period (the one after the completed one).
 */
export function getCurrentInProgressBillingPeriod(company: CompanyBillingSettings | null | undefined): BillingPeriod {
  const completed = getCurrentBillingPeriod(company);
  const invoicePeriod = company?.invoice_period ?? 'monthly';
  const inProgressStart = addDays(new Date(completed.period_end + 'T00:00:00'), 1);

  if (invoicePeriod === 'weekly') {
    const inProgressEnd = addDays(inProgressStart, 6);
    return {
      period_start: format(inProgressStart, 'yyyy-MM-dd'),
      period_end: format(inProgressEnd, 'yyyy-MM-dd'),
      period_label: `${format(inProgressStart, 'MMM d')} – ${format(inProgressEnd, 'MMM d, yyyy')}`,
    };
  }

  const billingDate = company?.monthly_billing_date ?? 1;
  let nextBillingDate: Date;
  if (inProgressStart.getDate() >= billingDate) {
    nextBillingDate = new Date(inProgressStart.getFullYear(), inProgressStart.getMonth() + 1, billingDate);
  } else {
    nextBillingDate = new Date(inProgressStart.getFullYear(), inProgressStart.getMonth(), billingDate);
  }
  const inProgressEnd = subDays(nextBillingDate, 1);

  return {
    period_start: format(inProgressStart, 'yyyy-MM-dd'),
    period_end: format(inProgressEnd, 'yyyy-MM-dd'),
    period_label: format(inProgressStart, 'MMMM yyyy'),
  };
}

/**
 * Format hours based on company time rounding preference.
 * Ported from HotSeatersMVP/src/components/utils.jsx — formatHours
 */
export function formatHours(hours: number | null | undefined, company: CompanyBillingSettings | null | undefined): string {
  if (hours == null) return '0h';
  const rounding = company?.time_rounding_minutes;
  let decimals = 2;
  if (rounding === 6) decimals = 1;
  else if (rounding === 60) decimals = 0;
  return `${Number(hours).toFixed(decimals)}h`;
}

/**
 * Format a dollar amount.
 * Ported from HotSeatersMVP/src/components/utils.jsx — formatCurrency
 */
export function formatCurrency(amount: number | null | undefined, showCents = false): string {
  if (amount == null || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(amount);
}
