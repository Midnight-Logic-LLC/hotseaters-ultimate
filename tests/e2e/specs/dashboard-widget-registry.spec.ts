/**
 * dashboard-widget-registry.spec.ts — table-driven role × marketplace-flag
 * matrix. Asserts the visible widget [data-testid] set matches the bible
 * role matrix locked in by `use-dashboard-widgets.ts` REGISTRY.
 *
 * The unit-level matrix lives in
 * `src/features/dashboard/hooks/__tests__/use-dashboard-widgets.spec.tsx`.
 * This E2E spec is the **end-to-end** equivalent: it signs in as each role,
 * loads /Dashboard, and verifies the right widgets render in the rendered
 * DOM.
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx + the role matrix table in
 * `.claude/plans/foamy-marinating-hollerith.md`.
 */

import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';

const ALWAYS_PRESENT = [
  'welcome-header',
  'kpi-active-trials',
  'kpi-trials-ytd',
  'recent-activity-card',
  'active-trial-performance',
  'upcoming-trials-card',
  'quick-actions-bar',
];

const REVENUE_PRESENT = [
  'kpi-revenue-ytd',
  'kpi-pipeline-value',
  'kpi-outstanding',
  'kpi-revenue-per-trial-ytd',
  'quick-stats-card',
  'weekly-team-performance',
  'monthly-team-performance',
  'revenue-trend-card',
];

const SALES_PIPELINE = 'sales-pipeline-chart';

async function assertWidgets(
  page: Page,
  present: string[],
  absent: string[],
  role: string,
): Promise<void> {
  await page.goto('/Dashboard');
  await page.waitForSelector('[data-testid="dashboard-page"]', { timeout: 15_000 });

  for (const testid of present) {
    await expect(
      page.locator(`[data-testid="${testid}"]`).first(),
      `expected ${testid} to be visible for role=${role}`,
    ).toBeVisible({ timeout: 10_000 });
  }

  for (const testid of absent) {
    await expect(
      page.locator(`[data-testid="${testid}"]`),
      `expected ${testid} to be ABSENT for role=${role}`,
    ).toHaveCount(0);
  }
}

test.describe('@parity dashboard widget registry — owner', () => {
  test('renders the bible widget set for owner', async ({ page, asOwner }) => {
    void asOwner;
    await assertWidgets(
      page,
      [...ALWAYS_PRESENT, ...REVENUE_PRESENT, SALES_PIPELINE],
      [],
      'owner',
    );
  });
});

test.describe('@parity dashboard widget registry — sales', () => {
  test('renders the bible widget set for sales', async ({ page, asSales }) => {
    void asSales;
    await assertWidgets(
      page,
      [...ALWAYS_PRESENT, ...REVENUE_PRESENT, SALES_PIPELINE],
      [],
      'sales',
    );
  });
});

test.describe('@parity dashboard widget registry — trial_consultant', () => {
  test('renders the narrowed widget set for trial_consultant', async ({
    page,
    asTrialConsultant,
  }) => {
    void asTrialConsultant;
    await assertWidgets(
      page,
      ALWAYS_PRESENT,
      [...REVENUE_PRESENT, SALES_PIPELINE, 'needs-attention-banner'],
      'trial_consultant',
    );
  });
});
