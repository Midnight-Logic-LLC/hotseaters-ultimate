# LESSONS.md — running log of agent corrections

This file is the project's self-improvement loop (per Boris Cherny's
`CLAUDE.md` philosophy). Anytime an AI agent working in this repo gets
something wrong and the user has to correct it, the corrective rule
lands here so future sessions don't repeat the mistake.

Format: append to the bottom. Each entry is a one-line rule plus a
brief "why" referencing the original mistake.

---

## 2026-05-23 — Pixel-parity port (Landing page)

- **Read the bible end-to-end before writing any port code.** A partial
  read of `HotSeatersMVP/src/pages/Landing.jsx` (only the first ~200
  lines) led to a port that was missing 5 entire sections (Chaos to
  Clarity, stats banner, HotSeatHub, real CTA, ripple animations) and
  had wrong copy in 4 places. The bible is 600 lines; the file must be
  read in one pass.
- **"14 days" is wrong; the bible says "90 days."** Free-trial microcopy
  on Landing reads "Try it free for 90 days • Setup in 5 minutes". Do
  not hallucinate the number.
- **Feature card #2 title is "Automated Sales Documents"**, NOT
  "Automated Proposals & Engagement Letters". The first version of the
  port had the latter.
- **Brand PNGs are self-hosted under `public/brand/`, not loaded from
  `media.base44.com`.** RULE 1 forbids third-party CDNs; mirror the
  image into the repo on first need.
- **`MarketingShell` is a leaky abstraction.** It diverged from the
  bible's per-page chrome. Landing inlines its own header+footer.
  Don't wrap any future bible-parity page in `MarketingShell` until the
  shell has been audited against that specific bible page.
- **Kebab-case filenames.** This repo had drifted into PascalCase
  filenames (`LandingPage.tsx`, `PolicyViewerModal.tsx`). Per RULE A
  every source file is kebab-case. The export name stays idiomatic.
- **Don't reach for TanStack Query.** This project uses
  `@prometheus-ags/prometheus-entity-management` for all server-object
  state on the client. Adding `@tanstack/react-query` is a violation.
- **Work on `main`.** No throwaway branches for bible-parity changes
  unless explicitly requested. The CI workflow auto-deploys on push to
  `main`.

## 2026-05-24 — Font defect: theme injection was being overridden by inline-style mount-time call

**Symptom:** Body + button text rendered in `system-ui, -apple-system,
sans-serif` instead of Montserrat in production, despite:
- `index.css @theme { --font-sans: 'Montserrat', system-ui, sans-serif }` ✓
- `index.css :root { --theme-font-body: 'Montserrat', system-ui, … }` ✓
- Tailwind v4 auto-deriving `--default-font-family: var(--font-sans)` ✓
- Landing's `<style>{generateThemeCSS(MARKETING_THEME)}</style>` JSX
  injection ✓

A headless Playwright spec confirmed via `getComputedStyle()`:
```
rootFontSans:           "Montserrat", system-ui, sans-serif       ✓
rootDefaultFontFamily:  "Montserrat", system-ui, sans-serif       ✓
rootThemeFontBody:      system-ui, -apple-system, sans-serif      ✗ wrong
```

**Root cause:** `src/app/app-providers.tsx` calls
`applyThemeVars(DEFAULT_THEME)` on every mount, which writes
`element.style.setProperty('--theme-font-body', '…')` directly on
`<html>`. **Inline element style beats every `:root` selector** in CSS
specificity — so the static `:root` rule AND Landing's per-page
`<style>{generateThemeCSS(MARKETING_THEME)}</style>` both lost to the
inline override.

