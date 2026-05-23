#!/usr/bin/env node
/**
 * dockerize-deps.mjs — rewrite the workspace `link:` reference to a `file:`
 * reference pointing at the vendored `prometheus-entity-management` dist.
 *
 * Run inside the docker build. Idempotent: if package.json is already
 * patched (i.e. the dep is already a `file:vendor/...` ref), exits 0.
 *
 * Rationale: the workspace setup uses
 *   "@prometheus-ags/prometheus-entity-management":
 *     "link:../latest-data/packages/prometheus-entity-management"
 * which only resolves when the sibling repo is in the build context. Image
 * builds use a single-repo context and consume the library's pre-built dist.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const PKG_PATH = resolve(process.cwd(), 'package.json');
const VENDOR_PATH = 'file:./vendor/prometheus-entity-management';
const DEP_NAME = '@prometheus-ags/prometheus-entity-management';

if (!existsSync(PKG_PATH)) {
  console.error('[dockerize-deps] package.json not found at', PKG_PATH);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
const current = pkg.dependencies?.[DEP_NAME];

if (!current) {
  console.error(`[dockerize-deps] dependency ${DEP_NAME} not found`);
  process.exit(1);
}

if (current === VENDOR_PATH) {
  console.log('[dockerize-deps] already vendored — no-op');
  process.exit(0);
}

if (!current.startsWith('link:') && !current.startsWith('workspace:')) {
  console.error(`[dockerize-deps] dependency reference is unexpected: ${current}`);
  console.error('[dockerize-deps] aborting — refusing to overwrite');
  process.exit(1);
}

pkg.dependencies[DEP_NAME] = VENDOR_PATH;
writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
console.log(`[dockerize-deps] rewrote ${DEP_NAME}: ${current} → ${VENDOR_PATH}`);
