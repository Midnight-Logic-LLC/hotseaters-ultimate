# Changelog

All notable changes to `hotseaters-ultimate` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added — Web CI deploy workflow (2026-05-24)

- **`.github/workflows/deploy.yml`** — mirrors the `latest-data` deploy CI
  pattern. On every push to `main`:
  1. Refuses any `*.supabase.co` URL in `VITE_SUPABASE_URL` (RULE 1).
  2. Verifies the vendored entity-mgmt dist is present.
  3. Builds a **single-arch `linux/amd64`** web image with build-args
     wired from repository secrets (`VITE_SUPABASE_URL`,
     `VITE_SUPABASE_ANON_KEY`, `VITE_ELECTRIC_URL`). No Tauri toolchain
     involvement — pure Vite + nginx.
  4. Pushes to
     `us-central1-docker.pkg.dev/prometheus-461323/prometheus/hotseaters-ultimate:<sha>`
     and `:latest`.
  5. Clones `latest-data`, edits the overlay's
     `k8s/overlays/prometheus/app/kustomization.yaml` via
     `kustomize edit set image`, commits
     `ci(hotseaters-ultimate): deploy <sha> [skip ci]` back to
     `latest-data`'s `main`. ArgoCD on the cluster auto-syncs.
- **Concurrency-serialised** (`concurrency.group: deploy-main`,
  `cancel-in-progress: false`) so two pushes never race the cross-repo
  tag-bump. Rebase-and-retry loop (5 attempts) handles the case where
  `latest-data`'s own deploy bot lands between checkout and push.
- **Required new repo secrets:** `GCP_SA_KEY`,
  `LATEST_DATA_PUSH_TOKEN`, `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`, `VITE_ELECTRIC_URL`. (No `kubectl` access
  needed — this workflow doesn't touch the cluster directly; ArgoCD
  reads the tag-bump commit.)

### Removed — Tauri mobile CI (2026-05-24)

- Deleted `.github/workflows/tauri-mobile.yml`. **Tauri mobile is
  local-only:** the `src-tauri/` scaffold, the `tauri:*` `package.json`
  scripts, the `@tauri-apps/cli` devDep, the `verify-pglite-in-webview.mjs`
  script, and `docs/RUNBOOKS-TAURI.md` are all retained so developers
  can `pnpm tauri:ios:dev` / `pnpm tauri:android:dev` on their own
  machines. Only the CI workflow that built mobile targets on every PR
  is gone.
- `docs/RUNBOOKS-TAURI.md` §6 updated to reflect "local-only — no CI."
- The earlier Change-9 CHANGELOG entry annotated to mark the workflow as
  removed.

### Added — Change 12: feature template and docs (2026-05-23)

- `docs/ARCHITECTURE.md` — comprehensive architecture document covering the
  four layers (components → hooks → stores → APIs), PGlite synced/local/view
  trio + `local_writes` queue, Electric shape sync + RLS coherence (RULE 5),
  auth bridge `auth.users` ↔ `user_info` (RULE 6), 4+1 role model, entity
  graph (prometheus-entity-management v1.3), theme system, mobile-first
  Tauri primary target, documentation-as-content, and the pgvector RAG
  pipeline. Polished ASCII diagrams throughout.
- `docs/FEATURE-TEMPLATE.md` — 8-step mechanical guide for adding a new
  feature, illustrated with a worked example for the upcoming `attorneys`
  feature. Covers tier decision per §0.12 checklist, `sync-config.ts`
  update, PGlite local-schema regen, RLS policy authoring, scaffold via
  `pnpm gen:feature`, layer-by-layer fill, route + `RoleGuard`, tests, and
  the quality gates that must all pass. Ends with the required PR
  description boilerplate.
- `docs/RUNBOOKS.md` — 11-runbook superset: first-time clone + dev setup,
  rotate Supabase keys, regenerate TS types after a migration, force-resync
  a tenant's PGlite cache via `clearLocalTenantData()`, embed updated
  manual chunks, ship a new role to the matrix, Tauri iOS device deploy,
  Tauri Android device deploy, rotate the OpenAI key, debug a stuck
  `local_writes` drain, and a condensed add-a-Tier-A-entity recipe.
