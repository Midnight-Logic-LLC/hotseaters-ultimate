import { describe, it, expect } from 'vitest';
import { calculateRetainer } from '../retainer-formula';

describe('calculateRetainer', () => {
  it('returns minimum when budget is zero', () => {
    expect(
      calculateRetainer({
        budget: 0,
        divisor: 15000,
        multiplier: 5000,
        minimum: 1000,
      }),
    ).toBe(1000);
  });

  it('applies the bible default formula at exactly one divisor', () => {
    // floor(15000/15000) * 5000 = 5000, max(1000, 5000) = 5000
    expect(
      calculateRetainer({
        budget: 15000,
        divisor: 15000,
        multiplier: 5000,
        minimum: 1000,
      }),
    ).toBe(5000);
  });

  it('floors partial tiers (budget 20000 / divisor 15000 → 1 tier)', () => {
    expect(
      calculateRetainer({
        budget: 20000,
        divisor: 15000,
        multiplier: 5000,
        minimum: 1000,
      }),
    ).toBe(5000);
  });

  it('scales linearly across multiple tiers (45000 / 15000 → 3 tiers)', () => {
    expect(
      calculateRetainer({
        budget: 45000,
        divisor: 15000,
        multiplier: 5000,
        minimum: 1000,
      }),
    ).toBe(15000);
  });

  it('returns the minimum floor when tiered contribution is below minimum', () => {
    // floor(5000/15000) * 5000 = 0, max(2500, 0) = 2500
    expect(
      calculateRetainer({
        budget: 5000,
        divisor: 15000,
        multiplier: 5000,
        minimum: 2500,
      }),
    ).toBe(2500);
  });

  it('handles a divisor of zero by treating it as 1 (no NaN/Infinity leak)', () => {
    const result = calculateRetainer({
      budget: 1000,
      divisor: 0,
      multiplier: 100,
      minimum: 50,
    });
    expect(Number.isFinite(result)).toBe(true);
    // floor(1000/1) * 100 = 100000, max(50, 100000) = 100000
    expect(result).toBe(100000);
  });

  it('coerces NaN budget to zero and returns minimum', () => {
    expect(
      calculateRetainer({
        budget: Number.NaN,
        divisor: 15000,
        multiplier: 5000,
        minimum: 750,
      }),
    ).toBe(750);
  });

  it('works with alternative tier shapes (per $10k add $2.5k, min $500)', () => {
    // floor(33000/10000) * 2500 = 3 * 2500 = 7500
    expect(
      calculateRetainer({
        budget: 33000,
        divisor: 10000,
        multiplier: 2500,
        minimum: 500,
      }),
    ).toBe(7500);
  });
});
