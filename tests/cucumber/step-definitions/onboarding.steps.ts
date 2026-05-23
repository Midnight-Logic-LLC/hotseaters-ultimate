// Steps for onboarding.feature.
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { HotseatersWorld } from '../support/world';

Given(
  'I am signed in as a new Owner with an empty company',
  async function (this: HotseatersWorld) {
    await this.signInAs('owner');
    await this.page.addInitScript(() => {
      try {
        window.sessionStorage.setItem('hotseaters:e2e-empty-company', '1');
      } catch {
        /* ignore */
      }
    });
  },
);

When(
  'I fill in the company name with {string}',
  async function (this: HotseatersWorld, name: string) {
    await this.page.getByLabel(/company name/i).fill(name);
  },
);

When(
  'I select the time zone {string}',
  async function (this: HotseatersWorld, tz: string) {
    await this.page.getByLabel(/time zone/i).fill(tz);
    await this.page.keyboard.press('Enter');
  },
);

When(
  'I pick the default trial-services pricing template',
  async function (this: HotseatersWorld) {
    await this.page.getByRole('radio', { name: /default/i }).check();
  },
);

Then(
  'the company {string} exists in the entity graph',
  async function (this: HotseatersWorld, name: string) {
    // The dashboard reads from the entity graph; if the name is visible we
    // have a working store-to-UI binding.
    await expect(this.page.getByText(name)).toBeVisible();
  },
);

Then(
  'my user_info.onboarding_completed_at is set',
  async function (this: HotseatersWorld) {
    // Asserted indirectly: the SPA exposes a `__hu_test__.userInfo` window
    // helper in test builds. Step exists for documentation; assertion is soft.
    const completed = await this.page.evaluate(
      () => (window as unknown as { __hu_test__?: { userInfo?: { onboarding_completed_at?: string } } }).__hu_test__?.userInfo?.onboarding_completed_at,
    );
    expect(completed).toBeTruthy();
  },
);
