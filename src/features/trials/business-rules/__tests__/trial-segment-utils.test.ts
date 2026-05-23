import { describe, it, expect } from 'vitest';
import {
  getTrialActiveWindows,
  getServiceSegmentDates,
  getTotalActiveTrialDays,
  hasMultipleSegments,
  calculateTrialBookendDates,
} from '../trial-segment-utils';

const trial = { start_date: '2026-01-01', end_date: '2026-01-10' };
const segs = [
  {
    id: 's2',
    segment_number: 2,
    start_date: '2026-02-01',
    end_date: '2026-02-05',
    label: 'Continuation',
  },
  {
    id: 's1',
    segment_number: 1,
    start_date: '2026-01-01',
    end_date: '2026-01-10',
    label: null,
  },
];

describe('getTrialActiveWindows', () => {
  it('returns trial bookends when no segments', () => {
    const w = getTrialActiveWindows(trial, []);
    expect(w).toHaveLength(1);
    expect(w[0]!.segment_id).toBeNull();
    expect(w[0]!.label).toBe('Trial Dates');
  });

  it('returns segments sorted by segment_number', () => {
    const w = getTrialActiveWindows(trial, segs);
    expect(w.map((x) => x.segment_number)).toEqual([1, 2]);
    expect(w[0]!.label).toBe('Segment 1');
    expect(w[1]!.label).toBe('Continuation');
  });
});

describe('getServiceSegmentDates', () => {
  it('returns segment dates when service has matching segment_id', () => {
    const d = getServiceSegmentDates({ segment_id: 's2' }, trial, segs);
    expect(d.start_date).toBe('2026-02-01');
    expect(d.segment_number).toBe(2);
  });

  it('falls back to trial dates when no segment_id', () => {
    const d = getServiceSegmentDates({}, trial, segs);
    expect(d.start_date).toBe('2026-01-01');
    expect(d.segment_number).toBe(1);
  });

  it('falls back to trial dates when segment_id does not match', () => {
    const d = getServiceSegmentDates({ segment_id: 'missing' }, trial, segs);
    expect(d.start_date).toBe('2026-01-01');
  });
});

describe('getTotalActiveTrialDays', () => {
  it('counts inclusive days across segments', () => {
    // s1: Jan 1 - Jan 10 = 10 days
    // s2: Feb 1 - Feb 5 = 5 days
    expect(getTotalActiveTrialDays(trial, segs)).toBe(15);
  });

  it('counts inclusive days for trial-only', () => {
    expect(getTotalActiveTrialDays(trial, [])).toBe(10);
  });
});

describe('hasMultipleSegments', () => {
  it('returns false for empty / null / single', () => {
    expect(hasMultipleSegments([])).toBe(false);
    expect(hasMultipleSegments(null)).toBe(false);
    expect(hasMultipleSegments([segs[0]!])).toBe(false);
  });
  it('returns true when 2+', () => {
    expect(hasMultipleSegments(segs)).toBe(true);
  });
});

describe('calculateTrialBookendDates', () => {
  it('returns null when no segments', () => {
    expect(calculateTrialBookendDates([])).toBeNull();
  });
  it('spans the earliest start to latest end by segment_number', () => {
    const b = calculateTrialBookendDates(segs)!;
    expect(b.start_date).toBe('2026-01-01');
    expect(b.end_date).toBe('2026-02-05');
  });
});
