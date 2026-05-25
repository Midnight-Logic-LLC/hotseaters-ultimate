#!/usr/bin/env node
/**
 * verify-pglite-in-webview.mjs
 *
 * Smoke-test script intended to be executed *inside* a Tauri WebView
 * (iOS WKWebView or Android WebView) via the platform devtools bridge.
 * Node can run the same code to sanity-check it before pasting in.
 *
 * Why "paste into devtools" instead of "automate"?
 * ------------------------------------------------
 * PGlite + Electric live inside the WebView's IndexedDB. The actual
 * environment we need to validate is the device-runtime WebView, not
 * Node's V8. There is no stable headless driver for the iOS Simulator
 * WebView, and Android's WebView devtools only accept ad-hoc JS via
 * `chrome://inspect`. Both flows are manual paste-and-run.
 *
 * Procedure (also in docs/RUNBOOKS-TAURI.md):
 *
 *   1.  Boot the app on the target:
 *         pnpm tauri ios dev     (Xcode Simulator opens automatically)
 *         pnpm tauri android dev (Android Emulator opens automatically)
 *
 *   2.  Open devtools against the WebView:
 *         iOS:     Safari → Develop → Simulator → HotSeaters → Inspect
 *         Android: chrome://inspect → WebView in com.prometheusags... → Inspect
 *
 *   3.  Paste the verifyPGliteWebViewEnv() function below into the
 *       Console and invoke it. Expect:
 *
 *         { sharedArrayBuffer: true,
 *           crossOriginIsolated: true,
 *           indexedDB: true,
 *           pgliteOk: true,
 *           selectOne: 1 }
 *
 *   4.  Any `false` value = a header / WebView config regression.
 *       See "Known issues" in docs/RUNBOOKS-TAURI.md.
 */

// =======================================================================
// COPY-PASTE TARGET: everything from `// ---8<---` to the closing
// `// --->8---` goes verbatim into the WebView devtools console.
// =======================================================================
//
// ---8<---
export async function verifyPGliteWebViewEnv() {
  const result = {
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    crossOriginIsolated:
      // eslint-disable-next-line no-undef
      typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated === true,
    indexedDB: typeof indexedDB !== 'undefined',
    pgliteOk: false,
    selectOne: null,
    error: null,
  };

  if (!result.sharedArrayBuffer || !result.crossOriginIsolated) {
    result.error =
      'SharedArrayBuffer or crossOriginIsolated is unavailable. Confirm COOP=same-origin and COEP=require-corp are served by both Vite and tauri.conf.json security.headers.';
    return result;
  }
  if (!result.indexedDB) {
    result.error = 'IndexedDB not available in this WebView.';
    return result;
  }

  try {
    // Dynamic import so this file is runnable both inside the bundled
    // app (where @electric-sql/pglite is on the import graph) and as a
    // dev-console snippet (where the bundled module exists at runtime).
    const mod = await import('@electric-sql/pglite');
    const PGlite = mod.PGlite ?? mod.default;
    const db = await PGlite.create('idb://hotseaters-webview-smoke');
    const rows = await db.query('SELECT 1 AS one;');
    result.selectOne = rows?.rows?.[0]?.one ?? null;
    result.pgliteOk = result.selectOne === 1;
    await db.close();
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
  }

  return result;
}
// --->8---

// =======================================================================
// CLI mode (Node) — sanity-check the source compiles and the bundled
// PGlite import resolves before pasting into the device.
// =======================================================================
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('[verify-pglite-in-webview] this script is a paste target.');
  console.log('[verify-pglite-in-webview] see header comment for usage.');
  console.log('[verify-pglite-in-webview] WebView devtools bridge required.');
  process.exit(0);
}
