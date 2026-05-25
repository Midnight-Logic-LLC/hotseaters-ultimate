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
import type { Role as LegacyRole, CompanyFlags } from '@/app/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useCurrentCompany } from '@/features/auth/hooks/use-current-company';
import { applyThemeVars, type CompanyTheme } from '@/shared/lib/theme';
import { toLegacyRole } from '@/shared/lib/role-mapping';

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
}

export interface Tier1Value {
  user: Tier1User | null;
  userInfo: Tier1UserInfo | null;
  company: Tier1Company | null;
  role: LegacyRole | undefined;
  isLoading: boolean;
  isError: boolean;
}

const Tier1Context = createContext<Tier1Value | null>(null);

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
        }
      : null;

    const t1Company: Tier1Company | null = company
      ? {
          id: company.id,
          name: company.name,
          theme: company.theme,
          marketplace_fill_jobs: company.marketplace_fill_jobs ?? false,
          marketplace_post_jobs: company.marketplace_post_jobs ?? false,
        }
      : null;

    return {
      user: t1User,
      userInfo: t1UserInfo,
      company: t1Company,
      role: legacyRole,
      isLoading: authLoading || userInfoLoading || companyLoading,
      isError: false,
    };
  }, [user, userInfo, company, authLoading, userInfoLoading, companyLoading]);

  return <Tier1Context.Provider value={value}>{children}</Tier1Context.Provider>;
}

export function useTier1(): Tier1Value {
  const ctx = useContext(Tier1Context);
  if (!ctx) {
    throw new Error('useTier1 must be used inside a <Tier1Provider>.');
  }
  return ctx;
}
