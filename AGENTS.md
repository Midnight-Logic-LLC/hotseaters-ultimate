# AGENTS.md

This file is read by any AI coding agent that operates in this repository
(Claude Code, Cursor, Roo, Cline, Codex, Aider, etc.).

**Before doing anything, read [`CLAUDE.md`](./CLAUDE.md) in full.** Every rule
in CLAUDE.md applies to every agent.

## Short version (full text in CLAUDE.md)

### Bible + architectural rules

0. **RULE 0 — Pixel parity with HotSeatersMVP is the project.** Every page
   must be visually indistinguishable from the bible side-by-side at the
   same viewport. Every CSS rule, font, color, spacing, copy string, icon,
   panel, tab, dialog, animation, word, AND business rule must match.
   Wrong copy / colors / sections / fonts / calculations are blocking
   defects.
1. **Self-hosted Supabase only.** `localhost:8000` or `hotbase.prometheusags.ai`.
   Never `*.supabase.co`.
2. **HotSeatersMVP is the bible.** `midnight/hotseaters` is prior art only.
3. **Components → hooks → stores → APIs.** Enforced by ESLint.
4. **Tauri mobile is primary.** Touch ≥ 44pt, bottom-tab + drawer.
5. **PGlite has no RLS** — Electric shapes mirror server RLS.
6. **`user_info.auth_user_id` bridges to `auth.users(id)`.**
7. **Docs are content (MDX), not pages.**
8. **No secrets in git.** `.env` is gitignored.

### Immutable code rules (RULES A–J)

- **A.** Kebab-case filenames everywhere (`landing-page.tsx`).
- **B.** Components → hooks only (no store imports in components).
- **C.** Hooks → stores only (no fetch/supabase/electric in hooks).
- **D.** Stores own all I/O.
- **E.** `@prometheus-ags/prometheus-entity-management` instead of
  TanStack Query for server-object client management.
- **F.** Feature-based clean architecture
  (`src/features/<x>/{pages,components,hooks,stores,entities,business-rules}`).
- **G.** shadcn/ui primitives over raw HTML where one exists.
- **H.** Base UI v1 (`@base-ui-components/react`) instead of Radix.
- **I.** Mobile-first, PWA-capable, Tauri-WebView-compatible at 375px+.
- **J.** Preserve every business rule + calculation when porting a bible page.

### Process discipline (Karpathy + Cherny)

- Think before coding — surface tradeoffs, don't pick silently.
- Simplicity first — minimum code that solves the problem.
- Surgical changes — touch only what you must.
- Goal-driven execution — define success, loop until verified.
- No laziness — find root causes, no band-aids.
- Minimal impact — no side effects, no new bugs in old code.
- Self-improvement loop — every correction goes into `docs/LESSONS.md` so it
  doesn't repeat.

## Constraints file (workspace-level)

The single source of truth for cross-repo constraints lives at:

```
/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/constraints.md
```

That file is canonical. If anything here disagrees with that file, the
constraints file wins.

## Page-parity port — agent instructions (active 2026-05-23)

Before any code edit, read in order:

1. `/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/constraints.md`
2. `/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/phases/hotseaters-page-parity-port/plan.md`
3. `./CLAUDE.md` (this repo) — "Page-parity port phase" section
4. The bible source for the page you're touching
   (`/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/<Name>.jsx`)

The four ground rules from CLAUDE.md apply unconditionally:

- **R1.** HotSeatersMVP IS the bible — copy every CSS/layout/copy precisely.
- **R2.** `midnight/hotseaters` Next.js is REFERENCE-ONLY (brand assets +
  technique lookup). Never copy behavior from it.
- **R3.** Surreal-memory MCP at
  `/Users/gqadonis/Projects/prometheus/surreal-memory-server`
  is the durable spine. When a call fails, read `docker compose logs`, patch
  the code, `docker compose up -d --build`, retry.
- **R4.** These rules persist across sessions (this file + CLAUDE.md).

Persistent task stream: **`hotseaters-page-parity-port`**
(surreal-memory id `aa6fd900-f793-4ff8-aa11-abb8720bbf24`).

After every non-trivial step, append to the stream:

```
mcp__surreal-memory__add_to_task_stream(
  stream_name="hotseaters-page-parity-port",
  content="<one-line status>"
)
```

Session-resume protocol:

```
mcp__surreal-memory__get_task_stream(name="hotseaters-page-parity-port")
mcp__surreal-memory__search_memories(query="current page in flight")
mcp__surreal-memory__read_graph()
```

(Use `search_memories` and `get_task_stream` — `list_task_streams` currently
times out via the MCP transport; tracked as a Wave-0 fix.)
