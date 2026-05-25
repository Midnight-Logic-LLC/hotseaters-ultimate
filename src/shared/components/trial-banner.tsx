/**
 * TrialBanner — dismissible banner shown above main content when the company
 * is in its 14-day free trial period.
 *
 * Ported from `HotSeatersMVP/src/components/TrialBanner.jsx`.
 * - No stripe_customer_id → show trial countdown.
 * - Urgent (≤3 days remaining) → red background, else indigo.
 * - Dismissible per session via local state.
 * - Upgrade CTA navigates to /Billing.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, X } from 'lucide-react';

export interface TrialBannerCompany {
  stripe_customer_id?: string | null;
  created_date?: string | null;
  created_at?: string | null;
}

interface TrialBannerProps {
  company: TrialBannerCompany | null;
}

export function TrialBanner({ company }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!company || dismissed) return null;

  // Active subscription → no banner
  if (company.stripe_customer_id) return null;

  // Support both `created_date` (legacy) and `created_at` (V2)
  const createdDateStr = company.created_date ?? company.created_at ?? null;
  if (!createdDateStr) return null;

  const createdDate = new Date(createdDateStr);
  if (isNaN(createdDate.getTime())) return null;

  // Compare at midnight for accurate day calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const createdMidnight = new Date(createdDate);
  createdMidnight.setHours(0, 0, 0, 0);

  const msElapsed = today.getTime() - createdMidnight.getTime();
  const daysElapsed = Math.floor(msElapsed / (24 * 60 * 60 * 1000));
  const daysRemaining = 14 - daysElapsed;

  // Trial expired
  if (daysRemaining < 0) return null;

  const isUrgent = daysRemaining <= 3;

  let trialMessage: string;
  if (daysRemaining === 0) {
    trialMessage = 'Your free trial ends today!';
  } else if (daysRemaining === 1) {
    trialMessage = '1 day left in your free trial';
  } else {
    trialMessage = `${daysRemaining} days left in your free trial`;
  }

  return (
    <div
      className="flex items-center justify-between px-4 py-2 text-sm text-white"
      style={{ backgroundColor: isUrgent ? '#dc2626' : '#4f46e5' }}
    >
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 flex-shrink-0" />
        <span className="font-medium">{trialMessage}</span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          to="/Billing"
          className="rounded px-3 py-1 font-medium transition-colors hover:bg-indigo-50"
          style={{ backgroundColor: 'white', color: isUrgent ? '#991b1b' : '#4338ca' }}
        >
          Upgrade Now
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="rounded p-1 transition-colors hover:bg-white/20"
          aria-label="Dismiss trial banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default TrialBanner;
