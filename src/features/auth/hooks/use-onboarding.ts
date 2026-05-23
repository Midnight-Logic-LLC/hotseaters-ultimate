/**
 * use-onboarding.ts — submit-only orchestration for the onboarding flow.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useState } from 'react';
import {
  createCompanyForOnboarding,
  type CreateCompanyInput,
} from '@/features/auth/stores/auth-store';

export interface UseOnboardingResult {
  submit: (input: CreateCompanyInput) => Promise<{ companyId: string }>;
  submitting: boolean;
  error: string | null;
}

export function useOnboarding(): UseOnboardingResult {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (input: CreateCompanyInput) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await createCompanyForOnboarding(input);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create company';
      setError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return { submit, submitting, error };
}
