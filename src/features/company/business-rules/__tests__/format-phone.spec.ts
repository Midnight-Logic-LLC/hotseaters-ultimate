import { describe, it, expect } from 'vitest';
import { formatPhone } from '../format-phone';

describe('formatPhone', () => {
  it('returns empty string for empty input', () => {
    expect(formatPhone('')).toBe('');
  });

  it('formats a partial 3-digit input as "(555) "', () => {
    // Bible behaviour: at exactly 3 digits the closing paren + space are shown
    // so the user can keep typing into the next group.
    expect(formatPhone('555')).toBe('(555) ');
  });

  it('formats a partial 1-2 digit input as "(NN"', () => {
    expect(formatPhone('5')).toBe('(5');
    expect(formatPhone('55')).toBe('(55');
  });

  it('formats a full 10-digit input as "(555) 123-4567"', () => {
    expect(formatPhone('5551234567')).toBe('(555) 123-4567');
  });

  it('drops a leading US country-code 1 from an 11-digit input', () => {
    expect(formatPhone('15551234567')).toBe('(555) 123-4567');
  });

  it('strips non-digit characters before formatting', () => {
    expect(formatPhone('(555) 123-4567')).toBe('(555) 123-4567');
    expect(formatPhone('555.123.4567')).toBe('(555) 123-4567');
  });

  it('formats partial 4-6 digit input with the dash group open', () => {
    expect(formatPhone('5551')).toBe('(555) 1');
    expect(formatPhone('555123')).toBe('(555) 123');
  });

  it('caps input at 10 digits', () => {
    expect(formatPhone('55512345678901234')).toBe('(555) 123-4567');
  });
});
