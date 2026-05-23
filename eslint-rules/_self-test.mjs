// =============================================================================
// eslint-rules/_self-test.mjs — smoke-test the local ESLint rules.
//
// Invoked via `pnpm lint:rules`. Loads the plugin, runs ESLint
// programmatically over `src/shared/db/sync-config.ts`, and verifies that the
// sync-config-rls-coherence rule completes cleanly (no missing-policy errors)
// against the current RLS migration in `../latest-data`.
//
// Run from the repo root:
//   $ pnpm lint:rules
// Exits non-zero on failure so CI catches drift.
// =============================================================================

import { ESLint } from 'eslint';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import plugin from './index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const target = path.join(repoRoot, 'src/shared/db/sync-config.ts');

const eslint = new ESLint({
  overrideConfigFile: true,
  cwd: repoRoot,
  overrideConfig: [
    {
      files: ['**/*.ts'],
      languageOptions: {
        parser: (await import('typescript-eslint')).parser,
        parserOptions: { project: false, ecmaVersion: 'latest', sourceType: 'module' },
      },
      plugins: { hotseaters: plugin },
      rules: { 'hotseaters/sync-config-rls-coherence': 'error' },
    },
  ],
});

const results = await eslint.lintFiles([target]);
const formatter = await eslint.loadFormatter('stylish');
const output = formatter.format(results);
if (output) {
  console.log(output);
}
const errors = results.reduce((n, r) => n + r.errorCount, 0);
if (errors > 0) {
  console.error(`\n[lint:rules] FAILED — ${errors} sync↔RLS coherence error(s).`);
  process.exit(1);
}
console.log('[lint:rules] OK — sync-config ↔ RLS coherence verified.');
