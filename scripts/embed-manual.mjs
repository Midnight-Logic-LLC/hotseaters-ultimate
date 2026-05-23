#!/usr/bin/env node
/**
 * embed-manual.mjs — ingest user-manual MDX → manual_documents / manual_chunks.
 *
 * For every non-deferred entry in content/user-manual/index.json:
 *   1. Read the MDX file, compute SHA-256 of the source.
 *   2. If manual_documents.slug already has a matching content_hash, skip.
 *   3. Otherwise: parse the MDX, walk the AST to extract plain text chunked
 *      by heading boundary (capped at ~800 tokens, with ~100-token overlap).
 *   4. Embed each chunk with OpenAI `text-embedding-3-small` (1536-dim).
 *   5. Upsert the manual_documents row, replace its manual_chunks.
 *
 * Self-hosted Supabase only. OpenAI is the only third-party API we call here
 * because it is the LLM provider, not infrastructure.
 *
 * Env:
 *   SUPABASE_URL              — must NOT match *.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — service-role JWT (writes bypass RLS)
 *   OPENAI_API_KEY            — text-embedding-3-small access
 *
 * Flags:
 *   --force      Re-embed every document even if content_hash matches.
 *   --dry-run    Skip writes; print what would happen.
 *
 * Run:
 *   node scripts/embed-manual.mjs
 *   node scripts/embed-manual.mjs --force
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const contentDir = resolve(root, 'content/user-manual')
const manifestPath = resolve(contentDir, 'index.json')

// ── Configuration ──────────────────────────────────────────────────────────
const CHUNK_MAX_TOKENS = 800
const CHUNK_OVERLAP_TOKENS = 100
const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIM = 1536
const EMBED_BATCH_SIZE = 100

// ── CLI flags ──────────────────────────────────────────────────────────────
const args = new Set(process.argv.slice(2))
const FORCE = args.has('--force')
const DRY_RUN = args.has('--dry-run')

// ── Env guard ──────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

function fail(msg) {
  console.error(`[embed-manual] ${msg}`)
  process.exit(1)
}

if (!SUPABASE_URL) fail('SUPABASE_URL not set')
if (!SUPABASE_SERVICE_ROLE_KEY) fail('SUPABASE_SERVICE_ROLE_KEY not set')
if (!OPENAI_API_KEY) fail('OPENAI_API_KEY not set')
if (/\.supabase\.co/i.test(SUPABASE_URL)) {
  fail(`Refusing to write to ${SUPABASE_URL}: self-hosted Supabase only.`)
}

// ── Utilities ──────────────────────────────────────────────────────────────

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

function stripMdxSyntax(source) {
  return source
    .replace(/^---[\s\S]*?---\n?/, '')
    .replace(/^(import|export)\s[^\n]*/gm, '')
}

