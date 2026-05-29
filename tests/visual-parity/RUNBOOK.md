# Visual-parity runbook

Self-hosted Supabase only. HotSeatersMVP is the bible.

## Two parity mechanisms

There are **two** complementary VR mechanisms in this directory. Pick by
whether the surface requires a signed-in session.

### 1. Deployed-vs-deployed drift — `specs/bible-vs-port.spec.ts`

For **unauth** surfaces. Opens the deployed bible (`https://hotseaters.com`)
and deployed port (`https://hotseaters-ultimate.prometheusags.ai`)
side-by-side, screenshots both, diffs via `pixelmatch`, and emits
`bible.png`/`port.png`/`diff.png`/`drift.json` per surface under
`.artifacts/bible-parity/<project>/<slug>/`. Soft-asserts <5% drift.

- **No committed baselines and no local servers** — it compares the two live
  deployments directly. Run with `pnpm test:bible-parity`.
- Cannot cover authed routes: you can't seed a session on the deployed bible
  domain. Add new unauth routes to the `PATHS` array in the spec.

### 2. Committed-baseline `toHaveScreenshot` — `specs/<page>-parity.spec.ts`

For **authed** surfaces. Uses `seedSession(page, 'owner'|'sales'|'trial')`
(from `tests/e2e/fixtures/auth.ts`) to render the port signed-in, then diffs
against a committed baseline PNG captured from the bible. Run with
`pnpm test:visual-parity`; capture/refresh with `:update`.

- Baselines are the **one** thing that needs the bible app run locally — see
  "Capturing authed baselines" below.

## What mechanism 2 tests

Pixel-by-pixel parity of `hotseaters-ultimate` SPA renders against the legacy
HotSeatersMVP screenshots at three widths: **375px, 768px, 1440px**.

Tolerance: `maxDiffPixelRatio: 0.005` (0.5%). Animations disabled, caret
hidden, baseline-vs-actual diffs land in `tests/visual-parity/.artifacts/` on
failure.

## Layout

```
tests/visual-parity/
├── playwright.config.ts          # separate config; 3 viewport projects
├── specs/                        # one spec per screen group
│   ├── landing-parity.spec.ts
│   ├── dashboard-parity.spec.ts
│   ├── clients-parity.spec.ts
│   └── trials-parity.spec.ts
└── __screenshots__/baseline/     # committed baselines (one png per
                                  # spec × project)
```

## First-time capture

Baselines do not exist yet. The first run **must** be an update:

```bash
pnpm test:visual-parity:update
```

This boots the preview server, navigates each spec, and writes the baseline
PNGs into `__screenshots__/baseline/`. Review the captures visually before
committing them — they become the source of truth.

## Capturing authed baselines (the local-bible step)

Authed-surface baselines (Dashboard, Settings, Clients, Trials, etc.) are
captured from the **bible app run locally**, once:

1. Start the bible: `cd /Users/gqadonis/Projects/courtroom/HotSeatersMVP && pnpm dev`
   (vite picks a free port if 5173 is held by the docker stack).
2. Sign in as an owner persona in the bible.
3. Screenshot each authed surface at 375 / 768 / 1440 with animations disabled.
4. Place the captures as the committed baseline for the matching
   `toHaveScreenshot` spec, then review and commit.

The deployed-vs-deployed mechanism (1) needs none of this — prefer it for any
surface reachable without a session.

## CI runs

CI runs `pnpm test:visual-parity` (no `--update-snapshots`). Any diff above
the 0.5% tolerance fails the job; failure artifacts include `actual.png`,
`expected.png`, and `diff.png` under
`tests/visual-parity/.artifacts/`.

## When the UI legitimately changes

1. Confirm the change is intentional (matches the HotSeatersMVP bible).
2. Locally run `pnpm test:visual-parity:update`.
3. Inspect the new PNGs.
4. Commit them in the same PR as the UI change.

## When tests are flaky

- Verify fonts loaded (`@fontsource-variable/geist` self-hosted; no network).
- Confirm `waitForLoadState('networkidle')` is in the spec.
- Ensure no live data (timestamps, counters) is in the captured region —
  fence with `data-testid` and mask via `mask: [page.locator(...)]` in
  `toHaveScreenshot` if needed.
