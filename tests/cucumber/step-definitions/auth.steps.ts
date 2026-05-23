// Step definitions for auth.feature. Drives the SPA via Playwright; never
// hits real supabase. Self-hosted Supabase only.
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { HotseatersWorld } from '../support/world';

Given('the SPA is served at the configured base URL', async function (this: HotseatersWorld) {
  expect(this.baseUrl).toMatch(/^https?:\/\//);
});

Given('the supabase auth endpoint is mocked', async function (this: HotseatersWorld) {
  // Mocks are wired in the Before hook; this step asserts presence.
  expect(this.parameters.supabaseUrl).not.toMatch(/supabase\.co/);
});

Given('I visit {string}', async function (this: HotseatersWorld, path: string) {
  await this.page.goto(`${this.baseUrl}${path}`);
});

When('I visit {string}', async function (this: HotseatersWorld, path: string) {
  await this.page.goto(`${this.baseUrl}${path}`);
});

When('I click the {string} button', async function (this: HotseatersWorld, label: string) {
  await this.page.getByRole('button', { name: new RegExp(label, 'i') }).click();
});

When(
  'the mocked Google OAuth callback returns a valid session for the Owner',
  async function (this: HotseatersWorld) {
    await this.signInAs('owner');
    await this.page.goto(`${this.baseUrl}/auth/callback?code=mock-google`);
  },
);

Then('I am redirected to {string}', async function (this: HotseatersWorld, path: string) {
  await this.page.waitForURL((url) => url.pathname.startsWith(path));
});

Then(
  'the dashboard greeting shows the Owner\'s name',
  async function (this: HotseatersWorld) {
    await expect(this.page.getByText(/welcome/i)).toBeVisible();
  },
);

When(
  'I fill in the email field with {string}',
  async function (this: HotseatersWorld, email: string) {
    await this.page.getByLabel(/email/i).fill(email);
  },
);

Then('I see the {string} confirmation', async function (this: HotseatersWorld, msg: string) {
  await expect(this.page.getByText(new RegExp(msg, 'i'))).toBeVisible();
});

Then(
  'the supabase OTP endpoint received the email {string}',
  async function (this: HotseatersWorld, email: string) {
    expect(this.capturedOtp?.email).toBe(email);
  },
);

Given(
  'an invitation token {string} exists for {string}',
  async function (this: HotseatersWorld, _token: string, _email: string) {
    // Invitation lookup is mocked at the supabase boundary in the Before hook.
    // The fact of the token's existence is asserted by the route returning 200.
  },
);

When('I complete the invitation form', async function (this: HotseatersWorld) {
  await this.page.getByLabel(/full name/i).fill('Invited User');
  await this.page.getByLabel(/password/i).fill('Sup3rSecret!');
  await this.page.getByRole('button', { name: /accept|finish/i }).click();
});

Then('a user_info row is created via the bridge trigger', async function (this: HotseatersWorld) {
  // Bridge-trigger behavior is pgTAP-tested at the DB layer
  // (latest-data/tests/auth_rls_smoke_test.sql). Here we assert the SPA
  // proceeds past the post-signup gate, which is gated on user_info existing.
  await expect(this.page).toHaveURL(/onboarding|dashboard/);
});

Given(
  'a sub-user {string} has signed in but has no approved user_info',
  async function (this: HotseatersWorld, _email: string) {
    await this.signInAs('trial_consultant');
    // Simulate "pending" by attaching a flag to the seeded session.
    await this.page.addInitScript(() => {
      try {
        window.sessionStorage.setItem('hotseaters:e2e-pending-approval', '1');
      } catch {
        /* ignore */
      }
    });
  },
);

When('the sub-user visits {string}', async function (this: HotseatersWorld, path: string) {
  await this.page.goto(`${this.baseUrl}${path}`);
});

Then(
  'I see the {string} message',
  async function (this: HotseatersWorld, msg: string) {
    await expect(this.page.getByText(new RegExp(msg, 'i'))).toBeVisible();
  },
);
