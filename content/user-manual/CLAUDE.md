# CLAUDE.md — `content/user-manual/`

This directory is the **single source of truth** for the hotseaters-ultimate
user manual. It is content, not code.

## Hard Constraints

This directory inherits the phase-wide hard constraints. See
`/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/constraints.md`.

Critical rules restated:

1. **Self-hosted Supabase only.** Never reference `*.supabase.co`. Manual prose
   that mentions URLs uses `http://localhost:8000` (local) or
   `https://hotbase.prometheusags.ai` (hosted).
2. **HotSeatersMVP is the bible.** The Next.js corpus at
   `/Users/gqadonis/Projects/midnight/hotseaters` was the donor for the initial
   34 MDX files — but it is **prior art, not authority**. When Next.js MDX
   disagrees with MVP at
   `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/`, **MVP wins**.
   Every doc carries a `lastReviewed` date in `index.json`; bump it whenever
   you reconcile against MVP.
3. **Components → hooks → stores → APIs.** Manual MDX never imports
   application code. Treat MDX as data.

## Authoring sources

In priority order:

1. **Existing hotseaters Next.js MDX** — copied wholesale in Change 17.
   Already 34 files live here. Verify against MVP before declaring "done."
2. **Legacy `HotSeatersMVP/src/pages/Doc*.jsx`** — for any topic in
   `PORT_GAPS.md` § "To port", emit a skeleton with
   `node scripts/jsx-doc-to-mdx.mjs <legacy.jsx> > content/user-manual/<slug>.mdx`
   then hand-edit. Never publish an auto-generated file unchanged — the
   `{/* AUTO-GENERATED … REVIEW REQUIRED. */}` banner must be removed only
   after a human review pass.
3. **Customer / handoff docs** — copy relevant prose from
   `hotseaters/docs/customer-demo-handoff.md`, `BIBLE.md`, etc., when it covers
   user-facing behavior.

`PORT_GAPS.md` is the live registry of what's covered, what to port, and what
to retire. Update it whenever you add or remove entries.

## Manifest convention (`index.json`)

```jsonc
{
  "$schema": "./schema.json",
  "version": 1,
  "entries": [
    {
      "slug": "time-tracking",            // kebab-case, URL-safe, unique
      "title": "Time Tracking",           // sentence case
      "section": "per-page",              // one of: foundation | core | detailed | per-page
      "legacyFile": "DocPageTimeTracking.jsx",
      "legacyPageId": "DocPageTimeTracking", // basename without .jsx, used by jsx-doc-to-mdx.mjs
      "lastReviewed": "2026-04-22",       // ISO date; bump on every MVP reconciliation
      "deferred": false,                  // true = stub-only, not yet ready for embedding
      "tags": []                          // optional, free-form
    }
  ]
}
```

Authoring rules for the MDX itself:

- File name must equal `<slug>.mdx`. Slug is kebab-case, ASCII-only.
- Frontmatter must include at minimum `title`, `section`, `order`. Recommended:
  `tags`, `legacyPageId`.
- **No React imports inside MDX.** The pipeline is unified/remark, not
  MDX-React. Custom components are not available; plain markdown only, plus
  HTML escape hatches where unavoidable.
- Headings start at `# Title` (H1) and stair-step. The compiler emits
  `rehype-slug` IDs so the manual UI can anchor-link.
- Code blocks use fenced triple backticks with a language tag for syntax
  highlighting (`rehype-highlight`).
- Tables use GFM syntax (`remark-gfm`).
- Internal cross-links: `[Time tracking](./time-tracking.mdx)` — the validator
  resolves these against `index.json`.

## Build pipeline

Owned by Change 17 scripts in the sibling `scripts/` directory:

1. `scripts/compile-user-manual-fragments.mjs`
   - Walks every `*.mdx` here.
   - Runs through `unified` → `remark-parse` → `remark-gfm` → `remark-rehype`
     → `rehype-slug` → `rehype-autolink-headings` → `rehype-highlight` →
     `rehype-stringify`.
   - Emits two files per slug:
     - `public/manual/<slug>.html` — pre-rendered HTML fragment for runtime
       fetch by `<ManualPage slug=…>` in the app.
     - `public/manual/<slug>.json` — `{ frontmatter, headings, text,
       content_hash }`. This JSON is what the **Change 18** embedding pipeline
       (`scripts/embed-manual.mjs`) consumes to produce `manual_chunks` rows
       with pgvector embeddings.
2. `scripts/validate-user-manual.mjs`
   - Validates frontmatter against `schema.json`.
   - Confirms every `index.json` entry has a corresponding `*.mdx` file and
     vice versa.
3. `scripts/validate-user-manual-links.mjs`
   - Resolves every internal link target.
4. `scripts/copy-user-manual-runtime.mjs`
   - Copies the manifest + compiled HTML/JSON into the Vite build output.

All four scripts are read-only against this directory. They never mutate MDX.

## Forward reference: Change 18 (RAG ingestion)

Change 18 builds the embedding pipeline that turns these MDX files into
`manual_documents` + `manual_chunks` rows in the self-hosted Supabase pgvector
schema. The pipeline:

- Reads `public/manual/<slug>.json` (output of step 1 above).
- Computes `content_hash`; skips unchanged documents.
- Chunks by heading boundary, ≤ 800 tokens per chunk, 100-token overlap.
- Calls OpenAI `text-embedding-3-small` (1536-dim).
- Upserts via a Supabase Edge Function (`embed-manual`).
- Public read access on `manual_documents` / `manual_chunks` via RLS; writes
  service-role only.

Authoring discipline matters because the RAG consumer (`example-app`'s chat,
shipped in Change 18) cites chunks back to `/manual/<slug>#<heading>`. Bad
heading hierarchy = bad citations.

## Linked references

- Phase constraints: `../../latest-data/.kbd-orchestrator/constraints.md`
- Phase plan, §0.13: `../../latest-data/.kbd-orchestrator/phases/hotseaters-pglite-port/plan.md`
- Port gaps registry: `./PORT_GAPS.md`
- MVP source (the bible): `/Users/gqadonis/Projects/courtroom/HotSeatersMVP`
- Next.js prior art (reference only): `/Users/gqadonis/Projects/midnight/hotseaters`
