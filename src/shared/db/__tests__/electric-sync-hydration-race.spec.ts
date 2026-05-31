/**
 * electric-sync-hydration-race.spec.ts — unit coverage for the budget/hydration
 * decoupling that fixes the "re-hydrate on every login" regression.
 *
 * The regression: `startTenantSync` returned `didInitialHydration` from a race
 * between the real hydration tail and a 12s budget. First-login hydration of
 * all Tier-A shapes takes 12–20s, so the budget won the race, the return value
 * was `false`, `markHydrated` was never called, `_sync_meta.hydrated_at` stayed
 * NULL, and EVERY subsequent login was treated as first-login → full
 * re-hydration.
 *
 * The fix decouples "unblock the UI" (the race return value) from "record that
 * hydration completed" (`onHydrated`). `onHydrated` must fire when the genuine
 * tail resolves `true` — EVEN IF that happens after the budget already fired.
 *
 * The full `startTenantSync` path needs a live PGlite worker + Electric, so we
 * unit-test the extracted pure helper `raceHydrationAgainstBudget` with fake
 * timers here.
 *
 * electric-sync.ts reads VITE_ELECTRIC_URL / VITE_ELECTRIC_SECRET at module
 * load and throws if unset (RULE 1). The test runner has no .env, so we stub
 * those two values BEFORE a dynamic import of the module under test — the same
 * pattern as electric-sync-companyid.spec.ts.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

// PGlite worker bootstrap must never run in the node test env.
vi.mock('../pglite-client', () => ({
  openForUser: vi.fn(),
}));

const BUDGET_MS = 12_000;

let raceHydrationAgainstBudget: typeof import('../electric-sync').raceHydrationAgainstBudget;

beforeAll(async () => {
  vi.stubEnv('VITE_ELECTRIC_URL', 'http://localhost:8000');
  vi.stubEnv('VITE_ELECTRIC_SECRET', 'test-secret');
  ({ raceHydrationAgainstBudget } = await import('../electric-sync'));
});

/** Build a promise plus its resolver so tests control settle timing. */
function deferred<T>(): { promise: Promise<T>; resolve: (v: T) => void } {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('raceHydrationAgainstBudget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('fires onHydrated when the tail resolves true AFTER the budget expired (the regression)', async () => {
    const tail = deferred<boolean>();
    const onHydrated = vi.fn();
    const onBudgetExpired = vi.fn();

    const racePromise = raceHydrationAgainstBudget({
      hydrationTail: tail.promise,
      budgetMs: BUDGET_MS,
      onHydrated,
      onBudgetExpired,
    });

    // Budget wins first: the UI is unblocked with `false`, onHydrated NOT yet.
    await vi.advanceTimersByTimeAsync(BUDGET_MS);
    await expect(racePromise).resolves.toBe(false);
    expect(onBudgetExpired).toHaveBeenCalledTimes(1);
    expect(onHydrated).not.toHaveBeenCalled();

    // Real hydration finishes LATER (slow but successful first login).
    tail.resolve(true);
    await vi.runAllTimersAsync();
    await Promise.resolve();

    // The genuine completion is still recorded — this is what stamps
    // `_sync_meta.hydrated_at` so the next login resumes incrementally.
    expect(onHydrated).toHaveBeenCalledTimes(1);
  });

  it('fires onHydrated and returns true when the tail wins the race (fast healthy login)', async () => {
    const tail = deferred<boolean>();
    const onHydrated = vi.fn();
    const onBudgetExpired = vi.fn();

    const racePromise = raceHydrationAgainstBudget({
      hydrationTail: tail.promise,
      budgetMs: BUDGET_MS,
      onHydrated,
      onBudgetExpired,
    });

    // Tail completes well within budget.
    await vi.advanceTimersByTimeAsync(1_000);
    tail.resolve(true);

    await expect(racePromise).resolves.toBe(true);
    await Promise.resolve();

    expect(onHydrated).toHaveBeenCalledTimes(1);
    expect(onBudgetExpired).not.toHaveBeenCalled();
  });

  it('does NOT fire onHydrated when the tail resolves false (resume run)', async () => {
    const tail = deferred<boolean>();
    const onHydrated = vi.fn();

    const racePromise = raceHydrationAgainstBudget({
      hydrationTail: tail.promise,
      budgetMs: BUDGET_MS,
      onHydrated,
    });

    // A resume run's tail resolves false (awaitInitialSync was false).
    tail.resolve(false);

    await expect(racePromise).resolves.toBe(false);
    await Promise.resolve();

    expect(onHydrated).not.toHaveBeenCalled();
  });

  it('does not throw when onHydrated rejects late (rejection is swallowed)', async () => {
    const tail = deferred<boolean>();
    const onHydrated = vi.fn().mockRejectedValue(new Error('markHydrated failed'));

    const racePromise = raceHydrationAgainstBudget({
      hydrationTail: tail.promise,
      budgetMs: BUDGET_MS,
      onHydrated,
    });

    await vi.advanceTimersByTimeAsync(BUDGET_MS);
    await expect(racePromise).resolves.toBe(false);

    // Late onHydrated rejection must not surface as an unhandled rejection.
    tail.resolve(true);
    await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
    await Promise.resolve();
    expect(onHydrated).toHaveBeenCalledTimes(1);
  });
});