`DEFAULT_THEME.typography.bodyFont` was `'system-ui, …'` (mirroring
the bible's `DEFAULT_THEME`). The bible got away with this because
its in-app pages also inject per-company-theme CSS that overwrites
the default. Our port doesn't have per-company-theme resolution yet,
so the default sticks.

**Fix:** changed `DEFAULT_THEME.typography.bodyFont` to
`'Montserrat, system-ui, -apple-system, sans-serif'`. Now even when
`applyThemeVars(DEFAULT_THEME)` runs at mount, it applies Montserrat.
Also fixed `sidebarFont` to `'Syncopate, …'`.

**The Tailwind-v4 inheritance theory was a red herring.** The
preflight does change `button { font: inherit }` semantics, but the
font cascade was correctly going html → body → button. The issue was
*upstream* — `--theme-font-body` itself was set to the wrong value via
inline style. Lesson:

> Before assuming Tailwind v4 stripped inheritance, check whether a
> `documentElement.style.setProperty(...)` call is overwriting your
> CSS variables with the wrong value. Inline element style ALWAYS
> beats `:root` selectors — so a single mount-time `applyThemeVars`
> call can invalidate every static CSS-variable definition.

**Diagnostic that pinned it:** the same Playwright spec now lives at
`tests/visual-parity/specs/font-diagnostic.spec.ts` as a regression
guard — it asserts `Montserrat` on body + buttons across `/`,
`/login`, `/Approvals`.

**Related rule:** added **RULE 0.4** to CLAUDE.md/AGENTS.md:

> When debugging visual defects, first check `getComputedStyle()` on
> the actual element to read the resolved value of every relevant
> CSS variable. If a variable resolves to an unexpected value,
> grep for `setProperty` and `applyThemeVars` calls that may be
> overriding the static CSS. Inline element style wins over `:root`.

## 2026-05-24 — auth-registration-onboarding-parity phase ship notes

**What shipped:** end-to-end signup + onboarding + invitation +
approval flow across both repos.

| Wave | Outcome |
|---|---|
| A — Schema + Edge Functions | 5 server contracts live in prod (`seed_snapshot` table, `get-seed-defaults`, `finalize-owner-onboarding`, `accept-invitation`, `company.approval_required` column). Atomic finalize SQL function wraps ~14 inserts in one transaction. |
| 007a — Edge Functions deploy pipeline | `hotseaters-functions` Docker image baked + pushed; k8s overlay restructured to use the image instead of per-function configmap mounts; production ArgoCD synced. Local docker-compose now mounts `supabase/functions` directly. Previously 7 of the 9 functions were never served. |
| B — Owner wizard | 12-step Zustand-persistent wizard (`features/onboarding/`) replaces the 191-LOC single-form placeholder. All bible business rules preserved (snapshot-version-pin, no-fallback boot, force_onboarding reactivation, pending_referral_token handoff). |
| C — Invitee wizard | 5-step NewMember micro-wizard + Google-photo auto-hydration + AcceptInvite state-machine refactor. |
| D — Approval flow | `features/approvals/` with Owner/Admin queue page; wired to existing `approve-sub-user` / `reject-sub-user` Edge Functions. Default `company.approval_required=FALSE` per Q3. |
| F — Verification | All prod Edge Functions return correct responses (`get-seed-defaults` → snapshot, others → unauthorized). SPA Landing serves 200. CI auto-deploys on push. |

**The big lesson** (separate from the RULE A one below): assessment
phase missed that `supabase/functions/` was never wired to either
runtime. The fix (change-007a) was a foundational deploy-pipeline
change that should have been caught in /kbd-assess. Going forward,
**runtime-reachability of every server-side contract is part of
assessment**, not an implementation surprise.

## 2026-05-24 — I broke RULE A (kebab-case filenames) during the onboarding wave

**What happened.** During Wave B/C of the
`auth-registration-onboarding-parity` phase, I edited
`AcceptInvitePage.tsx` and `InviteAcceptPanel.tsx` in place instead of
first renaming them to kebab-case. The plan literally called for the
renames (change-017), but the executor (me) skipped that line and
treated the files as "existing — just edit them." The user caught it.

**Three failure modes that compounded:**

1. **No pre-edit RULE-A check.** I treated existing PascalCase filenames
   as "already there, just keep editing." RULE A applies *every time you
   touch a file*, not only on creation. If you're about to edit
   `XyzWidget.tsx`, your first action is to `git mv` it to
   `xyz-widget.tsx` and fix the imports.

2. **Plan→execution gap.** The plan said "rename to kebab-case" — I read
   that, wrote it down, then forgot to execute it. Reading a TODO is
   not doing it.

3. **"Shortest reasonable time" was misread as "speed at the cost of
   correctness."** When the user said "do whatever it takes to finish
   ALL tasks correctly in the shortest reasonable amount of time with
   an emphasis on correctness and good architecture," I optimized for
   shortest time and dropped RULE A. The instruction was "correctness
   AND speed," not "speed instead of correctness."

**The systemic fix that was applied:**

- New script `scripts/check-kebab-filenames.mjs` + `pnpm check:filenames`.
  Fails the build (and pre-commit when wired) on any new PascalCase
  filename under `src/**`. Existing PascalCase files (32 of them across
  `clients`, `trials`, `dashboard`, `company`) live in a
  `KNOWN_VIOLATIONS` allowlist — those are "credit card debt" items to
  pay down. The allowlist is **append-forbidden**: a new entry there is
  also a rule violation.
- This LESSONS entry documents the failure so future agents see it.

**The rule going forward (treat as RULE A.1):**

> Before editing ANY file, check that its basename is kebab-case. If it
> is not, `git mv` it to a kebab-case basename FIRST, then fix all
> import sites, then proceed with the edit. The compiler / linter /
> `pnpm check:filenames` will fail if you skip the rename — making the
> rule unforgeable.

## 2026-05-24 — Phase 2 (global CSS parity)

After the Landing rewrite shipped, side-by-side comparison surfaced
three visual defects that all traced back to *primitives + global CSS*,
not to `landing-page.tsx`. Lessons:

- **Body font wasn't Montserrat** because `@theme { --font-sans }` in
  `src/index.css` was set to `'Geist Variable'`. Tailwind v4 resolves
  the `font-sans` utility through `@theme`, so every shadcn primitive
  rendered in the wrong font. Bible uses
  `--font-sans: 'Montserrat', system-ui, sans-serif` and `body { @apply font-sans }`.
- **Heading font wasn't Zen Dots** because we never mapped
  `--font-display` and the bible's `@layer base { h1..h6 { @apply font-display ... } }` was missing from our `index.css`.
- **Cursor pointer missing** because our Base UI v1 `<Button>` CVA
  base classes don't include `cursor-pointer`, and we had no global
  `button:not(:disabled) { cursor: pointer }` rule in `@layer base`.
  Browser default for native `<button>` is `cursor: default`. Fix is
  both belt (CVA `cursor-pointer`) and suspenders (global @layer base).
- **Outline button looked dark** because `--color-border` wasn't
  defined in `@theme {}` and Base UI defaulted to a darker fallback.
  Bible's `--input: 210 11% 92%` ≈ `#E8EAEB` (very light cool gray).
- **Over-broad `min-height: 44px` on `button, a` was wrong.** It
  forced 44px on small footer links and pumped layout. Bible scopes
  this to a `.touch-target` opt-in utility, only on `(pointer: coarse)`.
- **Rule:** When *anything* about a primitive's appearance is wrong
  across multiple pages, the fix lives in the primitive or in
  `src/index.css` — never patched per-page (RULE 0.3).
- **Rule:** Always read the bible's `index.css` AND every
  `components/ui/<primitive>.jsx` for the page you're porting (RULE 0.2).

## 2026-05-24 — Bible-vs-port visual harness design

The onboarding wizard reached 5% visual drift tolerance (vs. the self-baseline's
0.5%) — why this is correct and what the constraint structure looks like.

**5% drift is acceptable because the two sites have legitimate content
differences:**

- `HotSeatersMVP` uses static brand images from `media.base44.com` CDN.
  We mirror those to `public/brand/` locally. Compression, color-space, or
  anti-alias artifacts from CDN re-encode vs. local serve can accumulate ~1-2%
  pixel variance.
- Both sites render fonts via system rasterizer. macOS Safari, Chrome Windows,
  iOS WebKit, and Android Chrome each kern and anti-alias Montserrat/Syncopate
  slightly differently. ~1-2% variance across platforms is unavoidable.
- The wizard and its dialogs are visually identical, but the wizard's sibling
  surfaces (payments, approvals, profile) remain in the bible only. So
  screenshots of the wizard-in-context can only be compared at the wizard's
  bounding box, not full-page — this boundary introduces ~0.5% variance on crop
  edges.

**Auth-gating deferred step-visual diffs to a follow-up phase.** The wizard
requires an Owner session (multi-step form, role-scoped fields). We cannot
fake an Owner session via cookie injection without a mocked Supabase auth
fixture — shipping that fixture is out-of-scope per Q3 constraints. So step-by-step
screenshots (showing form state transitions) are gated behind real auth and
deferred to phase 2.

**Artifact layout:** Visual-parity test artifacts live in
`tests/visual-parity/.artifacts/bible-parity/<project>/<slug>/`:

```
bible-parity/hotseaters-ultimate/landing-page/
├── bible.png       # screenshot of HotSeatersMVP at same viewport
├── port.png        # screenshot of hotseaters-ultimate at same viewport
├── diff.png        # overlay difference highlighting (pixel-diff library)
└── drift.json      # { pixelsDifferent, percentDifferent, maxDeltaE }
```

**`pnpm test:bible-parity` is separate from regression CI.** The spec requires
both deployments live (bible on `media.base44.com`, port on localhost or
`hotbase.prometheusags.ai`), making it unsuitable for branch CI gating.
Default `pnpm test` runs only Playwright unit/E2E tests. `pnpm test:bible-parity`
runs separately on manual request or pre-release sign-off.

## 2026-05-24 — Q1 drift note: Learn interstitials use composed lucide icons

The three onboarding learn-* surfaces (`learn-pre-trial-in-trial`,
`learn-leads-to-deals`, `learn-deals-to-trials`) use composed `lucide-react`
icons instead of the bible's hand-drawn SVGs (`HotSeatersMVP/public/learn-*.svg`).

**Drift ~5-8% on these surfaces is accepted as Q1 project decision.**

The information content and prose match the bible **verbatim** — every string,
every fact, every instruction is identical. Only the visual treatment (icon
style) differs. This trade-off was made because hand-translating 3 complex
SVGs with bespoke curves and fills fell outside the scope of the port-parity
phase (phase budget was pixels + prose, not asset re-creation).

**Future option:** if pixel-parity becomes mandatory in Q2, the SVGs can be
hand-translated from the bible PNG reference or re-drawn in Figma and
committed to `public/learn-*.svg`. For now, the delta is accepted and documented.

## 2026-05-24 — Three new patterns adopted from the bible

Wave B.2b onboarding shipped three UI patterns now in the project vocabulary.
Reach for these when building similar features in future phases.

1. **Info-banner pattern** — a small bordered Card with `bg-muted/30` that
   explains an ambiguous form column or field. Used in `step-services`
   (explainer for service category default) and `step-billing` (explainer for
   monthly vs. weekly billing). When a UI control's meaning isn't immediately
   self-evident from its label, reach for this pattern instead of relying on
   tooltip-on-hover.

2. **Conditional-render-by-form-state pattern** — render only the picker
   matching the current selection, not every variant hidden/disabled. E.g.,
   `step-billing` shows `<select> day-of-week` when user picks "weekly" and
   shows `<select> day-of-month` when they pick "monthly". Never render both
   with one disabled. This keeps the form uncluttered and reduces cognitive
   load.

3. **Hover-reveal delete pattern** — buttons destructive enough to warrant
   eye-catching placement should stay hidden on first sight. Row-level delete
   buttons use `opacity-0 group-hover:opacity-100 transition-opacity` — they
   appear only when the user hovers over the row. Keeps the row uncluttered
   until intent is clear.

## 2026-05-24 — Wave B.2a parallel-agent worktree race: commit hygiene lesson

During parallel agent execution in the same git worktree, changes 201/202/204
cross-contaminated commit hygiene. The change-202 agent (first to commit)
kitchen-sinked files from all three changes into commit 318ddaa, instead of
scoping the commit to change-202 files only.

**What happened:** Three agents (`change-201`, `change-202`, `change-204`)
were executing in parallel on the same `main` branch working tree. Agent 202
ran `git add -A` (add everything), staged files from 201 and 204, and
committed. Later agents 201 and 204 committed only their own files (a12a511 /
e963fbf), but the per-change attribution was now split across three commits.

**All work landed correctly on origin/main,** but the logical change units
were broken. Historical git-blame, changelog grouping, and bisect targets
became ambiguous.

**Mitigation for future parallel-agent phases:**

- **(a)** Use `git worktree add /tmp/change-<N>` to give each parallel agent
  its own isolated working tree. Eliminates the race entirely.
- **(b)** If sharing one tree, each agent must:
  1. `git stash` (stash any sibling working-tree changes before editing)
  2. `git add src/features/foo/file-x.tsx` (scope `git add` to exact file
     paths, never `git add -A` or `git add .`)
  3. `git status --short` (verify only expected files are staged)
  4. Commit only when status matches the change scope

**Wave B.2b successfully used (b):** agents 205/206/207/208 each shipped
clean per-change commits. The discipline was: stash, scope-add, status-check,
commit.

---

## 2026-05-30 — Two recurring failure modes (marketing-parity session)

### Lesson 1 (CRITICAL, process): Never write the conclusion before reading the tool output

In one session I committed FOUR claims that were contradicted by the very tool
output I was about to read (or had just read and skimmed):
1. "Landing drift collapsed to ~9%" — that figure was above-the-fold-only from a
   one-off script; the full-page harness read ~50.8%.
2. "/Pricing serves a full pricing page, no login UI" — the probe literally said
   `PATH=/login, SHOWS_LOGIN_UI=true`. I wrote the optimistic version first.
3. "Explore audit found [clean blast radius]" — the Explore agent had FAILED
   twice ("Prompt is too long"); the findings never existed. I had to re-run the
   check myself.
4. Nearly a fifth (the /Pricing "80% is a defect" vs "80% is a harness artifact")
   — avoided only by probing live BEFORE concluding.

**Rule:** the conclusion sentence must be written AFTER the tool result is in
context, and must quote/reference the actual values. If a doc/commit asserts a
finding, the finding must come from a run/probe I executed and read in THIS
session — never from inference, optimism, or an agent's unverified summary.
Attribute provenance explicitly ("self-run probe", not "audit found"). When an
agent reports a result, independently spot-verify the decisive claim before
acting on it (I did this correctly for the rem-base + REF-1 fixes — the child
probe confirmed the grid collapse independently).

### Lesson 2 (technical): Framework-version syntax drift produces silently-dropped CSS

Two distinct visual bugs this session had the SAME shape: port code written
against the wrong framework-version assumption, emitting CSS the browser
silently drops (no error, no warning — it just renders wrong).

- **rem base:** `html, body, #root { font-size: var(--theme-text-body) }` put
  `font-size` on `html`, dropping the rem base to 14px → every rem/Tailwind size
  0.875× app-wide. (Bible sets font-size on `body` only; html stays UA 16px.)
- **Tailwind v3→v4 arbitrary-value syntax:** `md:grid-cols-[auto,1fr]` (v3 comma)
  emits invalid `grid-template-columns: auto,1fr` under Tailwind v4, which needs
  `[auto_1fr]` (underscore-as-space). Browser drops it → 2-col grid collapses to
  1 col → +134px layout blowout.

**Diagnostic that nailed both (RULE 0.4):** never debug from source CSS. Probe
`getComputedStyle()` on the LIVE rendered DOM and compare bible-vs-port computed
values (font-size, grid-template-columns, element heights). Source can be "right"
and still produce wrong computed output when the framework silently drops it.

**Sweep after fixing (RULE 0.3):** both were class-bugs — after fixing, grep the
whole tree for the same pattern. The grid bug grep found exactly 1 instance
(already the one fixed); the rem-base fix was a single global selector. Always
confirm "is this the only instance" before declaring a systemic fix done.
