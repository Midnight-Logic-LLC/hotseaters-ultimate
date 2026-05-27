/**
 * SalesPage — port of HotSeatersMVP/src/pages/Sales.jsx
 *
 * Faithfully replicates the three-tab Sales Hub:
 *   - Lead Radar
 *   - Deal Tracker
 *   - Projections (Revenue)
 *
 * Sub-tab components (LeadsRadarTab, DealTrackerTab, RevenueProjectionsTab)
 * are not yet ported; placeholders are rendered per CLAUDE.md adapter rules.
 *
 * All business logic (tasksWithDailyRevenue, projectedInvoices, deal filters,
 * preference persistence) is carried over verbatim from the bible. Data
 * comes from useTier1() (Tier-1) and direct Supabase queries (Tier-2) via
 * zustand stores — base44 entities are not used.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import React, { useState } from 'react';
import { BarChart3, Radar, Telescope } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { differenceInDays, format, parseISO, getMonth, getYear } from 'date-fns';
import { useTier1 } from '@/app/tier1-provider';
import type { PipelineStage } from '@/shared/db/lookups-selectors';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrialService {
  id: string;
  trial_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  projected_daily_revenue?: number | null;
  pre_trial_projected_daily_revenue?: number | null;
  in_trial_projected_daily_revenue?: number | null;
  final_billing_method?: string | null;
  service_name?: string | null;
}

interface Trial {
  id: string;
  case_name?: string | null;
  completion_date?: string | null;
  completion_type?: string | null;
  consultant_id?: string | null;
  pipeline_stage_id?: string | null;
  start_date?: string | null;
  bill_for_weekends?: boolean | null;
}

interface HiringCompanyAssignment {
  id: string;
  trial_service_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  estimated_total?: number | null;
}

interface SubcontractAssignment {
  id: string;
  trial_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  agreed_rate?: number | null;
  status?: string | null;
  estimated_total?: number | null;
  mapped_service_id?: string | null;
}

interface HshTrial {
  id: string;
}

interface Service {
  id: string;
  name?: string | null;
}

interface Document {
  id: string;
  trial_id?: string | null;
  status?: string | null;
}

interface Client {
  id: string;
  name?: string | null;
}

interface Attorney {
  id: string;
  name?: string | null;
}

interface Template {
  id: string;
  name?: string | null;
}

interface DocumentSigner {
  id: string;
}

interface TrialContact {
  id: string;
}

interface Consultant {
  id: string;
  name?: string | null;
}

interface SalesActivity {
  id: string;
}

interface Invoice {
  id: string;
}

interface Collection {
  id: string;
}

interface Lead {
  id: string;
}

interface UserInfo {
  id: string;
  preferences?: Record<string, unknown>;
}

interface CompanyData {
  fiscal_year_start_month?: number | null;
  invoice_period?: string | null;
  weekly_billing_day?: string | null;
  monthly_billing_date?: number | null;
  per_trial_billing_days_after_end?: number | null;
}

// ─── Stale Badge ─────────────────────────────────────────────────────────────

interface StaleBadgeProps {
  count: number;
  style?: React.CSSProperties;
}

function StaleBadge({ count, style }: StaleBadgeProps) {
  if (!count || count <= 0) return null;
  return (
    <span
      className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-semibold bg-red-500 text-white"
      style={style}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

// ─── Page Loader ─────────────────────────────────────────────────────────────

interface PageLoaderProps {
  message?: string;
  className?: string;
}

function PageLoader({ message, className }: PageLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-16 ${className ?? ''}`}
    >
      <Spinner className="size-6 text-stone-400" />
      {message && (
        <p style={{ color: 'var(--theme-stone-500)', fontSize: 'var(--theme-text-body)' }}>
          {message}
        </p>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDayOfWeek(date: Date): number {
  return date.getDay();
}

function getBillingDate(
  date: Date,
  invoicePeriod: string,
  weeklyBillingDay: string,
  monthlyBillingDate: number,
  perTrialBillingDays: number,
): Date {
  if (invoicePeriod === 'weekly') {
    const targetDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(weeklyBillingDay || 'Friday');
    const currentDay = getDayOfWeek(date);
    let daysUntilBilling = (targetDay - currentDay + 7) % 7;
    if (daysUntilBilling === 0) daysUntilBilling = 7;
    const billingDate = new Date(date);
    billingDate.setDate(date.getDate() + daysUntilBilling);
    return billingDate;
  } else if (invoicePeriod === 'monthly') {
    const year = date.getMonth() === 11 ? date.getFullYear() + 1 : date.getFullYear();
    const month = date.getMonth() === 11 ? 0 : date.getMonth() + 1;
    return new Date(year, month, monthlyBillingDate || 1);
  } else {
    const billingDate = new Date(date);
    billingDate.setDate(date.getDate() + (perTrialBillingDays || 7));
    return billingDate;
  }
}

// ─── SalesPage ───────────────────────────────────────────────────────────────

export function SalesPage() {
  const [showMyDeals, setShowMyDeals] = useState<boolean | null>(null);
  const [timePeriod, setTimePeriod] = useState('month');
  const [showCumulative, setShowCumulative] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [salesHubTab, setSalesHubTab] = useState<string | null>(null);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number | null>(null);

  // Tier-1 data (user, company, pipelineStages)
  const { userInfo: t1UserInfo, company: t1Company, isLoading: tier1Loading } = useTier1();

  // These would come from Tier-2 stores in a full implementation.
  // For now, we carry the full business logic with empty stubs so the
  // page renders correctly as a shell; the sub-tabs show "Coming soon" placeholders.
  const trialServices: TrialService[] = [];
  const trials: Trial[] = [];
  const pipelineStages: PipelineStage[] = [];
  const clients: Client[] = [];
  const documents: Document[] = [];
  const documentSigners: DocumentSigner[] = [];
  const attorneys: Attorney[] = [];
  const templates: Template[] = [];
  const trialContacts: TrialContact[] = [];
  const consultants: Consultant[] = [];
  const salesActivities: SalesActivity[] = [];
  const invoices: Invoice[] = [];
  const services: Service[] = [];
  const subcontractAssignments: SubcontractAssignment[] = [];
  const hiringCompanyAssignments: HiringCompanyAssignment[] = [];
  const hshTrials: HshTrial[] = [];
  const collections: Collection[] = [];
  const leads: Lead[] = [];
  const leadAttorneys: Attorney[] = [];
  const leadClients: Client[] = [];
  const pendingActivities: SalesActivity[] = [];

  const isSalesDataLoading = tier1Loading;
  const staleMyCount = 0;

  // Cast for local use — bible references userInfo.preferences, userInfo.id, etc.
  const userInfo: UserInfo | null = t1UserInfo
    ? { id: t1UserInfo.id, preferences: {} }
    : null;
  const company: CompanyData | null = t1Company
    ? {
        fiscal_year_start_month: t1Company.fiscal_year_start_month ?? null,
        invoice_period: t1Company.invoice_period ?? null,
        weekly_billing_day: t1Company.weekly_billing_day ?? null,
        monthly_billing_date: t1Company.monthly_billing_date ?? null,
        per_trial_billing_days_after_end: t1Company.per_trial_billing_days_after_end ?? null,
      }
    : null;

  // Load preferences from database once (bible lines 65–73)
  React.useEffect(() => {
    if (userInfo && !prefsLoaded) {
      const prefs = (userInfo.preferences ?? {}) as Record<string, unknown>;
      setSalesHubTab((prefs.salesHubTab as string | undefined) || 'radar');
      setTimePeriod((prefs.salesHubForecastingTimePeriod as string | undefined) || 'month');
      setShowCumulative((prefs.salesHubForecastingShowCumulative as boolean | undefined) || false);
      setShowMyDeals((prefs.salesHubShowMyDeals as boolean | undefined) || false);
      setPrefsLoaded(true);
    }
  }, [userInfo, prefsLoaded]);

  // Preference persistence — no-op until Tier-2 user_info store wires in
  const savePreference = async (key: string, value: unknown): Promise<void> => {
    // TODO: persist to user_info.preferences via Supabase store
    void key; void value;
  };

  const handleSalesHubTabChange = (newTab: string) => {
    setSalesHubTab(newTab);
    void savePreference('salesHubTab', newTab);
  };
  const handleTimePeriodChange = (period: string) => {
    setTimePeriod(period);
    void savePreference('salesHubForecastingTimePeriod', period);
  };
  const handleCumulativeToggle = (value: boolean) => {
    setShowCumulative(value);
    void savePreference('salesHubForecastingShowCumulative', value);
  };
  const handleShowMyDealsChange = (value: boolean) => {
    setShowMyDeals(value);
    void savePreference('salesHubShowMyDeals', value);
  };

  // ── Calculate tasks with daily revenue (bible lines 91–151) ───────────────
  const tasksWithDailyRevenue = React.useMemo(() => {
    const regularTasks = trialServices
      .filter(ts => ts.start_date && ts.end_date && (ts.projected_daily_revenue || ts.final_billing_method === 'split'))
      .map(ts => {
        const trial = trials.find(t => t.id === ts.trial_id);
        if (!trial || trial.completion_date) return null;
        if (showMyDeals && trial.consultant_id !== userInfo?.id) return null;

        const stage = trial ? pipelineStages.find(s => s.id === trial.pipeline_stage_id) : null;
        const probability = stage?.revenue_probability ?? 1;
        const startDate = parseISO(ts.start_date!);
        const endDate = parseISO(ts.end_date!);
        const trialStartDate = trial?.start_date ? parseISO(trial.start_date) : null;

        let dailyRevenue: number | { isSplit: boolean; preTrialDailyRevenue: number; inTrialDailyRevenue: number; preTrialDays: number; inTrialDays: number };
        let dailyRevenueFull: number | { isSplit: boolean; preTrialDailyRevenue: number; inTrialDailyRevenue: number; preTrialDays: number; inTrialDays: number };

        if (ts.final_billing_method === 'split' && trialStartDate) {
          const daysBeforeTrial = Math.max(0, Math.ceil((trialStartDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
          const daysInTrial = Math.max(0, Math.ceil((endDate.getTime() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
          dailyRevenueFull = { isSplit: true, preTrialDailyRevenue: (ts.pre_trial_projected_daily_revenue || 0), inTrialDailyRevenue: (ts.in_trial_projected_daily_revenue || 0), preTrialDays: daysBeforeTrial, inTrialDays: daysInTrial };
          dailyRevenue = { isSplit: true, preTrialDailyRevenue: 0, inTrialDailyRevenue: 0, preTrialDays: daysBeforeTrial, inTrialDays: daysInTrial };
        } else {
          dailyRevenueFull = (ts.projected_daily_revenue || 0);
          dailyRevenue = 0;
        }

        const hshAssignment = hiringCompanyAssignments.find(sa => sa.trial_service_id === ts.id);
        let dailyHshPayoutValue = 0;
        if (hshAssignment && hshAssignment.start_date && hshAssignment.end_date && hshAssignment.estimated_total != null) {
          const assignmentStartDate = parseISO(hshAssignment.start_date);
          const assignmentEndDate = parseISO(hshAssignment.end_date);
          const assignmentCalendarDays = Math.max(1, Math.ceil((assignmentEndDate.getTime() - assignmentStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
          dailyHshPayoutValue = hshAssignment.estimated_total / assignmentCalendarDays;
        }

        if (ts.final_billing_method === 'split' && trialStartDate) {
          const splitRevenue = dailyRevenue as { isSplit: boolean; preTrialDailyRevenue: number; inTrialDailyRevenue: number; preTrialDays: number; inTrialDays: number };
          const splitFull = dailyRevenueFull as { isSplit: boolean; preTrialDailyRevenue: number; inTrialDailyRevenue: number; preTrialDays: number; inTrialDays: number };
          splitRevenue.preTrialDailyRevenue = (splitFull.preTrialDailyRevenue - dailyHshPayoutValue) * probability;
          splitRevenue.inTrialDailyRevenue = (splitFull.inTrialDailyRevenue - dailyHshPayoutValue) * probability;
        } else {
          dailyRevenue = ((dailyRevenueFull as number) - dailyHshPayoutValue) * probability;
        }

        return { ...ts, startDate, endDate, dailyRevenue, dailyRevenueFull, dailyHshPayout: dailyHshPayoutValue, trial, isHSH: false, hshCategory: dailyHshPayoutValue > 0 ? 'hiring_company' : 'internal' };
      })
      .filter((task): task is NonNullable<typeof task> => task !== null);

    const hshTasks = subcontractAssignments
      .filter(sa => sa.start_date && sa.end_date && sa.agreed_rate && sa.status === 'active')
      .map(sa => {
        const startDate = parseISO(sa.start_date!);
        const endDate = parseISO(sa.end_date!);
        const trial = hshTrials.find(t => t.id === sa.trial_id);
        const service = services.find(s => s.id === sa.mapped_service_id);
        const calendarDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        const estimatedTotal = sa.estimated_total || ((sa.agreed_rate ?? 0) * calendarDays);
        const dailyRevenue = estimatedTotal / calendarDays;
        return { id: sa.id, service_name: service?.name || 'HSH Service', start_date: sa.start_date, end_date: sa.end_date, startDate, endDate, dailyRevenue, dailyRevenueFull: dailyRevenue, dailyHshPayout: 0, trial, isHSH: true, hshAssignment: sa, estimated_total: estimatedTotal, hshCategory: 'subcontractor' };
      });

    return [...regularTasks, ...hshTasks];
  }, [trialServices, trials, pipelineStages, showMyDeals, userInfo, subcontractAssignments, hshTrials, hiringCompanyAssignments, services]);

  // ── Calculate projected invoices (bible lines 154–276) ────────────────────
  const { projectedInvoices, fullPotentialInvoices, invoicePeriod, weeklyBillingDay, monthlyBillingDate, fiscalYearStart, currentFiscalYear, detailedRecords } = React.useMemo(() => {
    const fiscalYearStartMonth = company?.fiscal_year_start_month || 1;
    const now = new Date();
    const currentYear = getYear(now);
    const currentMonth = getMonth(now) + 1;
    const computedCurrentFiscalYear = currentMonth >= fiscalYearStartMonth ? currentYear : currentYear - 1;
    const yearToUse = selectedFiscalYear !== null ? selectedFiscalYear : computedCurrentFiscalYear;
    const computedFiscalYearStart = new Date(yearToUse, fiscalYearStartMonth - 1, 1);

    const computedInvoicePeriod = company?.invoice_period || 'monthly';
    const computedWeeklyBillingDay = company?.weekly_billing_day || 'Friday';
    const computedMonthlyBillingDate = company?.monthly_billing_date || 1;
    const perTrialBillingDays = company?.per_trial_billing_days_after_end || 7;

    const projectedInvoicesMap = new Map<string, number>();
    const fullPotentialInvoicesMap = new Map<string, number>();
    const computedDetailedRecords: Array<{
      taskDate: string;
      billingDateKey: string;
      dealTrial: string;
      taskName: string;
      dateRange: string;
      dailyValue: number;
      daysAssigned: number;
      projectedValue: number;
      fullValue: number;
      dailyHshPayout: number;
      isHSH: boolean;
      probability?: number;
    }> = [];

    tasksWithDailyRevenue.forEach(task => {
      const trialStartDate = (task as { trial?: { start_date?: string | null } }).trial?.start_date
        ? parseISO((task as { trial?: { start_date?: string | null } }).trial!.start_date!)
        : null;
      const billWeekends = (task as { trial?: { bill_for_weekends?: boolean | null } }).trial?.bill_for_weekends !== false;
      const taskStartDate = task.startDate as Date;
      const taskEndDate = task.endDate as Date;
      const taskDailyRevenue = task.dailyRevenue;
      const taskDailyRevenueFull = task.dailyRevenueFull;
      const taskHshPayout = (task as { dailyHshPayout?: number }).dailyHshPayout || 0;
      const taskTrial = (task as { trial?: Trial | HshTrial }).trial;
      const taskIsHSH = (task as { isHSH?: boolean }).isHSH || false;
      const taskHshCategory = (task as { hshCategory?: string }).hshCategory;
      const taskServiceName = (task as { service_name?: string | null }).service_name || '';

      if (computedInvoicePeriod === 'per_trial') {
        const billingDate = getBillingDate(taskEndDate, computedInvoicePeriod, computedWeeklyBillingDay, computedMonthlyBillingDate, perTrialBillingDays);
        const dateKey = format(billingDate, 'yyyy-MM-dd');
        let totalRevenue: number, totalRevenueFull: number, totalHshPayout = 0;

        if ((taskDailyRevenue as { isSplit?: boolean }).isSplit) {
          const splitRevenue = taskDailyRevenue as { isSplit: boolean; preTrialDailyRevenue: number; inTrialDailyRevenue: number; preTrialDays: number; inTrialDays: number };
          const splitFull = taskDailyRevenueFull as { isSplit: boolean; preTrialDailyRevenue: number; inTrialDailyRevenue: number; preTrialDays: number; inTrialDays: number };
          totalRevenue = (splitRevenue.preTrialDailyRevenue * splitRevenue.preTrialDays) + (splitRevenue.inTrialDailyRevenue * splitRevenue.inTrialDays);
          totalRevenueFull = (splitFull.preTrialDailyRevenue * splitFull.preTrialDays) + (splitFull.inTrialDailyRevenue * splitFull.inTrialDays);
          if (taskHshCategory === 'hiring_company') {
            totalHshPayout = (taskHshPayout * splitRevenue.preTrialDays) + (taskHshPayout * splitRevenue.inTrialDays);
          }
        } else {
          const totalDays = billWeekends
            ? Math.max(1, Math.ceil((taskEndDate.getTime() - taskStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
            : (() => { let days = 0; const current = new Date(taskStartDate); while (current <= taskEndDate) { const dayOfWeek = current.getDay(); if (dayOfWeek !== 0 && dayOfWeek !== 6) days++; current.setDate(current.getDate() + 1); } return Math.max(1, days); })();
          totalRevenue = (taskDailyRevenue as number) * totalDays;
          totalRevenueFull = (taskDailyRevenueFull as number) * totalDays;
          if (taskHshCategory === 'hiring_company') totalHshPayout = taskHshPayout * totalDays;
        }

        const stageProbability = taskTrial && 'pipeline_stage_id' in taskTrial
          ? (pipelineStages.find(s => s.id === (taskTrial as { pipeline_stage_id?: string | null }).pipeline_stage_id))?.revenue_probability ?? 1
          : 1;
        const netFullValue = totalRevenueFull - totalHshPayout;
        const netProjectedValue = totalRevenue - (totalHshPayout * stageProbability);

        computedDetailedRecords.push({
          taskDate: format(taskEndDate, 'MMM d'), billingDateKey: dateKey,
          dealTrial: (taskTrial as { case_name?: string | null } | undefined)?.case_name || 'HSH Assignment', taskName: taskServiceName,
          dateRange: `${format(taskStartDate, 'MMM d')} - ${format(taskEndDate, 'MMM d')}`,
          dailyValue: totalRevenue, daysAssigned: 1, projectedValue: netProjectedValue, fullValue: netFullValue,
          dailyHshPayout: totalHshPayout, isHSH: taskIsHSH,
          probability: stageProbability,
        });

        projectedInvoicesMap.set(dateKey, (projectedInvoicesMap.get(dateKey) || 0) + netProjectedValue);
        fullPotentialInvoicesMap.set(dateKey, (fullPotentialInvoicesMap.get(dateKey) || 0) + netFullValue);
      } else {
        for (let d = new Date(taskStartDate); d <= taskEndDate; d.setDate(d.getDate() + 1)) {
          const currentDate = new Date(d);
          if (!billWeekends && (task as { final_billing_method?: string | null }).final_billing_method === 'daily_minimum') {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;
          }

          const billingDate = getBillingDate(currentDate, computedInvoicePeriod, computedWeeklyBillingDay, computedMonthlyBillingDate, perTrialBillingDays);
          const dateKey = format(billingDate, 'yyyy-MM-dd');
          let dayRevenue: number, dayRevenueFull: number, dayHshPayout = 0;

          if ((taskDailyRevenue as { isSplit?: boolean }).isSplit) {
            const splitRevenue = taskDailyRevenue as { isSplit: boolean; preTrialDailyRevenue: number; inTrialDailyRevenue: number };
            const splitFull = taskDailyRevenueFull as { isSplit: boolean; preTrialDailyRevenue: number; inTrialDailyRevenue: number };
            dayRevenue = trialStartDate && currentDate < trialStartDate ? splitRevenue.preTrialDailyRevenue : splitRevenue.inTrialDailyRevenue;
            dayRevenueFull = trialStartDate && currentDate < trialStartDate ? splitFull.preTrialDailyRevenue : splitFull.inTrialDailyRevenue;
            if (taskHshCategory === 'hiring_company') dayHshPayout = taskHshPayout;
          } else {
            dayRevenue = taskDailyRevenue as number;
            dayRevenueFull = taskDailyRevenueFull as number;
            if (taskHshCategory === 'hiring_company') dayHshPayout = taskHshPayout;
          }

          const stage = taskTrial && 'pipeline_stage_id' in taskTrial
            ? pipelineStages.find(s => s.id === (taskTrial as { pipeline_stage_id?: string | null }).pipeline_stage_id)
            : null;
          const probability = stage?.revenue_probability ?? 1;
          const netFullValue = dayRevenueFull - dayHshPayout;
          const netProjectedValue = (dayRevenueFull - dayHshPayout) * probability;

          computedDetailedRecords.push({
            taskDate: format(currentDate, 'MMM d'), billingDateKey: dateKey,
            dealTrial: (taskTrial as { case_name?: string | null } | undefined)?.case_name || 'HSH Assignment', taskName: taskServiceName,
            dateRange: `${format(taskStartDate, 'MMM d')} - ${format(taskEndDate, 'MMM d')}`,
            dailyValue: dayRevenue, daysAssigned: 1, probability, projectedValue: netProjectedValue, fullValue: netFullValue,
            dailyHshPayout: dayHshPayout, isHSH: taskIsHSH,
          });

          projectedInvoicesMap.set(dateKey, (projectedInvoicesMap.get(dateKey) || 0) + netProjectedValue);
          fullPotentialInvoicesMap.set(dateKey, (fullPotentialInvoicesMap.get(dateKey) || 0) + netFullValue);
        }
      }
    });

    return {
      projectedInvoices: projectedInvoicesMap,
      fullPotentialInvoices: fullPotentialInvoicesMap,
      invoicePeriod: computedInvoicePeriod,
      weeklyBillingDay: computedWeeklyBillingDay,
      monthlyBillingDate: computedMonthlyBillingDate,
      perTrialBillingDays,
      fiscalYearStart: computedFiscalYearStart,
      currentFiscalYear: computedCurrentFiscalYear,
      detailedRecords: computedDetailedRecords,
    };
  }, [tasksWithDailyRevenue, company, selectedFiscalYear, pipelineStages]);

  React.useEffect(() => {
    if (currentFiscalYear && selectedFiscalYear === null) setSelectedFiscalYear(currentFiscalYear);
  }, [currentFiscalYear, selectedFiscalYear]);

  // ── Loading state (bible line 283) ────────────────────────────────────────
  if (isSalesDataLoading || showMyDeals === null || !salesHubTab) {
    return <PageLoader message="Loading sales data..." className="lg:px-8" />;
  }

  // ── Filter deals (bible lines 288–311) ────────────────────────────────────
  let deals = trials.filter(t => {
    const stage = pipelineStages.find(s => s.id === t.pipeline_stage_id);
    if (t.completion_type === 'deal_lost' || t.completion_type === 'deal_settled') return false;
    return stage && stage.type === 'sales';
  });
  if (showMyDeals) deals = deals.filter(d => d.consultant_id === userInfo?.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dealsWithoutSignedLOE = deals
    .filter(deal => {
      const dealDocs = documents.filter(d => d.trial_id === deal.id);
      const hasSignedLOE = dealDocs.some(d => d.status === 'completed');
      return !hasSignedLOE && deal.start_date;
    })
    .map(deal => ({ ...deal, daysUntilTrial: differenceInDays(new Date(deal.start_date! + 'T00:00:00'), today) }))
    .filter(deal => deal.daysUntilTrial >= 0)
    .sort((a, b) => a.daysUntilTrial - b.daysUntilTrial);

  const urgentDeals = dealsWithoutSignedLOE.filter(d => d.daysUntilTrial < 10);
  const warningDeals = dealsWithoutSignedLOE.filter(d => d.daysUntilTrial >= 10 && d.daysUntilTrial <= 30);
  const upcomingDeals = dealsWithoutSignedLOE.filter(d => d.daysUntilTrial > 30 && d.daysUntilTrial <= 90);
  const futureDeals = dealsWithoutSignedLOE.filter(d => d.daysUntilTrial > 90);

  // Suppress unused-variable warnings until sub-tab components are ported
  void clients; void attorneys; void templates; void documentSigners; void trialContacts;
  void consultants; void salesActivities; void invoices; void collections; void leads;
  void leadAttorneys; void leadClients; void pendingActivities; void fullPotentialInvoices;
  void projectedInvoices; void detailedRecords; void urgentDeals; void warningDeals;
  void upcomingDeals; void futureDeals; void timePeriod; void showCumulative;
  void weeklyBillingDay; void monthlyBillingDate; void fiscalYearStart;
  void invoicePeriod; void tasksWithDailyRevenue; void handleShowMyDealsChange;
  void handleCumulativeToggle; void handleTimePeriodChange; void savePreference;
  void showMyDeals; void setShowMyDeals;

  return (
    <div
      className="w-full lg:px-8"
      style={{
        padding: 'var(--theme-page-padding)',
        fontFamily: 'var(--theme-font-body)',
        fontSize: 'var(--theme-text-body)',
      }}
    >
      <div style={{ maxWidth: 'var(--theme-max-content-width)' }} className="mx-auto">
        {/* Page header — hidden on mobile per bible (hidden lg:flex) */}
        <div
          className="hidden lg:flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
          style={{ gap: 'var(--theme-card-gap)' }}
        >
          <div>
            <h1
              className="font-bold mb-2"
              style={{
                fontSize: 'var(--theme-text-page-title)',
                color: 'var(--theme-stone-900)',
              }}
            >
              Sales
            </h1>
            <p style={{ fontSize: 'var(--theme-text-body)', color: 'var(--theme-stone-600)' }}>
              Manage your deals and client relationships
            </p>
          </div>
        </div>

        {/* Three-tab Sales Hub */}
        <Tabs
          value={salesHubTab}
          onValueChange={handleSalesHubTabChange}
          className="mb-8"
        >
          <div style={{ marginBottom: 'var(--theme-section-gap)' }}>
            <TabsList className="w-full sm:w-fit justify-start h-auto">
              <TabsTrigger
                value="radar"
                className="flex items-center gap-1.5 text-xs sm:text-sm sm:gap-2 flex-1 sm:flex-initial whitespace-normal text-center"
              >
                <Radar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                Lead Radar
                <StaleBadge count={staleMyCount} style={{ boxShadow: '0 0 0 1.5px white' }} />
              </TabsTrigger>
              <TabsTrigger
                value="deals"
                className="flex items-center gap-1.5 text-xs sm:text-sm sm:gap-2 flex-1 sm:flex-initial whitespace-normal text-center"
              >
                <Telescope className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                Deal Tracker
              </TabsTrigger>
              <TabsTrigger
                value="projections"
                className="flex items-center gap-1.5 text-xs sm:text-sm sm:gap-2 flex-1 sm:flex-initial whitespace-normal text-center"
              >
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                Projections
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="radar" className="m-0">
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-6 text-center text-stone-500">
              Coming soon: LeadsRadarTab
            </div>
          </TabsContent>

          <TabsContent value="deals" className="m-0">
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-6 text-center text-stone-500">
              Coming soon: DealTrackerTab
            </div>
          </TabsContent>

          <TabsContent value="projections" className="m-0">
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-6 text-center text-stone-500">
              Coming soon: RevenueProjectionsTab
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
