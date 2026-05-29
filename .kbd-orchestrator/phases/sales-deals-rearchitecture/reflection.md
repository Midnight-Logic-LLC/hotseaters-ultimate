# Reflection / Verification — sales-deals-rearchitecture (D09)

_2026-05-29 (Claude Opus 4.8). Bible @ `29ae47e3`._

## Phase outcome: COMPLETE — 9/9 changes

The bible's Leads→Deals re-architecture is ported. Built D01→D08 with a
branch-per-change + two-stage review (spec-compliance → code-quality) loop;
D09 is this verification.

| Change | What | Disposition |
|--------|------|-------------|
| D01 | Deals-scope data layer (`use-deals-trials-data` + stage-transition rules over the trial entity; no migration) | ✅ DONE |
| D02 | DealTracker page + Kanban (@dnd-kit) | ✅ DONE |
| D03 | Deal wizard (4-step) + PDR calc | ✅ DONE |
| D04 | Sales-activity surface (+ wired D02/D03 deferrals) | ✅ DONE |
| D05 | Sales Hub retired (bible deleted Sales.jsx) | ✅ DONE |
| D06 | Revenue Projections re-port | ✅ DONE |
| D07 | Dashboard Needs-Attention leads→deals pivot | ✅ DONE |
| D08 | Lead Radar — KEEP working port page (bible downgraded to stub; owner-accepted deviation) | ✅ DONE (no code change) |
| D09 | Verification (this) | ✅ DONE |

## D09 verification results

### Gate trio — GREEN
- `pnpm typecheck` → **0 errors**
- `pnpm lint` → **0 errors** (17 warnings, all pre-existing `exhaustive-deps` in
  bills/collections/hsh/invoices pages — none in the deals feature)
- `pnpm test` → **547 passed / 547** (87 files; +115 net over the phase's 432 start)

### RULE J — business-rule coverage (the revenue/stage math)
9 pure modules, **102 tests**, all green:
- `deal-stage-transitions` (14) — won/restore/revert/restore-trial targets
- `pdr-calculations` (11) — projected daily revenue, all 4 billing branches
- `revenue-detail-aggregator` (27) — aggregate unpaid/revenue/projections × levels
- `revenue-projection-chart-data` (5) — weekly/monthly bucketing + cumulative
- `deal-kanban-buckets` (16) — next-step/trial-date/sales-stage bucketing
- `resolve-sales-activity-anchors` (5), `build-trial-services` (8),
  `activity-date-utils` (9), `guess-contact-email` (7)
Each verified bit-exact against the bible during spec review.

### Production build — GREEN
`pnpm build` → built in ~9s, all D01–D08 deal code compiles + bundles.

### Runtime smoke — GREEN (headless, local prod preview)
Loaded `/`, `/DealTracker`, `/Projections`, `/LeadRadar`, `/Dashboard`:
**zero pageerrors, no PGlite crash** on any route. Public `/` renders fully
(50,469-char DOM). Authed deal routes redirect to `/login` without a session
(expected — `#root` empty during redirect), mounting cleanly through the
bundled deal code.

### VR drift
`pnpm test:bible-parity` (deployed bible vs deployed port, unauth surfaces):
the over-gate findings are the **marketing pages** (`/`, `/Landing`, etc.) —
the PRE-EXISTING deployed-bible-ahead-of-source calibration issue documented in
`page-parity-verification-hardening/audits/_DRIFT-BACKLOG.md`, NOT a deals
change. Auth-utility surfaces are at parity. The deal surfaces (DealTracker,
Projections, deal wizard) are authed and cannot be VR'd against the deployed
bible without a session — a harness limitation; their parity rests on the
source-level spec reviews + the 102 RULE-J tests + the runtime smoke above.

## Two-stage review summary (what it caught across the phase)
The dual review earned its keep — real defects the automated gates missed:
- **D02:** hard-coded `userInfo`, "Add Contact" wrong handler, empty urgency
  banner; perf (unmemoized Kanban derivations).
- **D03:** a **revenue bug** — client-type multiplier read the wrong
  `extra_schema` key (shared D01/D02/D03 fix); stale client-overrides;
  `deal-wizard.tsx` over the 800-line RULE-A limit (split).
- **D04:** RBAC parity gap (non-admins could cascade-delete deals); **RULE B/D
  violations the linter missed** (components importing the store); two files
  over 800 LOC.
- **D06:** `monthly_breakeven` not wired into Tier1Company (breakeven line
  suppressed); unmemoized `company` churning the projection memo.
- **D07:** banner visibility dropped the bible's `is_sales` population.

## Accepted deviations (recorded)
- **Lead Radar** (D08): port keeps its working 437-LOC page; bible downgraded to
  a "Coming soon" stub. Port intentionally ahead — re-port only if the bible
  re-implements.
- **D04 cross-feature deferrals**: Google Tasks sync (backend automation, no
  seam), wider cascade-delete children (documents/HSH/billing stores not yet
  ported), secondary/FRP inline contact-create — all commented stubs naming
  owners.
- **D06 realized-revenue series**: invoices/payments bars empty until a deals-path
  billing read hook exists (billing surface); projection series is live.

## Lessons captured
1. **`git diff --name-status`, not `--stat`, for delete-vs-churn.** The phase's
   original gap-analysis misread `--stat` `-` numbers as deletions and nearly
   drove a wrong "retire Lead Radar" deletion. Always confirm D/M/A with
   `--name-status`, and READ the actual current bible file before acting on a
   "retire/downgrade" premise.
2. **Read the bible page content, not just the diff size**, before any
   reduce/delete. LeadRadar's "525 LOC" assumption was wrong — it's a 36-line
   stub. One `git show HEAD:<file>` settled it.
3. **Deleting working code to match a downgraded bible is a product decision** —
   surface it to the owner, never do it unilaterally (D08).
4. The two-stage review caught a revenue bug, an RBAC hole, and RULE B/D
   violations the CI gates passed — keep it for any non-trivial change.

## Recommended next
The Deals re-architecture is complete + verified. The remaining open item is
the **`page-parity-verification-hardening` phase** (V03–V13): the marketing-page
re-port (Landing dark-hero redesign) + per-page VR baselines, which is where the
~79% marketing drift gets resolved (independent of this phase). The Deal
surfaces should get authed VR baselines captured there too (needs the bible app
run locally with a seeded session).
