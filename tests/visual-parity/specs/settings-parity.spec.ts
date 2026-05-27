/**
 * settings-parity.spec.ts — VR baseline for the Settings page.
 *
 * Captures screenshots at 1440×900 and 375×667 for each of the 12 registered
 * settings tabs. First run creates the __screenshots__ baseline; subsequent
 * runs compare against it (≤5% drift allowed per RULE 0.1).
 *
 * Requires:
 *   - `pnpm dev` running at http://localhost:5174
 *   - User signed in with admin credentials (set VITE_TEST_USER / VITE_TEST_PASS)
 *   - Self-hosted Supabase stack (RULE 1)
 *
 * Run baseline capture:
 *   pnpm exec playwright test tests/visual-parity/specs/settings-parity.spec.ts \
 *     --config tests/visual-parity/playwright.config.ts \
 *     --update-snapshots
 *
 * Run comparison:
 *   pnpm exec playwright test tests/visual-parity/specs/settings-parity.spec.ts \
 *     --config tests/visual-parity/playwright.config.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5174';

const SETTINGS_TABS = [
  { id: 'company',   label: 'Company' },
  { id: 'time',      label: 'Time Tracking' },
  { id: 'billing',   label: 'Billing' },
  { id: 'services',  label: 'Services & Rates' },
  { id: 'pipeline',  label: 'Pipeline Stages' },
  { id: 'tiers',     label: 'Tiers' },
  { id: 'templates', label: 'Templates' },
  { id: 'theme',     label: 'Theme' },
  { id: 'subscription', label: 'Subscription' },
  { id: 'marketplace',  label: 'HotSeatHub' },
  { id: 'database',     label: 'Database' },
  { id: 'admin',        label: 'Admin' },
] as const;

const VIEWPORTS = [
  { width: 1440, height: 900,  name: 'desktop' },
  { width: 375,  height: 667,  name: 'mobile'  },
] as const;

test.describe('Settings page — visual parity', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings and wait for the shell to load.
    await page.goto(`${BASE_URL}/settings?tab=company`);
    // Wait for the SettingsPage header to confirm the shell rendered.
    await page.waitForSelector('h1:has-text("Settings")', { timeout: 15_000 });
  });

  for (const viewport of VIEWPORTS) {
    test.describe(`${viewport.name} (${viewport.width}×${viewport.height})`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      for (const tab of SETTINGS_TABS) {
        test(`${tab.label} tab renders`, async ({ page }) => {
          await page.goto(`${BASE_URL}/settings?tab=${tab.id}`);
          // Wait for the tab content area to appear.
          await page.waitForLoadState('networkidle');
          // Dismiss any loading skeletons.
          await page.waitForTimeout(500);

          await expect(page).toHaveScreenshot(
            `settings-${tab.id}-${viewport.name}.png`,
            {
              maxDiffPixelRatio: 0.05,
              fullPage: false,
              // Mask dynamic content (dates, $ values, user names).
              mask: [
                page.locator('[data-testid="dynamic-value"]'),
              ],
            },
          );
        });
      }
    });
  }
});
