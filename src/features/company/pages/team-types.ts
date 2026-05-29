/**
 * team-types.ts — Shared types and constants for the Team page.
 *
 * Extracted from team-page.tsx (>800 lines) per RULE A split rules.
 * HotSeatersMVP is the bible.
 */

import type React from 'react';
import { Crown, Shield, Briefcase, User } from 'lucide-react';
import type { TeamMember } from '@/features/company/hooks/use-team';
import type { LookupRow } from '@/shared/db/lookups-selectors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LegacyRole = 'owner' | 'admin' | 'sales' | 'trial_consultant';

/** Minimal service record used for display. */
export interface ServiceRecord {
  id: string;
  name: string;
  category_id?: string | null;
  order?: number | null;
}

/** Minimal user-service join record. */
export interface UserServiceRecord {
  id: string;
  consultant_id: string;
  service_id: string;
}

/** Extended TeamMember with additional display fields from the bible. */
export type Consultant = TeamMember & {
  user_id?: string | null;
  consultant_tier_id?: string | null;
  company_role?: LegacyRole | null;
  title?: string | null;
  phone?: string | null;
  profile_photo?: string | null;
  status?: 'active' | 'inactive' | null;
  google_calendar_refresh_token?: string | null;
};

/** Pending invite — matches the bible's Invitation entity shape. */
export interface PendingInvite {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  status?: string | null;
  invitation_type?: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export type LucideIcon = React.ComponentType<{ className?: string }>;

export const roleIcons: Record<string, LucideIcon> = {
  owner: Crown,
  admin: Shield,
  sales: Briefcase,
  trial_consultant: User,
};

export const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  sales: 'bg-green-100 text-green-700',
  trial_consultant: 'bg-stone-100 text-stone-700',
};

export const roleLabels: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  sales: 'Sales',
  trial_consultant: 'Trial Consultant',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export function getTierColor(tier: LookupRow | undefined): string {
  if (!tier) return 'bg-stone-100 text-stone-700';
  const multiplier = tier.multiplier ?? 0;
  if (multiplier >= 1.2) return 'bg-purple-100 text-purple-700';
  if (multiplier >= 1.0) return 'bg-blue-100 text-blue-700';
  return 'bg-green-100 text-green-700';
}

export function sortServicesByOrder(svcs: ServiceRecord[]): ServiceRecord[] {
  return [...svcs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
