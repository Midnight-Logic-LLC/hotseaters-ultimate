/**
 * change-401 — routing redirect + last-route persistence E2E.
 *
 * Four cases (bible parity, `HotSeatersMVP/src/Layout.jsx:364-419`):
 *   1. Fresh sign-in (no lastViewedPage) lands on /Dashboard.
 *   2. /dashboard lowercase redirects to /Dashboard.
 *   3. Navigation to /Trials persists across full-page reload.
 *   4. Sign-out then sign-in lands on last-viewed /Trials.
 */
import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';

interface UserInfoState {
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  preferences: Record<string, unknown>;
}

interface MockHandles {
  state: UserInfoState;
}

/**
 * Intercept the supabase REST endpoints the SPA hits for the user_info row
 * (one read by id; one PATCH for preference writes). Stash mutable state on
 * the returned handle so a single test can observe writes and seed reads.
 */
async function mockUserInfoEndpoints(page: Page, initial: UserInfoState, userInfoId: string, companyId: string): Promise<MockHandles> {
  const state: MockHandles = { state: { ...initial, preferences: { ...initial.preferences } } };

  await page.route('**/rest/v1/user_info**', async (route) => {
    const req = route.request();
    const method = req.method();
    if (method === 'GET' || method === 'HEAD') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: userInfoId,
          auth_user_id: '00000000-0000-0000-0000-000000000b01',
          email: 'owner+e2e@hotseaters.test',
          account_status: 'active',
          first_name: 'Owner',
          last_name: 'E2E',
          company_id: companyId,
          company_role: 'Owner',
          is_sales: false,
          status: state.state.status,
          preferences: state.state.preferences,
        }),
      });
      return;
    }
    if (method === 'PATCH') {
      let body: { preferences?: Record<string, unknown> } = {};
      try {
        body = JSON.parse(req.postData() ?? '{}');
      } catch {
        body = {};
      }
      if (body.preferences && typeof body.preferences === 'object') {
        state.state.preferences = { ...state.state.preferences, ...body.preferences };
      }
      await route.fulfill({
        status: 204,
        contentType: 'application/json',
        body: '',
      });
      return;
    }
    await route.fulfill({ status: 200, body: '[]' });
  });

  return state;
}

test.describe('@smoke change-401 routing + last-route', () => {
  test('fresh sign-in (no lastViewedPage) lands on /Dashboard', async ({ page, asOwner }) => {
    const handles = await mockUserInfoEndpoints(
      page,
      { status: 'active', preferences: {} },
      asOwner.userInfoId,
      asOwner.companyId,
    );

    await page.goto('/');
    await page.waitForURL(/\/Dashboard$/i, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/Dashboard$/);
    void handles;
  });

  test('/dashboard lowercase redirects to /Dashboard', async ({ page, asOwner }) => {
    await mockUserInfoEndpoints(page, { status: 'active', preferences: {} }, asOwner.userInfoId, asOwner.companyId);

    await page.goto('/dashboard');
    await page.waitForURL(/\/Dashboard$/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/Dashboard$/);
  });

  test('navigation to /Trials persists across full-page reload', async ({ page, asOwner }) => {
    const handles = await mockUserInfoEndpoints(
      page,
      { status: 'active', preferences: {} },
      asOwner.userInfoId,
      asOwner.companyId,
    );

    await page.goto('/Trials');
    await expect(page).toHaveURL(/\/Trials$/);

    // Wait beyond the 500ms debounce so the tracker fires the PATCH.
    await page.waitForTimeout(900);
    expect(handles.state.preferences['lastViewedPage']).toBe('Trials');

    // Full reload — we should still be on /Trials.
    await page.reload();
    await expect(page).toHaveURL(/\/Trials$/);
  });

  test('sign-out then sign-in lands on last-viewed /Trials', async ({ page, asOwner }) => {
    // Seed the user with `lastViewedPage: "Trials"` so the landing branch
    // picks /Trials over /Dashboard.
    await mockUserInfoEndpoints(
      page,
      { status: 'active', preferences: { lastViewedPage: 'Trials' } },
      asOwner.userInfoId,
      asOwner.companyId,
    );

    await page.goto('/');
    await page.waitForURL(/\/Trials$/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/Trials$/);
  });
});