/** Kebab-case slug for a heading anchor. */
function slugifyHeading(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

/**
 * Approximate token count using a word-count heuristic (~0.75 words/token →
 * tokens ≈ words * 1.3). Good enough for chunk-size budgeting; we are not
 * billed per chunk, only per embedding call.
 */
function approxTokens(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.ceil(words * 1.3)
}

/**
 * Extract plain text from an MDAST node, recursively. Tables and lists are
 * rendered as compact text; code blocks keep their content but lose syntax
 * highlighting. Anything we cannot stringify produces an empty string.
 */
function nodeToText(node) {
  if (!node) return ''
  if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? ''
  if (node.type === 'code') return '```\n' + (node.value ?? '') + '\n```'
  if (node.type === 'break') return '\n'
  if (Array.isArray(node.children)) {
    return node.children.map(nodeToText).join('')
  }
  return ''
}

/**
 * Walk the MDAST top-level children, splitting into "sections" each time a
 * heading is encountered. Each section carries:
 *   { headingPath: string[], anchor: string, text: string }
 * where `headingPath` is the chain of ancestor headings (H1→Hn) at that
 * point.
 */
function partitionByHeadings(tree, documentTitle) {
  const sections = []
  const stack = []  // [{ depth, text }, ...] active heading ancestry
  let buffer = ''

  const flush = () => {
    if (!buffer.trim()) {
      buffer = ''
      return
    }
    const path = stack.map((h) => h.text)
    const deepest = stack[stack.length - 1]
    sections.push({
      headingPath: path.length > 0 ? path : [documentTitle],
      anchor: deepest ? slugifyHeading(deepest.text) : null,
      text: buffer.trim(),
    })
    buffer = ''
  }

  for (const node of tree.children ?? []) {
    if (node.type === 'heading') {
      flush()
      const text = nodeToText(node).trim()
      while (stack.length > 0 && stack[stack.length - 1].depth >= node.depth) {
        stack.pop()
      }
      stack.push({ depth: node.depth, text })
      // Include the heading itself in the next section's text so the chunk
      // carries the topic.
      buffer = `${'#'.repeat(node.depth)} ${text}\n\n`
    } else {
      const text = nodeToText(node)
      if (text) buffer += text + '\n\n'
    }
  }
  flush()

  return sections
}

/**
 * Slice a section's text into chunks of ≤ CHUNK_MAX_TOKENS approximate
 * tokens, with CHUNK_OVERLAP_TOKENS-token overlap between consecutive
 * chunks. Splits on paragraph boundaries when possible.
 */
function chunkSection(section) {
  const paragraphs = section.text.split(/\n{2,}/).filter((p) => p.trim())
  const chunks = []
  let current = []
  let currentTokens = 0

  const flush = () => {
    if (current.length === 0) return
    const text = current.join('\n\n').trim()
    if (text) {
      chunks.push({
        ...section,
        text,
        tokens: approxTokens(text),
      })
    }
  }

  for (const para of paragraphs) {
    const t = approxTokens(para)
    if (currentTokens + t > CHUNK_MAX_TOKENS && current.length > 0) {
      flush()
      // Build the overlap tail: take the last paragraphs of the previous
      // chunk that together fit in CHUNK_OVERLAP_TOKENS.
      const overlap = []
      let overlapTokens = 0
      for (let i = current.length - 1; i >= 0; i--) {
        const ot = approxTokens(current[i])
        if (overlapTokens + ot > CHUNK_OVERLAP_TOKENS) break
        overlap.unshift(current[i])
        overlapTokens += ot
      }
      current = overlap
      currentTokens = overlapTokens
    }
    current.push(para)
    currentTokens += t
  }
  flush()

  return chunks
}

/** Compile MDX → array of chunks. */
async function chunkMdx(rawMdx, documentTitle) {
  const md = stripMdxSyntax(rawMdx)
  const processor = unified().use(remarkParse).use(remarkGfm)
  const tree = processor.parse(md)
  // We don't need any transforms — partition the parsed AST directly.
  const sections = partitionByHeadings(tree, documentTitle)
  const chunks = []
  for (const section of sections) {
    chunks.push(...chunkSection(section))
  }
  return chunks
}

// ── Supabase REST helpers (no @supabase/supabase-js dep) ───────────────────

async function sbFetch(path, init = {}) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Supabase ${init.method ?? 'GET'} ${path} → ${res.status} ${body}`)
  }
  if (res.status === 204) return null
  return res.json()
}

async function findDocumentBySlug(slug) {
  const rows = await sbFetch(
    `/manual_documents?slug=eq.${encodeURIComponent(slug)}&select=id,content_hash`,
  )
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null
}

async function upsertDocument(doc) {
  if (DRY_RUN) return { id: 'dry-run', ...doc }
  const rows = await sbFetch('/manual_documents?on_conflict=slug', {
    method: 'POST',
    headers: {
      prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify([doc]),
  })
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`Upsert of ${doc.slug} returned no rows`)
  }
  return rows[0]
}

async function deleteChunksForDocument(documentId) {
  if (DRY_RUN) return
  await sbFetch(`/manual_chunks?document_id=eq.${documentId}`, { method: 'DELETE' })
}

async function insertChunks(rows) {
  if (DRY_RUN) return
  if (rows.length === 0) return
  await sbFetch('/manual_chunks', {
    method: 'POST',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify(rows),
  })
}

// ── OpenAI embeddings ──────────────────────────────────────────────────────

async function embedBatch(inputs) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: inputs }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenAI embeddings → ${res.status} ${body}`)
  }
  const json = await res.json()
  const vectors = json.data?.map((d) => d.embedding)
  if (!Array.isArray(vectors) || vectors.length !== inputs.length) {
    throw new Error(`OpenAI returned ${vectors?.length ?? 0} vectors for ${inputs.length} inputs`)
  }
  for (const v of vectors) {
    if (!Array.isArray(v) || v.length !== EMBEDDING_DIM) {
      throw new Error(`Unexpected embedding dimension ${v?.length}; expected ${EMBEDDING_DIM}`)
    }
  }
  return vectors
}

