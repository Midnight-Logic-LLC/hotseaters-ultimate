import { describe, expect, it } from 'vitest';

import {
  formatPickedDateForUtcStorage,
  getDaysLabel,
  parseStoredDateForLocalPicker,
} from '../activity-date-utils';

describe('parseStoredDateForLocalPicker', () => {
  it('returns undefined for empty input', () => {
    expect(parseStoredDateForLocalPicker('')).toBeUndefined();
  });

  it('parses a yyyy-MM-dd string into a local Date on the exact day', () => {
    const result = parseStoredDateForLocalPicker('2026-05-29');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(4); // May is month index 4
    expect(result?.getDate()).toBe(29);
  });

  it('ignores any time suffix and reads only the date portion', () => {
    const result = parseStoredDateForLocalPicker('2026-01-02T23:59:59Z');
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(0);
    expect(result?.getDate()).toBe(2);
  });
});

describe('formatPickedDateForUtcStorage', () => {
  it('formats a local Date into a zero-padded yyyy-MM-dd string', () => {
    const date = new Date(2026, 0, 5); // 2026-01-05 local
    expect(formatPickedDateForUtcStorage(date)).toBe('2026-01-05');
  });

  it('round-trips with parseStoredDateForLocalPicker without day drift', () => {
    const original = '2026-12-31';
    const parsed = parseStoredDateForLocalPicker(original);
    expect(parsed).toBeDefined();
    expect(formatPickedDateForUtcStorage(parsed as Date)).toBe(original);
  });
});

describe('getDaysLabel', () => {
  // Build offset dates from "today" in the LOCAL zone so the assertion is
  // timezone-stable, then format them the same way the app stores them.
  const localDateStr = (offsetDays: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return formatPickedDateForUtcStorage(d);
  };

  it('returns null for empty / nullish input', () => {
    expect(getDaysLabel(null)).toBeNull();
    expect(getDaysLabel(undefined)).toBeNull();
    expect(getDaysLabel('')).toBeNull();
  });

  it('labels today as "Today"', () => {
    expect(getDaysLabel(localDateStr(0))).toBe('Today');
  });

  it('labels a future date as "in <n>d"', () => {
    expect(getDaysLabel(localDateStr(3))).toBe('in 3d');
  });

  it('labels a past date as "<n>d overdue"', () => {
    expect(getDaysLabel(localDateStr(-2))).toBe('2d overdue');
  });
});
