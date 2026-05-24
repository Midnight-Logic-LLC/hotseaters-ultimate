/**
 * font-diagnostic.spec.ts — TEMPORARY diagnostic that reports computed
 * font-family for body + buttons across pages. Removed after the
 * visual-parity-and-rule-a-paydown phase verification gate passes.
 */
import { test, expect } from '@playwright/test';

const PAGES = ['/', '/login', '/Approvals'];

test.describe('font-diagnostic — verify Montserrat across pages', () => {
  for (const path of PAGES) {
    test(`reports fonts on ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      const report = await page.evaluate(() => {
        const body = document.body;
        const root = document.documentElement;
        const rootStyle = getComputedStyle(root);
        const buttons = Array.from(document.querySelectorAll('button')).slice(0, 3);
        return {
          url: location.href,
          bodyFamily: getComputedStyle(body).fontFamily,
          rootThemeFontBody: rootStyle.getPropertyValue('--theme-font-body').trim(),
          buttonFamilies: buttons.map((b) => getComputedStyle(b).fontFamily),
        };
      });
      console.log(`\n=== ${path} ===\n${JSON.stringify(report, null, 2)}`);
      expect(report.bodyFamily.toLowerCase()).toContain('montserrat');
      for (const fam of report.buttonFamilies) {
        expect(fam.toLowerCase()).toContain('montserrat');
      }
    });
  }
});
