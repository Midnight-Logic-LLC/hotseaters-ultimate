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
