/**
 * pglite-isolation.spec.ts — per-user PGlite IDB isolation.
 *
 * Verifies that two distinct users each get their own isolated IndexedDB
 * database (`idb://hotseaters/<userId>`) and that signing out as user A
 * and signing in as user B does NOT expose A's data to B.
 *
 * TODO: set up multi-user fixtures in `.env.test`:
 *   E2E_USER_A_EMAIL, E2E_USER_A_PASSWORD
 *   E2E_USER_B_EMAIL, E2E_USER_B_PASSWORD
 *   E2E_USER_A_ID, E2E_USER_B_ID
 *
 * Until those credentials are available this test is skipped. To activate it:
 * 1. Create two test accounts in the self-hosted Supabase instance.
 * 2. Give user A at least one client row, leave user B with zero clients.
 * 3. Add the env vars above to `.env.test`.
 */

import { test, expect } from '../fixtures';

const USER_A_EMAIL = process.env['E2E_USER_A_EMAIL'];
const USER_A_PASSWORD = process.env['E2E_USER_A_PASSWORD'];
const USER_B_EMAIL = process.env['E2E_USER_B_EMAIL'];
const USER_B_PASSWORD = process.env['E2E_USER_B_PASSWORD'];
const USER_A_ID = process.env['E2E_USER_A_ID'];
const USER_B_ID = process.env['E2E_USER_B_ID'];

const credentialsAvailable =
  USER_A_EMAIL &&
  USER_A_PASSWORD &&
  USER_B_EMAIL &&
  USER_B_PASSWORD &&
  USER_A_ID &&
  USER_B_ID;

// Skip entire describe block when multi-user credentials are not set up.
const describeOrSkip = credentialsAvailable ? test.describe : test.describe.skip;

describeOrSkip('@pglite-isolation PGlite per-user IDB isolation', () => {
  test('user B sees no clients from user A after sign-in switch', async ({ page }) => {
    // ── Sign in as user A ────────────────────────────────────────────────────
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(USER_A_EMAIL!);
    await page.getByLabel(/password/i).fill(USER_A_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|clients)/);

    await page.goto('/clients');
    // User A should have at least one client visible.
    const clientCountA = await page.locator('[data-testid="client-row"]').count();
    expect(clientCountA).toBeGreaterThan(0);

    // ── Sign out ─────────────────────────────────────────────────────────────
    await page.getByRole('button', { name: /sign out/i }).click();
    await page.waitForURL(/\/login/);

    // ── Sign in as user B ────────────────────────────────────────────────────
    await page.getByLabel(/email/i).fill(USER_B_EMAIL!);
    await page.getByLabel(/password/i).fill(USER_B_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|clients)/);

    await page.goto('/clients');
    // User B has no data — the local clients list must be empty.
    const clientCountB = await page.locator('[data-testid="client-row"]').count();
    expect(clientCountB).toBe(0);
  });

  test('two separate IndexedDB databases exist after both users have signed in', async ({
    page,
  }) => {
    // Sign in as A, then sign out, then sign in as B.
    // After both sign-ins, `indexedDB.databases()` must contain entries for
    // both user IDs.

    // Sign in A
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(USER_A_EMAIL!);
    await page.getByLabel(/password/i).fill(USER_A_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|clients)/);
    await page.getByRole('button', { name: /sign out/i }).click();
    await page.waitForURL(/\/login/);

    // Sign in B
    await page.getByLabel(/email/i).fill(USER_B_EMAIL!);
    await page.getByLabel(/password/i).fill(USER_B_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|clients)/);

    // Inspect IDB databases in the page context.
    const dbNames = await page.evaluate(async () => {
      const dbs = await indexedDB.databases();
      return dbs.map((d) => d.name ?? '');
    });

    expect(dbNames.some((n) => n.includes(USER_A_ID!))).toBe(true);
    expect(dbNames.some((n) => n.includes(USER_B_ID!))).toBe(true);
  });
});
