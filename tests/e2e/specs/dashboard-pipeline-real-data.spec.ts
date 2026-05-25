/**
 * dashboard-pipeline-real-data.spec.ts — E2E smoke test verifying that the
 * Sales Pipeline chart on /Dashboard renders stage names sourced from real DB
 * data (MetadataType rows with scope='pipeline_stage') rather than hardcoded
 * strings.
 *
 * This spec is intentionally skipped (.skip) until the CI environment can
 * seed pipeline_stage rows and sign in as a test user.
 *
 * TODO to unskip:
 *   1. Provision a Supabase test tenant with pipeline_stage rows inserted via
 *      `INSERT INTO metadata_type (scope, name, order, is_active, company_id)
 *       VALUES ('pipeline_stage', 'Prospect', 1, 'true', '<test-company-id>')` etc.
 *   2. Set TEST_USER_EMAIL and TEST_USER_PASSWORD env vars for sign-in.
 *   3. Navigate to /Dashboard and assert recharts bar labels match seeded names.
 *   4. Remove the `.skip`.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { test, expect } from '@playwright/test';

test.skip('Sales Pipeline chart shows real stage names from DB', async ({ page }) => {
  // ── Step 1: sign in ────────────────────────────────────────────────────────
  const email = process.env['TEST_USER_EMAIL'] ?? 'test@example.com';
  const password = process.env['TEST_USER_PASSWORD'] ?? 'password';

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // ── Step 2: wait for dashboard ─────────────────────────────────────────────
  await page.waitForURL('**/Dashboard', { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();

  // ── Step 3: assert recharts bar chart is present ───────────────────────────
  // The Sales Pipeline card only renders when dealsByStage.length > 0.
  // The seeded data should populate at least one stage bar.
  const pipelineCard = page.getByText('Sales Pipeline').locator('../..');
  await expect(pipelineCard).toBeVisible();

  // Recharts renders SVG <text> elements for XAxis tick labels (stage names).
  // Assert at least one tick is present — its text content should match a
  // seeded stage name, not a hardcoded placeholder like "Prospect".
  const tickLabels = pipelineCard.locator('svg text');
  await expect(tickLabels.first()).toBeVisible();

  // TODO: assert specific stage names once the seed is set up, e.g.:
  // await expect(tickLabels.filter({ hasText: 'Prospect' })).toHaveCount(1);
});
