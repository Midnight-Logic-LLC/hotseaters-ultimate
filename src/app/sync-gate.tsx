import { useGraphSyncStatus } from '@prometheus-ags/prometheus-entity-management';
import {
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { useAuthSession } from '@/shared/db/auth-session';
import {
  bootstrapEntityGraph,
  type EntityGraphHandle,
} from '@/shared/db/entity-graph-bootstrap';
import {
  startTenantSync,
  type TenantSyncResult,
} from '@/shared/db/electric-sync';
import {
  openForUser,
  clearLocalTenantData,
  getSyncMeta,
  markHydrated,
} from '@/shared/db/pglite-client';
import { startWriteSync } from '@/shared/db/write-sync';

/**
 * sync-gate.tsx — single orchestration point for local-first sync.
 *
 * Lives at the app root (RULE 3 invariant 4). Composes:
 *
 *   1. Per-user PGlite boot (`openForUser`) — also surfaces `didMigrate`.
 *   2. The Electric tenant sync (`startTenantSync`).
 *   3. The write-path drain (`startWriteSync`).
 *   4. The entity-graph local-first runtime (`bootstrapEntityGraph`).
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
 *   Stops sync, disposes the graph runtime, clears local data.
 *   `closeForUser` + `resetGraph` are called by `auth-session.ts → signOut`.
 */

type Phase = 'idle' | 'hydrating' | 'syncing' | 'ready' | 'error';

interface BootState {
  phase: Phase;
  message?: string;
  error?: string;
  didMigrate?: boolean;
  isFirstLogin?: boolean;
}

export function SyncGate({ children }: PropsWithChildren) {
  const session = useAuthSession((s) => s.session);
  const companyId = useAuthSession((s) => s.companyId);
  const isLoading = useAuthSession((s) => s.isLoading);

  const [boot, setBoot] = useState<BootState>({ phase: 'idle' });

  // Hold handles so we can dispose on sign-out / tenant switch.
  const handlesRef = useRef<{
    tenantSync?: TenantSyncResult;
    graph?: EntityGraphHandle;
    stopWriteSync?: () => Promise<void>;
    activeCompanyId?: string;
  }>({});

  useEffect(() => {
    if (isLoading) return;

    const userId = session?.user?.id;

    // Sign-out path: tear down anything that's running.
    if (!session || !companyId || !userId) {
      void (async () => {
        const { tenantSync, graph, stopWriteSync, activeCompanyId } =
          handlesRef.current;
        if (activeCompanyId) {
          try {
            await tenantSync?.unsubscribe();
            await stopWriteSync?.();
            graph?.dispose();
            // clearLocalTenantData is called by auth-session.ts → signOut
            // (via closeForUser). Belt-and-suspenders: if userId was somehow
            // lost, skip the PGlite call here.
          } catch (err) {
            // Best-effort cleanup; log and proceed.
            // eslint-disable-next-line no-console
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
        setBoot({
          phase: isFirstLogin ? 'hydrating' : 'syncing',
          message: isFirstLogin
            ? bootRes.didMigrate
              ? 'Updating local cache…'
              : 'Preparing your data…'
            : 'Resuming sync…',
          didMigrate: bootRes.didMigrate,
          isFirstLogin,
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

        // ── Step 4: entity-graph runtime ────────────────────────────────────
        const graph = await bootstrapEntityGraph({
          pglite: bootRes.db,
          companyId,
          isFirstLogin,
        });
        if (cancelled) {
          graph.dispose();
          await tenantSync.unsubscribe();
          await stopWriteSync();
          return;
        }

        handlesRef.current = {
          tenantSync,
          graph,
          stopWriteSync,
          activeCompanyId: companyId,
        };

        setBoot({
          phase: 'ready',
          isFirstLogin,
          didMigrate: bootRes.didMigrate,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
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
  if (boot.phase === 'idle' || boot.phase === 'ready') {
    return (
      <>
        {children}
        {boot.phase === 'ready' ? <SyncStatusIndicator /> : null}
      </>
    );
  }

  if (boot.phase === 'syncing') {
    // Returning user — render the app immediately with a small status dot.
    return (
      <>
        {children}
        <SyncingBadge message={boot.message ?? 'Resuming sync…'} />
      </>
    );
  }

  if (boot.phase === 'error') {
    return <SyncErrorScreen message={boot.error ?? 'Unknown error'} />;
  }

  return <HydratingScreen message={boot.message ?? 'Loading…'} />;
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
  const status = useGraphSyncStatus();
  if (status.phase === 'ready' || status.phase === 'idle') return null;
  if (status.phase === 'error') {
    return <SyncingBadge message={`Sync error: ${status.error ?? ''}`} />;
  }
  if (!status.isOnline) {
    return <SyncingBadge message="Offline — changes will sync on reconnect" />;
  }
  return null;
}
