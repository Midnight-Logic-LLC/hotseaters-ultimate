#!/usr/bin/env node
/**
 * dockerize-deps.mjs — rewrite the workspace `workspace:` reference to the
 * published npm version of prometheus-entity-management.
 *
 * Run inside the docker build. Idempotent: if package.json is already
 * patched (i.e. the dep is already the npm version ref), exits 0.
 *
 * Rationale: the workspace setup uses `workspace:*` which only resolves when
 * the git submodule at packages/prometheus-entity-management is present. Image
 * builds use a single-repo context and install from the npm registry instead.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const PKG_PATH = resolve(process.cwd(), 'package.json');
const NPM_VERSION = '2.0.0';
const NPM_REF = `^${NPM_VERSION}`;
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

if (current === NPM_REF) {
  console.log('[dockerize-deps] already using npm ref — no-op');
  process.exit(0);
}

if (!current.startsWith('link:') && !current.startsWith('workspace:')) {
  console.error(`[dockerize-deps] dependency reference is unexpected: ${current}`);
  console.error('[dockerize-deps] aborting — refusing to overwrite');
  process.exit(1);
}

pkg.dependencies[DEP_NAME] = NPM_REF;
writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
console.log(`[dockerize-deps] rewrote ${DEP_NAME}: ${current} → ${NPM_REF}`);