- `docs/CODEMAP.md` — file-tree explanation covering every top-level dir,
  every `src/` subtree, `content/user-manual/`, the `scripts/` codegen +
  content pipeline, `src-tauri/`, and the sibling `latest-data/` repo.
- `scripts/gen-feature.mjs` — node ESM codegen script (stdlib only).
  CLI: `pnpm gen:feature <name>`. Scaffolds
  `src/features/<name>/{entities.ts, hooks/, stores/, components/, pages/,
  business-rules/, business-rules/__tests__/, CLAUDE.md}` with templated
  stubs, refuses to overwrite an existing directory, pretty-prints the
  created tree, and emits a next-step checklist that mirrors
  `FEATURE-TEMPLATE.md`.
- `package.json` — added `gen:feature` script wiring.
- `README.md` — added a "Documentation" section linking the four new docs.
- `CLAUDE.md` — added a "When in doubt" pointer block to the docs.

### Added — Change 10: e2e test harness (2026-05-23)

- `playwright.config.ts` — three projects: `chromium` (1440×900),
  `mobile-chrome` (Pixel 5), `mobile-webkit` (iPhone 13). `webServer` boots
  `pnpm preview` at port 5174. Retries: 2 in CI, 0 locally. Screenshots on
  failure, video on first retry.
- `tests/e2e/fixtures/` — Playwright fixtures:
  - `auth.ts` — three signed-in personas (Owner, Sales, Trial Consultant)
    seed a fake supabase session in `localStorage` via `addInitScript`.
    No real OAuth.
  - `pglite.ts` — auto-fixture that clears IndexedDB before each test so
    PGlite boots fresh.
  - `index.ts` — merged `test`/`expect` for specs.
- `tests/e2e/specs/` — six Playwright specs: `auth`, `dashboard`, `clients`,
  `trials`, `role-guard`, `cross-feature-graph`.
- `tests/cucumber/` — Cucumber harness modeled on the Next.js cucumber.cjs:
  - `cucumber.cjs` (profiles: default, smoke, ci, ui).
  - `features/auth.feature` (4 scenarios: Google, magic link, invitation,
    pending sub-user).
  - `features/onboarding.feature` (Owner onboarding).
  - `features/role-route-matrix.feature` (20-row table-driven role × route
    matrix per §0.9).
  - `support/world.ts` + three step-definition files reusing the auth
    fixtures.
- `tests/visual-parity/` — separate Playwright config:
  - 3 viewport projects (375 / 768 / 1440), 0.5% diff tolerance.
  - Five specs: landing, dashboard, clients, trials (list + detail).
  - Baselines under `__screenshots__/baseline/`; first run captures via
    `pnpm test:visual-parity:update`. `RUNBOOK.md` documents the workflow.
- `tests/db/` — pgTAP integration:
  - `auth_rls_smoke_test.sql` stub pointing at the canonical suite in
    `latest-data/tests/`.
  - `sync-allowlist-rls.sql` — every entity in `src/shared/db/sync-config.ts`
    must have a SELECT + write RLS policy.
  - `run-pgtap.sh` — runs the canonical smoke + the allowlist coherence
    test; refuses any `*.supabase.co` URL.
- `tests/CLAUDE.md` — explains the test pyramid (unit → integration → e2e →
  Cucumber → pgTAP → visual parity) and when to add each layer.
- `.github/workflows/test.yml` — install → typecheck → lint → vitest →
  build → playwright e2e → cucumber → visual parity (compare only) → pgTAP.
  Caches pnpm + Playwright browsers; uploads Playwright HTML report and
  visual-parity diffs as artifacts.
- `package.json` scripts: `test:e2e:smoke`, `test:e2e:cucumber`,
  `test:visual-parity`, `test:visual-parity:update`, `test:db`, `test:all`.
  Adds `@cucumber/cucumber` and `tsx` to `devDependencies`.

Self-hosted Supabase only. HotSeatersMVP is the bible.

### Added — Change 11: code quality gates (2026-05-23)

