# Plan — dashboard-bible-parity-build (Regression Round B: changes 420–424)

> This plan SUPERSEDES the earlier 405–409 plan for the *regression
> round* that follows the post-build dashboard defects identified in
> `assessment.md` §A–C. The original 405–409 plan and its execution
> remain valid and committed; this plan tracks the follow-on work to
> reach the bible-parity DoD now that the regression is understood.

## Context

Five-change ordered series, OpenSpec backend, sequential dependencies:

```
change-420 (entity-mgmt submodule fix — keystone)
       │
       ▼
change-421 (Card primitive bible tokens)         ← independent of 420 but
       │                                           ships with it for the
       │                                           combined visual+data fix
       ▼
change-422 (Welcome header parity)               ← independent; 2-line fix
       │
       ▼
change-423 (Recharts submodule OR no-op)         ← GATED on observation
       │                                           after 420 lands
       ▼
change-424 (Team Members data root cause)        ← diagnostic + targeted
                                                   fix after 420 lands
```

420 is the **keystone**: it stabilizes the snapshot identity that
`useSyncExternalStore` consumes, which most likely (a) eliminates the
recharts loop as a side-effect and (b) unblocks every Tier-A and
hybrid `useEntityList` consumer, which most likely unblocks the
Team Members count and other empty widgets.

421 + 422 are parallel-safe cosmetic + copy fixes; they're sequenced
after 420 so any rebuild/test cycle they trigger benefits from the
fixed data flow.

423 and 424 are **gated on observation** — we run the dashboard
AFTER 420–422 land and check whether the recharts loop / data
mismatch persists. If they don't, those changes close as no-op
diagnostic records. If they do, they take their respective
investigation-then-fix paths.

## Execution order

| Wave | Change | Title | Primary agent | Risk | Gated? |
|---|---|---|---|---|---|
| W1 | 420 | Memoize useEntityList in entity-mgmt submodule | typescript-reviewer + tdd-guide | Low (1-line library fix) | No |
| W2 | 421 | Card primitive uses bible tokens | ui-ux-designer + typescript-reviewer | Low (single primitive) | No |
| W3 | 422 | Welcome header fallback parity | typescript-reviewer | Trivial | No |
| W4 | 423 | Recharts submodule OR no-op | typescript-reviewer | Med (only if Phase 2B fires) | YES — gated on T1 retest |
| W5 | 424 | Team Members data root cause | tdd-guide + database-reviewer | Med (RLS / auth surface possible) | YES — gated on T1 diagnostic |

## Parallelism

Strictly sequential per wave. Each change consumes the prior wave's
verification. 423 + 424 share the "post-420 retest" step but can run
in either order once that retest is recorded.

## Dependencies

