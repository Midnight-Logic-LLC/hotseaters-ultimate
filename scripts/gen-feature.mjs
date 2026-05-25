#!/usr/bin/env node
/**
 * gen-feature.mjs — scaffold a new feature module under `src/features/<name>/`.
 *
 * Usage:
 *   pnpm gen:feature <name>             # e.g. pnpm gen:feature attorneys
 *
 * Refuses to overwrite an existing directory. Node stdlib only.
 *
 * Hard constraints (carried into every generated stub):
 *   - Self-hosted Supabase only.
 *   - HotSeatersMVP is the bible.
 *   - Components → hooks → stores → APIs.
 *
 * See docs/FEATURE-TEMPLATE.md for the full add-a-feature checklist.
 */

import { mkdirSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
const rawName = args[0];

function die(msg) {
  process.stderr.write(`gen:feature: ${msg}\n`);
  process.exit(1);
}

if (!rawName) die('missing feature name. usage: pnpm gen:feature <name>');
if (!/^[a-z][a-z0-9-]*$/.test(rawName))
  die(`invalid feature name "${rawName}". use lowercase kebab-case (e.g. "attorneys").`);

const featureName = rawName; // kebab-case slug used for the directory + URL
const pascal = featureName
  .split('-')
  .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
  .join('');
const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);
// crude singular: drop trailing 's' if present; user can edit
const singularPascal = pascal.endsWith('s') ? pascal.slice(0, -1) : pascal;
const featureDir = resolve(REPO_ROOT, 'src', 'features', featureName);

