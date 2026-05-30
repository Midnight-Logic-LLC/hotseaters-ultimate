import { describe, it, expect } from 'vitest';
import {
  decideCallbackRedirect,
  type RedirectDecisionInput,
} from '../callback-redirect';

// A fully-settled, authenticated, onboarded user — the happy path baseline.
const settledOwner: RedirectDecisionInput = {
  claimsResolved: true,
  state: 'done',
  isLoading: false,
  alreadyRedirecting: false,
  hasSession: true,
  hasCompany: true,
};

describe('decideCallbackRedirect', () => {
  it('routes a settled, onboarded user to /Dashboard', () => {
    expect(decideCallbackRedirect(settledOwner)).toBe('/Dashboard');
  });

  it('routes a settled session without a company to /onboarding', () => {
    expect(decideCallbackRedirect({ ...settledOwner, hasCompany: false })).toBe('/onboarding');
  });

  it('routes a settled flow with genuinely no session to /login', () => {
    expect(
      decideCallbackRedirect({ ...settledOwner, hasSession: false, hasCompany: false }),
    ).toBe('/login');
  });

  // ── The regression this fix targets ──────────────────────────────────────
  // During the async claims refresh + SyncGate hydration, the store flag can
  // be transiently false even though a real session exists. None of these
  // transients may resolve to a redirect — and crucially never to /login.

  it('returns null while the claims refresh is still in flight (claimsResolved=false)', () => {
    // hasSession is true the whole time; the only thing not yet true is that
    // THIS hook's refresh has resolved. Must NOT latch /login.
    expect(
      decideCallbackRedirect({ ...settledOwner, claimsResolved: false, hasCompany: false }),
    ).toBeNull();
  });

  it('returns null while the session store is still loading (isLoading=true)', () => {
    expect(
      decideCallbackRedirect({ ...settledOwner, isLoading: true, hasCompany: false }),
    ).toBeNull();
  });

  it('returns null before the flow reaches the done state', () => {
    expect(decideCallbackRedirect({ ...settledOwner, state: 'exchanging' })).toBeNull();
    expect(decideCallbackRedirect({ ...settledOwner, state: 'accepting-invite' })).toBeNull();
  });

  it('never overrides a redirect that was already committed', () => {
    // Even with an apparent no-session at decision time, an already-committed
    // redirect (e.g. accept-invite → /Dashboard) is final.
    expect(
      decideCallbackRedirect({ ...settledOwner, alreadyRedirecting: true, hasSession: false }),
    ).toBeNull();
  });

  it('does NOT send a real session to /login during the unsettled bounce window', () => {
    // The exact bounce scenario: session present, company not yet resolved,
    // and the refresh has not completed → no decision yet (not /login).
    const transient: RedirectDecisionInput = {
      claimsResolved: false,
      state: 'done',
      isLoading: true,
      alreadyRedirecting: false,
      hasSession: true,
      hasCompany: false,
    };
    expect(decideCallbackRedirect(transient)).toBeNull();
  });
});
