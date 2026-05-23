// Dashboard visual parity vs. HotSeatersMVP baseline.
import { test, expect } from '@playwright/test';
import { seedSession } from '../../e2e/fixtures/auth';

test.describe('dashboard parity', () => {
  test('dashboard renders at parity', async ({ page }, info) => {
    await seedSession(page, 'owner');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`dashboard-${info.project.name}.png`, {
      fullPage: true,
    });
  });
});
