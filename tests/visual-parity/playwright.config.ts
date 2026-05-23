// Visual-parity Playwright config. Separate from the main e2e config so the
// timeouts and snapshot dir do not bleed into smoke tests.
//
// Baselines live under tests/visual-parity/__screenshots__/baseline/.
// First run: pnpm test:visual-parity:update to capture baselines.
// Subsequent runs: pnpm test:visual-parity (fails on >0.5% pixel diff).
//
// Self-hosted Supabase only. HotSeatersMVP is the bible.
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.HU_PORT ?? 5174);
const BASE_URL = process.env.VITE_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './specs',
  snapshotDir: './__screenshots__',
  snapshotPathTemplate: '{snapshotDir}/baseline/{testFileName}/{arg}{ext}',
  fullyParallel: false, // sequential — screenshot stability
  retries: 0,
  workers: 1,
  timeout: 90_000,
  expect: {
    toHaveScreenshot: {
      // 0.5% pixel-difference tolerance per Change 10 spec.
      maxDiffPixelRatio: 0.005,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  reporter: [['html', { outputFolder: 'tests/visual-parity/.report', open: 'never' }]],
  outputDir: 'tests/visual-parity/.artifacts',
  use: {
    baseURL: BASE_URL,
    ...devices['Desktop Chrome'],
  },
  projects: [
    { name: 'desktop-1440', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'tablet-768', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'mobile-375', use: { viewport: { width: 375, height: 800 } } },
  ],
  webServer: {
    command: 'pnpm preview',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { HU_PORT: String(PORT) },
  },
});
