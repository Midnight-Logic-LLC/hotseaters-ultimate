/**
 * use-trials-list.ts — subscribe to the company-scoped trial list.
 *
 * Pattern 4 migration: reads directly from the PGlite `trial` unified view
 * via `useTierAQuery` instead of the `useEntityList` REST-cache bridge.
 * On browser refresh, IDB rows return immediately with zero network round-trips.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useTierAQuery } from '@/shared/hooks/use-tier-a-query';
import type { Trial } from '@/features/trials/entities';

export interface UseTrialsListOptions {
  companyId: string | null | undefined;
}

export interface UseTrialsListResult {
  items: Trial[];
  isLoading: boolean;
  /** No-op — kept for API compat. PGlite live queries auto-refresh. */
  refetch: () => void;
}

export function useTrialsList(opts: UseTrialsListOptions): UseTrialsListResult {
  const { companyId } = opts;

  const { rows, loading } = useTierAQuery<Trial>(
    'trial',
    companyId,
  );

  return {
    items: rows,
    isLoading: loading,
    refetch: () => {
      // useLiveQuery auto-updates on PGlite changes — nothing to do.
    },
  };
}
