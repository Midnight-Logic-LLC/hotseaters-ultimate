# Plan — page-parity-verification-hardening

_Generated: 2026-05-29 (Claude Opus 4.8)_

---

## Overview

The prior phase ported every bible app surface (43 pages, 78 routes) but shipped
W1–W8 without per-page RULE-0 audits and with only partial VR coverage. This
phase proves parity. It does **not** re-port.

### Key discovery (revises the assessment's stated blocker)

The VR harness is **far more built-out than the assessment assumed**. Two
complementary mechanisms already exist under `tests/visual-parity/`:

1. **`specs/bible-vs-port.spec.ts`** (103 LOC) — opens the **deployed bible**
   (`https://hotseaters.com`) and **deployed port**
   (`https://hotseaters-ultimate.prometheusags.ai`) side-by-side, screenshots
   both full-page at desktop + mobile, diffs via `pixelmatch`, emits
   `bible.png`/`port.png`/`diff.png`/`drift.json`, soft-asserts <5% drift.
   **Needs no local bible dev server** — it compares deployments. Currently
   covers **5 unauth surfaces** (`/`, `/login`, `/accept-invite`,
   `/pending-approval`, `/account-rejected`); auth surfaces deferred because you
   can't seed a session on the deployed bible domain.

2. **`specs/<page>-parity.spec.ts`** (small) — `toHaveScreenshot` against
   committed baselines using the `seedSession` auth fixture. Covers authed
   surfaces (dashboard, clients, trials, settings). Baselines captured locally
   via `pnpm test:visual-parity:update`.

**Therefore the assessment's "bible app must run locally" blocker only applies
to capturing committed baselines for the authed-surface `toHaveScreenshot`
specs — and even those compare against bible screenshots, not a live bible
server.** The deployed-vs-deployed drift path (mechanism 1) has no blocker.

### Revised strategy

- **Unauth surfaces** → extend `bible-vs-port.spec.ts` `PATHS` to cover all
  public/marketing routes. Zero baseline management; drift computed live.
- **Authed surfaces** → per-page `toHaveScreenshot` specs + locally-captured
  baselines (the one place needing bible screenshots).
- **Every page** → a RULE-0 acceptance audit (bible read end-to-end, strings
  verbatim, tokens referenced, deep links, business rules) recorded as a
  markdown audit note per page, regardless of VR mechanism.

---

## Change Backend

**OpenSpec** — `openspec/changes/change-V*/` directories.

---

## Execution Order

### Foundation (must ship first)

| # | Change ID | Title | Depends on |
|---|-----------|-------|-----------|
| 1 | change-V01 | VR harness consolidation: extend `bible-vs-port` PATHS to all unauth surfaces; document authed-baseline workflow in RUNBOOK; enable pre-commit (done locally — make it a tracked instruction) | — |
| 2 | change-V02 | Per-page RULE-0 audit template + audit ledger (`.kbd-orchestrator/phases/.../audits/<page>.md`); reconcile W1–W8 delivery into a tracked inventory | — |

### Per-surface audit + VR (parallel-safe after V01 + V02)

| # | Change ID | Title | Depends on |
|---|-----------|-------|-----------|
| 3 | change-V03 | Public/marketing surface — audit + extend bible-vs-port (`/`, `/Landing`, `/Pricing`, `/PrivacyPolicy`, `/TermsOfService`, `/ReferralLanding`) | V01, V02 |
| 4 | change-V04 | Auth/payment surface — audit + VR (`/Onboarding`, `/AcceptInvite`, `/PaymentSuccess`, `/PaymentCancelled`, `/AccountDeactivated`, `/pending-approval`, `/account-rejected`) | V01, V02 |
| 5 | change-V05 | App core — audit + authed VR (`/Dashboard`, `/MobileMore`, `/Settings` 12 tabs) | V01, V02 |
| 6 | change-V06 | Sales — audit + authed VR (`/Clients`, `/Clients/:id`, `/Clients/new`, `/DealTracker`, `/Sales`, `/LeadRadar`) | V01, V02 |
| 7 | change-V07 | Operations — audit + authed VR (`/Trials`, `/trials/:id`, `/trials/:id/edit`, `/Timeline`, `/TimeAndExpenses`, `/Team`) | V01, V02 |
| 8 | change-V08 | Billing — audit + authed VR (`/Approvals`, `/Invoices`, `/Bills`, `/Collections`) | V01, V02 |
| 9 | change-V09 | HotSeatHub — audit + authed VR (`/PotentialGigs`, `/HelpWanted`, `/HSHDirectory`, `/HotSeatHubMarketing`, `/Projections`) | V01, V02 |
| 10 | change-V10 | Documents + Manual — audit + VR (`/UserManual` + 6 manual pages, `/SignDocument`, `/ViewDocument`) | V01, V02 |

