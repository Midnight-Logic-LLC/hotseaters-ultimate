// Role-based route guards per HotSeatersMVP role matrix.
import { test, expect } from '../fixtures';

test.describe('@smoke role guards', () => {
  test('Sales is redirected away from /settings/billing', async ({ page, asSales }) => {
    void asSales;
    await page.goto('/settings/billing');
    await page.waitForURL((url) => !url.pathname.startsWith('/settings/billing'));
    await expect(page).not.toHaveURL(/\/settings\/billing/);
  });

  test('Trial Consultant cannot access /Clients', async ({ page, asTrialConsultant }) => {
    void asTrialConsultant;
    await page.goto('/Clients');
    await page.waitForURL((url) => !url.pathname.startsWith('/Clients'));
    await expect(page).not.toHaveURL(/\/Clients/);
  });
});