if (existsSync(featureDir)) {
  die(`refusing to overwrite existing directory: ${featureDir}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// templates
// ─────────────────────────────────────────────────────────────────────────────

const HEADER = `// Self-hosted Supabase only. HotSeatersMVP is the bible.
// Components → hooks → stores → APIs.
`;

const claudeMd = `# \`src/features/${featureName}\` — ${featureName} vertical slice

Self-hosted Supabase only. HotSeatersMVP is the bible. Components → hooks → stores → APIs.

## Responsibility

TODO: describe the aggregate this feature owns (which entities, which UI flows).

The functional bible is \`/Users/gqadonis/Projects/courtroom/HotSeatersMVP/\` —
look for the matching legacy page(s) and components. Field labels, ordering,
behavior MUST match MVP unless the plan explicitly says otherwise.

## Boundaries

- \`entities.ts\` — registers JSON Schemas with \`prometheus-entity-management\`.
  **No I/O.** Idempotent.
- \`business-rules/*\` — pure functions. Unit-tested under \`__tests__/\`.
- \`stores/*\` — the ONLY layer in this feature that may import PGlite,
  Electric, Supabase, or \`prometheus-entity-management/{engine,adapters}\`.
- \`hooks/*\` — consume stores; surface \`useEntity*\`, \`useEntityCRUD\`,
  \`useEntityView\` to components. No fetch / supabase / PGlite.
- \`components/*\` and \`pages/*\` — consume hooks only. No store imports.

## Sync tier

TODO: confirm the tier in \`src/shared/db/sync-config.ts\`. If this feature
introduces a Tier-C entity, document it here AND keep it out of
\`sync-config.ts\`.

## See also

- \`/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/constraints.md\`
- \`/Users/gqadonis/Projects/midnight/hotseaters-ultimate/CLAUDE.md\`
- \`/Users/gqadonis/Projects/midnight/hotseaters-ultimate/docs/FEATURE-TEMPLATE.md\`
- \`/Users/gqadonis/Projects/courtroom/HotSeatersMVP\` — the bible
`;

const entitiesTs = `${HEADER}/**
 * entities.ts — register the ${featureName} aggregate with the entity graph.
 *
 * No I/O. Idempotent. Imported once at app start.
 */

import {
  registerEntityJsonSchema,
  registerSchema,
} from '@prometheus-ags/prometheus-entity-management';

let registered = false;

export function register${pascal}Entities(): void {
  if (registered) return;
  registered = true;

  // TODO: replace placeholder schema with the real columns from
  // local-schema.sql (run \`pnpm gen:pglite-schema\` first).
  registerEntityJsonSchema({
    entityType: '${singularPascal}',
    schema: {
      type: 'object',
      additionalProperties: true,
      properties: {
        id: { type: 'string' },
        legacy_id: { type: ['string', 'null'] },
        company_id: { type: 'string' },
        created_at: { type: ['string', 'null'] },
        updated_at: { type: ['string', 'null'] },
        is_sample: { type: 'boolean' },
      },
      required: ['id', 'company_id'],
    },
  });

  // TODO: declare CRUD relations so cascadeInvalidation fires correctly.
  registerSchema({
    type: '${singularPascal}',
    relations: {},
  });
}
`;

const storeTs = `${HEADER}/**
 * ${featureName}-store.ts — the ONLY layer in this feature allowed to import
 * PGlite / Electric / Supabase / entity-management engine modules.
 *
 * Hooks talk to this store via \`useEntity*\` from
 * \`@prometheus-ags/prometheus-entity-management\`. Never call this module
 * from a component.
 */

// TODO: import from \`@/shared/db/*\` (pglite-client, supabase-client,
// electric-sync) and wire the entity graph for this feature.

export const ${camel}StoreReady = false;
`;

const hookTs = `${HEADER}/**
 * use-${featureName}-list.ts — first hook for this feature. Add siblings as
 * the UI demands.
 */

import { useEntityList } from '@prometheus-ags/prometheus-entity-management';

export function use${pascal}List() {
  // TODO: pass real query options (companyId scoping, sort, filter).
  return useEntityList('${singularPascal}');
}
`;

const pageTsx = `${HEADER}/**
 * ${pascal}ListPage.tsx — route component for /${featureName}.
 *
 * Consume hooks only. No store, no fetch, no supabase, no PGlite.
 */

import { use${pascal}List } from '../hooks/use-${featureName}-list';

export default function ${pascal}ListPage() {
  const list = use${pascal}List();
  return (
    <section aria-labelledby="${featureName}-heading">
      <h1 id="${featureName}-heading">${pascal}</h1>
      {/* TODO: render list. items length: */}
      <p>{String(list?.data?.length ?? 0)} items</p>
    </section>
  );
}
`;

const componentTsx = `${HEADER}/**
 * ${pascal}Row.tsx — feature component. Consumes hooks only.
 */

import type { ReactNode } from 'react';

export interface ${pascal}RowProps {
  children?: ReactNode;
}

export function ${pascal}Row({ children }: ${pascal}RowProps) {
  return <div className="flex items-center gap-2 py-2">{children}</div>;
}
`;

const businessRuleTs = `${HEADER}/**
 * placeholder.ts — pure business rule. No I/O. Unit-tested.
 */

export function placeholder(input: string): string {
  return input.trim();
}
`;

const businessRuleTestTs = `${HEADER}import { describe, it, expect } from 'vitest';
import { placeholder } from '../placeholder';

describe('${featureName} / placeholder', () => {
  it('trims whitespace', () => {
    expect(placeholder('  hi  ')).toBe('hi');
  });
});
`;

const _GITKEEP = '';

// ─────────────────────────────────────────────────────────────────────────────
// write
// ─────────────────────────────────────────────────────────────────────────────

const files = [
  ['CLAUDE.md', claudeMd],
  ['entities.ts', entitiesTs],
  [`stores/${featureName}-store.ts`, storeTs],
  [`hooks/use-${featureName}-list.ts`, hookTs],
  [`pages/${pascal}ListPage.tsx`, pageTsx],
  [`components/${pascal}Row.tsx`, componentTsx],
  ['business-rules/placeholder.ts', businessRuleTs],
  ['business-rules/__tests__/placeholder.test.ts', businessRuleTestTs],
];

mkdirSync(featureDir, { recursive: true });
for (const [relPath, body] of files) {
  const target = join(featureDir, relPath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, body, 'utf8');
}

// Pretty-print the resulting tree.
function tree(dir, prefix = '') {
  const entries = readdirSync(dir).sort();
  const lines = [];
  entries.forEach((entry, i) => {
    const last = i === entries.length - 1;
    const branch = last ? '└── ' : '├── ';
    const full = join(dir, entry);
    const isDir = statSync(full).isDirectory();
    lines.push(`${prefix}${branch}${entry}${isDir ? '/' : ''}`);
    if (isDir) {
      lines.push(tree(full, prefix + (last ? '    ' : '│   ')));
    }
  });
  return lines.filter(Boolean).join('\n');
}

process.stdout.write(
  `gen:feature ✓ scaffolded ${featureName}\n` +
    `${relative(REPO_ROOT, featureDir)}/\n` +
    `${tree(featureDir)}\n` +
    `\nNext steps (see docs/FEATURE-TEMPLATE.md):\n` +
    `  1. Add the entity to src/shared/db/sync-config.ts (decide tier).\n` +
    `  2. pnpm gen:pglite-schema\n` +
    `  3. Add RLS policies in latest-data/supabase/migrations/.\n` +
    `  4. Call register${pascal}Entities() from src/app/app-providers.tsx.\n` +
    `  5. Add the route to src/app/app-router.tsx (with <RoleGuard>).\n` +
    `  6. Replace TODOs in entities.ts, stores/, hooks/.\n` +
    `  7. pnpm typecheck && pnpm lint && pnpm test\n`,
);
