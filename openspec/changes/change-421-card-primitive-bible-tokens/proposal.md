# change-421 — Card primitive uses bible tokens, not hard ring

## Why
The port's `src/components/ui/card.tsx` overrides the bible's card chrome.
Current default classes:

```
overflow-hidden rounded-xl bg-card ... ring-1 ring-foreground/10
```

`rounded-xl` = 12 px (bible token is 8 px = `0.5rem`).
`ring-1 ring-foreground/10` resolves to a ~10% black hard ring (because
`--foreground` is `222 11% 9%` ≈ near-black). The bible uses a soft
stone border + drop shadow set via inline `style={}` on every Card,
binding to `--theme-card-radius / --theme-card-shadow / --theme-card-border
/ --theme-card-bg`. The port already DECLARES those tokens in
`src/index.css` (lines 119–122) — the primitive just doesn't use them.

Result, visible in the side-by-side screenshots: port cards look harsh
and box-y; bible cards have a soft 1 px stone border with a subtle
drop shadow and 8 px radius. The user's Rule #3 ("styles must precisely
match the bible") makes this a blocker.

Fixing this at the **primitive** level inherits the bible look across
every Card consumer (17 dashboard widgets + every other feature card)
without requiring per-consumer overrides — this is the right structural
fix and matches how the bible itself works (Card primitive defaults +
inline style overrides only when truly needed).

## What changes
1. EDIT `src/components/ui/card.tsx`:
   - REMOVE: `rounded-xl`, `ring-1 ring-foreground/10`, `bg-card`,
     `overflow-hidden`, and `py-4` from the default class string.
   - REMOVE the `*:[img:first-child]:rounded-t-xl` /
     `*:[img:last-child]:rounded-b-xl` since they hard-coded the wrong
     radius.
   - ADD inline `style={{ borderRadius: 'var(--theme-card-radius)',
     boxShadow: 'var(--theme-card-shadow)', borderWidth: 'var(--theme-card-border)',
     borderStyle: 'solid', borderColor: 'var(--theme-stone-200)',
     backgroundColor: 'var(--theme-card-bg)' }}`. (Allow per-call
     `style` prop to override via the spread, so consumers that already
     pass `style={...}` matching the bible continue to work.)
   - KEEP `flex flex-col gap-4 text-sm text-card-foreground` plus
     `data-size="sm"` variants — these are layout, not chrome.
2. EDIT `src/components/ui/card.tsx` `CardHeader`, `CardContent`,
   `CardFooter`: ensure their padding tokens match the bible
   (`--theme-card-header-padding`, `--theme-card-padding`,
   `--theme-card-footer-padding`). Where those tokens don't exist
   yet, ADD them to `src/index.css`'s `:root` block alongside
   `--theme-card-radius` etc.
3. AUDIT `src/index.css` to confirm `--theme-stone-200` (the border
   color in the bible) is defined. If not, add it from the bible's
   `index.css`.
4. VISUAL REGRESSION: extend the existing visual-parity harness
   (`tests/visual-parity/specs/dashboard-parity.spec.ts`) with a
   per-card snapshot test at 1440×900 vs the bible reference card
   crop. Drift ≤2 % per card.
5. UPDATE `src/components/ui/CLAUDE.md` (or create if absent) to
   document: "Card primitive binds bible `--theme-card-*` tokens by
   default. Do NOT pass `ring-*` or `rounded-*` overrides; if you
   need a different look, change the token in `src/index.css`."

## Out of scope
- Per-widget card overrides (Quick Stats, Recent Activity, etc.) —
  they inherit the fix automatically.
- Dark-mode token review — `--theme-card-*` values for `.dark` already
  exist (`src/index.css` line ~188); we'll spot-check them but not
  redo dark mode.
- Sidebar / page-shell typography (B.3 in the assessment) — separate
  follow-up; not in this phase's DoD.

## Tasks → see `tasks.md`.
