// Landing page visual parity vs. HotSeatersMVP baseline.
import { test, expect } from '@playwright/test';

test.describe('landing parity', () => {
  test('landing renders at parity', async ({ page }, info) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`landing-${info.project.name}.png`, {
      fullPage: true,
    });
  });
});
