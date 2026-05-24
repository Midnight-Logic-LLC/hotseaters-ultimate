import { test, expect, chromium } from '@playwright/test';

/**
 * Production smoke test — proves the live deployed bundle does not throw
 * the chunk-cycle TDZ error class we just paid down. Run manually after
 * a deploy lands. Not in regular CI rotation (the test job's pipeline
 * doesn't currently know about this surface).
 *
 * Definition of "fixed" for change-302 of phase vite-bundling-durable-fix:
 * this spec exits 0 against https://hotseaters-ultimate.prometheusags.ai/.
 */
test('production has no TDZ at boot', async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push('console: ' + m.text());
  });
  await page.goto('https://hotseaters-ultimate.prometheusags.ai/', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await page.waitForTimeout(2000);
  await browser.close();
  errs.slice(0, 8).forEach((e) => console.log(e.slice(0, 250)));
  const tdz = errs.find((e) =>
    /Cannot access .* before initialization/.test(e),
  );
  expect(tdz, tdz || 'no TDZ').toBeUndefined();
});
