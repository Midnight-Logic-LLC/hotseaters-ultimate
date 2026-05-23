import { describe, expect, it } from 'vitest';
import {
  checkTrialServiceDeleteGuard,
  formatDeleteGuardSummary,
} from '../trial-service-delete-guard';

describe('checkTrialServiceDeleteGuard', () => {
  it('returns not-blocked for empty input', () => {
    const r = checkTrialServiceDeleteGuard([], [], []);
    expect(r.blocked).toBe(false);
  });

  it('blocks on open or in_progress requests', () => {
    const r = checkTrialServiceDeleteGuard(
      ['ts1'],
      [
        { trial_service_id: 'ts1', status: 'open' },
        { trial_service_id: 'ts1', status: 'completed' },
        { trial_service_id: 'ts2', status: 'open' },
      ],
      [],
    );
    expect(r.blocked).toBe(true);
    expect(r.blockingRequests).toHaveLength(1);
  });

  it('blocks on active assignments', () => {
    const r = checkTrialServiceDeleteGuard(
      ['ts1'],
      [],
      [
        { trial_service_id: 'ts1', status: 'active' },
        { trial_service_id: 'ts1', status: 'cancelled' },
      ],
    );
    expect(r.blocked).toBe(true);
    expect(r.blockingAssignments).toHaveLength(1);
  });

  it('does not block on historical-only references', () => {
    const r = checkTrialServiceDeleteGuard(
      ['ts1'],
      [{ trial_service_id: 'ts1', status: 'cancelled' }],
      [{ trial_service_id: 'ts1', status: 'completed' }],
    );
    expect(r.blocked).toBe(false);
  });

  it('summarises blockers in MVP style', () => {
    const r = checkTrialServiceDeleteGuard(
      ['ts1'],
      [{ trial_service_id: 'ts1', status: 'open' }],
      [{ trial_service_id: 'ts1', status: 'active' }],
    );
    expect(formatDeleteGuardSummary(r)).toMatch(/agreement/);
    expect(formatDeleteGuardSummary(r)).toMatch(/posting/);
  });

  it('returns null summary when nothing blocks', () => {
    expect(
      formatDeleteGuardSummary({
        blocked: false,
        blockingRequests: [],
        blockingAssignments: [],
      }),
    ).toBeNull();
  });
});
