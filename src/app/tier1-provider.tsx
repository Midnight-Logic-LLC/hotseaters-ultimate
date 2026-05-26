/**
 * Tier1Provider — shell-only context for the current user/company/role.
 *
 * Change 5 (this revision) replaces the fixture wiring with real
 * subscriptions:
 *   - `useAuth()` → user + companyId + currentUserInfoId
 *   - `useCurrentUser()` → live `user_info` row via entity graph
 *   - `useCurrentCompany()` → live `company` row via entity graph
 *
 * Also applies `company.theme` via `applyThemeVars` whenever the theme
 * changes (Change 5 deliverable #4).
 *
 * The exposed `useTier1()` shape is unchanged so downstream consumers
 * (app-shell, bottom-tab-bar, navigation.ts) keep working. The role string
 * is converted from the V2 TitleCase value to the legacy lowercase that the
 * navigation module expects (see `shared/lib/role-mapping.ts`).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type PropsWithChildren,
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';
import type { Role as LegacyRole, CompanyFlags } from '@/app/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useCurrentCompany } from '@/features/auth/hooks/use-current-company';
import { applyThemeVars, type CompanyTheme } from '@/shared/lib/theme';
import { toLegacyRole } from '@/shared/lib/role-mapping';
import {
  selectClientTypes,
  selectConsultantTiers,
  selectPipelineStages,
  selectServiceCategories,
  type LookupRow,
  type PipelineStage,
} from '@/shared/db/lookups-selectors';

export interface Tier1User {
  id: string;
  email: string;
  /** Legacy `user.role` field — distinct from `company_role`. */
  role?: 'admin' | 'user';
}

export interface Tier1UserInfo {
  id: string;
  company_id: string | null;
  company_role: LegacyRole;
  is_sales?: boolean | undefined;
  status?: 'active' | 'inactive' | undefined;
  /** Display name fields surfaced from user_info row. */
  first_name?: string | null;
  last_name?: string | null;
  /** Account status from user_info row. */
  account_status?: 'pending' | 'active' | 'rejected' | 'disabled' | null;
}

export interface Tier1Company extends CompanyFlags {
  id: string;
  name: string;
  theme?: unknown;
  /** Presence indicates a Stripe subscription; absence = still in trial. */
  stripe_customer_id?: string | null;
  /** ISO date string: when the company record was created (trial start). */
  created_date?: string | null;
  created_at?: string | null;
  // ── Billing config (bible Dashboard.jsx lines 330–333 reads these) ────
  /** Billing cadence — drives projected-invoice bucketing. */
  invoice_period?: 'weekly' | 'monthly' | 'per_trial' | null;
  /** Day of week to bill on for `invoice_period = 'weekly'`. */
  weekly_billing_day?: string | null;
  /** Day of month to bill on for `invoice_period = 'monthly'` (1..31). */
  monthly_billing_date?: number | null;
  /** Days after a task end_date to bill for `invoice_period = 'per_trial'`. */
  per_trial_billing_days_after_end?: number | null;
  /** Bible-required fiscal-year start (1..12). Defaults to 1 (Jan). */
  fiscal_year_start_month?: number | null;
  /** Annual revenue target — drives the RevenueTrend goal line. */
  annual_revenue_target?: number | null;
}

export interface Tier1Value {
  user: Tier1User | null;
  userInfo: Tier1UserInfo | null;
  company: Tier1Company | null;
  role: LegacyRole | undefined;
  isLoading: boolean;
  isError: boolean;
  /** Active pipeline stages for the current company + system rows. */
  pipelineStages: PipelineStage[];
  /** Active service categories. */
  serviceCategories: LookupRow[];
  /** Active consultant tiers (with optional `multiplier` lifted from extras). */
  consultantTiers: LookupRow[];
  /** Active client types (with optional `multiplier`). */
  clientTypes: LookupRow[];
}

const Tier1Context = createContext<Tier1Value | null>(null);

/**
 * Project the live company row (typed loosely via `CompanyRecord extends
 * Record<string, unknown>`) into the strict Tier1Company shape, lifting
 * the bible's billing fields onto top-level keys so consumers (e.g.
 * dashboard widgets) don't reach into `unknown`.
 */
