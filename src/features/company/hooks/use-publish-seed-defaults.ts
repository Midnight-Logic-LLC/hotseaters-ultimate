/**
 * use-publish-seed-defaults.ts — composite hook for the
 * PublishSeedDefaultsButton component.
 *
 * Exposes:
 *   - `isSuperadmin`: true when the current user is the seed superadmin and
 *     the button should render at all.
 *   - `publish(notes)`: invoke the publish action.
 *   - `state`: 'idle' | 'publishing' | 'success' | 'error'
 *   - `result`: the latest successful result payload (e.g. version number).
 *   - `error`: the latest error message, if any.
 *
 * Stores own the Supabase seam (RULE C/D); this hook only talks to the
 * company store and pure business rules.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useCallback, useState } from 'react';

import { useTier1 } from '@/app/tier1-provider';
import {
  publishSeedDefaults as storePublishSeedDefaults,
  type PublishSeedDefaultsInput,
  type PublishSeedDefaultsResult,
} from '@/features/company/stores/company-store';
import { isSeedSuperadmin } from '@/features/company/business-rules/seed-company';

export type PublishSeedDefaultsState =
  | 'idle'
  | 'publishing'
  | 'success'
  | 'error';

export interface UsePublishSeedDefaultsValue {
  isSuperadmin: boolean;
  state: PublishSeedDefaultsState;
  result: PublishSeedDefaultsResult | null;
  error: string | null;
  publish: (notes?: string) => Promise<void>;
  reset: () => void;
}

export function usePublishSeedDefaults(): UsePublishSeedDefaultsValue {
  const { user, userInfo } = useTier1();
  const userRole = (user?.role as 'admin' | 'user' | null | undefined) ?? null;
  const isSuperadmin = isSeedSuperadmin(
    user ? { ...(userRole !== undefined ? { role: userRole } : {}) } : null,
    userInfo
      ? {
          company_id: userInfo.company_id ?? null,
          legacy_id:
            (userInfo as unknown as { legacy_id?: string | null }).legacy_id ??
            null,
        }
      : null,
  );

  const [state, setState] = useState<PublishSeedDefaultsState>('idle');
  const [result, setResult] = useState<PublishSeedDefaultsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const publish = useCallback(async (notes?: string) => {
    setState('publishing');
    setError(null);
    setResult(null);
    try {
      const input: PublishSeedDefaultsInput =
        notes !== undefined ? { notes } : {};
      const res = await storePublishSeedDefaults(input);
      if (res.success) {
        setResult(res);
        setState('success');
      } else {
        setError(res.error ?? 'Publish failed');
        setState('error');
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Publish failed';
      setError(message);
      setState('error');
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
    setResult(null);
  }, []);

  return { isSuperadmin, state, result, error, publish, reset };
}
