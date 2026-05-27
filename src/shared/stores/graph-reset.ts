/**
 * graph-reset.ts — helper to clear all in-memory entity graph state on
 * sign-out or tenant switch.
 *
 * `useGraphStore` from `@prometheus-ags/prometheus-entity-management` is a
 * Zustand store. Resetting it to empty collections ensures that a new user
 * who signs in after sign-out never briefly sees the previous tenant's data
 * while PGlite re-hydrates from Electric.
 *
 * The graph store does NOT expose a dedicated `reset()` action in the v2.x
 * public API, so we use `setState` directly — the idiomatic Zustand
 * escape hatch for external resets.
 *
 * Called from `auth-session.ts` → `signOut` (change-403).
 */

import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';

/**
 * Reset the global entity graph to empty collections.
 *
 * Safe to call outside React (Zustand `setState` works anywhere). Idempotent.
 */
export function resetGraph(): void {
  useGraphStore.setState({
    entities: {} as ReturnType<typeof useGraphStore.getState>['entities'],
    patches: {} as ReturnType<typeof useGraphStore.getState>['patches'],
    entityStates: {},
    syncMetadata: {},
    lists: {} as ReturnType<typeof useGraphStore.getState>['lists'],
  });
}
