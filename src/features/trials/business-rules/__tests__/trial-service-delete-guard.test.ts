import { describe, it, expect } from 'vitest';
import {
  findHSHBlockers,
  formatBlockerSummary,
} from '../trial-service-delete-guard';

describe('findHSHBlockers', () => {
  it('returns not-blocked when no ids', () => {
    const r = findHSHBlockers([], [], []);
    expect(r.blocked).toBe(false);
  });

  it('detects open and in_progress requests', () => {
    const r = findHSHBlockers(
      ['ts-1'],
      [
        { trial_service_id: 'ts-1', status: 'open', service_name: 'Jury' },
        { trial_service_id: 'ts-1', status: 'in_progress', service_name: 'Other' },
        { trial_service_id: 'ts-1', status: 'cancelled', service_name: 'Done' },
      ],
      [],
    );
    expect(r.blocked).toBe(true);
    expect(r.requests).toHaveLength(2);
  });

  it('detects active assignments', () => {
    const r = findHSHBlockers(
      ['ts-1'],
      [],
      [
        { trial_service_id: 'ts-1', status: 'active', consultant_first_name: 'A' },
        { trial_service_id: 'ts-1', status: 'completed', consultant_first_name: 'B' },
      ],
    );
    expect(r.blocked).toBe(true);
    expect(r.assignments).toHaveLength(1);
  });

  it('ignores rows for unrelated ids', () => {
    const r = findHSHBlockers(
      ['ts-1'],
      [{ trial_service_id: 'ts-OTHER', status: 'open' }],
      [{ trial_service_id: 'ts-OTHER', status: 'active' }],
    );
    expect(r.blocked).toBe(false);
  });
});

describe('formatBlockerSummary', () => {
  it('returns null when nothing blocks', () => {
    expect(formatBlockerSummary({ requests: [], assignments: [] })).toBeNull();
  });

  it('summarizes assignments and requests with pluralization', () => {
    const text = formatBlockerSummary({
      assignments: [
        { consultant_first_name: 'Jane', consultant_last_name: 'Doe' },
        { consultant_first_name: 'Bob', consultant_last_name: 'Roe' },
      ],
      requests: [{ service_name: 'Jury' }],
    })!;
    expect(text).toContain('2 active HSH agreements');
    expect(text).toContain('Jane Doe');
    expect(text).toContain('1 open HSH job posting');
  });
});
