/**
 * pglite-db-store.ts — process-global Zustand store for the active PGlite
 * database handle.
 *
 * Pattern 4 ("Through-the-Database") requires that `useLiveQuery` hooks run
 * inside a `<PGliteProvider>`. The provider must only render when a real db
 * handle exists (PGliteWorker is per-user, keyed to `idb://hotseaters-<userId>`).
 *
 * This store is kept as a lightweight complement to the SyncGate React context
 * (`useSyncGateDb`). The Zustand store is used for non-React consumers (e.g.
 * stores or utilities that need to know whether PGlite is ready). React
 * components should prefer `useSyncGateDb` from `@/app/sync-gate` which is
 * always in sync with the React render cycle and avoids batching races.
 *
 * RULE 3: this store is part of `shared/db` — the only layer permitted to
 * import PGlite-adjacent types.
 */

import { create } from 'zustand';
import type { LocalDB } from './pglite-client';

interface PGliteDbState {
  /** Active PGlite handle, or null if no user is signed in / db not yet open. */
  db: LocalDB | null;
  /** Populate when openForUser resolves. */
  setPGliteDb: (db: LocalDB) => void;
  /** Clear on sign-out. */
  clearPGliteDb: () => void;
}

export const usePGliteDbStore = create<PGliteDbState>((set) => ({
  db: null,
  setPGliteDb: (db) => set({ db }),
  clearPGliteDb: () => set({ db: null }),
}));
