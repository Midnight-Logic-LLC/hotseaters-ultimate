// =============================================================================
// ESLint configuration for hotseaters-ultimate
//
// Enforces RULE 3 from latest-data/.kbd-orchestrator/constraints.md:
//   - Components consume hooks only (no stores, no APIs, no PGlite, no Supabase)
//   - Hooks consume stores only (no APIs, no PGlite, no Supabase)
//   - Stores own the API/sync seam (only stores and shared/db may import
//     PGlite, Electric, Supabase, or prometheus-entity-management engine/adapters)
//
// Violation = CI fail.
// =============================================================================

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';
import hotseaters from './eslint-rules/index.js';

export default tseslint.config(
  {
    ignores: ['dist', 'dist-manual', 'node_modules', 'src-tauri', '*.tsbuildinfo', 'public'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { project: false },
    },
    plugins: {
      'react-hooks': reactHooks,
      boundaries,
      hotseaters,
    },
    settings: {
      'boundaries/elements': [
        { type: 'app',          pattern: 'src/app/**' },
        { type: 'components',   pattern: 'src/components/**' },
        { type: 'feature',      pattern: 'src/features/*', mode: 'folder' },
        { type: 'feature-page',       pattern: 'src/features/*/pages/**' },
        { type: 'feature-component',  pattern: 'src/features/*/components/**' },
        { type: 'feature-hook',       pattern: 'src/features/*/hooks/**' },
        { type: 'feature-store',      pattern: 'src/features/*/stores/**' },
        { type: 'feature-business',   pattern: 'src/features/*/business-rules/**' },
        { type: 'feature-entities',   pattern: 'src/features/*/entities.ts' },
        { type: 'shared-ui',     pattern: 'src/shared/ui/**' },
        { type: 'shared-hooks',  pattern: 'src/shared/hooks/**' },
        { type: 'shared-lib',    pattern: 'src/shared/lib/**' },
        { type: 'shared-db',     pattern: 'src/shared/db/**' },
        { type: 'scripts',       pattern: 'scripts/**' },
        { type: 'test',          pattern: ['src/test/**', '**/*.test.{ts,tsx}'] },
      ],
      'boundaries/include': ['src/**/*'],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // ─── Architectural invariants (CI-enforced) ─────────────────────────
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            // App composes everything.
            { from: 'app', allow: ['components', 'shared-ui', 'shared-hooks', 'shared-lib', 'shared-db', 'feature', 'feature-page', 'feature-component', 'feature-hook', 'feature-store', 'feature-business', 'feature-entities'] },

            // Components consume hooks and shared UI only — NO stores, NO db.
            { from: 'components',        allow: ['components', 'shared-ui', 'shared-hooks', 'shared-lib'] },
            { from: 'feature-component', allow: ['components', 'shared-ui', 'shared-hooks', 'shared-lib', 'feature-hook'] },
            { from: 'feature-page',      allow: ['components', 'shared-ui', 'shared-hooks', 'shared-lib', 'feature-hook', 'feature-component'] },

            // Hooks consume stores. Hooks do NOT touch the network or PGlite directly.
            { from: 'feature-hook',  allow: ['shared-hooks', 'shared-lib', 'feature-store', 'feature-business', 'feature-entities'] },
            { from: 'shared-hooks',  allow: ['shared-lib'] },

            // Stores own the API/sync seam.
            { from: 'feature-store', allow: ['shared-lib', 'shared-db', 'feature-business', 'feature-entities'] },
            { from: 'shared-db',     allow: ['shared-lib'] },

            // Business rules are pure — no I/O at all.
            { from: 'feature-business', allow: ['shared-lib'] },
            { from: 'feature-entities', allow: ['shared-lib'] },

            // Shared UI may use shared lib.
            { from: 'shared-ui', allow: ['shared-ui', 'shared-lib'] },

            // Tests and scripts are free.
            { from: 'test',    allow: ['app', 'components', 'shared-ui', 'shared-hooks', 'shared-lib', 'shared-db', 'feature', 'feature-page', 'feature-component', 'feature-hook', 'feature-store', 'feature-business', 'feature-entities'] },
            { from: 'scripts', allow: ['shared-lib'] },
          ],
        },
      ],

      // ─── Forbid external imports outside the data seam ──────────────────
      'boundaries/external': [
        'error',
        {
          default: 'allow',
          rules: [
            // PGlite, Electric, Supabase, and entity-management graph engine
            // must only enter via shared-db or feature-store.
            {
              from: ['components', 'feature-component', 'feature-page', 'shared-ui'],
              disallow: [
                '@electric-sql/*',
                '@supabase/*',
                '@prometheus-ags/prometheus-entity-management/graph',
                '@prometheus-ags/prometheus-entity-management/engine',
                '@prometheus-ags/prometheus-entity-management/adapters/*',
              ],
              message:
                'RULE 3: Components must not import PGlite/Electric/Supabase or entity-management graph/engine/adapters. Use a hook.',
            },
            {
              from: ['feature-hook', 'shared-hooks'],
              disallow: [
                '@electric-sql/*',
                '@supabase/*',
                '@prometheus-ags/prometheus-entity-management/graph',
                '@prometheus-ags/prometheus-entity-management/engine',
                '@prometheus-ags/prometheus-entity-management/adapters/*',
              ],
              message:
                'RULE 3: Hooks must not import PGlite/Electric/Supabase or entity-management graph/engine/adapters. Use a store.',
            },
            {
              from: ['feature-business', 'feature-entities'],
              disallow: ['@electric-sql/*', '@supabase/*', '@prometheus-ags/prometheus-entity-management/*'],
              message: 'RULE 3: business-rules and entities must be pure — no I/O imports.',
            },
          ],
        },
      ],

      // ─── Sync-config ↔ RLS coherence (RULE 5) ───────────────────────────
      // Fires once on src/shared/db/sync-config.ts. Errors if any entity in
      // SYNC_CONFIG lacks a CREATE POLICY in the RLS migrations.
      'hotseaters/sync-config-rls-coherence': 'error',

      // Soft warning: discourage useState<T> for entity types.
      'hotseaters/no-server-state-in-usestate': 'warn',

      // ─── React strictness ───────────────────────────────────────────────
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ─── TypeScript strictness ──────────────────────────────────────────
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
);
