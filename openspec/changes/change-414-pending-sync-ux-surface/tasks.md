# Tasks — change-414

## 414.a — Selector hook
- [ ] T1. NEW `src/shared/hooks/use-pending-sync-summary.ts`. Combines `useLocalWrites()` + `useNetworkStatus()` into:
  ```ts
  type Summary = {
    online: boolean;
    pending: number; draining: number; failed: number; conflict: number;
    label: string;        // 'Online · All synced' | 'Offline · 5 pending' | ...
    severity: 'ok' | 'info' | 'warn' | 'error';
  };
  ```
- [ ] T2. NEW unit `use-pending-sync-summary.spec.ts`.

## 414.b — Chip
- [ ] T3. NEW `src/shared/ui/pending-sync-chip.tsx`. Uses Base UI v1 `<Tooltip>` for the hover label, lucide-react icons. Variants per `severity`. `role="status"`, `aria-live="polite"`.
- [ ] T4. NEW Storybook stub or component test `pending-sync-chip.spec.tsx`.

## 414.c — Panel + diff modal
- [ ] T5. NEW `src/shared/ui/pending-sync-panel.tsx`. Base UI `<Dialog>`. Sectioned. Empty states per section. Per-row actions wired to `useLocalWrites().retry/discard/forceLwwReapply`.
- [ ] T6. NEW `src/shared/ui/conflict-diff-modal.tsx`. Side-by-side diff using a tiny `diff-jsonb` util (`src/shared/lib/diff-jsonb.ts` — NEW). Buttons: "Keep my change" / "Keep server" / "Cancel".
- [ ] T7. NEW `src/shared/lib/diff-jsonb.ts` — pure function `diffJsonb(a, b) → { onlyA, onlyB, changed: { key, a, b }[] }`.
- [ ] T8. NEW unit `diff-jsonb.spec.ts`.

## 414.d — Wiring
- [ ] T9. Add `<PendingSyncChip />` to `src/app/main-layout.tsx` next to the user avatar. Mobile: add a "Pending (N)" item to the overflow menu in `src/components/mobile-bottom-tab.tsx`.
- [ ] T10. Toast policy: wire transitions in `src/shared/ui/sync-toast-bridge.tsx` (NEW). Coalesce per-batch successes; surface failures individually.

## 414.e — Cypress
- [ ] T11. NEW `tests/e2e/specs/pending-sync-chip.spec.ts` covering all 4 chip states + panel actions + diff modal flow.
- [ ] T12. Lighthouse a11y check on the panel — target ≥ 95.

## 414.f — Bible visual parity
- [ ] T13. Even though the chip is net-new, all colors/typography/spacing must come from `--theme-*` vars per RULE 0. No raw color values. Screenshot at 1440×900 + 375×667; archive in `tests/visual-parity/screenshots/`.

## Definition of done
- All Cypress + unit tests pass.
- Manual airplane-mode demo (write → see counts → reconnect → see drain) matches the proposal's acceptance criteria.
- Lighthouse a11y ≥ 95 on the panel.
- Code-reviewer agent + ui-ux-designer agent both sign off.
