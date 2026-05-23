# Code Map

> Self-hosted Supabase only. HotSeatersMVP is the bible. Components → hooks → stores → APIs.

Where things live. Use alongside [`ARCHITECTURE.md`](./ARCHITECTURE.md) for
the "why."

## Top level

```
hotseaters-ultimate/
├── CLAUDE.md                # hard rules + quick architecture (read first)
├── README.md                # quickstart + stack overview
├── CHANGELOG.md             # per-Change history within the phase
├── AGENTS.md                # cross-tool agent rules
├── MOBILE_AUDIT.md          # mobile-conformance audit notes
├── components.json          # shadcn base-nova config
├── eslint.config.js         # incl. eslint-plugin-boundaries (RULE 3)
├── index.html               # Vite entry
├── package.json             # scripts: dev, gen:pglite-schema, gen:feature, etc.
├── playwright.config.ts     # e2e against the local Supabase stack
├── tsconfig.json            # strict TS (noUncheckedIndexedAccess, etc.)
├── vite.config.ts           # PWA, COOP/COEP, supabase-cloud guardrail
├── docs/                    # this directory
├── content/                 # MDX manual content
├── public/                  # static assets
├── scripts/                 # node scripts (codegen, manual pipeline)
├── src/                     # application source
└── src-tauri/               # Tauri 2 wrapper (ios/android primary)
```

## `src/app/` — application shell

```
src/app/
├── app-providers.tsx        # one place for all providers; entity registrations
├── app-router.tsx           # React Router v7 routes + <RoleGuard> wrappers
├── app-shell.tsx            # responsive shell (sidebar md+, bottom-tab mobile)
├── bottom-tab-bar.tsx       # mobile primary navigation
├── navigation.ts            # role-aware nav item table
├── page-metadata.ts         # per-route titles, breadcrumbs
├── role-guard.tsx           # <RoleGuard allow={[…]}> route element wrapper
├── role-guard.test.tsx
├── sync-gate.tsx            # blocks shell until PGlite has hydrated
├── tier1-provider.tsx       # bootstraps the Tier-A sync subscriptions
└── ui-sandbox.tsx           # dev-only /ui-sandbox surface for primitives
```

Sync, Electric registration, entity registration, and Supabase client
creation all happen **exactly once** here (RULE 3.4).

## `src/components/ui/` — shadcn / base-ui primitives

Shadcn-style primitive components on the **Base UI v1** stack
(`@base-ui/react`). Imported elsewhere as `@/components/ui/<name>`. Do not
edit these to add feature logic — wrap them in a feature component
instead. New primitives land here via the shadcn CLI configured in
`components.json`.

## `src/shared/` — cross-feature utilities

```
src/shared/
├── db/                      # the only place PGlite/Electric/Supabase live
│   ├── CLAUDE.md
│   ├── auth-session.ts      # Supabase auth session bridge
│   ├── electric-sync.ts     # tenant-scoped shape registry
│   ├── entity-graph-bootstrap.ts  # prometheus-entity-management init
│   ├── local-schema.sql     # GENERATED — do not hand-edit
│   ├── pglite-client.ts     # PGlite singleton + clearLocalTenantData()
│   ├── pglite.worker.ts     # Web Worker entry for PGlite
│   ├── supabase-client.ts   # supabase-js v2 (self-hosted URLs only)
│   ├── sync-config.ts       # Tier-A/B allowlist (source of truth)
│   ├── sync-foundation.test.ts
│   ├── sync-types.ts        # shared type defs
│   └── write-sync.ts        # local_writes drain
├── hooks/                   # cross-feature hooks
│   ├── use-media-query.ts
│   └── use-mobile.ts
└── lib/                     # pure utilities — no I/O
    ├── cn.ts                # tailwind classnames merger
    ├── role-mapping.ts      # role → permissions table
    └── theme.ts             # applyThemeVars(name, mode)
```

## `src/features/<x>/` — feature modules

Every feature is a vertical slice in this layout:

```
src/features/<name>/
├── CLAUDE.md                # boundary rules + bible reference
├── entities.ts              # registerEntityJsonSchema(...) + registerSchema(...)
├── business-rules/          # pure functions; unit-tested
│   ├── __tests__/
│   └── *.ts
├── components/              # feature UI; consume hooks only
├── hooks/                   # consume stores via useEntity*
├── pages/                   # route components; consume hooks only
└── stores/                  # ONLY layer here allowed to import shared/db
```

Currently shipping:

- `src/features/auth/` — sign-in, OAuth callback, magic link.
- `src/features/clients/` — Client + ClientAddress (+ ClientServiceOverride stub).
- `src/features/company/` — company settings, user_info admin.
- `src/features/dashboard/` — landing dashboard.
- `src/features/trials/` — Trial + TrialContact + TrialSegment + TrialService.

## `content/user-manual/` — documentation as content

```
content/user-manual/
├── CLAUDE.md
├── PORT_GAPS.md             # tracks doc parity with the legacy app
├── index.json               # ordered manifest with slug/title/section/tags
└── *.mdx                    # one fragment per topic
```

The legacy `Doc*.jsx` pages are retired (RULE 7). To add or edit a topic:
edit the MDX file, run `pnpm manual:validate` then `pnpm manual:compile`,
and embed with `pnpm manual:embed` (R-05).

## `scripts/` — codegen + content pipeline

```
scripts/
├── compile-user-manual-fragments.mjs   # MDX → HTML + JSON
├── copy-user-manual-runtime.mjs        # ship compiled manual into dist/
├── embed-manual.mjs                    # idempotent embedding pipeline
├── gen-feature.mjs                     # pnpm gen:feature <name>
├── gen-pglite-schema.mjs               # pnpm gen:pglite-schema
├── jsx-doc-to-mdx.mjs                  # legacy Doc*.jsx → MDX
├── validate-user-manual-links.mjs
├── validate-user-manual.mjs
└── verify-pglite-in-webview.mjs        # iOS/Android WebView smoke check
```

## `src-tauri/` — Tauri 2 wrapper

Tauri runs the same Vite bundle inside iOS and Android WebViews
(primary), and desktop downstream. COOP/COEP and PGlite OPFS access are
configured under `tauri.conf.json.security.headers`.

## `latest-data/` — the database project (sibling repo)

Not in this repo, but referenced everywhere:

```
/Users/gqadonis/Projects/midnight/latest-data/
├── docker-compose.yaml                       # self-hosted Supabase + Electric stack
├── supabase/
│   ├── config.toml
│   └── migrations/                           # source of truth for schema, RLS, bridge
├── packages/prometheus-entity-management/    # the entity graph library (link:)
└── content/user-manual/                      # (planned move from this repo)
```

`hotseaters-ultimate` links against the entity-management library via
`link:../latest-data/packages/prometheus-entity-management` in
`package.json`.

## `e2e/` — Playwright specs

(Created per-feature as work lands.) Specs run against the local
docker-compose stack and a seeded tenant. See `playwright.config.ts` for
the base URL.

## See also

- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`FEATURE-TEMPLATE.md`](./FEATURE-TEMPLATE.md)
- [`RUNBOOKS.md`](./RUNBOOKS.md)
