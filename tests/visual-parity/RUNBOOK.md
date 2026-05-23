# Visual-parity runbook

Self-hosted Supabase only. HotSeatersMVP is the bible.

## What this tests

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
