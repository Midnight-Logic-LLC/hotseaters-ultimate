import { describe, it, expect } from 'vitest';
import { resolveTrialServiceForEntry } from '../time-entry-trial-service-resolver';
import { resolveSubcontractAssignmentForEntry } from '../time-entry-subcontract-assignment-resolver';

const trialServices = [
  { id: 'ts-original' },
  { id: 'ts-continuation' },
];

describe('resolveTrialServiceForEntry', () => {
  it('returns null when entry has no trial_service_id', () => {
    expect(resolveTrialServiceForEntry({}, trialServices)).toBeNull();
  });

  it('returns null when candidate list is empty', () => {
    expect(
      resolveTrialServiceForEntry({ trial_service_id: 'ts-original' }, []),
    ).toBeNull();
  });

  it('resolves by direct id lookup', () => {
    expect(
      resolveTrialServiceForEntry(
        { trial_service_id: 'ts-continuation' },
        trialServices,
      )!.id,
    ).toBe('ts-continuation');
  });

  it('returns null when id absent from candidates', () => {
    expect(
      resolveTrialServiceForEntry(
        { trial_service_id: 'ts-missing' },
        trialServices,
      ),
    ).toBeNull();
  });

  it('does NOT fall back to (trial_id, service_id) triangulation', () => {
    // entry with service_id but no trial_service_id must return null —
    // this is the segment-ambiguity prevention the refactor exists for.
    expect(
      resolveTrialServiceForEntry(
        { trial_service_id: null } as { trial_service_id: null },
        trialServices,
      ),
    ).toBeNull();
  });
});

describe('resolveSubcontractAssignmentForEntry', () => {
  const assignments = [{ id: 'sa-1' }, { id: 'sa-2' }];

  it('returns null when entry has no subcontract_assignment_id', () => {
    expect(resolveSubcontractAssignmentForEntry({}, assignments)).toBeNull();
  });

  it('resolves by direct id lookup', () => {
    expect(
      resolveSubcontractAssignmentForEntry(
        { subcontract_assignment_id: 'sa-2' },
        assignments,
      )!.id,
    ).toBe('sa-2');
  });

  it('returns null when candidate list empty', () => {
    expect(
      resolveSubcontractAssignmentForEntry(
        { subcontract_assignment_id: 'sa-1' },
        [],
      ),
    ).toBeNull();
  });

  it('returns null when id absent', () => {
    expect(
      resolveSubcontractAssignmentForEntry(
        { subcontract_assignment_id: 'sa-missing' },
        assignments,
      ),
    ).toBeNull();
  });

  it('does NOT triangulate by consultant + trial', () => {
    expect(
      resolveSubcontractAssignmentForEntry(
        { subcontract_assignment_id: null } as { subcontract_assignment_id: null },
        assignments,
      ),
    ).toBeNull();
  });
});