- Custom ESLint plugin `eslint-rules/` wired into `eslint.config.js`:
  - `hotseaters/sync-config-rls-coherence` (error) — every entity in
    `SYNC_CONFIG` must have a matching `CREATE POLICY ... ON public.<entity>`
    in `latest-data/supabase/migrations/*_rls_policies*.sql`. Enforces
    RULE 5 (PGlite has no RLS; sync shapes ⊆ RLS USING clauses).
  - `hotseaters/no-server-state-in-usestate` (warning) — flags
    `useState<TypeName>(...)` where `TypeName` matches a known entity from
    `SYNC_CONFIG`; nudges toward `useEntity*`.
- `eslint-rules/_self-test.mjs` — programmatic smoke test for the custom
  rules, exposed as `pnpm lint:rules`.
- `.lighthouserc.json` — assertions for `/login`, `/dashboard`, `/clients`,
  `/trials`. Budgets: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.05; min scores
  85/90/90 (perf/a11y/best-practices).
- `size-limit.config.cjs` — bundle budgets: JS ≤ 180 KB gzip, CSS ≤ 30 KB
  gzip.
- `.github/workflows/quality.yml` — CI jobs: lint+typecheck, size,
  lighthouse (label-gated), db drift (self-hosted only — fails on
  `.supabase.co`), manual validate.
- `.githooks/pre-commit.example` — opt-in local pre-commit hook (husky
  intentionally NOT installed).
- `docs/QUALITY-GATES.md` — full explainer including the "adding a new
  entity" checklist that keeps RLS + sync-config in lockstep.
- `package.json` — new scripts: `lint:rules`, `lh`, `size`, `db:diff`.
  Added devDeps: `@lhci/cli ^0.14`, `size-limit ^11`,
  `@size-limit/preset-app ^11`.
- `CLAUDE.md` — new "Quality gates" section pointing at this infrastructure.

### Added — Change 9: PWA & Tauri 2 mobile scaffold (2026-05-23)

- **`src-tauri/` Rust crate**:
  - `Cargo.toml` — Tauri 2.x, `tauri-plugin-shell`, `serde`/`serde_json`,
    Rust edition 2021. Crate name `hotseaters-ultimate`, identifier
    `ai.prometheusags.hotseaters.ultimate`.
  - `src/main.rs` — desktop entrypoint.
  - `src/lib.rs` — mobile entrypoint stub guarded by
    `#[cfg_attr(mobile, tauri::mobile_entry_point)]`.
  - `build.rs` — `tauri_build::build()`.
  - `.gitignore` — `target/`, `gen/`, `Cargo.lock`.
- **`src-tauri/tauri.conf.json`**:
  - `productName: "HotSeaters"`, identifier
    `ai.prometheusags.hotseaters.ultimate`, version `0.0.1`.
  - `build.devUrl: http://localhost:5174`, `frontendDist: ../dist`.
  - One main window (1200×800, resizable, not fullscreen).
  - **Security headers**: COOP `same-origin`, COEP `require-corp`,
    CORP `same-origin` — required for PGlite `SharedArrayBuffer`
    inside WKWebView / Android WebView.
  - **CSP**: `self` + `localhost:8000` (Supabase local),
    `localhost:3133` (Electric local), `hotbase.prometheusags.ai`,
    `electricsql.prometheusags.ai`. **No `*.supabase.co`.**
  - `bundle.targets`: `app, appimage, deb, dmg, ipa, apk`.
  - iOS minimum **16.0**, Android `minSdkVersion` **26**.
  - `bundle.iOS.developmentTeam = "REPLACE_ME"` — operator must set.
- **`src-tauri/capabilities/default.json`** — Tauri 2 capability file.
  Conservative: window + dialog + path + events. No shell exec, no
  unrestricted filesystem (PGlite owns persistence via IndexedDB).
- **`src-tauri/icons/README.md`** — generation procedure for the icon
  set via `pnpm tauri icon`. No binary icons committed until a real
  brand asset exists.
- **`public/manifest-icons-README.md`** — PWA icon + splash generation
  via `pwa-asset-generator`.
