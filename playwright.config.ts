// Playwright config for hotseaters-ultimate e2e tests.
//
// Hard Constraints (from latest-data/.kbd-orchestrator/constraints.md):
//   - Self-hosted Supabase only. Tests run against localhost:8000 (docker-compose)
//     or https://hotbase.prometheusags.ai. Never *.supabase.co.
//   - HotSeatersMVP is the bible.
//
// Three projects: desktop chromium, mobile chrome (Pixel 5), mobile webkit (iPhone 13).
// Visual-parity tests live in a separate config at tests/visual-parity/playwright.config.ts.
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.HU_PORT ?? 5174);
const BASE_URL = process.env.VITE_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['html', { open: 'never' }], ['list']],
  outputDir: 'tests/e2e/.artifacts',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'pnpm preview',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      HU_PORT: String(PORT),
    },
  },
});
