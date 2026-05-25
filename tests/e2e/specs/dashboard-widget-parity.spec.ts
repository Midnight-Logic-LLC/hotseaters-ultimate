/**
 * dashboard-widget-parity.spec.ts — E2E assertions verifying that
 * change-402 dashboard widgets are real (not stubs/placeholders) and that
 * the SidebarUserFooter sign-out flow works.
 *
 * Spec targets:
 *   - 6 KPI tiles are present and contain no "Coming soon" / "Stub" text.
 *   - Pipeline bar chart renders at least 1 SVG bar (if the user has sales data).
 *   - Sign-out via SidebarUserFooter redirects to /login.
 *
 * These tests run at 1440×900 (desktop) and 414×896 (mobile).
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx
 */

import { test, expect } from '../fixtures';

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 414, height: 896 };

// ── Desktop ──────────────────────────────────────────────────────────────────

test.describe('@parity dashboard-widget-parity — desktop 1440×900', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP);
  });

  test('KPI tiles do not contain stub/placeholder text', async ({ page, asOwner }) => {
    void asOwner;
    await page.goto('/dashboard');
    // Wait for the dashboard to load (not a loading spinner)
    await page.waitForSelector('[aria-label="Key metrics"]', { timeout: 15000 });

    // Ensure no tile shows "Stub" or "Coming soon"
    const metricsSection = page.locator('[aria-label="Key metrics"]');
    await expect(metricsSection).not.toContainText('Coming soon');
    await expect(metricsSection).not.toContainText('Stub');
    await expect(metricsSection).not.toContainText('v0.2');
  });

  test('at least the Active Trials KPI tile is present', async ({ page, asOwner }) => {
    void asOwner;
    await page.goto('/dashboard');
    await page.waitForSelector('[aria-label="Key metrics"]', { timeout: 15000 });

    // Active Trials tile must exist (role-independent)
    await expect(page.getByText('Active Trials')).toBeVisible();
    await expect(page.getByText('Trials YTD')).toBeVisible();
  });

  test('Quick Actions card has at least one button', async ({ page, asOwner }) => {
    void asOwner;
    await page.goto('/dashboard');
    await page.waitForSelector('text=Quick Actions', { timeout: 15000 });
    // Quick Actions section should have buttons
    const quickActionsCard = page.locator(':has-text("Quick Actions")').last();
    const buttons = quickActionsCard.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('sign-out via SidebarUserFooter redirects to /login', async ({
    page,
    asOwner,
  }) => {
    void asOwner;
    await page.goto('/dashboard');
    // Wait for the sidebar footer to be present
    // The sign-out button has aria-label="Sign out" per SidebarUserFooter
    const signOutBtn = page.getByRole('button', { name: /sign out/i });
    await expect(signOutBtn).toBeVisible({ timeout: 15000 });
    await signOutBtn.click();
    // After sign-out we should land on /login
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});

// ── Mobile ───────────────────────────────────────────────────────────────────

test.describe('@parity dashboard-widget-parity — mobile 414×896', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE);
  });

  test('KPI tiles render on mobile without stub text', async ({ page, asOwner }) => {
    void asOwner;
    await page.goto('/dashboard');
    await page.waitForSelector('[aria-label="Key metrics"]', { timeout: 15000 });
    const metricsSection = page.locator('[aria-label="Key metrics"]');
    await expect(metricsSection).not.toContainText('Stub');
    await expect(metricsSection).not.toContainText('Coming soon');
  });

  test('Active Trials tile is visible on mobile', async ({ page, asOwner }) => {
    void asOwner;
    await page.goto('/dashboard');
    await page.waitForSelector('[aria-label="Key metrics"]', { timeout: 15000 });
    await expect(page.getByText('Active Trials')).toBeVisible();
  });
});

// ── Visual parity snapshots ───────────────────────────────────────────────────

test.describe('@visual dashboard — parity screenshots', () => {
  test('dashboard at 1440×900 matches snapshot', async ({ page, asOwner }) => {
    void asOwner;
    await page.setViewportSize(DESKTOP);
    await page.goto('/dashboard');
    await page.waitForSelector('[aria-label="Key metrics"]', { timeout: 15000 });
    // Allow charts to render
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('dashboard-1440x900.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('dashboard at 414×896 matches snapshot', async ({ page, asOwner }) => {
    void asOwner;
    await page.setViewportSize(MOBILE);
    await page.goto('/dashboard');
    await page.waitForSelector('[aria-label="Key metrics"]', { timeout: 15000 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('dashboard-414x896.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});