- **`index.html`**:
  - Status-bar style changed to `black-translucent` for edge-to-edge.
  - Apple-touch-startup-image placeholders (commented, with media
    queries for iPhone SE / 15 Pro / 15 Pro Max / iPad Pro 11").
  - `mobile-web-app-capable` for Android home-screen install.
- **`scripts/verify-pglite-in-webview.mjs`** — paste-target devtools
  snippet that asserts `SharedArrayBuffer`, `crossOriginIsolated`,
  IndexedDB, and a PGlite `SELECT 1` round-trip inside the live
  WebView. Documents the iOS Safari Web Inspector / Android
  `chrome://inspect` flow.
- ~~`.github/workflows/tauri-mobile.yml`~~ — **REMOVED 2026-05-24.**
  Tauri mobile is local-only: no CI iOS or Android builds. The scaffold
  under `src-tauri/` is retained for local experimentation
  (`pnpm tauri:ios:dev`, `pnpm tauri:android:dev`); the GKE web image is
  built by `.github/workflows/deploy.yml` exclusively.
- **`docs/RUNBOOKS-TAURI.md`** — full operator runbook: prerequisites,
  one-time bootstrap, dev loop, **PGlite-in-WebView smoke test**
  procedure, production builds, known issues.
- **`package.json` scripts** — added `tauri:init`, `tauri:ios:init`,
  `tauri:android:init`, `verify:pglite-webview`. Existing
  `tauri:{ios,android}:{dev,build}` retained.

### Added — Change 1: package scaffold (2026-05-23)

- New repo at `/Users/gqadonis/Projects/midnight/hotseaters-ultimate`.
- `package.json` with full dependency set: React 19, Vite 7, Tailwind v4,
  Base UI v1, PGlite, `@electric-sql/pglite-sync`, `prometheus-entity-management`
  (linked from `latest-data/packages/`), TanStack Table v8, vaul,
  framer-motion, @dnd-kit, Tiptap, react-leaflet, recharts, react-hook-form +
  zod, @assistant-ui/react, @ai-sdk/openai, Tauri CLI v2.
- `tsconfig.json` strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- `vite.config.ts` with:
  - COOP/COEP headers (required for PGlite SharedArrayBuffer / OPFS).
  - PWA plugin with mobile manifest.
  - Build-time guardrail: refuses Supabase Cloud URLs.
  - Supabase proxy (`/auth`, `/rest`, `/storage`, `/realtime`, `/functions`).
- `eslint.config.js` with `eslint-plugin-boundaries` enforcing
  Components → Hooks → Stores → APIs (RULE 3).
  - External-import rules forbid PGlite/Electric/Supabase outside `shared/db`
    and `features/*/stores/*`.
- `components.json` (shadcn base-nova, aliases under `@/components/ui`).
- `index.html`, `src/main.tsx`, `src/app/{app-providers,app-router,app-shell}.tsx`,
  `src/index.css`, `src/shared/lib/cn.ts`, `src/test/setup.ts`, `src/vite-env.d.ts`.
- `CLAUDE.md`, `AGENTS.md`, `README.md`, `CHANGELOG.md` documenting all rules.
- `.gitignore`, `.env.example`, `.prettierrc.json`, `.prettierignore`.
- Hard rules carried into every file header where relevant.

### Added — Change 2: shadcn / base-ui primitive port (2026-05-23)

- 57 primitives copied from `latest-data/packages/example-app/src/shared/ui/`
  into `src/components/ui/`.
- Shared hooks `use-mobile.ts` and `use-media-query.ts` copied into
  `src/shared/hooks/`.
- Internal imports rewritten `@/shared/ui/*` → `@/components/ui/*`.
- `ResponsiveModal` wired to `useIsMobile` from `@/shared/hooks/use-media-query`;
  picks `BottomSheet` on mobile and a centered dialog on `>= md`.
- `Sidebar` primitive verified mobile-conformant: uses `useIsMobile` and
  renders a `Sheet`-backed drawer on mobile. All required exports present.

### Change 2 audit fixes

- (no import fixes required — all 57 primitives' imports resolve clean; `@/shared/ui/*` remediation already complete pre-audit)
- add `/ui-sandbox` route + page rendering one of each primitive as a smoke surface
- write `MOBILE_AUDIT.md` (5 warn, 6 note, 0 block) covering hover-only, touch-target, and shell-substitution concerns

### Coming next

- Change 14 (supabase migrations workflow) — running in parallel.
- Change 17 (documentation content model) — running in parallel.
- Change 2 (shadcn primitives port) — Wave 2.
- Change 3 (theme + layout port) — Wave 2.
