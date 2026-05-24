import { describe, expect, it } from 'vitest';
import { formatPhone, stripPhone } from '../format-phone';

describe('formatPhone', () => {
  it('returns digits as-is when 3 or fewer', () => {
    expect(formatPhone('')).toBe('');
    expect(formatPhone('5')).toBe('5');
    expect(formatPhone('555')).toBe('555');
  });

  it('formats 4-6 digits as (NNN) NNN', () => {
    expect(formatPhone('5551')).toBe('(555) 1');
    expect(formatPhone('555123')).toBe('(555) 123');
  });

  it('formats 7-10 digits as (NNN) NNN-NNNN', () => {
    expect(formatPhone('5551234')).toBe('(555) 123-4');
    expect(formatPhone('5551234567')).toBe('(555) 123-4567');
  });

  it('strips non-digits and caps at 10', () => {
    expect(formatPhone('(555) 123-4567')).toBe('(555) 123-4567');
    expect(formatPhone('555.123.4567ext99')).toBe('(555) 123-4567');
    expect(formatPhone('55512345678901234')).toBe('(555) 123-4567');
  });
});

describe('stripPhone', () => {
  it('removes all non-digit characters', () => {
    expect(stripPhone('(555) 123-4567')).toBe('5551234567');
    expect(stripPhone('')).toBe('');
    expect(stripPhone('abc123')).toBe('123');
  });
});
