// Auth fixtures for Playwright. Programmatically sets a supabase session in
// localStorage so specs do not need to drive real OAuth or magic-link flows.
//
// Three personas matching HotSeatersMVP role expectations:
//   - Owner: full company access.
//   - Sales: cannot reach /settings/billing.
//   - Trial Consultant: cannot reach /Clients.
//
// Self-hosted Supabase only — the storage key here mirrors what
// @supabase/supabase-js v2 writes when configured against http://localhost:8000
// or https://hotbase.prometheusags.ai.
import { test as base, type Page } from '@playwright/test';

export type Role = 'owner' | 'sales' | 'trial_consultant';

export interface SeedUser {
  email: string;
  userInfoId: string;
  authUserId: string;
  companyId: string;
  role: Role;
}

// These match the test seed users created by Change 4's seed.sql.
// IDs are stable so RLS pgTAP tests and Playwright tests share the same fixture.
export const SEED_USERS: Record<Role, SeedUser> = {
  owner: {
    email: 'owner+e2e@hotseaters.test',
    userInfoId: '00000000-0000-0000-0000-000000000a01',
    authUserId: '00000000-0000-0000-0000-000000000b01',
    companyId: '00000000-0000-0000-0000-0000000000c1',
    role: 'owner',
  },
  sales: {
    email: 'sales+e2e@hotseaters.test',
    userInfoId: '00000000-0000-0000-0000-000000000a02',
    authUserId: '00000000-0000-0000-0000-000000000b02',
    companyId: '00000000-0000-0000-0000-0000000000c1',
    role: 'sales',
  },
  trial_consultant: {
    email: 'consultant+e2e@hotseaters.test',
    userInfoId: '00000000-0000-0000-0000-000000000a03',
    authUserId: '00000000-0000-0000-0000-000000000b03',
    companyId: '00000000-0000-0000-0000-0000000000c1',
    role: 'trial_consultant',
  },
};

// The supabase-js v2 localStorage key. The project ref is the URL's first
// hostname label (`localhost` -> `localhost`, `hotbase` -> `hotbase`).
function storageKey(supabaseUrl: string): string {
  try {
    const u = new URL(supabaseUrl);
    const host = u.hostname;
    const ref = host.split('.')[0] || 'localhost';
    return `sb-${ref}-auth-token`;
  } catch {
    return 'sb-localhost-auth-token';
  }
}

export function mintFakeSession(user: SeedUser) {
  const nowSec = Math.floor(Date.now() / 1000);
  const exp = nowSec + 60 * 60; // 1 hour
  // A signed JWT is not required for the SPA's localStorage seed — the SPA
  // reads the user object on hydration; signature verification happens at the
  // PostgREST/Realtime layer, which Playwright tests do not exercise directly.
  // We still emit a JWT-shaped string so client code that parses claims works.
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      aud: 'authenticated',
      exp,
      iat: nowSec,
      iss: 'self-hosted-supabase',
      sub: user.authUserId,
      email: user.email,
      role: 'authenticated',
      app_metadata: { provider: 'email' },
      user_metadata: {
        company_id: user.companyId,
        user_info_id: user.userInfoId,
        role: user.role,
      },
    }),
  ).toString('base64url');
  const signature = 'e2e-fixture-signature-not-verified';
  const access_token = `${header}.${payload}.${signature}`;
  return {
    access_token,
    token_type: 'bearer',
    expires_at: exp,
    expires_in: 3600,
    refresh_token: 'e2e-fixture-refresh',
    user: {
      id: user.authUserId,
      aud: 'authenticated',
      email: user.email,
      app_metadata: { provider: 'email' },
      user_metadata: {
        company_id: user.companyId,
        user_info_id: user.userInfoId,
        role: user.role,
      },
      created_at: new Date(nowSec * 1000).toISOString(),
    },
  };
}

export async function seedSession(page: Page, role: Role): Promise<SeedUser> {
  const user = SEED_USERS[role];
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ?? 'http://localhost:8000';
  const key = storageKey(supabaseUrl);
  const session = mintFakeSession(user);

  // addInitScript runs before any page script, so the SPA boots already-authed.
  await page.addInitScript(
    ({ key, session }) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(session));
      } catch {
        /* private-mode storage failures are non-fatal in tests */
      }
    },
    { key, session },
  );

  return user;
}

interface AuthFixtures {
  asOwner: SeedUser;
  asSales: SeedUser;
  asTrialConsultant: SeedUser;
}

export const test = base.extend<AuthFixtures>({
  asOwner: async ({ page }, use) => {
    const u = await seedSession(page, 'owner');
    await use(u);
  },
  asSales: async ({ page }, use) => {
    const u = await seedSession(page, 'sales');
    await use(u);
  },
  asTrialConsultant: async ({ page }, use) => {
    const u = await seedSession(page, 'trial_consultant');
    await use(u);
  },
});

export { expect } from '@playwright/test';
