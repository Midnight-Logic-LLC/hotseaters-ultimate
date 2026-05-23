// =============================================================================
// size-limit.config.cjs — bundle budget enforcement.
//
// Run: `pnpm size` (after `pnpm build`).
// CI runs this on every PR touching src/.
//
// Budgets (web/performance.md, landing-app tier):
//   - JS gzip ≤ 180 KB
//   - CSS gzip ≤ 30 KB
//
// The brotli budgets are tighter; we report-only for now.
// =============================================================================

module.exports = [
  {
    name: 'app JS (gzip)',
    path: 'dist/assets/index-*.js',
    limit: '180 KB',
    gzip: true,
  },
  {
    name: 'app CSS (gzip)',
    path: 'dist/assets/index-*.css',
    limit: '30 KB',
    gzip: true,
  },
  {
    name: 'app JS (brotli, report-only)',
    path: 'dist/assets/index-*.js',
    limit: '160 KB',
    brotli: true,
    ignore: ['react', 'react-dom'],
  },
];
