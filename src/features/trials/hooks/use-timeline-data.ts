/**
 * use-timeline-data.ts
 *
 * Provides all data the Timeline page needs, sourced from PGlite (Tier-A).
 * Mirrors the field shape that HotSeatersMVP/src/hooks/useTimelineData.js
 * exposes to the page, but uses our entity graph + stores instead of
 * TanStack Query / base44.
 *
 * Architecture (RULES B/C/D):
 *  - This is a hook; it imports other hooks + useTier1(), never stores directly.
 *  - Returns arrays with loading / error states.
 *  - No I/O in this file — reads through useTierAQuery.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useMemo } from 'react';
import { useTier1 } from '@/app/tier1-provider';
import { useTierAQuery } from '@/shared/hooks/use-tier-a-query';
import type { Trial, TrialService, TrialSegment, TrialServiceAssignment } from '@/features/trials/entities';

// ─── Lightweight entity types for entities not yet in the port ───────────────

export interface TimelineConsultant {
  id: string;
  first_name: string;
  last_name: string;
  profile_photo?: string | null;
  company_id?: string | null;
  isSubcontractor?: boolean;
}

export interface TimelineClient {
  id: string;
  firm_name?: string | null;
  company_id?: string | null;
}

export interface TimelineService {
  id: string;
  name: string;
  has_daily_minimum?: boolean;
  is_in_trial_only?: boolean;
  company_id?: string | null;
}

export interface TimelineTimeOff {
  id: string;
  consultant_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  company_id?: string | null;
}

export interface TimelineOpenRequest {
  id: string;
  trial_id?: string | null;
  service_id?: string | null;
  company_id?: string | null;
}

export interface TimelineFavorite {
  id: string;
  favorite_company_id?: string | null;
  favorite_user_id?: string | null;
  company_id?: string | null;
}

export interface TimelineHiringCompany {
  id: string;
  name?: string | null;
}

// ─── Return type ─────────────────────────────────────────────────────────────

export interface UseTimelineDataResult {
  isLoading: boolean;

  // Tier-1
  userInfo: ReturnType<typeof useTier1>['userInfo'];
  company: ReturnType<typeof useTier1>['company'] | null;
  pipelineStages: ReturnType<typeof useTier1>['pipelineStages'];
  canEditDates: boolean;

  // Tier-A from PGlite
  trials: Trial[];
  trialServices: TrialService[];
  trialSegments: TrialSegment[];
  trialServiceAssignments: TrialServiceAssignment[];
  clients: TimelineClient[];

  // Stubs — empty until those features land
  services: TimelineService[];
  consultants: TimelineConsultant[];
  hiringCompanies: TimelineHiringCompany[];
  timeOffs: TimelineTimeOff[];
  openRequests: TimelineOpenRequest[];
  favorites: TimelineFavorite[];
  subcontractTrials: Trial[];
  mySubcontractGigs: never[];
  hiredSubcontractors: never[];
  subcontractorConsultants: TimelineConsultant[];
  subcontractClients: TimelineClient[];
  subcontractTrialServices: TrialService[];
  mappedServices: TimelineService[];
  subcontractTrialSegments: TrialSegment[];
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useTimelineData(): UseTimelineDataResult {
  const {
    userInfo,
    company,
    pipelineStages,
    isLoading: tier1Loading,
  } = useTier1();

  const companyId = userInfo?.company_id ?? null;

  const { rows: trials, loading: trialsLoading } = useTierAQuery<Trial>(
    'trial',
    companyId,
    '*',
    "start_date IS NOT NULL AND (completion_type IS NULL OR completion_type IN ('deal_won', 'case_continued'))",
  );

  const { rows: trialServices, loading: tsLoading } = useTierAQuery<TrialService>(
    'trial_service',
    companyId,
  );

  const { rows: trialSegments, loading: segLoading } = useTierAQuery<TrialSegment>(
    'trial_segment',
    companyId,
  );

  const { rows: trialServiceAssignments, loading: tsaLoading } =
    useTierAQuery<TrialServiceAssignment>('trial_service_assignment', companyId);

  const { rows: clients, loading: clientsLoading } = useTierAQuery<TimelineClient>(
    'client',
    companyId,
  );

  const canEditDates = useMemo(
    () =>
      userInfo?.company_role === 'owner' || userInfo?.company_role === 'admin',
    [userInfo?.company_role],
  );

  const isLoading =
    tier1Loading ||
    trialsLoading ||
    tsLoading ||
    segLoading ||
    tsaLoading ||
    clientsLoading;

  return {
    isLoading,
    userInfo,
    company: company ?? null,
    pipelineStages,
    canEditDates,
    trials,
    trialServices,
    trialSegments,
    trialServiceAssignments,
    clients,
    services: [],
    consultants: [],
    hiringCompanies: [],
    timeOffs: [],
    openRequests: [],
    favorites: [],
    subcontractTrials: [],
    mySubcontractGigs: [],
    hiredSubcontractors: [],
    subcontractorConsultants: [],
    subcontractClients: [],
    subcontractTrialServices: [],
    mappedServices: [],
    subcontractTrialSegments: [],
  };
}
