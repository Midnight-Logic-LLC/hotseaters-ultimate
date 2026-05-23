/**
 * useTrialWithChildren — composite projection: a Trial plus its services,
 * contacts, segments, and assignments in one render-stable shape.
 *
 * Each child list comes from its own list-hook so subscriptions are
 * fine-grained: this hook does NOT re-render when unrelated entities elsewhere
 * in the graph change. It rerenders only when a Trial/TrialService/
 * TrialContact/TrialSegment/TrialServiceAssignment row this trial owns
 * changes.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useMemo } from 'react';
import { useTrial } from '@/features/trials/hooks/use-trial';
import { useTrialServices } from '@/features/trials/hooks/use-trial-services';
import { useTrialContacts } from '@/features/trials/hooks/use-trial-contacts';
import { useTrialSegments } from '@/features/trials/hooks/use-trial-segments';
import { useTrialServiceAssignmentsByTrial } from '@/features/trials/hooks/use-trial-service-assignments';
import type {
  Trial,
  TrialService,
  TrialContact,
  TrialSegment,
  TrialServiceAssignment,
} from '@/features/trials/entities';

export interface TrialWithChildren {
  trial: Trial | null;
  services: TrialService[];
  contacts: TrialContact[];
  segments: TrialSegment[];
  assignments: TrialServiceAssignment[];
  /** Aggregated `estimated_total` across services — derived. */
  servicesTotal: number;
  isLoading: boolean;
  error: string | null;
}

export function useTrialWithChildren(
  trialId: string | null | undefined,
): TrialWithChildren {
  const trial = useTrial(trialId);
  const services = useTrialServices(trialId);
  const contacts = useTrialContacts(trialId);
  const segments = useTrialSegments(trialId);
  const assignments = useTrialServiceAssignmentsByTrial(trialId);

  const servicesTotal = useMemo(
    () =>
      services.items.reduce(
        (sum, s) => sum + (s.estimated_total ?? 0),
        0,
      ),
    [services.items],
  );

  const isLoading =
    trial.isLoading ||
    services.isLoading ||
    contacts.isLoading ||
    segments.isLoading ||
    assignments.isLoading;

  const error =
    trial.error ??
    services.error ??
    contacts.error ??
    segments.error ??
    assignments.error;

  return {
    trial: trial.data,
    services: services.items,
    contacts: contacts.items,
    segments: segments.items,
    assignments: assignments.items,
    servicesTotal,
    isLoading,
    error,
  };
}
