import { test, expect } from '@playwright/test';
import { seedSession } from '../../e2e/fixtures/auth';

test.describe('trials parity', () => {
  test('trials list renders at parity', async ({ page }, info) => {
    await seedSession(page, 'owner');
    await page.goto('/Trials');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`trials-${info.project.name}.png`, {
      fullPage: true,
    });
  });

  test('trial detail renders at parity', async ({ page }, info) => {
    await seedSession(page, 'owner');
    await page.goto('/Trials');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="trial-row"]').first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`trial-detail-${info.project.name}.png`, {
      fullPage: true,
    });
  });
});
