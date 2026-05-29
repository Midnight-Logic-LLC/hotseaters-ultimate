/**
 * navigation.ts — sidebar group + item registry.
 *
 * Ported verbatim from `HotSeatersMVP/src/Layout.jsx -> getNavigationGroups`.
 * Group order, group labels, item titles, and item URLs MUST match the legacy
 * app. The bible is `HotSeatersMVP`.
 *
 * Role-based filtering and company-flag-based filtering are preserved. The
 * `userRole` values are the legacy strings ('owner' | 'admin' | 'sales' |
 * 'trial_consultant') — Change 15 owns the auth bridge that maps the V2
 * `user_info.company_role` column to these values.
 */

import {
  type LucideIcon,
  LayoutDashboard,
  Users,
  Clock,
  DollarSign,
  Settings,
  Orbit,
  HandCoins,
  BookOpen,
  Gavel,
  Building2,
  UserPlus,
  Search,
  Rocket,
  TrendingUp,
  Radar,
  Telescope,
  GanttChart,
  ScrollText,
  CheckCircle2,
} from 'lucide-react';

export type Role = 'owner' | 'admin' | 'sales' | 'trial_consultant';

export interface NavigationItem {
  title: string;
  url: string;
  icon: LucideIcon;
  /** Marker used by the layout to render badges or special treatment. */
  badge?: 'stale-deals';
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
  /** Decorative trailing icon next to the group label (e.g. Orbit on HotSeatHub). */
  trailingIcon?: LucideIcon;
}

export interface CompanyFlags {
  marketplace_fill_jobs?: boolean;
  marketplace_post_jobs?: boolean;
}

export interface UserInfoLike {
  is_sales?: boolean | undefined;
}

export interface UserLike {
  role?: string | undefined;
}

const url = (page: string) => `/${page}`;

/**
 * Build the sidebar navigation groups for a given user/company context.
 * Pure function. Order and copy match `HotSeatersMVP/src/Layout.jsx`.
 */
export function getNavigationGroups(
  userRole: Role | undefined,
  company: CompanyFlags | null | undefined,
  user: UserLike | null | undefined,
  userInfo: UserInfoLike | null | undefined,
): NavigationGroup[] {
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';
  const isTrialConsultant = userRole === 'trial_consultant';
  const hasSalesAccess = userInfo?.is_sales === true;

  const groups: NavigationGroup[] = [];

  // Overview
  groups.push({
    label: 'Overview',
    items: [
      { title: 'Dashboard', url: url('Dashboard'), icon: LayoutDashboard },
      { title: 'Projections', url: url('Projections'), icon: TrendingUp },
    ],
  });

  // Sales — visible to everyone except trial consultants (unless is_sales=true)
  if (!isTrialConsultant || hasSalesAccess) {
    groups.push({
      label: 'Sales',
      items: [
        { title: 'Lead Radar', url: url('LeadRadar'), icon: Radar },
        { title: 'Deal Tracker', url: url('DealTracker'), icon: Telescope, badge: 'stale-deals' },
        { title: 'Clients', url: url('Clients'), icon: Building2 },
      ],
    });
  }

  // Operations
  groups.push({
    label: 'Operations',
    items: [
      { title: 'Trials', url: url('Trials'), icon: Gavel },
      { title: 'Trial Timeline', url: url('Timeline'), icon: GanttChart },
      { title: 'Time & Expenses', url: url('TimeAndExpenses'), icon: Clock },
    ],
  });

  // HotSeatHub — owners/admins only
  if (isOwnerOrAdmin) {
    const hshItems: NavigationItem[] = [];
    if (!company?.marketplace_fill_jobs && !company?.marketplace_post_jobs) {
      hshItems.push({
        title: 'Join HotSeatHub',
        url: url('HotSeatHubMarketing'),
        icon: Rocket,
      });
    } else {
      if (company?.marketplace_fill_jobs) {
        hshItems.push({ title: 'Potential Gigs', url: url('PotentialGigs'), icon: Search });
      }
      if (company?.marketplace_post_jobs) {
        hshItems.push({ title: 'Help Wanted', url: url('HelpWanted'), icon: UserPlus });
        hshItems.push({ title: 'HSH Directory', url: '/HSHDirectory', icon: Orbit });
      }
    }
    if (hshItems.length > 0) {
      groups.push({ label: 'HotSeatHub', items: hshItems, trailingIcon: Orbit });
    }
  }

  // Billing — owners/admins only
  if (isOwnerOrAdmin) {
    groups.push({
      label: 'Billing',
      items: [
        { title: 'Approvals', url: url('Approvals'), icon: CheckCircle2 },
        { title: 'Invoices', url: url('Invoices'), icon: DollarSign },
        { title: 'Collections', url: url('Collections'), icon: HandCoins },
        { title: 'Bills', url: '/Bills', icon: ScrollText },
      ],
    });
  }

  // Company
  const companyItems: NavigationItem[] = [
    { title: 'Team', url: url('Team'), icon: Users },
  ];
  if (isOwnerOrAdmin) {
    companyItems.push({ title: 'Settings', url: url('Settings'), icon: Settings });
  }
  groups.push({ label: 'Company', items: companyItems });

  // Help — available to all users. Doc-pages are deprecated (Constraint RULE 7);
  // legacy "V2 Blueprint" and "Dev Docs" entries are folded into "User Manual",
  // which is now /manual (Change 17).
  const helpItems: NavigationItem[] = [
    { title: 'User Manual', url: '/manual', icon: BookOpen },
  ];
  // Admin still gets the legacy dev-docs route during the migration window.
  if (user?.role === 'admin') {
    helpItems.push({ title: 'Dev Docs', url: url('Docs'), icon: BookOpen });
  }
  groups.push({ label: 'Help', items: helpItems });

  return groups;
}