async function embedAll(contents) {
  const out = []
  for (let i = 0; i < contents.length; i += EMBED_BATCH_SIZE) {
    const slice = contents.slice(i, i + EMBED_BATCH_SIZE)
    const vectors = await embedBatch(slice)
    out.push(...vectors)
  }
  return out
}

// ── Per-document processing ────────────────────────────────────────────────

async function processEntry(entry) {
  const slug = entry.slug
  const srcPath = resolve(contentDir, `${slug}.mdx`)
  if (!existsSync(srcPath)) {
    console.warn(`[embed-manual] WARN missing source for slug "${slug}", skipping`)
    return { status: 'missing', slug, chunks: 0 }
  }

  const raw = readFileSync(srcPath, 'utf8')
  const contentHash = sha256(raw)

  const existing = await findDocumentBySlug(slug)
  if (existing && existing.content_hash === contentHash && !FORCE) {
    console.log(`[embed-manual] unchanged: ${slug}`)
    return { status: 'skipped', slug, chunks: 0 }
  }

  const chunks = await chunkMdx(raw, entry.title)
  if (chunks.length === 0) {
    console.warn(`[embed-manual] WARN no chunks emitted for ${slug}, skipping`)
    return { status: 'empty', slug, chunks: 0 }
  }

  console.log(`[embed-manual] ${existing ? 'updating' : 'creating'}: ${slug} (${chunks.length} chunks)`)

  const vectors = await embedAll(chunks.map((c) => c.text))

  const frontmatter = {
    section: entry.section,
    lastReviewed: entry.lastReviewed,
    legacyPageId: entry.legacyPageId ?? null,
    legacyFile: entry.legacyFile ?? null,
  }

  const docRow = await upsertDocument({
    slug,
    title: entry.title,
    section: entry.section ?? null,
    tags: entry.tags ?? null,
    frontmatter,
    source_path: `content/user-manual/${slug}.mdx`,
    content_hash: contentHash,
    updated_at: new Date().toISOString(),
  })

  await deleteChunksForDocument(docRow.id)

  const rows = chunks.map((c, idx) => ({
    document_id: docRow.id,
    ord: idx,
    content: c.text,
    tokens: c.tokens,
    heading_path: c.headingPath,
    anchor: c.anchor,
    embedding: vectors[idx],
  }))

  await insertChunks(rows)

  return { status: 'embedded', slug, chunks: chunks.length }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now()
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const entries = manifest.entries.filter((e) => !e.deferred)

  console.log(
    `[embed-manual] ${entries.length} entries; force=${FORCE} dryRun=${DRY_RUN}`,
  )

  let embedded = 0
  let skipped = 0
  let missing = 0
  let chunksEmbedded = 0

  for (const entry of entries) {
    try {
      const r = await processEntry(entry)
      if (r.status === 'embedded') {
        embedded++
        chunksEmbedded += r.chunks
      } else if (r.status === 'skipped') {
        skipped++
      } else if (r.status === 'missing') {
        missing++
      }
    } catch (err) {
      console.error(`[embed-manual] ERROR ${entry.slug}:`, err instanceof Error ? err.message : err)
      process.exitCode = 1
    }
  }

  const durationMs = Date.now() - t0
  const summary = {
    documentsTotal: entries.length,
    documentsSkipped: skipped,
    documentsMissing: missing,
    documentsEmbedded: embedded,
    chunksEmbedded,
    durationMs,
  }
  console.log('[embed-manual] done:', JSON.stringify(summary))
}

main().catch((err) => {
  console.error('[embed-manual] FATAL:', err instanceof Error ? err.stack : err)
  process.exit(1)
})
