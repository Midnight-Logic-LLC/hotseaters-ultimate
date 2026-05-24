// Bible-vs-port visual harness config (change-209).
//
// Loads hotseaters.com (bible) and hotseaters-ultimate.prometheusags.ai (port)
// in separate browser contexts, captures full-page PNGs, diffs via pixelmatch,
// and writes A/B/diff + drift.json under tests/visual-parity/.artifacts/bible-parity/.
//
// Separate from the local visual-parity config — that one snapshots a single
// local dev server. This one drives two remote URLs in parallel.
//
// Self-hosted Supabase only. HotSeatersMVP is the bible (RULE 0 pixel parity).
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  testMatch: /bible-vs-port\.spec\.ts/,
  timeout: 60_000,
  fullyParallel: false, // sequential — keeps artifact paths tidy
  workers: 1,
  reporter: [
    ['list'],
    // outputFolder + outputDir are resolved relative to the config file's directory.
    ['html', { outputFolder: '.artifacts/bible-parity-html', open: 'never' }],
  ],
  outputDir: '.artifacts/bible-parity-output',
  use: {
    headless: true,
    screenshot: 'off',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone SE'], viewport: { width: 375, height: 667 } },
    },
  ],
});
