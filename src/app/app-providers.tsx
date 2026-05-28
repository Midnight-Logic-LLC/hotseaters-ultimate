import { useEffect, type PropsWithChildren } from 'react';
import { SyncGate } from '@/app/sync-gate';
import { Tier1Provider } from '@/app/tier1-provider';
import { applyThemeVars, DEFAULT_THEME } from '@/shared/lib/theme';
import { registerAllTransports } from '@/shared/db/entity-transports';
import { registerCompanySettingsTabs } from '@/features/company/settings-registration';

// Register entity transports exactly once, synchronously at module evaluation
// time — before any hook renders and before React's first reconciliation pass.
// This is safe because the registry is a process-global Map; calling it here
// is equivalent to calling it at the top of main.tsx.
registerAllTransports();

// Register all company settings tabs with the plugin-ready registry.
// Must run before any SettingsPage render so tabs are present on first mount.
registerCompanySettingsTabs();

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

  // SyncGate is the outer provider: it boots PGlite + Electric and wraps
  // children in <PGliteProvider> once the db handle is ready.
  //
  // Tier1Provider is INSIDE SyncGate so it always renders within the
  // PGliteProvider subtree when db is available. MetadataTypeSyncer (inside
  // Tier1Provider) guards on the pgliteDb Zustand store — it only calls
  // useLiveQuery when PGlite is ready, preventing the "No PGlite instance
  // found" crash on routes that render before sign-in.
  return (
    <SyncGate>
      <Tier1Provider>{children}</Tier1Provider>
    </SyncGate>
  );
}
