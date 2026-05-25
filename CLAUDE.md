# CLAUDE.md — hotseaters-ultimate

This file is loaded by Claude Code (and any compatible agent) when it works
in this repo. It defines the **hard rules**. Read in full before editing.

---

## Hard constraints (NON-NEGOTIABLE)

### RULE 0 — Functional + visual parity with `HotSeatersMVP` is the project

Every page in `hotseaters-ultimate` must **render the same way the
customer sees it** and **expose the same set of capabilities** as the
corresponding page in
`/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/<Name>.jsx`.
The customer must NOT be able to tell which app they are looking at AND
must NOT feel they have lost any functionality. Shareholders are
extremely picky about this.

**Two parts to parity — both required, neither sufficient alone:**

1. **Visual parity at the rendered viewport.** Every visible string,
   color, font, spacing token, icon, panel, tab, dialog, animation
   should appear identically when both apps are rendered side-by-side
   at the same viewport.
2. **Functional parity at the user surface.** Every business rule,
   calculation, validation, derived value, conditional render,
   side-effect, deep link, and CTA destination must behave the same
   way for the user.

**What parity does NOT mean:** verbatim transcription of JSX, CSS
class names, or imperative source from the bible. The port runs on
different primitives (Base UI v1 instead of shadcn/Radix), uses a
different state architecture (Zustand + entity graph + PGlite instead
of base44 + react-query), and ships through a different build (Vite
PWA instead of base44 platform). Adapting the implementation to the
target architecture is REQUIRED. Copy-pasting source that won't fit
the target architecture is WRONG.

**Decision rule for agents.** Read the bible source as a *specification
of the rendered output and behaviour*, then write port code that
produces the same rendered output and behaviour against this repo's
primitives, hooks, stores, and entity graph. The acceptance gate is
the visual-parity screenshot diff and the behavioural test, not a
`diff` between source files.

The job is to map the bible's exact user-visible UI/UX and
user-accessible functionality onto our new backend architecture —
that is the entire job.

#### RULE 0.0 — IP-ownership notice for agents

