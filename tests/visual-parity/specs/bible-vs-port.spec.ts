// change-209 — bible-vs-port visual drift harness.
//
// For each unauth surface, opens https://hotseaters.com<surface> (bible) and
// https://hotseaters-ultimate.prometheusags.ai<surface> (port) in fresh
// browser contexts, screenshots both full-page (animations disabled, caret
// hidden), diffs via pixelmatch with threshold 0.1, and emits:
//
//   tests/visual-parity/.artifacts/bible-parity/<project>/<slug>/bible.png
//   tests/visual-parity/.artifacts/bible-parity/<project>/<slug>/port.png
//   tests/visual-parity/.artifacts/bible-parity/<project>/<slug>/diff.png
//   tests/visual-parity/.artifacts/bible-parity/<project>/<slug>/drift.json
//
// Soft-asserts drift < 5%. The drift number is data — the harness ships
// regardless of current parity state. Auth surfaces deferred (Q3 of proposal).
import { test, expect, chromium } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const here = path.dirname(fileURLToPath(import.meta.url));

const PATHS = [
  // Unauth surfaces — deployed-vs-deployed drift, no session required.
  '/',
  '/Landing',
  '/Pricing',
  '/PrivacyPolicy',
  '/TermsOfService',
  '/ReferralLanding',
  '/login',
  '/accept-invite?token=fake',
  '/pending-approval',
  '/account-rejected',
];
const BIBLE = 'https://hotseaters.com';
const PORT = 'https://hotseaters-ultimate.prometheusags.ai';

for (const surface of PATHS) {
  test(`bible-vs-port drift @ ${surface}`, async ({ viewport }, testInfo) => {
    const project = testInfo.project.name;
    const slug = surface.replace(/[^a-z0-9]/gi, '_').replace(/^_|_$/g, '') || 'root';
    const artifactDir = path.join(here, '..', '.artifacts', 'bible-parity', project, slug);
    fs.mkdirSync(artifactDir, { recursive: true });

    const browser = await chromium.launch();
    try {
      const ctxA = await browser.newContext({ viewport: viewport ?? undefined });
      const pageA = await ctxA.newPage();
      await pageA.goto(BIBLE + surface, { waitUntil: 'networkidle', timeout: 30_000 });
      await pageA.waitForTimeout(500);
      const bibleBuf = await pageA.screenshot({
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
      });
      fs.writeFileSync(path.join(artifactDir, 'bible.png'), bibleBuf);
      await ctxA.close();

      const ctxB = await browser.newContext({ viewport: viewport ?? undefined });
      const pageB = await ctxB.newPage();
      await pageB.goto(PORT + surface, { waitUntil: 'networkidle', timeout: 30_000 });
      await pageB.waitForTimeout(500);
      const portBuf = await pageB.screenshot({
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
      });
      fs.writeFileSync(path.join(artifactDir, 'port.png'), portBuf);
      await ctxB.close();

      const bible = PNG.sync.read(bibleBuf);
      const port = PNG.sync.read(portBuf);

      // Normalize sizes — clip both to the smaller width/height.
      const w = Math.min(bible.width, port.width);
      const h = Math.min(bible.height, port.height);
      const a = trimTo(bible, w, h);
      const b = trimTo(port, w, h);
      const diff = new PNG({ width: w, height: h });
      const mismatchedPixels = pixelmatch(a.data, b.data, diff.data, w, h, {
        threshold: 0.1,
        includeAA: true,
      });

      fs.writeFileSync(path.join(artifactDir, 'diff.png'), PNG.sync.write(diff));
      const driftRatio = mismatchedPixels / (w * h);
      fs.writeFileSync(
        path.join(artifactDir, 'drift.json'),
        JSON.stringify(
          { surface, project, viewport, mismatchedPixels, totalPixels: w * h, driftRatio },
          null,
          2,
        ),
      );
      testInfo.annotations.push({
        type: 'drift',
        description: `${(driftRatio * 100).toFixed(2)}% mismatched @ ${surface} (${project})`,
      });

      expect.soft(driftRatio).toBeLessThan(0.05);
    } finally {
      await browser.close();
    }
  });
}

function trimTo(src: PNG, w: number, h: number): PNG {
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    src.data.copy(out.data, y * w * 4, y * src.width * 4, y * src.width * 4 + w * 4);
  }
  return out;
}
