import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// =============================================================================
// Vite config for hotseaters-ultimate
//
// HARD CONSTRAINTS (see latest-data/.kbd-orchestrator/constraints.md):
//   - Self-hosted Supabase only. VITE_SUPABASE_URL must point at either
//     http://localhost:8000 (local docker-compose) or
//     https://hotbase.prometheusags.ai (our hosted stack). Never *.supabase.co.
//   - HotSeatersMVP is the bible for product behavior.
//
// PGlite + COOP/COEP: PGlite relies on SharedArrayBuffer / OPFS for multi-tab
// persistence, which the browser only enables in a cross-origin-isolated
// context. These headers are required for dev, preview, and any reverse
// proxy fronting the production build.
// =============================================================================

const crossOriginIsolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = env.VITE_SUPABASE_URL ?? 'http://localhost:8000';

  // Guard rail: refuse to build against Supabase Cloud.
  if (/\.supabase\.co/i.test(supabaseUrl)) {
    throw new Error(
      `[hotseaters-ultimate] VITE_SUPABASE_URL points at Supabase Cloud (${supabaseUrl}). ` +
        'This project is self-hosted only. Use http://localhost:8000 or https://hotbase.prometheusags.ai.',
    );
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'HotSeaters',
          short_name: 'HotSeaters',
          description: 'Trial consulting management — local-first.',
          theme_color: '#06B6D4',
          background_color: '#f6fbfe',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,woff2}'],
          // PGlite owns durable data. The service worker only caches the app
          // shell; never cache /rest/* or /auth/* responses.
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/auth/, /^\/rest/, /^\/storage/, /^\/realtime/, /^\/functions/],
          // Default workbox limit is 2 MiB. This is a full SPA with PGlite
          // (WASM), Electric sync, dnd-kit, lucide, base-ui, supabase, etc.
          // With the single-vendor-chunk strategy below, vendor.js consolidates
          // all of node_modules into one chunk for cycle safety; that chunk
          // approaches but does not exceed a few MiB. 8 MiB is generous
          // headroom — if vendor.js ever climbs near this, that's the loud
          // build-time signal to revisit dependency footprint, not a silent
          // runtime failure mode.
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        },
      }),
    ],
    server: {
      headers: crossOriginIsolation,
      port: 5174,
      proxy: {
        // Proxy Supabase paths to the configured upstream so the SPA stays on
        // a single origin. The upstream is local docker-compose by default;
        // override via VITE_SUPABASE_URL.
        '/auth':      { target: supabaseUrl, changeOrigin: true, secure: true },
        '/rest':      { target: supabaseUrl, changeOrigin: true, secure: true },
        '/storage':   { target: supabaseUrl, changeOrigin: true, secure: true },
        '/functions': { target: supabaseUrl, changeOrigin: true, secure: true },
        '/realtime':  { target: supabaseUrl, changeOrigin: true, secure: true, ws: true },
      },
    },
    preview: {
      headers: crossOriginIsolation,
      port: 5174,
    },
    resolve: {
      dedupe: ['react', 'react-dom', 'zustand'],
      alias: {
        '@':            fileURLToPath(new URL('./src', import.meta.url)),
        '@/components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@/shared':     fileURLToPath(new URL('./src/shared', import.meta.url)),
        '@/features':   fileURLToPath(new URL('./src/features', import.meta.url)),
      },
    },
    optimizeDeps: {
      // PGlite ships its own WASM; pre-bundling breaks asset URL resolution.
      exclude: ['@electric-sql/pglite'],
    },
    build: {
      // Single-vendor-chunk strategy. Every node_modules import lands in
      // ONE chunk called `vendor`. Every src/** import lands in `index`.
      //
      // This is the only chunking shape that is mathematically immune to
      // chunk-level circular dependencies (a two-node graph index→vendor
      // cannot cycle). It is the pattern endorsed by Rollup's maintainer
      // in https://github.com/rollup/rollup/discussions/4992:
      //
      //   "manualChunks is a crude and unsafe tool... It is usually safe
      //    to put the entire node_modules into a single manual chunk
      //    because stuff in node_modules does not import from your
      //    regular code, so no danger of cycles."
      //
      // Earlier attempts to split node_modules into per-family chunks
      // (vendor-react, vendor-dnd, vendor-icons, vendor-router,
      // vendor-supabase, vendor-zustand, vendor-base-ui + a generic
      // catch-all) caused production crashes:
      //   Uncaught ReferenceError: Cannot access 'H' before initialization
      //     at vendor-Cdu5HLyV.js:12:1406
      // because packages whose transitive deps spanned the families
      // created chunk-graph triangles. Do NOT reintroduce that pattern.
      //
      // Trade-off: vendor.js is ~1.6 MB. Browser caches it across all
      // source-only changes (cache busts only when a dependency changes,
      // which is rare). Real first-paint perf comes from route-level
      // React.lazy() splitting on the source side — that is the planned
      // Phase B follow-up to this config and is orthogonal to chunking.
      rollupOptions: {
        output: {
          manualChunks: (id) => (id.includes('node_modules') ? 'vendor' : undefined),
        },
      },
      // Surface build-time warning if any single chunk grows past 2 MB.
      // Not an error — Workbox's 8 MiB limit above is the actual ceiling.
      chunkSizeWarningLimit: 2000,
    },
    worker: {
      format: 'es',
    },
    test: {
      environment: 'happy-dom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['node_modules', 'dist', 'tests/**'],
    },
  };
});
