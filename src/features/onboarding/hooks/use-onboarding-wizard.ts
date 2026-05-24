/**
 * use-onboarding-wizard.ts — the canonical hook the wizard components use
 * to read + mutate onboarding state. Per RULE B/C, components import THIS
 * hook (not the underlying store).
 */
import { useEffect } from 'react';
import { useOnboardingStore, ONBOARDING_STEPS } from '@/features/onboarding/stores/onboarding-store';

export function useOnboardingWizard() {
  const store = useOnboardingStore();

  // Auto-bootstrap on first mount.
  useEffect(() => {
    if (
      store.isBooting &&
      !store.bootError &&
      store.snapshotVersion === null
    ) {
      void store.bootstrap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...store,
    steps: ONBOARDING_STEPS,
    totalSteps: ONBOARDING_STEPS.length,
    isLastStep: store.step === ONBOARDING_STEPS.length - 1,
    isFirstStep: store.step === 0,
    currentStepKey: ONBOARDING_STEPS[store.step]?.key,
  };
}
