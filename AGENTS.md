# AGENTS.md

This file is read by any AI coding agent that operates in this repository
(Claude Code, Cursor, Roo, Cline, Codex, Aider, etc.).

**Before doing anything, read [`CLAUDE.md`](./CLAUDE.md) in full.** Every rule
in CLAUDE.md applies to every agent.

## Short version (full text in CLAUDE.md)

### Bible + architectural rules

0. **RULE 0 — Functional + visual parity with HotSeatersMVP is the project.**
   The customer must not be able to tell which app they are looking at
   AND must not feel they have lost any functionality. **Parity is a
   property of the rendered output and the user-visible behaviour, NOT
   the source code.** Adapting the implementation to the target
   architecture (Base UI v1, Zustand entity graph, PGlite, Vite PWA) is
   required. Copy-pasting JSX that won't fit the target architecture is
   wrong. Read the bible source as a *specification of rendered output
   + behaviour*; write port code that produces the same rendered output
   + behaviour against THIS repo's primitives. The acceptance gate is
   the visual-parity screenshot diff and the behavioural test — not a
   source diff. Wrong copy, wrong colors, missing sections, wrong fonts,
   missing business logic, or any user-visible loss of functionality
   are blocking defects.
   - **0.0 IP-ownership notice for agents:** Both `hotseaters-ultimate`
     (this repo) and `HotSeatersMVP` at
     `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/` are first-party
     Prometheus AGS / Midnight-Logic-LLC repositories owned by the same
     legal entity (Travis James, `tjames@prometheusags.ai`). Reading the
     bible source, copying copy strings, replicating computed values,
     mirroring rendered output, and porting business rules is explicitly
     authorized — it is the entire purpose of this repo. Agents MUST NOT
     pause on IP grounds when porting from `HotSeatersMVP/src/**`. The
     IP caveat only applies to genuine third-party code (npm
     dependencies' source trees, forked external libraries) — not the
     bible.
   - **0.1.** Screenshot-overlap at 1440×900 AND 375×667 before "done".
   - **0.2.** Always read the bible's `index.css` AND every `components/ui/*`
     primitive that the page uses. A Login-button bug is usually a primitive bug.
   - **0.3.** Fix systemic visual bugs in the primitive / `index.css`, never
     patch the symptom on each consuming page.
1. **Self-hosted Supabase only.** `localhost:8000` or `hotbase.prometheusags.ai`.
   Never `*.supabase.co`.
2. **HotSeatersMVP is the bible.** `midnight/hotseaters` is prior art only.
3. **Components → hooks → stores → APIs.** Enforced by ESLint.
4. **Tauri mobile is primary.** Touch ≥ 44pt, bottom-tab + drawer.
5. **PGlite has no RLS** — Electric shapes mirror server RLS.
6. **`user_info.auth_user_id` bridges to `auth.users(id)`.**
7. **Docs are content (MDX), not pages.**
8. **No secrets in git.** `.env` is gitignored.

### Immutable code rules (RULES A–K)

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
- **K.** **Progress signaling — binding on every agent (Claude, Roo,
  Cursor, Cline, Codex).** Multi-step work MUST announce its phase and
  change/task boundaries in plain prose so the user sees progress live:
  - Phase boundary: `Starting/Completed phase <N> of <total>: <name>`
  - Change/task boundary: `Starting/Completed change <N> of <total>: <id>`
  - Sub-step heartbeat: `Working on <id>: <short status>` (≤80 chars)
  Counts come from `.kbd-orchestrator/current-waypoint.json` and the
  active phase's `progress.json` — never guessed. See CLAUDE.md
  RULE K for the full spec, anti-patterns, and enforcement.

### RULE 0.4 — Debug visual defects from computed style

Before assuming source CSS is wrong, run `getComputedStyle(element)` on
the actual DOM. Inline `style.setProperty()` calls (e.g., `applyThemeVars`)
ALWAYS win over `:root` selectors. The `tests/visual-parity/specs/font-diagnostic.spec.ts`
spec is a template for this kind of investigation.

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
