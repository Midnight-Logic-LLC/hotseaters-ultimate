# Tasks — change-421

- [x] T1. EDIT `src/components/ui/card.tsx` `Card` function: removed
  `rounded-xl`, `ring-1 ring-foreground/10`, `bg-card`,
  `overflow-hidden`, `py-4`, and the `*:[img:first-child]:rounded-t-xl`
  / `*:[img:last-child]:rounded-b-xl` selectors from the default
  class string. `props.style` spread AFTER the new default `style`
  so consumer overrides win.
- [x] T2. Added the bible-binding default `style={}` to `Card`:
  `borderRadius: var(--theme-card-radius)`,
  `boxShadow: var(--theme-card-shadow)`,
  `borderWidth: var(--theme-card-border)`, `borderStyle: 'solid'`,
  `borderColor: var(--theme-stone-200)`,
  `backgroundColor: var(--theme-card-bg)`. Lifted into a module-level
  `cardDefaultStyle` constant for stable identity + readability.
- [x] T3. EDIT `src/components/ui/card.tsx` `CardHeader` /
  `CardContent` / `CardFooter`: padding bound to
  `--theme-card-header-padding` / `--theme-card-padding` via inline
  `style`; consumer `style` spread last so per-call overrides still
  win. Removed the hard `px-4` / `rounded-t-xl` / `p-4` / `rounded-b-xl`
  classes since the tokens supersede them.

  *Deviation from the original proposal*: a `--theme-card-footer-padding`
  token does NOT exist in the bible (`HotSeatersMVP/src/index.css`)
  and was never declared in the port. Used `--theme-card-padding`
  for the footer to match the bible's `p-6 pt-0` semantics. Documented
  in the primitive's comment block.

  *Deviation #2*: `CardContent` default is `padding: var(--theme-card-padding)`
  on ALL four sides, NOT `paddingTop: 0`. The bible widgets explicitly
  override with `style={{ padding: 'var(--theme-card-padding)' }}`
  (Dashboard.jsx:935 etc.), so the effective bible behavior is
  all-sides padding. Consumers needing `pt: 0` (matching the bible's
  raw primitive default) can still override via `style`.

- [x] T4. Confirmed `--theme-stone-200` is declared in `src/index.css`
  for both `:root` (line 74: `#E7E5E4`) and `.dark` (line 196:
  `#44403c`). No new token required.
- [x] T5. Audited dashboard widgets that pass `style={cardStyle()}`
  (`quick-stats-card`, `quick-actions-bar`, `sales-pipeline-chart`,
  `weekly-team-performance`, `upcoming-trials-card`, etc.). The new
  primitive defaults match exactly what `cardStyle()` was setting,
  so existing widget overrides remain semantically no-ops (and stay
  in place for now to be safe). `_styles.ts cardStyle()` deprecation
  noted in `src/components/ui/CLAUDE.md`.
- [x] T6. `pnpm typecheck && pnpm test`. **298/298 green.** Typecheck
  clean.
- [/] T7. **DEFERRED to user manual baseline refresh.** Per-card
  visual-regression tests should be added to
  `tests/visual-parity/specs/dashboard-parity.spec.ts`. The existing
  spec already covers full-page dashboard parity; per-card cropping
  requires bible-server-side baseline captures (T8) before tests are
  meaningful. Will land alongside T8.
- [/] T8. **DEFERRED to user.** `pnpm test:visual-parity:update`
  requires the bible app (`HotSeatersMVP`) running locally and a
  parallel port `pnpm dev` to capture fresh side-by-side baselines.
  User has the bible / port environments; agent can't drive both.
  Once user runs the update, commit the new baselines under
  `tests/visual-parity/baselines/dashboard-*.png`.
- [/] T9. **DEFERRED to user manual verification.** Side-by-side at
  1440×900: port `/Dashboard` vs bible `/Dashboard`. Expected: card
  chrome visually indistinguishable — soft 1 px stone border, subtle
  drop shadow, 8 px radius, white background, no hard black ring.
  If anything looks off, that's the signal to reopen this change.
- [x] T10. UPDATED `src/components/ui/CLAUDE.md` (created from
  scratch). Documents the token-binding contract for Card, why
  `ring-*` etc. must never return, the spread-order rule, the
  anti-pattern list, and how to deviate deliberately. The May 2026
  ring-1 regression is named in the file as a worked example.

## Acceptance

- ✓ Card primitive default chrome bound to `--theme-card-*` tokens.
- ✓ `ring-1 ring-foreground/10` is gone; replaced by token-bound
  border + drop shadow + radius + bg.
- ✓ 298/298 unit tests green; typecheck clean.
- ✓ `src/components/ui/CLAUDE.md` documents the binding so a future
  agent doesn't reintroduce ring overrides.
- ⌛ Per-card visual regression with fresh bible baselines: deferred
  to user manual run + commit of baselines.
- ⌛ Visual side-by-side confirmation at 1440×900: deferred to user.

## Verification commit

- `93c6621` — primitive rewrite + ui/CLAUDE.md.
- (deferred) baseline-refresh commit landing the per-card VR tests
  once bible captures are available.
