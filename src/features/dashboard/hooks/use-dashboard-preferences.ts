/**
 * use-dashboard-preferences — read + write the dashboard's per-user prefs.
 *
 * The bible (HotSeatersMVP/src/pages/Dashboard.jsx lines 123–156)
 * persists three RevenueTrend controls on `user_info.preferences`:
 *   • dashboardRevenueFiscalYear  (number)
 *   • dashboardRevenueShowCumulative (boolean)
 *   • dashboardRevenuePeriod      ('month' | 'week')  ← new in port
 *
 * Reads come from the live `useCurrentUser().userInfo.preferences`
 * (entity graph). Writes go through the auth store's `patchPreferences`
 * (merge semantics; survives missing column). When the offline-first
 * phase ships the Pending-Sync chip, writes auto-surface there.
 */

import { useCallback, useMemo } from 'react';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { patchPreferences } from '@/features/auth/stores/user-info-store';

export type DashboardRevenuePeriod = 'month' | 'week';

export interface DashboardPreferences {
  fiscalYear: number | null;
  showCumulative: boolean;
  period: DashboardRevenuePeriod;
}

export interface DashboardPreferencesResult {
  prefs: DashboardPreferences;
  isLoading: boolean;
  setFiscalYear: (year: number) => Promise<void>;
  setShowCumulative: (value: boolean) => Promise<void>;
  setPeriod: (period: DashboardRevenuePeriod) => Promise<void>;
}

const DEFAULTS: DashboardPreferences = Object.freeze({
  fiscalYear: null,
  showCumulative: false,
  period: 'month',
});

function readNumberPref(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const parsed = parseInt(raw, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readPeriod(raw: unknown): DashboardRevenuePeriod {
  return raw === 'week' ? 'week' : 'month';
}

export function useDashboardPreferences(): DashboardPreferencesResult {
  const { userInfo, isLoading } = useCurrentUser();
  const userInfoId = userInfo?.id ?? undefined;
  const previousPreferences = userInfo?.preferences ?? null;

  const prefs = useMemo<DashboardPreferences>(() => {
    const p = (previousPreferences ?? {}) as Record<string, unknown>;
    return {
      fiscalYear: readNumberPref(p.dashboardRevenueFiscalYear),
      showCumulative: p.dashboardRevenueShowCumulative === true,
      period: readPeriod(p.dashboardRevenuePeriod),
    };
  }, [previousPreferences]);

  const writeOptions = useMemo(() => {
    const opts: { userInfoId?: string; previousPreferences: Record<string, unknown> | null } = {
      previousPreferences,
    };
    if (userInfoId) opts.userInfoId = userInfoId;
    return opts;
  }, [userInfoId, previousPreferences]);

  const setFiscalYear = useCallback(
    async (year: number): Promise<void> => {
      await patchPreferences({ dashboardRevenueFiscalYear: year }, writeOptions);
    },
    [writeOptions],
  );

  const setShowCumulative = useCallback(
    async (value: boolean): Promise<void> => {
      await patchPreferences({ dashboardRevenueShowCumulative: value }, writeOptions);
    },
    [writeOptions],
  );

  const setPeriod = useCallback(
    async (period: DashboardRevenuePeriod): Promise<void> => {
      await patchPreferences({ dashboardRevenuePeriod: period }, writeOptions);
    },
    [writeOptions],
  );

  return {
    prefs: userInfo ? prefs : DEFAULTS,
    isLoading,
    setFiscalYear,
    setShowCumulative,
    setPeriod,
  };
}
