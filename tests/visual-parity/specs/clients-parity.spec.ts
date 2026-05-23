import { test, expect } from '@playwright/test';
import { seedSession } from '../../e2e/fixtures/auth';

test.describe('clients parity', () => {
  test('clients list renders at parity', async ({ page }, info) => {
    await seedSession(page, 'owner');
    await page.goto('/Clients');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`clients-${info.project.name}.png`, {
      fullPage: true,
    });
  });
});
