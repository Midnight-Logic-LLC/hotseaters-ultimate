/**
 * realtime-theme.spec.ts — Realtime company theme propagation smoke test.
 *
 * PENDING — manual verification required. Automated E2E for this path needs
 * a Supabase Realtime broadcast triggered mid-test, which requires either:
 *   a) a companion script that patches the company row via the Admin API, or
 *   b) a `pg_notify` helper exposed by a self-hosted edge function.
 *
 * === Manual verification steps ===
 *
 * 1. Start the local stack: `docker compose up -d`
 * 2. Sign in as a company owner in the app at http://localhost:6173.
 * 3. Open Supabase Studio at http://localhost:8000.
 * 4. Navigate to the Table Editor → company → find your company row.
 * 5. Change the `theme` JSONB column, e.g.:
 *      {"primary": "#ff6600", "primaryForeground": "#ffffff"}
 * 6. Save the row.
 * 7. Within 2 seconds the app should re-render with the updated accent color
 *    because `realtime-channels.ts` upserts the new company row into
 *    `company_synced` in PGlite and the entity graph propagates the change.
 *
 * === Automated shape ===
 *
 * When a helper is available, replace the `.skip` with `.only` and implement:
 *   - Route to the dashboard.
 *   - Record the current --color-primary computed value.
 *   - Trigger the theme change via API.
 *   - Poll until `getComputedStyle(document.documentElement)
 *       .getPropertyValue('--color-primary')` equals the new value.
 *   - Assert the elapsed time is < 2 000 ms.
 */

import { test, expect } from '../fixtures';

test.describe.skip('@realtime-theme Realtime company theme propagation', () => {
  test(
    'theme change in Supabase Studio propagates to the app within 2 s',
    async ({ page }) => {
      // TODO: implement when a mid-test Admin API trigger is available.
      // See the manual steps above.
      await page.goto('/dashboard');
      expect(await page.title()).toBeTruthy();
    },
  );
});