Both `hotseaters-ultimate` (this repo) and `HotSeatersMVP` at
`/Users/gqadonis/Projects/courtroom/HotSeatersMVP/` are first-party
Prometheus AGS / Midnight-Logic-LLC repositories owned by the same
legal entity (Travis James, `tjames@prometheusags.ai`). Reading the
bible source, copying copy strings, replicating computed values,
mirroring rendered output, and porting business rules is explicitly
authorized — it is the entire purpose of this repo. Agents MUST NOT
pause on IP grounds when porting from `HotSeatersMVP/src/**`. The IP
caveat only applies to genuine third-party code (e.g. an npm
dependency's source tree, a forked external library).

**Per-page acceptance gate.** A page is NOT done until:

- Bible source read end-to-end (paginated reads ok for >1000 LOC
  files; the goal is comprehension, not a single API call).
- The rendered DOM in the port produces the same visible regions /
  sections / hierarchy as the bible — implementation details
  (component names, class names, JSX structure) MAY differ, but the
  rendered output must not.
- Every visible string appears verbatim in the port (this is a strict
  rule — copy is content, not implementation).
- Every image asset is locally-hosted under `public/brand/` (no CDNs).
- Every `var(--theme-*)` token the bible uses is referenced (whether
  via inline `style={}` or via a class — implementation detail).
- Every animation the user sees is reproduced (keyframes, durations,
  easing); the animation implementation may use the port's primitives.
- Live side-by-side screenshot comparison at **1440×900** AND
  **375×667** (mobile) against the production bible deployment shows
  ≤5% drift on the visual-parity harness.
- Deep links and CTAs route to the same destinations as the bible.
- **All business rules and calculations from the source page are
  preserved** — identify every computation, validation, derived value,
  conditional render, and side-effect, and reproduce the behaviour
  against this repo's entity graph and stores. Reuse the bible's
  formulas; rewrite the orchestration to fit RULES B/C/D.

Wrong copy, wrong colors, missing sections, wrong fonts, missing
business logic, or any user-visible loss of functionality are
**blocking defects**, not polish.

#### RULE 0.1 — Screenshot-overlap before "done"

Before declaring a page done, screenshot the bible AND the port at
**1440×900** with the same browser zoom. The two screenshots must
pixel-overlap. If body font weight, color, cursor, border tint, or any
visible glyph differs — that's a blocker, not a polish item. Repeat
at **375×667** for mobile parity.

#### RULE 0.2 — Always cross-check the bible's primitives + global CSS

When porting any page, also open the bible's
`HotSeatersMVP/src/index.css` AND every
`HotSeatersMVP/src/components/ui/<primitive>.jsx` that the page
consumes. Divergence in CVA classes, base layer rules, or CSS
variables shows up everywhere downstream. A Login button that looks
wrong on Landing is almost never a Landing bug — it's a primitive bug.

#### RULE 0.3 — Fix systemic visual bugs in the primitive, not the page

If a primitive (Button, Tab, Dialog, Input, etc.) renders consistently
wrong across multiple consuming pages — wrong cursor, wrong font,
wrong border tint, wrong focus ring — fix it in
`src/components/ui/<primitive>.tsx` and/or `src/index.css`. Do not
patch the symptom on each page. This is how "visual rot" creeps in.

### RULE 1 — Self-hosted Supabase only

**Never** use Supabase Cloud (`*.supabase.co`, `app.supabase.com`).

Two acceptable Supabase targets:
1. **Local dev:** the docker-compose stack at
   `/Users/gqadonis/Projects/midnight/latest-data/docker-compose.yaml` →
   `http://localhost:8000`.
2. **Hosted:** `https://hotbase.prometheusags.ai`.

Electric: `http://localhost:3133` (local) or `https://electricsql.prometheusags.ai`.

The Vite config in `vite.config.ts` refuses to build if `VITE_SUPABASE_URL`
matches `*.supabase.co`.

### RULE 2 — `HotSeatersMVP` is the BIBLE

The functional/visual ground truth is the legacy app at:
```
/Users/gqadonis/Projects/courtroom/HotSeatersMVP
```

`midnight/hotseaters` (the Next.js app at
`/Users/gqadonis/Projects/midnight/hotseaters`) is **reference prior art only**
for migration/auth/RLS/MDX patterns. When MVP and Next.js disagree on
behavior, UI, copy, or rules — **MVP wins, always**.

### RULE 3 — Architectural invariants (CI-enforced via `eslint-plugin-boundaries`)

1. **Components → hooks only.** No component imports a store, an API, PGlite,
   Electric, Supabase, or `prometheus-entity-management/graph|engine|adapters`.
2. **Hooks → stores only.** No fetch / supabase / PGlite in hooks.
3. **Stores own the API/sync seam.** Only `src/shared/db/*` and
   `src/features/*/stores/*` import `@electric-sql/*`, `@supabase/*`, or the
   entity-management engine/adapters.
4. **Realtime/sync configured once, in the app root.**
5. **Every entity registered with `prometheus-entity-management`.**
6. **Business-rules are pure.** No I/O in `business-rules/*` or `entities.ts`.

ESLint will fail the build on violation. Do not disable the rules.

### RULE 4 — Tauri mobile is the primary target

Every UI decision is mobile-first. Sidebar collapses to bottom-tab + drawer
at `< md`. Touch targets ≥ 44pt (enforced in `src/index.css`). PGlite must
work in iOS Safari WKWebView and Android Chromium WebView.

### RULE 5 — PGlite has no RLS; Electric shapes are RLS-coherent

Shape `WHERE` predicates ⊆ corresponding RLS policies. The tenant-scoped
Electric adapter refuses to attach unscoped shapes (Change 13).

### RULE 6 — `auth.users` ↔ `user_info` bridge

`auth.users.id` is **never** an FK target in domain tables. Use
`user_info.auth_user_id` (see latest-data supabase migration
`<ts>_auth_user_info_bridge.sql`).

### RULE 7 — Documentation is content, not pages

Manual content lives in `content/user-manual/*.mdx`. Never write a React page
to display documentation. Use `/manual/<slug>` (Change 17).

### RULE 8 — No Lovable, no Supabase Cloud, no Vercel-hosted services

Fully self-hosted. CI/build/deploy go to our K8s cluster.

### RULE 9 — Secret hygiene

`.env` is gitignored. Never commit a real key. Use `.env.example` for shape.

---

## Page-parity port phase (active — 2026-05-23)

This repo is mid-port from `HotSeatersMVP` (the bible) on a per-page basis.
The phase plan + wave structure + per-page assessments live in:

```
/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/phases/hotseaters-page-parity-port/
```

### Four ground rules (binding on every agent — non-negotiable)

**R1. HotSeatersMVP IS the bible.** Copy every CSS, layout, navigation,
color, spacing, font, and copy string precisely from
`/Users/gqadonis/Projects/courtroom/HotSeatersMVP/`. When MVP and any other
source disagree, **MVP wins**. The currently deployed bundle was generated by
sub-agents and contains copy drift (e.g., "90 days" instead of the bible's
"14 days") — fix to match the bible.

**R2. `midnight/hotseaters` Next.js is REFERENCE-ONLY.** Located at
`/Users/gqadonis/Projects/midnight/hotseaters/`. Use **only** for:

- Brand assets: `public/logo.svg`, `logo-dark.svg`, `logo-white.svg`,
  `apple-icon.png`, `icon-192.png`, `icon-512.png`, `favicon.ico`
- Technique lookup: Supabase SSR/PKCE patterns, MDX compile pipeline shape,
  role-route matrix structure

**Never** copy behavior, UI, copy, or styling from the Next.js repo.

**R3. Surreal-memory MCP server is the durable cross-turn spine.** Source
repo at `/Users/gqadonis/Projects/prometheus/surreal-memory-server`. When a
call fails:

1. `cd /Users/gqadonis/Projects/prometheus/surreal-memory-server`
2. `docker compose logs --tail=80 surreal-memory-server`
3. `docker compose logs --tail=40 surrealdb`
4. Patch the code (Rust crate under `src/` and `crates/`)
5. `docker compose up -d --build`
6. Retry the failed call

**Known workarounds (until fixed):** use `get_task_stream(name=…)` and
`search_memories(query=…)` for reads. `list_task_streams` currently times
out via the MCP transport — fix scheduled in Wave 0.

**R4. These rules persist.** They are restated in `AGENTS.md` and the phase
plan so they survive session resets, model swaps, and tool restarts.

### Persistent task stream

- **Name:** `hotseaters-page-parity-port`
- **Surreal-memory id:** `aa6fd900-f793-4ff8-aa11-abb8720bbf24`
- **Session-resume protocol:**

```ts
mcp__surreal-memory__get_task_stream({ name: "hotseaters-page-parity-port" });
mcp__surreal-memory__search_memories({ query: "current page in flight" });
mcp__surreal-memory__read_graph(); // load route + change inventory
```

After every non-trivial step:

```ts
mcp__surreal-memory__add_to_task_stream({
  stream_name: "hotseaters-page-parity-port",
  content: "<one-line status>",
});
```

### Wave structure (5–10 pages per deploy)

| Wave | Scope | Status |
|---|---|---|
| W0 | Foundation (brand assets, auth routing, MarketingShell, AuthOptionsDialog, PolicyViewerModal, fonts, surreal-memory fix) | not started |
| W1 | Public surface (`/`, `/Landing`, `/PrivacyPolicy`, `/TermsOfService`, `/Pricing`, `/ReferralLanding`) | not started |
| W2 | Auth surface (`/Onboarding`, `/AcceptInvite`, `/PaymentSuccess`, `/PaymentCancelled`, `/AccountDeactivated`) | not started |
| W3 | App shell audit + `/Dashboard` + `/MobileMore` | not started |
| W4 | Sales (`/Clients`, `/Clients/:id`, `/DealTracker`, `/Sales`, `/LeadRadar`) | not started |
| W5 | Operations (`/Trials`, `/Trials/:id`, `/Timeline`, `/TimeAndExpenses`, `/Team`) | not started |
| W6 | Billing (`/Approvals`, `/Invoices`, `/Bills`, `/Collections`) | not started |
| W7 | HotSeatHub (`/PotentialGigs`, `/HelpWanted`, `/HSHDirectory`, `/HotSeatHubMarketing`, `/Projections`) | not started |
| W8 | Settings + Manual + Documents (`/Settings`, `/UserManual`, `/SignDocument`, `/ViewDocument`, onboarding previews) | not started |

Live progress + per-page artifacts in
`.kbd-orchestrator/phases/hotseaters-page-parity-port/plan.md` §7 +
`pages/<route>/` subfolders.

---

## Quality gates (CI-enforced)

Every PR runs the gates in `.github/workflows/quality.yml`. Failures block
merge. See `docs/QUALITY-GATES.md` for the full explainer.

- **`pnpm typecheck`** — strict TS, no `any`.
- **`pnpm lint`** — boundaries (RULE 3) + the custom
  `hotseaters/sync-config-rls-coherence` rule (RULE 5). The latter ensures
  every entity in `src/shared/db/sync-config.ts` has a matching
  `CREATE POLICY ... ON public.<entity>` in
  `latest-data/supabase/migrations/`.
- **`pnpm lint:rules`** — smoke-tests the local ESLint plugin in
  `eslint-rules/`.
- **`pnpm size`** — bundle budgets via `size-limit.config.cjs`
  (JS ≤ 180 KB gzip, CSS ≤ 30 KB gzip).
- **`pnpm lh`** — Lighthouse (opt-in via `lh` PR label). LCP ≤ 2.5s,
  INP ≤ 200ms, CLS ≤ 0.05.
- **`pnpm db:diff`** — schema drift check against the **self-hosted**
  Supabase stack (URL containing `.supabase.co` fails the job — RULE 1).
- **`pnpm manual:validate`** — MDX validation on `content/user-manual/`.

Local pre-commit (opt-in): `cp .githooks/pre-commit.example .git/hooks/pre-commit`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ src/app/                  routing, providers, shell         │
├─────────────────────────────────────────────────────────────┤
│ src/features/<x>/                                            │
│   pages/         route components (consume hooks)            │
│   components/    feature UI (consume hooks)                  │
│   hooks/         consume stores                              │
│   stores/        consume shared/db                           │
│   business-rules/ pure functions                             │
│   entities.ts    schema registration                         │
├─────────────────────────────────────────────────────────────┤
│ src/components/ui/        shadcn base-nova primitives        │
│ src/shared/                                                  │
│   ui/            cross-feature UI                            │
│   hooks/         cross-feature hooks                         │
│   lib/           pure utilities (cn, dates, money, theme)    │
│   db/            PGlite worker, Electric, Supabase, sync     │
└─────────────────────────────────────────────────────────────┘
              ▲
              │ entity-graph from
              │ @prometheus-ags/prometheus-entity-management
              ▼
     PGlite (synced/local/view trio) ← Electric ← Postgres (supabase)
```

## Immutable code rules (RULES A–H)

These hold across the entire `hotseaters-ultimate/` tree. They sit
alongside RULE 0–9 above; violations are blocking.

### RULE A — Kebab-case filenames

Every source file in `src/**`, `public/**`, and `tests/**` uses
kebab-case (`landing-page.tsx`, `policy-viewer-modal.tsx`,
`use-auth.ts`). No PascalCase. No camelCase. The component or hook
*exported from* the file keeps its idiomatic case
(`export function LandingPage()`, `export function useAuth()`); the
**filename** is kebab.

#### RULE A.1 — Rename BEFORE editing (no exceptions)

Before editing ANY file, check the basename. If it is not kebab-case,
`git mv` it to a kebab-case basename FIRST, fix every import site,
re-run `pnpm typecheck && pnpm check:filenames`, THEN proceed with the
edit. Encountering a PascalCase file in the wild is not an excuse to
keep it that way — it's a chance to pay down the credit-card debt in
`scripts/check-kebab-filenames.mjs` `KNOWN_VIOLATIONS`.

The `pnpm check:filenames` script fails the build on any new
PascalCase file under `src/**`. Pre-commit + CI will block. Skipping
RULE A is no longer possible — but the rename must still be done
before the edit, not after, or the typecheck stage will fail on the
import path mismatch.

#### Anti-pattern (real example from 2026-05-24, see docs/LESSONS.md)

> "I treated existing PascalCase filenames as 'already there, just keep
> editing.'" — me, when the user caught it. RULE A applies every time
> you touch a file, not only on creation.

### RULE 0.4 — Debug visual defects from the resolved computed value, not the source CSS

When something looks wrong visually, the first diagnostic is NEVER "what
does the source CSS say." It is **`getComputedStyle(element)` on the
actual rendered DOM**, including every CSS variable the element's style
declarations reference. Source CSS can be 100% correct and still be
overridden at runtime by:

- `document.documentElement.style.setProperty(...)` from any code path
  that runs at mount (theme application, dark-mode toggles, A/B testers)
- `<style>` tags injected into the DOM later in the render order
- Inline `style={}` props on ancestor elements
- Specificity collisions between equal-specificity selectors

**Inline element style always wins over `:root` selectors.** If a CSS
variable resolves to the wrong value, grep for `setProperty` and
inline-style assignments BEFORE assuming the bug is in the source CSS or
the cascade.

A Playwright `getComputedStyle()` spec is the fastest way to pin a font
or color defect. See `tests/visual-parity/specs/font-diagnostic.spec.ts`
for a template.

### RULE B — Components → hooks only

A React component MUST NOT import from `stores/*` or call a Zustand
store directly. Components import hooks; hooks own all access to state
and side-effect machinery. ESLint (`eslint-plugin-boundaries`) enforces
this.

### RULE C — Hooks → stores only

A custom hook MUST NOT call `fetch`, the supabase client, the electric
client, PGlite, or any external service directly. Hooks only call into
stores (and other hooks). Stores expose a stable surface that hides the
network.

### RULE D — Stores own all I/O

Stores are the only layer that holds API calls, supabase subscriptions,
electric sync, PGlite reads/writes, realtime updates, and any external
service interaction. Stores expose plain JS state + actions; everything
above them is pure.

### RULE E — `@prometheus-ags/prometheus-entity-management` instead of TanStack Query

All client management of server-derived entities flows through the
entity graph from
`@prometheus-ags/prometheus-entity-management`. No `useQuery`, no
`useMutation`, no `QueryClient`. The entity graph is the cache, the
subscription manager, and the optimistic-update surface.

### RULE F — Feature-based clean architecture

Code lives under `src/features/<feature>/{pages,components,hooks,stores,entities,business-rules}`.
The only cross-feature buckets are `src/components/ui/` (shadcn
primitives) and `src/shared/`. No top-level `pages/` or `components/`
outside those.

### RULE G — shadcn/ui components over raw HTML

Where a primitive exists in `@/components/ui/*`, use it instead of the
raw HTML element. `<Button>` over `<button>`, `<Card>` over a styled
`<div>`, `<Dialog>` over a custom modal, `<Input>` over `<input>`, and
so on. Bare semantic HTML (`<header>`, `<footer>`, `<section>`,
`<main>`, `<nav>`, `<aside>`) IS allowed and encouraged when the page
needs a semantic landmark and no primitive applies.

### RULE H — Base UI v1 over Radix UI

Headless primitives come from `@base-ui-components/react` (Base UI v1).
No new `@radix-ui/*` imports. Existing Radix-based shadcn primitives
will be migrated to Base UI over time; new code uses Base UI from the
start.

### RULE I — Mobile-first, PWA-capable, Tauri-compatible

Every view must adapt to mobile viewports (375×667 minimum) and must
behave like a native PWA in mobile form. The same view also has to
work inside Tauri's WebView (iOS WKWebView + Android Chromium) — no
desktop-only assumptions, no APIs that fail in mobile WebViews, no
fixed-pixel layouts that overflow at 375px. Touch targets ≥ 44pt.
Sidebar collapses to bottom-tab + drawer at `< md`. PGlite has to
work in mobile WebViews (already tested).

### RULE J — Preserve all business rules from the source page

When porting a view from `HotSeatersMVP`, read the bible component end-
to-end and identify every:

- calculation (totals, multipliers, projections, derived fields)
- validation (form rules, conditional submit blocks)
- conditional render (role gates, feature flags, state-machine branches)
- side-effect (toast, email, e-sign, calendar sync)
- formatting rule (currency, date locale, phone, address)

Each of these must be reproduced in the port. A page is not done if a
single bible calculation or rule is missing.

---

## Process discipline (Karpathy + Cherny)

These are working-style rules that govern *how* an agent edits code in
this repo, not what it edits.

### Think before coding

Don't assume; surface tradeoffs. If multiple interpretations exist,
present them — don't pick silently. If a simpler approach exists, say
so. If something is unclear, stop and ask.

### Simplicity first

Minimum code that solves the problem. No features beyond what was
asked. No abstractions for single-use code. No "flexibility" or
"configurability" that wasn't requested. No error handling for
impossible scenarios. If you wrote 200 lines and 50 would do, rewrite
it. Ask: "would a senior engineer call this overcomplicated?" If yes,
simplify.

### Surgical changes

Touch only what you must. Clean up only your own mess. Don't "improve"
adjacent code, comments, or formatting. Don't refactor what isn't
broken. Match existing style even if you'd do it differently. If you
notice unrelated dead code, mention it — don't delete it. Every changed
line must trace directly to the user's request.

### Goal-driven execution

Define success criteria. Loop until verified.

- "Add validation" → "Write tests for invalid inputs, then make them pass."
- "Fix the bug" → "Write a test that reproduces it, then make it pass."
- "Refactor X" → "Ensure tests pass before AND after."

For multi-step tasks, state a brief plan with verification steps before
touching code.

### No laziness — find root causes

No temporary fixes. No band-aids. No "this should work for now."
Investigate until you have the actual cause, then fix that. Hold to
senior-developer standards.

### Minimal impact

Only touch what's necessary. No side effects. No introducing new bugs
while fixing old ones. Every commit should be defensible in isolation.

### Self-improvement loop

Anytime Claude does something wrong here, add a rule to
[`docs/LESSONS.md`](./docs/LESSONS.md) (or this file, if it's an
architectural rule) so the mistake doesn't repeat. The file is a living
record of every correction. Over time the agent learns this project.

---

## Workflow

```bash
pnpm install
pnpm dev                # Vite at :5174 (needs local supabase + electric)
pnpm typecheck
pnpm lint
pnpm test
pnpm manual:compile     # MDX → HTML fragments + JSON for embeddings
pnpm manual:validate    # manifest + link check
pnpm gen:pglite-schema  # regenerate src/shared/db/local-schema.sql

# Tauri mobile
pnpm tauri:ios:dev
pnpm tauri:android:dev
```

## Adding a feature

See `docs/FEATURE-TEMPLATE.md` (Change 12). In short:

1. Add the entity to `src/features/<x>/entities.ts` with
   `registerEntityJsonSchema`.
2. Decide the sync tier in `src/shared/db/sync-config.ts` (Change 16).
3. Run `pnpm gen:pglite-schema` to update `local-schema.sql`.
4. Add the RLS policies in `latest-data/supabase/migrations/`.
5. Build `pages/`, `components/`, `hooks/`, `stores/`, `business-rules/`.
6. Each layer must obey the architectural invariants (RULE 3).

## When in doubt

- **Architecture / why does this layer exist?** → [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- **How do I add a feature?** → [`docs/FEATURE-TEMPLATE.md`](./docs/FEATURE-TEMPLATE.md)
- **How do I rotate a key / regenerate types / debug sync?** → [`docs/RUNBOOKS.md`](./docs/RUNBOOKS.md)
- **Where does X live in the tree?** → [`docs/CODEMAP.md`](./docs/CODEMAP.md)
- **Should this UI / behavior look like this?** → the bible (HotSeatersMVP).

## Reference

- Constraints: `/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/constraints.md`
- Plan: `/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/phases/hotseaters-pglite-port/plan.md`
- Bible: `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/`
- Entity-management library: `/Users/gqadonis/Projects/midnight/latest-data/packages/prometheus-entity-management/`
- Example-app reference: `/Users/gqadonis/Projects/midnight/latest-data/packages/example-app/`
- Supabase migrations: `/Users/gqadonis/Projects/midnight/latest-data/supabase/migrations/`
