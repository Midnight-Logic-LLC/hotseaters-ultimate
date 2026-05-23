import { describe, it, expect } from 'vitest';
import {
  decideInvitation,
  type AuthContextSnapshot,
  type InvitationSnapshot,
} from '../accept-invitation';

const baseAuth: AuthContextSnapshot = {
  isAuthenticated: false,
  userEmail: null,
  userInfoId: null,
  companyId: null,
};

const baseInvite: InvitationSnapshot = {
  token: 'tok-abc',
  email: 'invitee@example.com',
  role: 'Sales',
  companyId: 'co-1',
  expiresAt: null,
  acceptedAt: null,
};

describe('decideInvitation', () => {
  it('returns invalid-token when invitation is null', () => {
    expect(decideInvitation(null, baseAuth).kind).toBe('invalid-token');
  });

  it('returns invalid-token when required fields are missing', () => {
    expect(decideInvitation({ ...baseInvite, token: '' }, baseAuth).kind).toBe('invalid-token');
    expect(decideInvitation({ ...baseInvite, companyId: '' }, baseAuth).kind).toBe('invalid-token');
    expect(decideInvitation({ ...baseInvite, email: '' }, baseAuth).kind).toBe('invalid-token');
  });

  it('returns expired when expires_at is in the past', () => {
    const past = new Date('2020-01-01T00:00:00Z').toISOString();
    const result = decideInvitation(
      { ...baseInvite, expiresAt: past },
      baseAuth,
      new Date('2026-01-01T00:00:00Z'),
    );
    expect(result.kind).toBe('expired');
  });

  it('returns already-accepted when accepted_at is set', () => {
    const result = decideInvitation(
      { ...baseInvite, acceptedAt: '2026-01-01T00:00:00Z' },
      { ...baseAuth, isAuthenticated: true, userEmail: 'invitee@example.com' },
    );
    expect(result.kind).toBe('already-accepted');
  });

  it('returns auth-required when user is not signed in', () => {
    const result = decideInvitation(baseInvite, baseAuth);
    expect(result.kind).toBe('auth-required');
    if (result.kind === 'auth-required') expect(result.storeToken).toBe(true);
  });

  it('returns wrong-account when emails do not match', () => {
    const result = decideInvitation(baseInvite, {
      ...baseAuth,
      isAuthenticated: true,
      userEmail: 'somebody-else@example.com',
    });
    expect(result.kind).toBe('wrong-account');
  });

  it('returns accept when authenticated and emails match (case-insensitive)', () => {
    const result = decideInvitation(baseInvite, {
      ...baseAuth,
      isAuthenticated: true,
      userEmail: 'INVITEE@EXAMPLE.com',
    });
    expect(result.kind).toBe('accept');
  });
});
