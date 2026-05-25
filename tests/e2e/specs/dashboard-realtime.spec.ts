/**
 * dashboard-realtime.spec.ts — assert that a server-side mutation to a
 * pipeline-stage MetadataType row propagates to the live dashboard
 * within 2 seconds (the Realtime Manager coalescing window + a
 * graph-store selector tick).
 *
 * This exercises the full reactive path:
 *   Server psql UPDATE
 *     → Electric / Supabase Realtime
 *     → graph-persistence-adapter → upsertEntity
 *     → useTier1().pipelineStages re-projects
 *     → usePipelineSummary recomputes weightedValue
 *     → SalesPipelineChart re-renders
 *
 * Skipped until CI provisions:
 *   1. A docker-compose Supabase stack with Electric attached.
 *   2. A psql-accessible test tenant with a seeded `pipeline_stage`
 *      MetadataType row (scope='pipeline_stage') with a known id and
 *      revenue_probability=0.5.
 *   3. The seeded owner user has a `trial` row in that stage with
 *      `estimated_value=100000`, so weightedValue = 50000 → after the
 *      UPDATE bumps probability to 0.9 the chart shows weightedValue=90000.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { test, expect } from '../fixtures';

test.skip('@parity dashboard realtime — pipeline stage update reflects within 2s', async ({
  page,
  asOwner,
}) => {
  void asOwner;
  await page.goto('/Dashboard');
  await page.waitForSelector('[data-testid="sales-pipeline-chart"]', { timeout: 15_000 });

  // 1) Capture the initial weighted value caption from the KPI tile.
  const pipelineKpi = page.locator('[data-testid="kpi-pipeline-value"]');
  const initialText = await pipelineKpi.innerText();
  expect(initialText).toContain('weighted');

  // 2) Fire the server-side mutation via psql (env var TEST_PSQL_URL).
  //    Pseudo-code — implement when CI infra lands:
  //
  //    await execPsql(`
  //      UPDATE metadata_type SET extra_schema = jsonb_set(
  //        extra_schema, '{revenue_probability}', '0.9'::jsonb
  //      ) WHERE scope = 'pipeline_stage' AND name = 'Proposal Sent'
  //    `);

  // 3) Assert the KPI tile's text re-renders within 2 seconds.
  await expect(async () => {
    const next = await pipelineKpi.innerText();
    expect(next).not.toBe(initialText);
  }).toPass({ timeout: 2_000, intervals: [100, 200, 500] });
});
