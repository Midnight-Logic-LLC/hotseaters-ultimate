/**
 * use-database-status.ts — composite hook for the Database settings tab.
 *
 * Exposes:
 *   - `status`: PGlite + Electric sync status snapshot (or null while loading).
 *   - `isLoading`, `error`: load state.
 *   - `clearLocal()`: drop all local tenant data.
 *   - `forceSync()`: trigger a re-sync (currently implemented as a clear +
 *     full-page reload so the sync gate re-hydrates from scratch).
 *
 * Components → hooks (RULE B). Hooks call only stores (RULE C). All I/O
 * lives in `database-admin-store.ts` and the shared/db seam.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useCallback, useEffect, useState } from 'react';

import { useTier1 } from '@/app/tier1-provider';
import {
  clearLocalDatabase,
  readDatabaseStatus,
  type DatabaseStatusSnapshot,
} from '@/features/company/stores/database-admin-store';

export type DatabaseActionState = 'idle' | 'working' | 'done' | 'error';

export interface UseDatabaseStatusValue {
  userId: string | null;
  status: DatabaseStatusSnapshot | null;
  isLoading: boolean;
  loadError: string | null;
  actionState: DatabaseActionState;
  actionError: string | null;
  reload: () => Promise<void>;
  clearLocal: () => Promise<void>;
  forceSync: () => Promise<void>;
}

export function useDatabaseStatus(): UseDatabaseStatusValue {
  const { user } = useTier1();
  const userId = user?.id ?? null;

  const [status, setStatus] = useState<DatabaseStatusSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<DatabaseActionState>('idle');
  const [actionError, setActionError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setStatus(null);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      const snap = await readDatabaseStatus(userId);
      setStatus(snap);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Failed to read database status';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const clearLocal = useCallback(async () => {
    if (!userId) return;
    setActionState('working');
    setActionError(null);
    try {
      await clearLocalDatabase(userId);
      setActionState('done');
      await reload();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Failed to clear local data';
      setActionError(message);
      setActionState('error');
    }
  }, [userId, reload]);

  const forceSync = useCallback(async () => {
    if (!userId) return;
    setActionState('working');
    setActionError(null);
    try {
      // Re-sync is implemented as: drop the local snapshot and reload the
      // page so the sync gate re-hydrates every shape from the server.
      await clearLocalDatabase(userId);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      setActionState('done');
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Failed to force sync';
      setActionError(message);
      setActionState('error');
    }
  }, [userId]);

  return {
    userId,
    status,
    isLoading,
    loadError,
    actionState,
    actionError,
    reload,
    clearLocal,
    forceSync,
  };
}
