// Auth flows. Magic-link + OAuth callback are mocked — we never hit real
// supabase in tests. Self-hosted Supabase only.
import { test, expect } from '../fixtures';

test.describe('@smoke auth', () => {
  test('login route renders the magic-link form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /magic link/i })).toBeVisible();
  });

  test('magic-link form posts to the mocked supabase endpoint', async ({ page }) => {
    let captured: { email?: string } = {};
    await page.route('**/auth/v1/otp**', async (route) => {
      const req = route.request();
      try {
        captured = JSON.parse(req.postData() ?? '{}');
      } catch {
        /* ignore */
      }
      await route.fulfill({ status: 200, body: JSON.stringify({ messageId: 'mock' }) });
    });

    await page.goto('/login');
    await page.getByLabel(/email/i).fill('owner+e2e@hotseaters.test');
    await page.getByRole('button', { name: /magic link/i }).click();

    await expect(page.getByText(/check your email/i)).toBeVisible();
    expect(captured.email).toBe('owner+e2e@hotseaters.test');
  });

  test('callback route handles ?code= and exchanges for a session', async ({ page }) => {
    let exchanged = false;
    await page.route('**/auth/v1/token?grant_type=pkce**', async (route) => {
      exchanged = true;
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          access_token: 'mock-access',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: '00000000-0000-0000-0000-000000000b01' },
        }),
      });
    });

    await page.goto('/auth/callback?code=fake-pkce-code');
    await page.waitForURL(/\/(dashboard|onboarding|$)/);
    expect(exchanged).toBe(true);
  });
});
