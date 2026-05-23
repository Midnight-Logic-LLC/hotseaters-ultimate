#!/usr/bin/env node
/**
 * Link-integrity validator for the `/user-manual` content pipeline
 * (change-535 contract).
 *
 * Scans every `.mdx` file under `content/user-manual/` for:
 *   1. Markdown links of shape `](/user-manual/<slug>...)`
 *   2. `hx-get="/user-manual/fragments/<slug>"` attributes
 *   3. Plain anchor hrefs of shape `href="/user-manual/<slug>...`
 *
 * For each referenced slug, verifies a matching manifest entry exists
 * (active OR `deferred: true`). Fails fast on the first unknown slug
 * so `pnpm build` breaks before shipping dead links.
 *
 * Anchor-only links (`#section`), mailto:, external http(s), and the
 * root `/user-manual` / `/user-manual/` paths are ignored. Downloads
 * pointing at `/user-manual/<slug>/download.md` are resolved to their
 * base slug.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const contentDir = resolve(root, 'content/user-manual')
const manifestPath = resolve(contentDir, 'index.json')

function fail(message) {
  console.error(`[user-manual:links] ${message}`)
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

const known = new Set(manifest.entries.map((e) => e.slug))

// Capture any `/user-manual/...` URL in links, hx-get, href, etc.
// Group 1 = the path tail after `/user-manual/`. Includes `.` so
// `/download.md` is captured in full and stripped before slug lookup.
const URL_RE = /\/user-manual\/([a-z0-9][a-z0-9\-/.]*)/g

const files = readdirSync(contentDir).filter((f) => f.endsWith('.mdx'))
if (files.length === 0) {
  console.log('[user-manual:links] no MDX files to scan')
  process.exit(0)
}

const violations = []
let scanned = 0

for (const file of files) {
  const filePath = resolve(contentDir, file)
  const source = readFileSync(filePath, 'utf8')
  scanned += 1

  for (const match of source.matchAll(URL_RE)) {
    const tail = match[1]
    if (!tail) continue

    // Strip trailing `/download.md` (downloads resolve to base slug).
    let slug = tail.replace(/\/download\.md$/, '')
    // Strip trailing slash.
    slug = slug.replace(/\/+$/, '')
    // Strip any fragment or query that slipped through.
    slug = slug.split('#')[0].split('?')[0]

    if (!slug) continue // bare `/user-manual/`
    if (known.has(slug)) continue

    violations.push({ file, slug, context: match[0] })
  }
}

if (violations.length > 0) {
  for (const v of violations) {
    console.error(
      `[user-manual:links] ${v.file}: unknown slug "${v.slug}" (matched "${v.context}")`,
    )
  }
  fail(
    `${violations.length} dead link(s) across ${scanned} MDX file(s). ` +
      `Register the slug in content/user-manual/index.json (use "deferred": true for stubs).`,
  )
}

console.log(
  `[user-manual:links] link-integrity OK (${scanned} MDX file(s), ${known.size} manifest slug(s))`,
)
