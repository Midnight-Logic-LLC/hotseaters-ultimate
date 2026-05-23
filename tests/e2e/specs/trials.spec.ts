// Trials detail: five tabs render; editing a trial service updates the
// live-derived services total (Change 6 — derived calculations).
import { test, expect } from '../fixtures';

const TABS = ['Services', 'Attorneys', 'Segments', 'Assignments', 'Map'] as const;

test.describe('@smoke trials', () => {
  test('trial detail tabs render', async ({ page, asOwner }) => {
    void asOwner;
    await page.goto('/Trials');
    await page.locator('[data-testid="trial-row"]').first().click();
    for (const label of TABS) {
      await expect(page.getByRole('tab', { name: label })).toBeVisible();
    }
  });

  test('editing a trial service updates the services total live', async ({
    page,
    asOwner,
  }) => {
    void asOwner;
    await page.goto('/Trials');
    await page.locator('[data-testid="trial-row"]').first().click();
    await page.getByRole('tab', { name: 'Services' }).click();

    const totalLocator = page.locator('[data-testid="services-total"]');
    await expect(totalLocator).toBeVisible();
    const before = (await totalLocator.textContent())?.trim() ?? '';

    await page.locator('[data-testid="trial-service-row"]').first().click();
    await page.getByLabel(/rate/i).fill('250');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(totalLocator).not.toHaveText(before, { timeout: 3_000 });
  });
});
