/**
 * useTrialContactCRUD — mutations for trial_contact rows (attorneys on the
 * trial). Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useEntityMutation } from '@prometheus-ags/prometheus-entity-management';
import {
  createTrialContact,
  deleteTrialContact,
} from '@/features/trials/stores/trials-store';
import type { TrialContact } from '@/features/trials/entities';

export function useTrialContactCRUD() {
  const create = useEntityMutation<Partial<TrialContact>, TrialContact, TrialContact>({
    type: 'TrialContact',
    mutate: createTrialContact,
    normalize: (raw) => ({ id: raw.id, data: raw }),
    invalidateLists: ['trialContacts'],
  });
  const remove = useEntityMutation<{ id: string }, void, TrialContact>({
    type: 'TrialContact',
    mutate: async ({ id }) => {
      await deleteTrialContact(id);
    },
    invalidateLists: ['trialContacts'],
  });
  return { create, remove };
}
