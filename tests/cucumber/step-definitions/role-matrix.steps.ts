// Steps for role-route-matrix.feature. Drives a single signin + visit per
// scenario row and asserts the gate behavior.
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { HotseatersWorld } from '../support/world';
import type { Role } from '../../e2e/fixtures/auth';

const ROLE_KEYS: Record<string, Role> = {
  owner: 'owner',
  admin: 'owner', // admin shares the owner persona for routing in v0.1
  sales: 'sales',
  trial_consultant: 'trial_consultant',
};

Given('I am signed in as a {string}', async function (this: HotseatersWorld, role: string) {
  const key = ROLE_KEYS[role];
  if (!key) throw new Error(`Unknown role in matrix: ${role}`);
  await this.signInAs(key);
});

When('I visit {string}', async function (this: HotseatersWorld, path: string) {
  await this.page.goto(`${this.baseUrl}${path}`);
});

Then('the route should {string}', async function (this: HotseatersWorld, expectation: string) {
  switch (expectation) {
    case 'render': {
      // Page stays at the requested path.
      const url = new URL(this.page.url());
      expect(url.pathname).not.toMatch(/\/forbidden|\/login|\/pending-approval/);
      break;
    }
    case 'redirect': {
      await this.page.waitForURL((u) => /\/forbidden|\/login|\/pending-approval|\/dashboard/.test(u.pathname));
      break;
    }
    case 'render-readonly': {
      await expect(this.page.locator('[data-testid="readonly-banner"]')).toBeVisible();
      break;
    }
    default:
      throw new Error(`Unknown expectation: ${expectation}`);
  }
});