function buildTier1Company(
  company: { id: string; name: string } & Record<string, unknown>,
): Tier1Company {
  const out: Tier1Company = {
    id: company.id,
    name: company.name,
    theme: company.theme,
    marketplace_fill_jobs: (company.marketplace_fill_jobs as boolean | undefined) ?? false,
    marketplace_post_jobs: (company.marketplace_post_jobs as boolean | undefined) ?? false,
  };
  const ip = company.invoice_period;
  if (ip === 'weekly' || ip === 'monthly' || ip === 'per_trial') {
    out.invoice_period = ip;
  }
  if (typeof company.weekly_billing_day === 'string') {
    out.weekly_billing_day = company.weekly_billing_day;
  }
  if (typeof company.monthly_billing_date === 'number') {
    out.monthly_billing_date = company.monthly_billing_date;
  }
  if (typeof company.per_trial_billing_days_after_end === 'number') {
    out.per_trial_billing_days_after_end = company.per_trial_billing_days_after_end;
  }
  if (typeof company.fiscal_year_start_month === 'number') {
    out.fiscal_year_start_month = company.fiscal_year_start_month;
  }
  if (typeof company.annual_revenue_target === 'number') {
    out.annual_revenue_target = company.annual_revenue_target;
  }
  return out;
}

export function Tier1Provider({ children }: PropsWithChildren) {
  const { user, isLoading: authLoading } = useAuth();
  const { userInfo, isLoading: userInfoLoading } = useCurrentUser();
  const { company, isLoading: companyLoading } = useCurrentCompany();

  // Apply theme vars whenever company.theme changes. Falls back silently to
  // DEFAULT_THEME (already applied at app boot) when company.theme is null.
  useEffect(() => {
    if (company?.theme && typeof company.theme === 'object') {
      applyThemeVars(company.theme as CompanyTheme);
    }
  }, [company?.theme]);

  // Subscribe to the MetadataType slice of the entity graph. useShallow keeps
  // reference identity stable when other entity types (Client, Trial, etc.)
  // change — the bible's Tier1DataContext.jsx pattern (lines 63-73).
  const metadataTypeSlice = useGraphStore(
    useShallow(
      (s) => (s.entities as Record<string, Record<string, unknown>>).MetadataType,
    ),
  );

  const companyIdForLookups = company?.id ?? null;
  const pipelineStages = useMemo(
    () => selectPipelineStages(metadataTypeSlice, companyIdForLookups),
    [metadataTypeSlice, companyIdForLookups],
  );
  const serviceCategories = useMemo(
    () => selectServiceCategories(metadataTypeSlice, companyIdForLookups),
    [metadataTypeSlice, companyIdForLookups],
  );
  const consultantTiers = useMemo(
    () => selectConsultantTiers(metadataTypeSlice, companyIdForLookups),
    [metadataTypeSlice, companyIdForLookups],
  );
  const clientTypes = useMemo(
    () => selectClientTypes(metadataTypeSlice, companyIdForLookups),
    [metadataTypeSlice, companyIdForLookups],
  );

  const value = useMemo<Tier1Value>(() => {
    const legacyRole = toLegacyRole(userInfo?.company_role ?? undefined);
    const t1User: Tier1User | null = user
      ? {
          id: user.id,
          email: user.email ?? '',
          // Platform-level role isn't part of the V2 user_info; only
          // surface 'admin' for System Admin scope so admin nav entries
          // appear for cross-tenant superadmins.
          role: userInfo?.company_role === 'System Admin' ? 'admin' : 'user',
        }
      : null;

    const t1UserInfo: Tier1UserInfo | null = userInfo
      ? {
          id: userInfo.id,
          company_id: userInfo.company_id ?? null,
          company_role: legacyRole ?? 'trial_consultant',
          is_sales: userInfo.is_sales,
          status:
            userInfo.status === 'active' || userInfo.status === 'inactive'
              ? userInfo.status
              : undefined,
          // Surface display name fields so WelcomeHeader and other consumers
          // can show the user's real name without reaching into the graph.
          first_name: userInfo.first_name ?? null,
          last_name: userInfo.last_name ?? null,
          account_status: userInfo.account_status ?? null,
        }
      : null;

    const t1Company: Tier1Company | null = company
      ? buildTier1Company(company)
      : null;

    return {
      user: t1User,
      userInfo: t1UserInfo,
      company: t1Company,
      role: legacyRole,
      isLoading: authLoading || userInfoLoading || companyLoading,
      isError: false,
      pipelineStages,
      serviceCategories,
      consultantTiers,
      clientTypes,
    };
  }, [
    user,
    userInfo,
    company,
    authLoading,
    userInfoLoading,
    companyLoading,
    pipelineStages,
    serviceCategories,
    consultantTiers,
    clientTypes,
  ]);

  return <Tier1Context.Provider value={value}>{children}</Tier1Context.Provider>;
}

export function useTier1(): Tier1Value {
  const ctx = useContext(Tier1Context);
  if (!ctx) {
    throw new Error('useTier1 must be used inside a <Tier1Provider>.');
  }
  return ctx;
}
