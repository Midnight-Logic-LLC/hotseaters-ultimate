import { PGliteProvider } from '@electric-sql/pglite-react';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { useAuthSession } from '@/shared/db/auth-session';
import {
  startTenantSync,
  type TenantSyncResult,
} from '@/shared/db/electric-sync';
import {
  openForUser,
  clearLocalTenantData,
  getSyncMeta,
  markHydrated,
  type LocalDB,
} from '@/shared/db/pglite-client';
import { startWriteSync } from '@/shared/db/write-sync';

/**
 * SyncGateDbContext — exposes the active PGlite handle (or null) to all
 * descendants of SyncGate without requiring them to be inside the conditional
 * `<PGliteProvider>`. Tier1Provider reads this to guard MetadataTypeSyncer:
 * it only renders that child component when db is non-null, which ensures
 * useLiveQuery is never called without a PGliteProvider in the tree.
 *
 * The value is always in sync with boot.db — no Zustand batching races.
 */
const SyncGateDbContext = createContext<LocalDB | null>(null);

/**
 * Hook to read the current PGlite db handle from SyncGate.
 * Returns null when PGlite is not yet initialized (before sign-in or during
 * initial hydration).
 */
export function useSyncGateDb(): LocalDB | null {
  return useContext(SyncGateDbContext);
}

/**
 * sync-gate.tsx — single orchestration point for local-first sync.
 *
 * Lives at the app root (RULE 3 invariant 4). Composes:
 *
 *   1. Per-user PGlite boot (`openForUser`) — also surfaces `didMigrate`.
 *   2. The Electric tenant sync (`startTenantSync`).
 *   3. The write-path drain (`startWriteSync`).
 *
 * Pattern 4 ("Through-the-Database"): children are wrapped in
 * `<PGliteProvider>` as soon as PGlite opens. All Tier-A reads flow through
 * `useLiveQuery` — no entity-graph bootstrap or graph-bridge needed for
 * Tier-A data. The entity-management graph is retained for Tier-C writes/
 * server-only entities (invoices, time entries, etc.).
 *
 * State machine:
 *
 *   idle       — not signed in. Renders children (auth routes handle this).
 *   hydrating  — signed in, first login OR schema-migrated. Shows splash.
 *   syncing    — signed in, returning user, shapes resuming. Renders
 *                children plus a corner status indicator.
 *   ready      — bootstrap complete.
 *   error      — anything threw; shows retry CTA.
 *
 * Tenant switching:
 *   When the resolved `companyId` differs from the previously synced tenant
 *   (`_sync_meta.tenant_id`), `clearLocalTenantData()` runs FIRST so the new
 *   user never sees the previous tenant's rows.
 *
 * Sign-out:
 *   Stops sync, clears local data.
 *   `closeForUser` is called by `auth-session.ts → signOut`.
 */

type Phase = 'idle' | 'hydrating' | 'syncing' | 'ready' | 'error';

interface BootState {
  phase: Phase;
  message?: string;
  error?: string;
  didMigrate?: boolean;
  isFirstLogin?: boolean;
  /** PGlite instance — available once openForUser resolves */
  db?: LocalDB;
}

