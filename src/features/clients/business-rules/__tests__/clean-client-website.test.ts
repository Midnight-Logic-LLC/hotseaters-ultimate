import { describe, expect, it } from 'vitest';
import {
  cleanClientWebsite,
  displayClientWebsite,
} from '../clean-client-website';

describe('cleanClientWebsite', () => {
  it('prepends https:// when missing', () => {
    expect(cleanClientWebsite('example.com')).toBe('https://example.com');
  });

  it('preserves existing http(s) protocol', () => {
    expect(cleanClientWebsite('http://example.com')).toBe('http://example.com');
    expect(cleanClientWebsite('https://example.com')).toBe('https://example.com');
  });

  it('trims whitespace', () => {
    expect(cleanClientWebsite('  example.com  ')).toBe('https://example.com');
  });

  it('returns empty for nullish or blank', () => {
    expect(cleanClientWebsite(null)).toBe('');
    expect(cleanClientWebsite(undefined)).toBe('');
    expect(cleanClientWebsite('   ')).toBe('');
  });
});

describe('displayClientWebsite', () => {
  it('strips protocol and trailing slash for display', () => {
    expect(displayClientWebsite('https://example.com/')).toBe('example.com');
    expect(displayClientWebsite('http://example.com/path')).toBe(
      'example.com/path',
    );
    expect(displayClientWebsite('example.com')).toBe('example.com');
  });

  it('handles nullish', () => {
    expect(displayClientWebsite(null)).toBe('');
  });
});
