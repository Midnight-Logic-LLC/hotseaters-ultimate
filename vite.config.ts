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
          // Raise the precache size limit. The default 2 MiB is sized for
          // a marketing site; this is a full SPA with PGlite (WASM), Electric
          // sync, dnd-kit, lucide, etc. Code-splitting via manualChunks below
          // keeps individual chunks small in normal operation, but vendor
          // chunks (React + PGlite + Electric) can legitimately approach this
          // ceiling. 6 MiB is generous headroom; we still want CI to fail if
          // we ever go past that (something is wrong if main bundle is 6+ MiB).
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
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
      // Code-split heavy dependencies into named vendor chunks so the main
      // entry stays small. Without this, every dep ends up in `index-<hash>.js`
      // and we hit workbox's 2 MiB precache limit (see workbox config above).
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('@electric-sql/pglite')) return 'vendor-pglite';
            if (id.includes('@electric-sql')) return 'vendor-electric';
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('react-dom') || /\/react\//.test(id)) return 'vendor-react';
            if (id.includes('@dnd-kit')) return 'vendor-dnd';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('@base-ui-components')) return 'vendor-base-ui';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('zustand')) return 'vendor-zustand';
            // Everything else from node_modules → generic vendor chunk.
            return 'vendor';
          },
        },
      },
      // Raise the chunk-size warning threshold (default 500 KB) so vendor
      // chunks for PGlite/Electric don't spam the build log. The workbox
      // limit above is the real ceiling.
      chunkSizeWarningLimit: 1500,
    },
    worker: {
      format: 'es',
    },
    test: {
      environment: 'happy-dom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
    },
  };
});
