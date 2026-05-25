# Wave 1 brief — change-401-routing-redirect-last-route

You are an implementer for the `hotseaters-ultimate` project at
`/Users/gqadonis/Projects/midnight/hotseaters-ultimate`.

## Read first (in this order)

1. `openspec/changes/change-401-routing-redirect-last-route/proposal.md`
2. `openspec/changes/change-401-routing-redirect-last-route/tasks.md`
3. `openspec/changes/change-401-routing-redirect-last-route/specs/auth-routing/spec.md`
4. `.kbd-orchestrator/phases/dashboard-and-data-architecture-parity/plan.md` (Change 401 section)
5. `HotSeatersMVP/src/App.jsx:97-100` — the bible's landing redirect.
6. `HotSeatersMVP/src/Layout.jsx:364-419` — the auth-branching logic to
   port.
7. `HotSeatersMVP/src/Layout.jsx:443-479` — the lastViewedPage writer.
8. `src/app/app-router.tsx` — current routes.
9. `src/features/landing/pages/landing-page.tsx` — current Landing
   render.
10. `src/features/auth/stores/auth-store.ts` and
    `user-info-store.ts` (or wherever the userInfo store lives).

## Constraints (non-negotiable)

- **RULE 0 (bible parity):** branch order in `landing-page.tsx` MUST be
  byte-for-byte identical to `Layout.jsx:364-419` (pending invite → no
  userInfo → inactive → no company → last-viewed → /Dashboard).
- **NEVER use `window.location.replace`** inside React-Router-controlled
  surfaces. Use `<Navigate to=... replace />`.
- Skip-list MUST match the bible exactly.
- 500 ms debounce on the lastViewedPage writer.
- No TODOs, no `any` casts, no console.log debug noise in the final
  commit.

## Tasks (work through `tasks.md` in order)

1. T1. Add `patchPreferences(patch)` to the userInfo store.
2. T2. NEW `src/app/last-route-tracker.tsx`.
3. T3. Unit spec for the tracker.
4. T4. Rewrite `landing-page.tsx` body with the branch table.
5. T5. Add the `/dashboard` lowercase alias and mount `<LastRouteTracker>`
   in `app-router.tsx`.
6. T6. Playwright `auth-and-dashboard-reach.spec.ts` (4 cases).
7. T7. `pnpm typecheck && pnpm test && pnpm test:e2e` green.
8. T8. Commit `change-401: routing redirect + last-route` and push to
   `main`. Do NOT open a PR — direct push is project policy.

## When done

1. Tick every `[ ]` in `tasks.md` to `[x]`.
2. Run `openspec validate change-401-routing-redirect-last-route`.
3. Update `.kbd-orchestrator/phases/dashboard-and-data-architecture-parity/progress.json`:
   - `change_state["change-401-routing-redirect-last-route"] = "DONE"`
   - `changes_completed = 1`
4. Report back the commit SHA, the four E2E case results, and any
   deferred work.
