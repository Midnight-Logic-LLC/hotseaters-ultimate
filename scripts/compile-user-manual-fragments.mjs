#!/usr/bin/env node
/**
 * Build-time compiler for user-manual MDX → static HTML fragments.
 *
 * For every non-deferred entry in content/user-manual/index.json:
 *   1. Read content/user-manual/<slug>.mdx
 *   2. Strip frontmatter and MDX-specific import/export lines
 *   3. Run through the unified/remark/rehype pipeline
 *   4. Write to public/user-manual/fragments/<slug>.html
 *
 * The fragment route handler (src/app/(authenticated)/user-manual/fragments/[slug]/route.ts)
 * simply reads these pre-built files — zero runtime compilation cost.
 *
 * Run:
 *   node scripts/compile-user-manual-fragments.mjs
 *
 * Automatically run as part of `pnpm build` via the prebuild script.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const contentDir = resolve(root, 'content/user-manual')
const manifestPath = resolve(contentDir, 'index.json')
const outputDir = resolve(root, 'public/user-manual/fragments')

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
  .use(rehypeHighlight)
  .use(rehypeStringify, { allowDangerousHtml: true })

function stripMdxSyntax(source) {
  return source
    .replace(/^---[\s\S]*?---\n?/, '')           // frontmatter
    .replace(/^(import|export)\s[^\n]*/gm, '')   // MDX import/export
}

async function compileSlug(slug) {
  const srcPath = resolve(contentDir, `${slug}.mdx`)
  if (!existsSync(srcPath)) {
    console.warn(`[user-manual] WARNING: missing source for slug "${slug}", skipping`)
    return
  }

  const raw = readFileSync(srcPath, 'utf8')
  const md = stripMdxSyntax(raw)
  const vfile = await processor.process(md)
  const body = String(vfile)

  const html = `<article class="prose prose-neutral dark:prose-invert max-w-none" data-user-manual-slug="${slug}">\n${body}\n</article>`
  const outPath = resolve(outputDir, `${slug}.html`)
  writeFileSync(outPath, html, 'utf8')
}

async function main() {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const entries = manifest.entries.filter((e) => !e.deferred)

  mkdirSync(outputDir, { recursive: true })

  console.log(`[user-manual] Compiling ${entries.length} fragment(s) → public/user-manual/fragments/`)

  const results = await Promise.allSettled(entries.map((e) => compileSlug(e.slug)))

  let failures = 0
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    const slug = entries[i].slug
    if (r.status === 'rejected') {
      console.error(`[user-manual] ERROR compiling "${slug}": ${r.reason?.message ?? r.reason}`)
      failures++
    } else {
      console.log(`[user-manual]   ✓ ${slug}`)
    }
  }

  if (failures > 0) {
    console.error(`[user-manual] ${failures} fragment(s) failed to compile.`)
    process.exit(1)
  }

  console.log(`[user-manual] Done. ${entries.length} fragment(s) written.`)
}

main().catch((err) => {
  console.error('[user-manual] Fatal:', err)
  process.exit(1)
})
