// PGlite fixture: boot the SPA with a fresh in-browser PGlite by clearing
// IndexedDB before each test. The local cache is canonical-from-server, so
// wiping it is non-destructive.
//
// Self-hosted Supabase only.
import { test as base, type Page } from '@playwright/test';

// IndexedDB databases that PGlite + entity-management may create. Listed
// explicitly to avoid waiting on a slow `databases()` enumeration.
const PGLITE_IDB_NAMES = [
  '/pglite/hotseaters', // PGlite default IDB FS
  'pglite',
  'prometheus-entity-management',
  'hotseaters-cache',
];

export async function clearLocalCache(page: Page): Promise<void> {
  await page.addInitScript((names: string[]) => {
    try {
      // Drop each known IDB. deleteDatabase is async-event-based; we fire all
      // at once and let the SPA proceed — PGlite will reinitialize cleanly.
      for (const name of names) {
        try {
          indexedDB.deleteDatabase(name);
        } catch {
          /* ignore */
        }
      }
      try {
        window.localStorage.removeItem('hotseaters:last-sync-cursor');
        window.sessionStorage.clear();
      } catch {
        /* ignore */
      }
    } catch {
      /* ignore */
    }
  }, PGLITE_IDB_NAMES);
}

interface PgliteFixtures {
  freshPglite: void;
}

export const test = base.extend<PgliteFixtures>({
  freshPglite: [
    async ({ page }, use) => {
      await clearLocalCache(page);
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
