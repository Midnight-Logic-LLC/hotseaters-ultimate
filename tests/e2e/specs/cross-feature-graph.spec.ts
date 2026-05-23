// Cross-feature entity-graph reactivity: editing a client name from the
// Clients page should propagate through the entity graph (Zustand) and
// re-render the trial detail page without a manual refresh.
import { test, expect } from '../fixtures';

test('@smoke renamed client propagates to trial detail without refresh', async ({
  page,
  context,
  asOwner,
}) => {
  void asOwner;

  // Open trial detail in tab A.
  await page.goto('/Trials');
  await page.locator('[data-testid="trial-row"]').first().click();
  const trialClientLabel = page.locator('[data-testid="trial-client-name"]');
  await expect(trialClientLabel).toBeVisible();
  const originalName = (await trialClientLabel.textContent())?.trim() ?? '';

  // Edit the client from tab B (same context shares the entity-graph store
  // only within a single tab — so we instead navigate the same tab and come
  // back, asserting the cached entity reflects the rename without re-fetch).
  const clientsPage = await context.newPage();
  await clientsPage.goto('/Clients');
  const row = clientsPage.locator(`[data-testid="client-row"]:has-text("${originalName}")`).first();
  await row.getByRole('button', { name: /edit/i }).click();
  const renamed = `Cross ${Date.now()}`;
  await clientsPage.getByLabel(/client name/i).fill(renamed);
  await clientsPage.getByRole('button', { name: /save/i }).click();
  await expect(clientsPage.getByText(renamed)).toBeVisible();

  // Back to the trial tab — the store reacts via realtime / write-sync drain.
  await page.bringToFront();
  await expect(trialClientLabel).toHaveText(renamed, { timeout: 10_000 });
});
