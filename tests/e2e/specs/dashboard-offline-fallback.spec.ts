/**
 * dashboard-offline-fallback.spec.ts — verify that the dashboard
 * degrades gracefully when the browser is offline.
 *
 * Acceptance:
 *   • Tier-A-backed widgets (Trial, Client, MetadataType) render with
 *     cached data after a reload under context.setOffline(true).
 *   • Hybrid-mode widgets backed by un-synced entities (Invoice,
 *     TimeEntry, etc.) render their loading skeleton (or empty state)
 *     without throwing a fatal error or surfacing an alert toast.
 *
 * Bible-parity invariant: a partially-offline dashboard NEVER shows
 * an unhandled error. The widgets independently fail-soft.
 */

import { test, expect } from '../fixtures';

test.describe('@parity dashboard offline fallback', () => {
  test('Tier-A widgets render + no alert toast after going offline', async ({
    page,
    context,
    asOwner,
  }) => {
    void asOwner;

    // 1) Load Dashboard fully online first so the graph + caches populate.
    await page.goto('/Dashboard');
    await page.waitForSelector('[data-testid="dashboard-page"]', { timeout: 15_000 });
    await expect(page.locator('[data-testid="kpi-active-trials"]')).toBeVisible({
      timeout: 10_000,
    });

    // 2) Go offline + reload.
    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: 'domcontentloaded' });

      // 3) Page shell + Tier-A widgets still render.
      await expect(
        page.locator('[data-testid="dashboard-page"]'),
        'dashboard page shell renders offline',
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        page.locator('[data-testid="kpi-active-trials"]'),
        'Tier-A KPI tile renders offline',
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        page.locator('[data-testid="upcoming-trials-card"]'),
        'Upcoming trials (Tier-A) widget renders offline',
      ).toBeVisible({ timeout: 10_000 });

      // 4) No alert toast / unhandled error surfaced.
      await expect(page.locator('[role="alert"]')).toHaveCount(0);
    } finally {
      await context.setOffline(false);
    }
  });

  test('Hybrid-REST widgets show loading state, not a fatal error', async ({
    page,
    context,
    asOwner,
  }) => {
    void asOwner;

    // Start offline so hybrid REST cannot fetch on first mount.
    await context.setOffline(true);
    try {
      await page.goto('/Dashboard');
      await page.waitForSelector('[data-testid="dashboard-page"]', { timeout: 15_000 });

      // Widgets backed by Invoice / TimeEntry / Subcontract* fall back to
      // their loading skeleton rather than blowing up. We just assert the
      // testid renders — the recharts container handles the empty case.
      await expect(page.locator('[data-testid="revenue-trend-card"]')).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.locator('[data-testid="weekly-team-performance"]')).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.locator('[data-testid="quick-stats-card"]')).toBeVisible({
        timeout: 10_000,
      });

      // No alert toast / unhandled error.
      await expect(page.locator('[role="alert"]')).toHaveCount(0);
    } finally {
      await context.setOffline(false);
    }
  });
});