export function SyncGate({ children }: PropsWithChildren) {
  const session = useAuthSession((s) => s.session);
  const companyId = useAuthSession((s) => s.companyId);
  const isLoading = useAuthSession((s) => s.isLoading);

  const [boot, setBoot] = useState<BootState>({ phase: 'idle' });

  // Hold handles so we can dispose on sign-out / tenant switch.
  const handlesRef = useRef<{
    tenantSync?: TenantSyncResult;
    stopWriteSync?: () => Promise<void>;
    activeCompanyId?: string;
  }>({});

  useEffect(() => {
    if (isLoading) return;

    const userId = session?.user?.id;

    // Sign-out path: tear down anything that's running.
    if (!session || !companyId || !userId) {
      void (async () => {
        const { tenantSync, stopWriteSync, activeCompanyId } = handlesRef.current;
        if (activeCompanyId) {
          try {
            await tenantSync?.unsubscribe();
            await stopWriteSync?.();
            // clearLocalTenantData is called by auth-session.ts → signOut
            // (via closeForUser). Belt-and-suspenders: if userId was somehow
            // lost, skip the PGlite call here.
          } catch (err) {
            // Best-effort cleanup; log and proceed.
             
            console.warn('[sync-gate] cleanup error', err);
          }
          handlesRef.current = {};
        }
        setBoot({ phase: 'idle' });
      })();
      return;
    }

    // Already booted for this tenant — nothing to do.
    if (handlesRef.current.activeCompanyId === companyId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        // ── Step 1: boot per-user PGlite, capture didMigrate ────────────────
        setBoot({ phase: 'hydrating', message: 'Opening local database…' });
        const bootRes = await openForUser(userId);
        if (cancelled) return;

        const meta = await getSyncMeta(userId);
        const isTenantSwitch =
          meta.tenantId !== null && meta.tenantId !== companyId;
        const isFirstLogin =
          meta.hydratedAt === null || isTenantSwitch || bootRes.didMigrate;

        if (isTenantSwitch) {
          setBoot({
            phase: 'hydrating',
            message: 'Switching workspace — clearing local cache…',
          });
          await clearLocalTenantData(userId);
        }

        // ── Step 2: Electric shapes ─────────────────────────────────────────
        // Pass db into boot state so PGliteProvider can wrap children before
        // Electric shapes / graph bootstrap run. This is the Pattern 4 fix:
        // useLiveQuery hooks mount against the live IDB instance immediately,
        // so no REST fetch fires for already-synced Tier-A data.
        setBoot({
          phase: isFirstLogin ? 'hydrating' : 'syncing',
          message: isFirstLogin
            ? bootRes.didMigrate
              ? 'Updating local cache…'
              : 'Preparing your data…'
            : 'Resuming sync…',
          didMigrate: bootRes.didMigrate,
          isFirstLogin,
          db: bootRes.db,
        });

        const tenantSync = await startTenantSync(userId, companyId, isFirstLogin);
        if (cancelled) {
          await tenantSync.unsubscribe();
          return;
        }
        if (tenantSync.didInitialHydration) {
          await markHydrated(userId, companyId);
        }

        // ── Step 3: write-sync drain ────────────────────────────────────────
        const stopWriteSync = await startWriteSync(userId);
        if (cancelled) {
          await tenantSync.unsubscribe();
          await stopWriteSync();
          return;
        }

        handlesRef.current = {
          tenantSync,
          stopWriteSync,
          activeCompanyId: companyId,
        };

        setBoot({
          phase: 'ready',
          isFirstLogin,
          didMigrate: bootRes.didMigrate,
          db: bootRes.db,
        });
      } catch (err) {
         
        console.error('[sync-gate] bootstrap failed', err);
        setBoot({
          phase: 'error',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, companyId, isLoading]);

  // ── Render state machine ────────────────────────────────────────────────
  //
  // Pattern 4: wrap children in PGliteProvider whenever the db handle is
  // available. This ensures useLiveQuery hooks immediately see the live IDB
  // instance and serve Tier-A data from PGlite without any REST round-trip.
  //
  // db is set as soon as openForUser() resolves (Step 1 of boot), which is
  // before Electric shapes attach or the graph bootstrap runs — so children
  // that render in 'syncing' phase already have PGlite context.
  const content = boot.db ? (
    <PGliteProvider db={boot.db}>{children}</PGliteProvider>
  ) : (
    children
  );

  // Wrap all renders in SyncGateDbContext so Tier1Provider (and any other
  // component in the tree) can check whether PGlite is ready synchronously —
  // always in sync with boot.db, no Zustand batching races.
  if (boot.phase === 'idle' || boot.phase === 'ready') {
    return (
      <SyncGateDbContext.Provider value={boot.db ?? null}>
        {content}
        {boot.phase === 'ready' ? <SyncStatusIndicator /> : null}
      </SyncGateDbContext.Provider>
    );
  }

  if (boot.phase === 'syncing') {
    // Returning user — render the app immediately with a small status dot.
    // db is available here (set in Step 2 alongside phase='syncing'), so
    // useLiveQuery hooks in children get IDB rows on first render.
    return (
      <SyncGateDbContext.Provider value={boot.db ?? null}>
        {content}
        <SyncingBadge message={boot.message ?? 'Resuming sync…'} />
      </SyncGateDbContext.Provider>
    );
  }

  if (boot.phase === 'error') {
    return (
      <SyncGateDbContext.Provider value={null}>
        <SyncErrorScreen message={boot.error ?? 'Unknown error'} />
      </SyncGateDbContext.Provider>
    );
  }

  return (
    <SyncGateDbContext.Provider value={null}>
      <HydratingScreen message={boot.message ?? 'Loading…'} />
    </SyncGateDbContext.Provider>
  );
}

// ─── UI bits ────────────────────────────────────────────────────────────────

function HydratingScreen({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'var(--color-surface, #fff)',
        color: 'var(--color-text, #111)',
        zIndex: 9999,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          aria-hidden
          style={{
            width: 32,
            height: 32,
            margin: '0 auto 1rem',
            borderRadius: '50%',
            border: '3px solid currentColor',
            borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ fontSize: 14 }}>{message}</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function SyncErrorScreen({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'var(--color-surface, #fff)',
        color: 'var(--color-text, #111)',
        zIndex: 9999,
      }}
    >
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 12 }}>Sync error</h2>
        <p style={{ marginBottom: 16, fontSize: 14 }}>{message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: '1px solid currentColor',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function SyncingBadge({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        padding: '6px 12px',
        borderRadius: 999,
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        fontSize: 12,
        zIndex: 9998,
      }}
    >
      {message}
    </div>
  );
}

function SyncStatusIndicator() {
  // Placeholder: no badge in 'ready' state for Pattern 4 builds.
  // A future change can wire navigator.onLine / Electric sync status here.
  return null;
}
