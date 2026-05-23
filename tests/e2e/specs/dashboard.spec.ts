// Dashboard renders for an authed Owner. Mobile viewport collapses to a card
// stack per Rule 4 (Tauri mobile is primary).
import { test, expect } from '../fixtures';

test.describe('@smoke dashboard', () => {
  test('dashboard renders for Owner with placeholder cards', async ({ page, asOwner }) => {
    void asOwner;
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    const cards = page.locator('[data-testid="dashboard-card"]');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('dashboard collapses to a card stack at 375px', async ({ page, asOwner }) => {
    void asOwner;
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="dashboard-card-stack"]')).toBeVisible();
    // Sidebar must not be visible — bottom-tab + drawer pattern.
    await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeHidden();
  });
});
