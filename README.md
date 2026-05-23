# hotseaters-ultimate

> PGlite + ElectricSQL + `@prometheus-ags/prometheus-entity-management`
> port of HotSeatersMVP. Mobile-first PWA + Tauri (iOS / Android).

**Status:** v0.0.1 — scaffold (Change 1 of 18 in the `hotseaters-pglite-port` phase).

## Hard rules

1. **Self-hosted Supabase only.** `localhost:8000` (docker-compose) or
   `hotbase.prometheusags.ai`. **Never** `*.supabase.co`.
2. **HotSeatersMVP is the bible.** Behavior, UI, copy, rules — all decided
   by the legacy app at `/Users/gqadonis/Projects/courtroom/HotSeatersMVP`.
3. **Components → hooks → stores → APIs.** Enforced via
   `eslint-plugin-boundaries`. CI fails on violation.
4. **Tauri mobile is the primary target.** Tauri desktop is downstream.

Full rules: [`CLAUDE.md`](./CLAUDE.md) and
[`latest-data/.kbd-orchestrator/constraints.md`](../latest-data/.kbd-orchestrator/constraints.md).

## Quick start

```bash
# from the hotseaters-ultimate directory
pnpm install
cp .env.example .env.local
# edit .env.local to point at your local docker-compose stack

pnpm dev                # http://localhost:5174
```

The local Supabase stack must be running (in `latest-data/`):

```bash
cd ../latest-data
docker compose up -d
```

## Mobile (Tauri 2)

Tauri mobile is the **primary target** per
[RULE 4](../latest-data/.kbd-orchestrator/constraints.md). Desktop is
downstream. See [`docs/RUNBOOKS-TAURI.md`](./docs/RUNBOOKS-TAURI.md)
for the full runbook (prerequisites, signing, smoke test, known issues).

```bash
# one-time bootstrap (after pnpm install)
pnpm tauri:init
pnpm tauri:ios:init
pnpm tauri:android:init

# replace `bundle.iOS.developmentTeam = "REPLACE_ME"` in
# src-tauri/tauri.conf.json with your 10-char Apple team ID

# dev loops
pnpm tauri:ios:dev        # boots iOS Simulator
pnpm tauri:android:dev    # boots Android Emulator

# release builds
pnpm tauri:ios:build
pnpm tauri:android:build --apk
```

**Acceptance gate:** PGlite + SharedArrayBuffer must work inside both
WebViews. Verify via the devtools paste-test in
[`scripts/verify-pglite-in-webview.mjs`](./scripts/verify-pglite-in-webview.mjs)
(procedure in the runbook).

## Documentation

Start here when joining the project — these four docs should get you
productive in 30 minutes.

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — the four layers, PGlite
  trio, Electric ↔ RLS coherence, auth bridge, role model, entity graph,
  theme, mobile, content + RAG.
- [`docs/FEATURE-TEMPLATE.md`](./docs/FEATURE-TEMPLATE.md) — step-by-step
  guide for adding a new feature (worked example: `attorneys`).
- [`docs/RUNBOOKS.md`](./docs/RUNBOOKS.md) — operations: rotate keys,
  regenerate types, force-resync, embed manual, ship a new role, Tauri
  iOS/Android deploys, debug stuck `local_writes`.
- [`docs/CODEMAP.md`](./docs/CODEMAP.md) — file-tree explanation.

## Architecture

```
Postgres (Supabase, self-hosted)
   ↓ Electric shapes (tenant-scoped WHERE)
PGlite (Web Worker, *_synced/*_local/view trio + local_writes queue)
   ↓ pg_notify
Feature stores (Zustand) ← project rows via electricsql adapter
   ↓
prometheus-entity-management graph (normalized by type+id)
   ↓
Hooks (useEntity*, useEntityCRUD)
   ↓
Components (consume hooks only)
```

## Phase plan

Plan + waypoint live in the sibling repo:
- [Plan](../latest-data/.kbd-orchestrator/phases/hotseaters-pglite-port/plan.md)
- [Constraints](../latest-data/.kbd-orchestrator/constraints.md)
- [Progress](../latest-data/.kbd-orchestrator/phases/hotseaters-pglite-port/progress.json)

## Stack

- **React 19** + **TypeScript 6**
- **Vite 7** + **Tailwind v4** + **vite-plugin-pwa**
- **Base UI v1** + **shadcn base-nova** under `@/components/ui/*`
- **`vaul`** drawers, **`framer-motion`** animation, **`@dnd-kit/*`** drag
- **TanStack Table** v8 (headless), **`react-hook-form`** + **`zod`** forms
- **PGlite** (WASM Postgres) + **ElectricSQL** sync
- **`@prometheus-ags/prometheus-entity-management`** as the only data API
  consumed by components/hooks
- **Tauri 2** mobile (iOS + Android primary; desktop downstream)
- **`@assistant-ui/react`** + **`@ai-sdk/openai`** (manual-RAG chat in
  example-app, post-v0.1 in this app)

## License

Internal — Prometheus AGS.
