/**
 * use-time-tracking-data.ts — fetches all data for the Time & Expenses page.
 *
 * Interim: calls Supabase directly for tables not yet in stores.
 * TODO: migrate expense/time-off fetches to their own stores when they land.
 *
 * RULE B: hooks only call stores and Supabase clients — no components.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/db/supabase-client';
import { useTier1 } from '@/app/tier1-provider';
import { fetchTimeEntriesForCompany } from '@/features/time-entries/stores/time-entries-store';

export interface TimeTrackingData {
  userInfo: Record<string, unknown> | null;
  company: Record<string, unknown> | null;
  isOwnerOrAdmin: boolean;
  pipelineStages: Record<string, unknown>[];
  trials: Record<string, unknown>[];
  clients: Record<string, unknown>[];
  services: Record<string, unknown>[];
  trialServices: Record<string, unknown>[];
  trialSegments: Record<string, unknown>[];
  consultants: Record<string, unknown>[];
  timeEntries: Record<string, unknown>[];
  allTimeEntries: Record<string, unknown>[];
  activeEntry: Record<string, unknown> | null;
  userExpenses: Record<string, unknown>[];
  allCompanyExpenses: Record<string, unknown>[];
  expenseReports: Record<string, unknown>[];
  timeOffRequests: Record<string, unknown>[];
  isLoading: boolean;
  refetch: () => void;
}

export function useTimeTrackingData(): TimeTrackingData {
  const tier1 = useTier1();
  const { userInfo, company, role, pipelineStages: tier1Stages } = tier1;

  const companyId = userInfo?.company_id as string | null;
  const consultantId = userInfo?.id as string | null;
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';

  const [trials, setTrials] = useState<Record<string, unknown>[]>([]);
  const [clients, setClients] = useState<Record<string, unknown>[]>([]);
  const [services, setServices] = useState<Record<string, unknown>[]>([]);
  const [trialServices, setTrialServices] = useState<Record<string, unknown>[]>([]);
  const [trialSegments, setTrialSegments] = useState<Record<string, unknown>[]>([]);
  const [consultants, setConsultants] = useState<Record<string, unknown>[]>([]);
  const [allTimeEntries, setAllTimeEntries] = useState<Record<string, unknown>[]>([]);
  const [userExpenses, setUserExpenses] = useState<Record<string, unknown>[]>([]);
  const [allCompanyExpenses, setAllCompanyExpenses] = useState<Record<string, unknown>[]>([]);
  const [expenseReports, setExpenseReports] = useState<Record<string, unknown>[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchTick, setFetchTick] = useState(0);

  const refetch = useCallback(() => setFetchTick((n) => n + 1), []);

  useEffect(() => {
    if (!companyId) return;

    let cancelled = false;
    setIsLoading(true);

    async function load() {
      try {
        const [
          trialsRes,
          clientsRes,
          servicesRes,
          trialServicesRes,
          trialSegmentsRes,
          consultantsRes,
          allEntriesRaw,
          expensesRes,
          expenseReportsRes,
          timeOffRes,
        ] = await Promise.all([
          supabase.from('trial').select('*').eq('company_id', companyId!),
          supabase.from('client').select('*').eq('company_id', companyId!),
          supabase.from('service').select('*').eq('company_id', companyId!),
          supabase.from('trial_service').select('*'),
          supabase.from('trial_segment').select('*'),
          supabase.from('user_info').select('*').eq('company_id', companyId!),
          fetchTimeEntriesForCompany(companyId!),
          supabase.from('expense').select('*').eq('company_id', companyId!),
          supabase.from('expense_report').select('*').eq('company_id', companyId!),
          supabase.from('time_off').select('*').eq('company_id', companyId!),
        ]);

        if (cancelled) return;

        const allEntries = (allEntriesRaw as unknown as Record<string, unknown>[]);

        setTrials((trialsRes.data ?? []) as Record<string, unknown>[]);
        setClients((clientsRes.data ?? []) as Record<string, unknown>[]);
        setServices((servicesRes.data ?? []) as Record<string, unknown>[]);
        setTrialServices((trialServicesRes.data ?? []) as Record<string, unknown>[]);
        setTrialSegments((trialSegmentsRes.data ?? []) as Record<string, unknown>[]);
        setConsultants((consultantsRes.data ?? []) as Record<string, unknown>[]);
        setAllTimeEntries(allEntries);

        const allExp = (expensesRes.data ?? []) as Record<string, unknown>[];
        setAllCompanyExpenses(allExp);
        const myExp = consultantId
          ? allExp.filter((e) => e['consultant_id'] === consultantId)
          : allExp;
        setUserExpenses(myExp);

        setExpenseReports((expenseReportsRes.data ?? []) as Record<string, unknown>[]);
        setTimeOffRequests((timeOffRes.data ?? []) as Record<string, unknown>[]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId, consultantId, fetchTick]);

  const timeEntries = consultantId
    ? allTimeEntries.filter((e) => e['consultant_id'] === consultantId)
    : allTimeEntries;

  const activeEntry =
    timeEntries.find((e) => e['status'] === 'in_progress' && !e['end_time']) ?? null;

  return {
    userInfo: userInfo as Record<string, unknown> | null,
    company: company as Record<string, unknown> | null,
    isOwnerOrAdmin,
    pipelineStages: tier1Stages as unknown as Record<string, unknown>[],
    trials,
    clients,
    services,
    trialServices,
    trialSegments,
    consultants,
    timeEntries,
    allTimeEntries,
    activeEntry,
    userExpenses,
    allCompanyExpenses,
    expenseReports,
    timeOffRequests,
    isLoading,
    refetch,
  };
}
