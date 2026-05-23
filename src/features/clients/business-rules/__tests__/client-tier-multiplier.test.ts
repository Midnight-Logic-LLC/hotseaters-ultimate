import { describe, expect, it } from 'vitest';
import {
  clientTierMultiplier,
  clientTierBadgeClass,
} from '../client-tier-multiplier';

const types = [
  { id: 'law-firm', multiplier: 1.0 },
  { id: 'tsc', multiplier: 0.85 },
  { id: 'premium', multiplier: 1.25 },
  { id: 'string-num', multiplier: '0.75' },
];

describe('clientTierMultiplier', () => {
  it('returns 1.0 when client has no type', () => {
    expect(clientTierMultiplier({ client_type_id: null }, types)).toBe(1.0);
    expect(clientTierMultiplier(null, types)).toBe(1.0);
  });

  it('returns 1.0 when type is not in the table', () => {
    expect(clientTierMultiplier({ client_type_id: 'missing' }, types)).toBe(1.0);
  });

  it('returns the matching multiplier', () => {
    expect(clientTierMultiplier({ client_type_id: 'tsc' }, types)).toBe(0.85);
    expect(clientTierMultiplier({ client_type_id: 'premium' }, types)).toBe(
      1.25,
    );
  });

  it('parses numeric strings', () => {
    expect(clientTierMultiplier({ client_type_id: 'string-num' }, types)).toBe(
      0.75,
    );
  });

  it('falls back to 1.0 when the stored value is invalid', () => {
    expect(
      clientTierMultiplier(
        { client_type_id: 'bad' },
        [{ id: 'bad', multiplier: 'not-a-number' }],
      ),
    ).toBe(1.0);
  });
});

describe('clientTierBadgeClass (MVP parity)', () => {
  it('colors low multipliers purple', () => {
    expect(clientTierBadgeClass(0.85)).toBe('bg-purple-100 text-purple-700');
  });
  it('colors mid multipliers blue', () => {
    expect(clientTierBadgeClass(0.95)).toBe('bg-blue-100 text-blue-700');
  });
  it('colors >= 1.0 multipliers stone', () => {
    expect(clientTierBadgeClass(1.0)).toBe('bg-stone-100 text-stone-700');
    expect(clientTierBadgeClass(1.25)).toBe('bg-stone-100 text-stone-700');
  });
});