- 420 has no dependencies on 421/422/423/424.
- 421 has no hard dep on 420 (it's a primitive rewrite), but is
  sequenced after to keep the visual-regression baseline stable.
- 422 has no hard dep on 420.
- 423 is gated on `pnpm dev` console state AFTER 420+421+422.
- 424 is gated on Network-tab observations AFTER 420 lands.

## Definition of Done (this regression round)

Layered on top of the existing phase DoD already in `progress.json`:

1. DevTools Console at `/Dashboard` clean of:
   - `getSnapshot should be cached to avoid an infinite loop` (420).
   - `Maximum update depth exceeded` (423 or side-effect of 420).
   - `width(-1) height(-1) of chart should be greater than 0` (423
     or side-effect of 420).
2. Card chrome at 1440×900 matches the bible's soft 1 px stone border
   + drop shadow + 8 px radius (421); per-card visual regression ≤2 %
   drift.
3. Welcome header reads "Welcome back, User" pre-hydration and
   "Welcome back, <FirstName>" post-hydration; no missing-comma flash
   (422).
4. Quick Stats → Team Members value === bible value for the same user
   (424).
5. `@prometheus-ags/prometheus-entity-management@1.3.1` published to
   npm (420). Submodule pointer in `hotseaters-ultimate` advanced.
6. `pnpm typecheck && pnpm lint && pnpm test` stay 298/298+ green
   throughout.
7. `docs/RUNBOOKS.md` documents:
   - The submodule-fix loop for entity-mgmt (added by 420).
   - The recharts submodule loop OR the existing tarball loop with a
     "when to upgrade to a submodule" pointer (added by 423).

## Implementation notes

### 420 — entity-mgmt memoize fix (1-line library change)

The change is one `useMemo` wrap. The hard part is the publish-and-
submodule-bump dance:

1. Edit `packages/prometheus-entity-management/src/hooks.ts`.
2. Rebuild via the submodule's own `pnpm build`.
3. App picks up the change instantly through `workspace:*` link.
4. Test in browser. Confirm clean console.
5. Bump submodule version 1.3.0 → 1.3.1, update CHANGELOG.
6. `git commit` inside submodule; `git push origin main`.
7. `npm publish` from inside the submodule.
8. Back in superproject: `git add packages/prometheus-entity-management`
   to commit the new SHA. Push. CI installs the new SHA.

Document this loop in `docs/RUNBOOKS.md` so a future contributor
doesn't repeat the prior round's wrong-directory mistake (which
edited the unrelated `latest-data/packages/...` copy).

### 421 — Card primitive

Remove `rounded-xl`, `ring-1 ring-foreground/10`, `bg-card`,
`overflow-hidden`, and `py-4` from the default class string. Add
inline default `style={{ borderRadius, boxShadow, borderWidth,
borderStyle, borderColor, backgroundColor }}` reading from
`--theme-card-*` tokens. Spread `props.style` AFTER so per-call
overrides still win. Add `--theme-stone-200` and `--theme-card-*-padding`
tokens to `src/index.css` if absent.

Visual regression baseline must be refreshed against the bible
(`pnpm test:visual-parity:update` with the bible app running).

### 422 — Welcome header

```tsx
// before
Welcome back{userInfo?.first_name ? `, ${userInfo.first_name}` : ''}
// after
Welcome back, {userInfo?.first_name || 'User'}
```

Two-token diff. Spec covers loading / hydrated / falsy states.

### 423 — Recharts conditional

After 420–422, take a clean DevTools console screenshot at
`/Dashboard`. If both `Maximum update depth exceeded` and `width(-1)`
are gone, close 423 as no-op with the screenshot for record. If
either persists, take the submodule path: `git submodule add`,
`workspace:*` pin, identify the patch point, fix in source, rebuild,
SHA-bump.

### 424 — Team Members diagnostic

After 420 lands, open Network tab, inspect the `user_info` REST call.
Branch on observation. The latent `status: 'active'` parity fix from
the bible's `Dashboard.jsx:209` ships in every branch since it's
correct regardless of which root cause fires.

## Risk register

- **Submodule SHA not bumped**: forgetting to `git add
  packages/prometheus-entity-management` in the superproject after
  420 means CI installs the old SHA and the `getSnapshot` warning
  returns. Mitigation: documented in RUNBOOKS + 420 T12.
- **`workspace:*` + `npm publish` interaction**: pnpm rewrites
  `workspace:*` deps to actual versions on publish. The submodule's
  own deps must use `workspace:*` or pinned versions; confirm before
  T11. Mitigation: 420 T11 explicit verification step.
- **Recharts submodule cost**: adopting recharts as a submodule
  means we own its build pipeline forever. Mitigation: 423 is
  gated; we only adopt if the no-op path fails.
- **RLS regression**: if 424 lands in branch C (RLS-rejected), the
  migration goes in `latest-data/supabase/migrations/` and requires
  the migration runbook. Mitigation: 424 T6C explicit migration
  step.

## Sources

See `assessment.md` §I for the full source list (recharts upstream
issues, zustand discussion #1936, pnpm workspaces docs, bible
`Dashboard.jsx`).
