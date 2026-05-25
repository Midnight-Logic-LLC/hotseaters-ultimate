# change-414 — Pending-sync UX surface

## Why
Offline-first is invisible if the user can't see what's pending,
what's draining, what failed, and what's in conflict. The user-locked
decision (2026-05-25) is **global header chip** with a click-through
"Pending changes" panel.

## What changes
1. NEW `src/shared/ui/pending-sync-chip.tsx` — persistent header
   element, rendered in the app shell next to the user avatar. States:
   - `Online · All synced` (green dot)
   - `Online · Syncing N…` (spinner)
   - `Offline · N pending` (yellow dot)
   - `N failed` (red dot, attention)
   - `N conflict` (orange dot, attention)
2. NEW `src/shared/ui/pending-sync-panel.tsx` — opens from the chip.
   Sectioned: Pending / Draining / Failed / Conflicts. Each row shows:
   - Entity + row id (clickable → detail page)
   - Age (`3 minutes ago`)
   - Operation (Insert / Update / Delete / Send e-sign)
   - Last error (if any)
   - Per-row actions: Retry, Discard, View diff (conflicts only)
3. NEW `src/shared/ui/conflict-diff-modal.tsx` — side-by-side diff of
   local vs. server values. Buttons: "Keep my change" (re-queues as a
   fresh write with `updated_at = now()`), "Keep server" (discards local).
4. NEW selector `usePendingSyncSummary()` (from `useLocalWrites` plus
   `useNetworkStatus`).
5. Wire chip into:
   - `src/app/main-layout.tsx` (desktop shell) — top-right.
   - `src/components/mobile-bottom-tab.tsx` (mobile) — overflow menu
     entry "Pending changes (N)".
6. Toast on transitions (per user choice — global chip primary,
   transitions secondary): on `pending → synced` for the LAST drained
   row of a batch, fire a single "Synced N change(s)" toast (NOT one
   per row). On `pending → failed`, fire "1 change failed to sync —
   open panel" toast.
7. A11y: chip has `role="status"` + `aria-live="polite"`. Panel is a
   `<Dialog>` with focus trap.

## Out of scope
- Per-row badge in list views (`Clients` table, `Trials` table, etc.).
  Tracked as follow-up phase.
- Per-field tooltip on detail pages. Follow-up.

## Acceptance
- Cypress: offline → write 5 rows → chip shows `Offline · 5 pending`.
- Cypress: online → chip drains to `All synced` within 10s.
- Cypress: a forced 409 → chip shows `1 conflict`; clicking opens the
  panel; clicking the row opens the diff modal; "Keep my change" re-queues
  and drains.
- Lighthouse a11y score on the panel: ≥ 95.
- Visual parity: chip's resting state matches the bible header layout
  (no MVP equivalent — this is net-new but uses bible theme tokens).

## Tasks → see `tasks.md`.
