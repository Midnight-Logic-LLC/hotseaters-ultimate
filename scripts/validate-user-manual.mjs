#!/usr/bin/env node
/**
 * Build-time validator for the `/user-manual` content pipeline.
 *
 * Enforces:
 *   1. Every non-deferred manifest entry has a matching MDX file.
 *   2. Every MDX file under `content/user-manual/` is registered in the
 *      manifest (no orphan content).
 *   3. Slugs in the manifest are unique and match the kebab-slug regex.
 *
 * Exits non-zero on any violation so `pnpm build` fails fast.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const contentDir = resolve(root, 'content/user-manual')
const manifestPath = resolve(contentDir, 'index.json')

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-/]*[a-z0-9])?$/

function fail(message) {
  console.error(`[user-manual] ${message}`)
  process.exit(1)
}

if (!existsSync(manifestPath)) {
  fail(`manifest missing: ${manifestPath}`)
}

let manifest
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
} catch (error) {
  fail(`manifest is not valid JSON: ${error.message}`)
}

if (!Array.isArray(manifest.entries)) {
  fail('manifest.entries must be an array')
}

const seen = new Set()
const registered = new Set()

for (const entry of manifest.entries) {
  if (!entry || typeof entry.slug !== 'string') {
    fail(`entry missing slug: ${JSON.stringify(entry)}`)
  }
  if (!SLUG_RE.test(entry.slug)) {
    fail(`invalid slug shape: ${entry.slug}`)
  }
  if (seen.has(entry.slug)) {
    fail(`duplicate slug: ${entry.slug}`)
  }
  seen.add(entry.slug)
  registered.add(entry.slug)

  if (entry.deferred === true) {
    continue
  }

  const mdxPath = resolve(contentDir, `${entry.slug}.mdx`)
  if (!existsSync(mdxPath)) {
    fail(`non-deferred entry ${entry.slug} has no MDX file at ${mdxPath}`)
  }
}

// Orphan check: any `.mdx` file under the content dir must be registered.
const files = readdirSync(contentDir).filter((f) => f.endsWith('.mdx'))
for (const file of files) {
  const slug = file.replace(/\.mdx$/, '')
  if (!registered.has(slug)) {
    fail(`orphan MDX file has no manifest entry: ${file}`)
  }
}

console.log(
  `[user-manual] manifest OK (${manifest.entries.length} entries, ${files.length} MDX files)`,
)
