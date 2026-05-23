/**
 * useTrialServiceAssignments — subscribe to assignments for a specific
 * trial_service OR (variant) for a whole trial.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useEntityList } from '@prometheus-ags/prometheus-entity-management';
import {
  fetchTrialServiceAssignments,
  fetchTrialServiceAssignmentsByTrial,
} from '@/features/trials/stores/trials-store';
import type { TrialServiceAssignment } from '@/features/trials/entities';

export function useTrialServiceAssignments(
  trialServiceId: string | null | undefined,
) {
  return useEntityList<TrialServiceAssignment, TrialServiceAssignment>({
    type: 'TrialServiceAssignment',
    queryKey: ['trialServiceAssignments', { trialServiceId }],
    enabled: !!trialServiceId,
    fetch: async () => {
      if (!trialServiceId) return { items: [], total: 0 };
      const items = await fetchTrialServiceAssignments(trialServiceId);
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
  });
}

export function useTrialServiceAssignmentsByTrial(
  trialId: string | null | undefined,
) {
  return useEntityList<TrialServiceAssignment, TrialServiceAssignment>({
    type: 'TrialServiceAssignment',
    queryKey: ['trialServiceAssignments', { trialId }],
    enabled: !!trialId,
    fetch: async () => {
      if (!trialId) return { items: [], total: 0 };
      const items = await fetchTrialServiceAssignmentsByTrial(trialId);
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
  });
}
