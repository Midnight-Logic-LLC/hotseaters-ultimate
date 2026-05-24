/**
 * use-new-member-onboarding.ts — facade hook for the invitee 5-step
 * wizard. Auto-hydrates the Google photo on mount.
 */
import { useEffect } from 'react';
import { useNewMemberStore } from '@/features/onboarding/stores/new-member-store';

export function useNewMemberOnboarding() {
  const store = useNewMemberStore();
  useEffect(() => {
    void store.hydrateGooglePhoto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return store;
}
