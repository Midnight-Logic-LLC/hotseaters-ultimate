import { useEffect, type PropsWithChildren } from 'react';
import { SyncGate } from '@/app/sync-gate';
import { Tier1Provider } from '@/app/tier1-provider';
import { applyThemeVars, DEFAULT_THEME } from '@/shared/lib/theme';

/**
 * AppProviders — composition of app-level context providers.
 *
 * Change 3 attached:
 *   - Theme variable application (applies DEFAULT_THEME on mount; later
 *     Change 5 swaps in the live `company.theme` from Tier-1 data).
 *   - Tier1Provider (currently fixture; Change 5 replaces with entity-graph
 *     subscriptions).
 *
 * Change 4 adds **SyncGate** — the single orchestration point for PGlite +
 * Electric + write-sync + entity-graph bootstrap. It nests inside
 * Tier1Provider so context values that depend on a signed-in tenant are
 * stable for the children rendered after the gate opens.
 *
 * Change 5 will add AuthProvider.
 */
export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    applyThemeVars(DEFAULT_THEME);
  }, []);

  return (
    <Tier1Provider>
      <SyncGate>{children}</SyncGate>
    </Tier1Provider>
  );
}
