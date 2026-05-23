// Clients vertical: virtualization, optimistic CRUD, offline edits, and the
// reconnect drain. These exercise the PGlite + write-sync queue from Change 3.
import { test, expect } from '../fixtures';

test.describe('@smoke clients', () => {
  test('clients list virtualizes with TanStack Virtual', async ({ page, asOwner }) => {
    void asOwner;
    await page.goto('/Clients');
    const virtualizer = page.locator('[data-testid="clients-virtualizer"]');
    await expect(virtualizer).toBeVisible();
    // Sanity: rendered row count should be bounded (windowed), not equal to
    // total client count when more than the viewport can hold.
    const rendered = await page.locator('[data-testid="client-row"]').count();
    expect(rendered).toBeLessThan(200);
  });

  test('creating a client appears optimistically and survives reload', async ({
    page,
    asOwner,
  }) => {
    void asOwner;
    await page.goto('/Clients');
    await page.getByRole('button', { name: /new client/i }).click();
    const name = `E2E Acme ${Date.now()}`;
    await page.getByLabel(/client name/i).fill(name);
    await page.getByRole('button', { name: /save/i }).click();

    // Optimistic: row should appear before any server roundtrip.
    await expect(page.getByText(name)).toBeVisible({ timeout: 2_000 });

    await page.reload();
    await expect(page.getByText(name)).toBeVisible();
  });

  test('editing a client name updates the row optimistically', async ({ page, asOwner }) => {
    void asOwner;
    await page.goto('/Clients');
    const firstRow = page.locator('[data-testid="client-row"]').first();
    await firstRow.getByRole('button', { name: /edit/i }).click();
    const renamed = `Renamed ${Date.now()}`;
    await page.getByLabel(/client name/i).fill(renamed);
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(renamed)).toBeVisible({ timeout: 2_000 });
  });

  test('offline edit persists locally and drains on reconnect', async ({
    page,
    context,
    asOwner,
  }) => {
    void asOwner;
    await page.goto('/Clients');
    const firstRow = page.locator('[data-testid="client-row"]').first();

    // Go offline.
    await context.setOffline(true);

    await firstRow.getByRole('button', { name: /edit/i }).click();
    const offlineName = `Offline Edit ${Date.now()}`;
    await page.getByLabel(/client name/i).fill(offlineName);
    await page.getByRole('button', { name: /save/i }).click();

    // Edit is visible while offline.
    await expect(page.getByText(offlineName)).toBeVisible();
    await page.reload();
    await expect(page.getByText(offlineName)).toBeVisible();

    // Reconnect — pending queue drains and the toast confirms success.
    await context.setOffline(false);
    await expect(page.getByText(/synced|drained|up to date/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
