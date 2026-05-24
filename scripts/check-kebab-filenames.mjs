#!/usr/bin/env node
/**
 * scripts/check-kebab-filenames.mjs
 *
 * Enforces RULE A (kebab-case filenames) across `src/**`.
 *
 * - Exits 0 when every .ts/.tsx file under src/ has a kebab-case basename.
 * - Exits 1 with a list of violators otherwise.
 *
 * Why this exists (LESSONS.md 2026-05-24):
 *   RULE A was codified in CLAUDE.md + AGENTS.md, but during the
 *   auth-registration-onboarding-parity phase I (the agent) silently
 *   edited PascalCase files instead of renaming them. The fix is to make
 *   the rule unforgeable by failing CI / pre-commit instead of relying on
 *   recall. Run via `pnpm check:filenames` and as a Stop-hook.
 *
 * Exemptions:
 *   - Files inside `src/components/ui/` follow shadcn's kebab convention
 *     already; no exemption needed there.
 *   - The script intentionally only scans `src/**` so vendor + generated
 *     code isn't false-flagged.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SRC = join(ROOT, 'src');

const SOURCE_EXTS = new Set(['.ts', '.tsx']);
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+)+$/;

/**
 * Pre-existing PascalCase files that landed before this guard was added.
 * Listed here so the check passes today while still failing on any NEW
 * PascalCase file. Each line is a "credit card debt" item — pay it off by
 * `git mv`-ing the file to kebab-case + updating imports, then remove the
 * entry from this list. NEVER add new entries.
 */
const KNOWN_VIOLATIONS = new Set([
]);

/** Walk every file under dir. */
function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      yield* walk(full);
    } else if (st.isFile()) {
      yield full;
    }
  }
}

const violations = [];
const knownButFixed = [];
for (const file of walk(SRC)) {
  const name = basename(file);
  // Only check .ts/.tsx source files.
  const dot = name.lastIndexOf('.');
  if (dot === -1) continue;
  const ext = name.slice(dot);
  if (!SOURCE_EXTS.has(ext)) continue;
  const rel = relative(ROOT, file);
  if (!KEBAB.test(name)) {
    if (!KNOWN_VIOLATIONS.has(rel)) {
      violations.push(rel);
    }
  } else if (KNOWN_VIOLATIONS.has(rel)) {
    // File got renamed but the allowlist entry was not cleaned up.
    knownButFixed.push(rel);
  }
}

if (knownButFixed.length > 0) {
  console.error(
    `✗ check:filenames — ${knownButFixed.length} entries in KNOWN_VIOLATIONS no longer match an actual file. Remove them from scripts/check-kebab-filenames.mjs:`,
  );
  for (const v of knownButFixed) console.error(`  ${v}`);
  process.exit(1);
}

if (violations.length === 0) {
  console.log(`✓ check:filenames — all ${SOURCE_EXTS.size}-ext files under src/ are kebab-case`);
  process.exit(0);
}

console.error(`✗ check:filenames — ${violations.length} PascalCase / camelCase filename(s) detected:`);
for (const v of violations) {
  console.error(`  ${v}`);
}
console.error(
  '\nFix: `git mv` each violating file to a kebab-case basename, update all import sites,\n' +
    'then re-run `pnpm typecheck && pnpm check:filenames`.\n' +
    'See RULE A in CLAUDE.md, docs/LESSONS.md (2026-05-24 entry).',
);
process.exit(1);
