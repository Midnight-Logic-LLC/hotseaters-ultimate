# Tasks — change-420

- [x] T1. EDIT `packages/prometheus-entity-management/src/hooks.ts`
  `useEntityList`. Change the bare object `return { items, ids: ..., isLoading: ..., ... }`
  at the end of the function (around line 124) to
  `return useMemo(() => ({ items, ids: listState.ids, isLoading: ..., ... }), [items, listState, fetchNextPage, doFetch])`.
  Keep the `useShallow(itemsSelector)` call at line 108 unchanged.
- [x] T2. Verify the change compiles inside the submodule:
  `cd packages/prometheus-entity-management && pnpm typecheck`.
- [x] T3. Run the submodule's own test suite: `pnpm --filter
  @prometheus-ags/prometheus-entity-management test`. Must stay green.
- [x] T4. Rebuild: `pnpm --filter @prometheus-ags/prometheus-entity-management build`.
  Confirm `dist/index.mjs` includes the new `useMemo(() => ({ items,`
  return shape (grep the built file).
- [x] T5. From the superproject, run `pnpm typecheck && pnpm test`. Must
  stay 298/298 green.
- [/] T6. **DEFERRED to user manual verification.** `pnpm dev` → open `/Dashboard` → DevTools
  Console. The `The result of getSnapshot should be cached to avoid an
  infinite loop` warning must be absent. Capture a screenshot of the
  clean console for the verification record.
- [/] T7. **DEFERRED to change-424 diagnostic.** Verify dashboard data flows: with §A.1 fixed, Quick Stats →
  Team Members should now show a non-zero count if the user has team
  members in `user_info` (this is also exercised more rigorously in
  change-424).
- [x] T8. Update `packages/prometheus-entity-management/CHANGELOG.md`
  with a `## 1.3.1` entry citing this assessment's §A.1 and the
  zustand discussion linked in the proposal.
- [x] T9. Bump `packages/prometheus-entity-management/package.json`
  version from `1.3.0` to `1.3.1`.
- [x] T10. Commit inside the submodule (SHA `4b46b53`); pushed to `origin/main`.
  `git -C packages/prometheus-entity-management commit -am "fix(hooks): memoize useEntityList return for React 19 useSyncExternalStore stability"`.
- [/] T11. **DEFERRED by user.** Publish: `cd packages/prometheus-entity-management && pnpm publish`.
  npm credentials not present on this machine; user opted to skip the publish step for this change. The local app loop works via the `workspace:*` link; downstream consumers will pick up 1.3.1 in a later batch. CHANGELOG + version bump remain; just `pnpm publish` to ship.
- [x] T12. From the superproject, `git add packages/prometheus-entity-management`
  to bump the submodule SHA. Commit: `e38d64f chore(submodule): bump prometheus-entity-management to 1.3.1 (fixes getSnapshot loop)`.
- [x] T13. Document the submodule-fix loop in `docs/RUNBOOKS.md` under a
  new "Iterating on `@prometheus-ags/prometheus-entity-management`"
  section. Commit `1b696f2`.


  new "Iterating on `@prometheus-ags/prometheus-entity-management`"
  section: edit submodule src → rebuild → app picks up via workspace
  link → confirm in DevTools → version-bump → npm publish → superproject
  submodule pointer commit.

## Acceptance

- DevTools Console at `/Dashboard` is clean of the `getSnapshot should be
  cached` warning across at least three consecutive page loads.
- 298/298 unit tests stay green.
- `npm view @prometheus-ags/prometheus-entity-management` lists `1.3.1`.
- The superproject `git log` shows the submodule-pointer-bump commit
  pointing at the new HEAD of `Prometheus-AGS/prometheus-entity-management`.
- A future regression of this same pattern is preventable: anyone
  hitting `getSnapshot should be cached` from this codepath can now
  follow the documented loop in RUNBOOKS.
