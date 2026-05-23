// Cucumber World — owns the Playwright browser/context/page per scenario.
// Re-uses the auth fixtures from tests/e2e/fixtures/auth.ts so step
// definitions share one source of truth for personas.
import { setWorldConstructor, World, type IWorldOptions, Before, After } from '@cucumber/cucumber';
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { seedSession, SEED_USERS, type Role } from '../../e2e/fixtures/auth';

export interface WorldParams {
  baseUrl: string;
  supabaseUrl: string;
}

export class HotseatersWorld extends World<WorldParams> {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  currentRole?: Role;
  capturedOtp?: { email?: string };

  constructor(options: IWorldOptions<WorldParams>) {
    super(options);
  }

  get baseUrl(): string {
    return this.parameters.baseUrl;
  }

  async signInAs(role: Role): Promise<void> {
    this.currentRole = role;
    await seedSession(this.page, role);
  }

  seedUser(role: Role) {
    return SEED_USERS[role];
  }
}

setWorldConstructor(HotseatersWorld);

Before(async function (this: HotseatersWorld) {
  this.browser = await chromium.launch();
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();

  // Default mocks: supabase OTP + token exchange. Steps can override.
  await this.page.route('**/auth/v1/otp**', async (route) => {
    try {
      this.capturedOtp = JSON.parse(route.request().postData() ?? '{}');
    } catch {
      this.capturedOtp = {};
    }
    await route.fulfill({ status: 200, body: JSON.stringify({ messageId: 'mock' }) });
  });
  await this.page.route('**/auth/v1/token**', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        access_token: 'mock',
        refresh_token: 'mock',
        expires_in: 3600,
        token_type: 'bearer',
      }),
    });
  });
});

After(async function (this: HotseatersWorld) {
  await this.context?.close();
  await this.browser?.close();
});