### Remediation + close (must be last)

| # | Change ID | Title | Depends on |
|---|-----------|-------|-----------|
| 11 | change-V11 | Drift remediation: fix every parity defect surfaced in V03–V10 (copy/color/missing-section/font/deep-link). Per RULE 0.3, fix systemic primitive bugs in the primitive, not per-page | V03–V10 |
| 12 | change-V12 | Pay down 37 `react-hooks/exhaustive-deps` warnings on heavy ported pages (HSH projections, dashboard widgets) | V03–V10 |
| 13 | change-V13 | Final gate: full gate trio green + full `pnpm test:bible-parity` + `pnpm test:visual-parity` ≤5% drift on every surface at 1440×900 + 375×667; Lighthouse a11y ≥90 on key pages | V11, V12 |

---

## Agent Recommendations

| Change | Recommended agent | Notes |
|--------|------------------|-------|
| V01 | `code-architect` | Extend existing harness; do not rebuild. Read `bible-vs-port.spec.ts` + `bible-parity.config.ts` first |
| V02 | `doc-updater` | Audit template + ledger; pure docs |
| V03–V10 | `e2e-runner` (VR) + manual bible read per page | Each: read bible `pages/<Name>.jsx` end-to-end, run RULE-0 gate, add/extend VR spec, record audit note |
| V11 | `gan-generator` or targeted edits | Fix scope depends on drift found; systemic fixes go in primitives (RULE 0.3) |
| V12 | `code-simplifier` | Mechanical `useMemo` wrapping; preserve behavior |
| V13 | `e2e-runner` | Final VR + Lighthouse run |

---

## Per-page RULE-0 acceptance gate (applies in V03–V10)

For each page, the audit note records PASS/FAIL on:

1. Bible source (`HotSeatersMVP/src/pages/<Name>.jsx`) read end-to-end.
2. Rendered DOM regions/sections/hierarchy match the bible.
3. Every visible string appears verbatim in the port (strict).
4. Every image asset locally hosted under `public/brand/` (no CDNs).
5. Every `var(--theme-*)` token the bible uses is referenced.
6. Every user-visible animation reproduced.
7. VR drift ≤5% at 1440×900 AND 375×667.
8. Deep links + CTAs route to the same destinations.
9. All business rules / calculations / validations / conditional renders /
   side-effects preserved (RULE J).

A page is NOT done until all nine pass or a deviation is explicitly recorded
and accepted.

---

## Reusable Existing Infrastructure

- `tests/visual-parity/specs/bible-vs-port.spec.ts` — live deployed-vs-deployed
  drift harness. **Extend `PATHS`**, don't replace.
- `tests/visual-parity/bible-parity.config.ts` — desktop + mobile projects.
- `tests/visual-parity/RUNBOOK.md` — capture/refresh workflow.
- `tests/e2e/fixtures/auth.ts` — `seedSession(page, 'owner'|'sales'|'trial')`
  for authed VR specs.
- `tests/e2e/fixtures/pglite.ts` — fresh-IDB auto-fixture.
- `pnpm test:bible-parity` / `pnpm test:visual-parity` / `:update` scripts.
- `tests/visual-parity/specs/font-diagnostic.spec.ts` — `getComputedStyle`
  template for RULE 0.4 font/color debugging.

---

## Wave Completion Gate

This phase is complete and the next phase can start when:

1. `pnpm typecheck && pnpm lint && pnpm test` green.
2. A RULE-0 audit note exists for every bible app surface (43 pages).
3. `pnpm test:bible-parity` shows ≤5% drift on every unauth surface (desktop +
   mobile).
4. `pnpm test:visual-parity` passes for every authed surface against committed
   baselines (desktop + mobile).
5. Zero `react-hooks/exhaustive-deps` errors (warnings ≤ a documented residual).
6. Lighthouse a11y ≥90 on Dashboard, Landing, Settings.
7. All drift defects from V03–V10 either fixed (V11) or recorded as accepted
   deviations with rationale.

---

## Blockers / Prerequisites

- **Authed-surface baselines (V05–V09)** need bible screenshots of authed pages.
  The bible app (`HotSeatersMVP`, has `vite dev`) must run locally with a seeded
  session to capture these once. The deployed-vs-deployed unauth path (V03–V04)
  has **no** blocker.
- Confirm disposition of the 4 unported dev/admin utilities (onboarding
  previews, RunMigration) — recommend recording as explicit out-of-scope in V02.

---

## Deferred / Out of Scope

- entity-management 2.0 transport-registry redesign (separate track).
- Porting `Doc*` bible pages as React (RULE 7 — they are `/manual` content).
- New features beyond bible parity.
- npm publish of entity-mgmt (needs credentials).
