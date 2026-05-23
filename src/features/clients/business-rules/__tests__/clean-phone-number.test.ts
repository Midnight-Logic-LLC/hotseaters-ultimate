import { describe, expect, it } from 'vitest';
import {
  cleanPhoneNumber,
  formatPhoneNumber,
} from '../clean-phone-number';

describe('cleanPhoneNumber', () => {
  it('strips non-digits', () => {
    expect(cleanPhoneNumber('(555) 123-4567')).toBe('5551234567');
  });

  it('returns empty for nullish', () => {
    expect(cleanPhoneNumber(null)).toBe('');
    expect(cleanPhoneNumber(undefined)).toBe('');
    expect(cleanPhoneNumber('')).toBe('');
  });
});

describe('formatPhoneNumber (MVP parity)', () => {
  it('formats 10-digit numbers as (xxx) xxx-xxxx', () => {
    expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
    expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
    expect(formatPhoneNumber('555.123.4567')).toBe('(555) 123-4567');
  });

  it('passes through non-10-digit numbers unchanged', () => {
    expect(formatPhoneNumber('+44 20 7946 0958')).toBe('+44 20 7946 0958');
    expect(formatPhoneNumber('555-CALL-NOW')).toBe('555-CALL-NOW');
  });

  it('handles nullish input', () => {
    expect(formatPhoneNumber(null)).toBe('');
    expect(formatPhoneNumber(undefined)).toBe('');
  });
});
