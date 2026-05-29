/**
 * ProjectionsPage — port of HotSeatersMVP/src/pages/Projections.jsx
 *
 * Dedicated revenue-projections / forecasting page. Reproduces the same
 * tasksWithDailyRevenue + projectedInvoices business logic as the bible, with
 * the same fiscal-year / invoice-period preferences. The RevenueProjectionsTab
 * sub-component is not yet ported, so a typed "Coming soon" stub is rendered
 * in its place — all props computed by this page will be passed to it once
 * the port lands.
 *
 * Adapter mappings:
 *   useTier1Data()         → useTier1() from @/app/tier1-provider
 *   useDealsTrialsData()   → useProjectionsData() (composes D01 deals hook +
 *                            useClientsList + useEntities<TrialService>)
 *   PageLoader             → inline spinner
 *   RevenueProjectionsTab  → the ported component (D06)
 *
 * Realized-revenue + HSH inputs (D06 deferrals):
 *   - invoices / payments(collections): no port read hook on the deals data
 *     path yet → empty arrays. The projection (future) series is the D06
 *     deliverable; the realized series renders empty until the billing surface
 *     (features/invoices + features/collections) exposes a company-scoped read
 *     hook. See TODO below.
 *   - subcontractAssignments / hiringCompanyAssignments / hshTrials / services:
 *     belong to the HotSeatHub / subcontracts surface → empty arrays.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useState, useMemo, useEffect } from 'react';
import { format, parseISO, getMonth, getYear } from 'date-fns';
import { useTier1 } from '@/app/tier1-provider';
import { Spinner } from '@/components/ui/spinner';
import { useProjectionsData } from '@/features/sales/hooks/use-projections-data';
import { RevenueProjectionsTab } from '@/features/sales/components/revenue-projections-tab';
import type {
  ChartInvoiceRow,
  ChartPaymentRow,
} from '@/features/deals/business-rules/revenue-projection-chart-data';
import type { TrialRow } from '@/features/sales/components/revenue-projections-types';

// ─── Types (verbatim from Sales.jsx / SalesPage) ─────────────────────────────

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

interface CompanyData {
  fiscal_year_start_month?: number | null;
  invoice_period?: string | null;
  weekly_billing_day?: string | null;
  monthly_billing_date?: number | null;
  per_trial_billing_days_after_end?: number | null;
  // Read by RevenueProjectionsTab for the goal / breakeven reference lines.
  annual_revenue_target?: number | null;
  monthly_breakeven?: number | null;
  show_debug_info?: boolean | null;
}

interface UserInfo {
  id: string;
  preferences?: Record<string, unknown>;
}

// ─── Detail record shape (passed to RevenueProjectionsTab) ───────────────────

interface DetailedRecord {
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
}

// ─── Helpers (verbatim from Bible Projections.jsx) ───────────────────────────

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
    const targetDay = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ].indexOf(weeklyBillingDay || 'Friday');
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

// ─── Page loader ──────────────────────────────────────────────────────────────

function PageLoader({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 lg:px-8">
      <Spinner className="size-6 text-stone-400" />
      <p style={{ color: 'var(--theme-stone-500)', fontSize: 'var(--theme-text-body)' }}>
        {message}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// Stable empty stubs for the not-yet-wired revenue inputs (D06 deferrals).
// Module-level frozen identity keeps the projection-math useMemo deps stable.
const EMPTY_SERVICES: Service[] = [];
const EMPTY_SUBCONTRACTS: SubcontractAssignment[] = [];
const EMPTY_HIRING_ASSIGNMENTS: HiringCompanyAssignment[] = [];
const EMPTY_HSH_TRIALS: HshTrial[] = [];
const EMPTY_INVOICES: ChartInvoiceRow[] = [];
const EMPTY_PAYMENTS: ChartPaymentRow[] = [];

export function ProjectionsPage() {
  const { userInfo: t1UserInfo, company: t1Company } = useTier1();

  const [showMyDeals, setShowMyDeals] = useState<boolean | null>(null);
  const [timePeriod, setTimePeriod] = useState('month');
  const [showCumulative, setShowCumulative] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number | null>(null);

  // ── Real data (D01 deals hook + clients + trial services) ─────────────────
  const {
    trials: trialRows,
    clients,
    trialServices: trialServiceRows,
    pipelineStages,
    isLoading: isSalesDataLoading,
  } = useProjectionsData();

  // The bible's projection math reads a narrow field-set; cast at the boundary.
  const trials = trialRows as unknown as Trial[];
  const trialServices = trialServiceRows as unknown as TrialService[];

  // HSH / subcontract revenue inputs belong to the HotSeatHub + subcontracts
  // surface — empty until those read hooks exist (D06 deferral).
  const services = EMPTY_SERVICES;
  const subcontractAssignments = EMPTY_SUBCONTRACTS;
  const hiringCompanyAssignments = EMPTY_HIRING_ASSIGNMENTS;
  const hshTrials = EMPTY_HSH_TRIALS;

  // Realized-revenue inputs — no deals-path read hook yet (D06 deferral).
  // TODO(billing): wire company-scoped invoice + payment reads from
  // features/invoices (fetchInvoicesForCompany) + features/collections once
  // those surfaces expose hooks. Until then the realized series renders empty.
  const invoices = EMPTY_INVOICES;
  const collections = EMPTY_PAYMENTS;
  // ─────────────────────────────────────────────────────────────────────────

  // Local cast mirrors SalesPage / Projections.jsx shape
  const userInfo: UserInfo | null = t1UserInfo ? { id: t1UserInfo.id, preferences: {} } : null;
  const companyExtras = (t1Company ?? {}) as {
    monthly_breakeven?: number | null;
    show_debug_info?: boolean | null;
  };
  const company: CompanyData | null = t1Company
    ? {
        fiscal_year_start_month: t1Company.fiscal_year_start_month ?? null,
        invoice_period: t1Company.invoice_period ?? null,
        weekly_billing_day: t1Company.weekly_billing_day ?? null,
        monthly_billing_date: t1Company.monthly_billing_date ?? null,
        per_trial_billing_days_after_end: t1Company.per_trial_billing_days_after_end ?? null,
        annual_revenue_target: t1Company.annual_revenue_target ?? null,
        monthly_breakeven: companyExtras.monthly_breakeven ?? null,
        show_debug_info: companyExtras.show_debug_info ?? null,
      }
    : null;

  // Load preferences — bible Projections.jsx lines 28–35
  useEffect(() => {
    if (userInfo && !prefsLoaded) {
      const prefs = (userInfo.preferences ?? {}) as Record<string, unknown>;
      setTimePeriod((prefs.salesHubForecastingTimePeriod as string | undefined) || 'month');
      setShowCumulative(
        (prefs.salesHubForecastingShowCumulative as boolean | undefined) || false,
      );
      setShowMyDeals((prefs.salesHubShowMyDeals as boolean | undefined) || false);
      setPrefsLoaded(true);
    }
  }, [userInfo, prefsLoaded]);

  // Preference persistence — no-op until Tier-2 userInfo store wires in.
  const savePreference = (_key: string, _value: unknown) => {
    // TODO(Tier-2): persist to user_info.preferences when store port lands
  };

  const handleTimePeriodChange = (period: string) => {
    setTimePeriod(period);
    savePreference('salesHubForecastingTimePeriod', period);
  };

  const handleCumulativeToggle = (value: boolean) => {
    setShowCumulative(value);
    savePreference('salesHubForecastingShowCumulative', value);
  };

  // ── tasksWithDailyRevenue (verbatim from Bible Projections.jsx ll. 51–110) ──
  const tasksWithDailyRevenue = useMemo(() => {
    const regularTasks = trialServices
      .filter(
        ts =>
          ts.start_date &&
          ts.end_date &&
          (ts.projected_daily_revenue || ts.final_billing_method === 'split'),
      )
      .map(ts => {
        const trial = trials.find(t => t.id === ts.trial_id);
        if (!trial || trial.completion_date) return null;
        if (showMyDeals && trial.consultant_id !== userInfo?.id) return null;

        const stage = trial ? pipelineStages.find(s => s.id === trial.pipeline_stage_id) : null;
        const probability = (stage as { revenue_probability?: number } | undefined)?.revenue_probability ?? 1;
        const startDate = parseISO(ts.start_date!);
        const endDate = parseISO(ts.end_date!);
        const trialStartDate = trial?.start_date ? parseISO(trial.start_date) : null;

        let dailyRevenue: number | { isSplit: true; preTrialDailyRevenue: number; inTrialDailyRevenue: number; preTrialDays: number; inTrialDays: number };
        let dailyRevenueFull: number | { isSplit: true; preTrialDailyRevenue: number; inTrialDailyRevenue: number; preTrialDays: number; inTrialDays: number };

        if (ts.final_billing_method === 'split' && trialStartDate) {
          const daysBeforeTrial = Math.max(
            0,
            Math.ceil(
              (trialStartDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
            ),
          );
          const daysInTrial = Math.max(
            0,
            Math.ceil(
              (endDate.getTime() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24),
            ) + 1,
          );
          dailyRevenueFull = {
            isSplit: true,
            preTrialDailyRevenue: ts.pre_trial_projected_daily_revenue ?? 0,
            inTrialDailyRevenue: ts.in_trial_projected_daily_revenue ?? 0,
            preTrialDays: daysBeforeTrial,
            inTrialDays: daysInTrial,
          };
          dailyRevenue = {
            isSplit: true,
            preTrialDailyRevenue: 0,
            inTrialDailyRevenue: 0,
            preTrialDays: daysBeforeTrial,
            inTrialDays: daysInTrial,
          };
        } else {
          dailyRevenueFull = ts.projected_daily_revenue ?? 0;
          dailyRevenue = 0;
        }

        const hshAssignment = hiringCompanyAssignments.find(
          sa => sa.trial_service_id === ts.id,
        );
        let dailyHshPayoutValue = 0;
        if (hshAssignment && hshAssignment.start_date && hshAssignment.end_date) {
          const assignmentStartDate = parseISO(hshAssignment.start_date);
          const assignmentEndDate = parseISO(hshAssignment.end_date);
          const assignmentCalendarDays = Math.max(
            1,
            Math.ceil(
              (assignmentEndDate.getTime() - assignmentStartDate.getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1,
          );
          dailyHshPayoutValue = (hshAssignment.estimated_total ?? 0) / assignmentCalendarDays;
        }

        if (ts.final_billing_method === 'split' && trialStartDate) {
          const dr = dailyRevenue as {
            isSplit: true;
            preTrialDailyRevenue: number;
            inTrialDailyRevenue: number;
            preTrialDays: number;
            inTrialDays: number;
          };
          const drf = dailyRevenueFull as typeof dr;
          dr.preTrialDailyRevenue =
            (drf.preTrialDailyRevenue - dailyHshPayoutValue) * probability;
          dr.inTrialDailyRevenue =
            (drf.inTrialDailyRevenue - dailyHshPayoutValue) * probability;
        } else {
          const drFull = dailyRevenueFull as number;
          dailyRevenue = (drFull - dailyHshPayoutValue) * probability;
        }

        return {
          ...ts,
          startDate,
          endDate,
          dailyRevenue,
          dailyRevenueFull,
          dailyHshPayout: dailyHshPayoutValue,
          trial,
          isHSH: false,
          hshCategory: dailyHshPayoutValue > 0 ? 'hiring_company' : 'internal',
        };
      })
      .filter((task): task is NonNullable<typeof task> => task !== null);

    const hshTasks = subcontractAssignments
      .filter(
        sa =>
          sa.start_date &&
          sa.end_date &&
          sa.agreed_rate &&
          sa.status === 'active',
      )
      .map(sa => {
        const startDate = parseISO(sa.start_date!);
        const endDate = parseISO(sa.end_date!);
        const trial = hshTrials.find(t => t.id === sa.trial_id) as Trial | undefined;
        const service = services.find(s => s.id === sa.mapped_service_id);
        const calendarDays = Math.max(
          1,
          Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
          ) + 1,
        );
        const estimatedTotal =
          sa.estimated_total ?? ((sa.agreed_rate ?? 0) * calendarDays);
        const dailyRevenue = estimatedTotal / calendarDays;
        return {
          id: sa.id,
          service_name: service?.name ?? 'HSH Service',
          start_date: sa.start_date!,
          end_date: sa.end_date!,
          startDate,
          endDate,
          dailyRevenue,
          dailyRevenueFull: dailyRevenue,
          dailyHshPayout: 0,
          trial: trial ?? null,
          isHSH: true,
          hshAssignment: sa,
          estimated_total: estimatedTotal,
          hshCategory: 'subcontractor',
        };
      });

    return [...regularTasks, ...hshTasks];
  }, [
    trialServices,
    trials,
    pipelineStages,
    showMyDeals,
    userInfo,
    subcontractAssignments,
    hshTrials,
    services,
    hiringCompanyAssignments,
  ]);

  // ── projectedInvoices / detailedRecords (verbatim from Bible ll. 113–235) ──
  const {
    projectedInvoices,
    invoicePeriod,
    weeklyBillingDay,
    monthlyBillingDate,
    fiscalYearStart,
    currentFiscalYear,
    detailedRecords,
  } = useMemo(() => {
    const fiscalYearStartMonth = company?.fiscal_year_start_month ?? 1;
    const now = new Date();
    const currentYear = getYear(now);
    const currentMonth = getMonth(now) + 1;
    const currentFiscalYearVal =
      currentMonth >= fiscalYearStartMonth ? currentYear : currentYear - 1;
    const yearToUse =
      selectedFiscalYear !== null ? selectedFiscalYear : currentFiscalYearVal;
    const fiscalYearStartDate = new Date(yearToUse, fiscalYearStartMonth - 1, 1);

    const invoicePeriodVal = company?.invoice_period ?? 'monthly';
    const weeklyBillingDayVal = company?.weekly_billing_day ?? 'Friday';
    const monthlyBillingDateVal = company?.monthly_billing_date ?? 1;
    const perTrialBillingDaysVal = company?.per_trial_billing_days_after_end ?? 7;

    const projectedInvoicesMap = new Map<string, number>();
    const fullPotentialInvoices = new Map<string, number>();
    const detailedRecordsArr: DetailedRecord[] = [];

    tasksWithDailyRevenue.forEach((task) => {
      const trialStartDate =
        task.trial?.start_date ? parseISO(task.trial.start_date) : null;
      const billWeekends = task.trial?.bill_for_weekends !== false;
      const taskAny = task as Record<string, unknown>;

      if (invoicePeriodVal === 'per_trial') {
        const billingDate = getBillingDate(
          task.endDate,
          invoicePeriodVal,
          weeklyBillingDayVal,
          monthlyBillingDateVal,
          perTrialBillingDaysVal,
        );
        const dateKey = format(billingDate, 'yyyy-MM-dd');
        let totalRevenue: number;
        let totalRevenueFull: number;
        let totalHshPayout = 0;

        const dr = task.dailyRevenue;
        const drf = task.dailyRevenueFull;
        if (typeof dr === 'object' && dr !== null && (dr as { isSplit?: boolean }).isSplit) {
          const drSplit = dr as { preTrialDailyRevenue: number; inTrialDailyRevenue: number; preTrialDays: number; inTrialDays: number };
          const drfSplit = drf as typeof drSplit;
          totalRevenue =
            drSplit.preTrialDailyRevenue * drSplit.preTrialDays +
            drSplit.inTrialDailyRevenue * drSplit.inTrialDays;
          totalRevenueFull =
            drfSplit.preTrialDailyRevenue * drfSplit.preTrialDays +
            drfSplit.inTrialDailyRevenue * drfSplit.inTrialDays;
          if (taskAny.hshCategory === 'hiring_company') {
            totalHshPayout =
              (task.dailyHshPayout as number) * drSplit.preTrialDays +
              (task.dailyHshPayout as number) * drSplit.inTrialDays;
          }
        } else {
          const totalDays = billWeekends
            ? Math.max(
                1,
                Math.ceil(
                  (task.endDate.getTime() - task.startDate.getTime()) /
                    (1000 * 60 * 60 * 24),
                ) + 1,
              )
            : (() => {
                let days = 0;
                const current = new Date(task.startDate);
                while (current <= task.endDate) {
                  const dayOfWeek = current.getDay();
                  if (dayOfWeek !== 0 && dayOfWeek !== 6) days++;
                  current.setDate(current.getDate() + 1);
                }
                return Math.max(1, days);
              })();
          totalRevenue = (dr as number) * totalDays;
          totalRevenueFull = (drf as number) * totalDays;
          if (taskAny.hshCategory === 'hiring_company')
            totalHshPayout = (task.dailyHshPayout as number) * totalDays;
        }

        const stageForTask = task.trial
          ? pipelineStages.find(
              s => s.id === (task.trial as Trial).pipeline_stage_id,
            )
          : null;
        const probForTask =
          (stageForTask as { revenue_probability?: number } | undefined)?.revenue_probability ?? 1;
        const netFullValue = totalRevenueFull - totalHshPayout;
        const netProjectedValue =
          totalRevenue - totalHshPayout * probForTask;

        detailedRecordsArr.push({
          taskDate: format(task.endDate, 'MMM d'),
          billingDateKey: dateKey,
          dealTrial: (task.trial as Trial | null)?.case_name ?? 'HSH Assignment',
          taskName: (taskAny.service_name as string | null) ?? '',
          dateRange: `${format(task.startDate, 'MMM d')} - ${format(task.endDate, 'MMM d')}`,
          dailyValue: totalRevenue,
          daysAssigned: 1,
          projectedValue: netProjectedValue,
          fullValue: netFullValue,
          dailyHshPayout: totalHshPayout,
          isHSH: (task.isHSH as boolean) || false,
          probability: probForTask,
        });

        projectedInvoicesMap.set(
          dateKey,
          (projectedInvoicesMap.get(dateKey) ?? 0) + netProjectedValue,
        );
        fullPotentialInvoices.set(
          dateKey,
          (fullPotentialInvoices.get(dateKey) ?? 0) + netFullValue,
        );
      } else {
        for (
          let d = new Date(task.startDate);
          d <= task.endDate;
          d.setDate(d.getDate() + 1)
        ) {
          const currentDate = new Date(d);
          if (
            !billWeekends &&
            (taskAny.final_billing_method as string | undefined) === 'daily_minimum'
          ) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;
          }

          const billingDate = getBillingDate(
            currentDate,
            invoicePeriodVal,
            weeklyBillingDayVal,
            monthlyBillingDateVal,
            perTrialBillingDaysVal,
          );
          const dateKey = format(billingDate, 'yyyy-MM-dd');

          let dayRevenue: number;
          let dayRevenueFull: number;
          let dayHshPayout = 0;

          const dr = task.dailyRevenue;
          const drf = task.dailyRevenueFull;
          if (typeof dr === 'object' && dr !== null && (dr as { isSplit?: boolean }).isSplit) {
            const drSplit = dr as { preTrialDailyRevenue: number; inTrialDailyRevenue: number };
            const drfSplit = drf as typeof drSplit;
            dayRevenue =
              trialStartDate && currentDate < trialStartDate
                ? drSplit.preTrialDailyRevenue
                : drSplit.inTrialDailyRevenue;
            dayRevenueFull =
              trialStartDate && currentDate < trialStartDate
                ? drfSplit.preTrialDailyRevenue
                : drfSplit.inTrialDailyRevenue;
            if (taskAny.hshCategory === 'hiring_company')
              dayHshPayout = task.dailyHshPayout as number;
          } else {
            dayRevenue = dr as number;
            dayRevenueFull = drf as number;
            if (taskAny.hshCategory === 'hiring_company')
              dayHshPayout = task.dailyHshPayout as number;
          }

          const stageForDay = task.trial
            ? pipelineStages.find(
                s => s.id === (task.trial as Trial).pipeline_stage_id,
              )
            : null;
          const probForDay =
            (stageForDay as { revenue_probability?: number } | undefined)?.revenue_probability ?? 1;
          const netFullValue = dayRevenueFull - dayHshPayout;
          const netProjectedValue = (dayRevenueFull - dayHshPayout) * probForDay;

          detailedRecordsArr.push({
            taskDate: format(currentDate, 'MMM d'),
            billingDateKey: dateKey,
            dealTrial: (task.trial as Trial | null)?.case_name ?? 'HSH Assignment',
            taskName: (taskAny.service_name as string | null) ?? '',
            dateRange: `${format(task.startDate, 'MMM d')} - ${format(task.endDate, 'MMM d')}`,
            dailyValue: dayRevenue,
            daysAssigned: 1,
            probability: probForDay,
            projectedValue: netProjectedValue,
            fullValue: netFullValue,
            dailyHshPayout: dayHshPayout,
            isHSH: (task.isHSH as boolean) || false,
          });

          projectedInvoicesMap.set(
            dateKey,
            (projectedInvoicesMap.get(dateKey) ?? 0) + netProjectedValue,
          );
          fullPotentialInvoices.set(
            dateKey,
            (fullPotentialInvoices.get(dateKey) ?? 0) + netFullValue,
          );
        }
      }
    });

    return {
      projectedInvoices: projectedInvoicesMap,
      fullPotentialInvoices,
      invoicePeriod: invoicePeriodVal,
      weeklyBillingDay: weeklyBillingDayVal,
      monthlyBillingDate: monthlyBillingDateVal,
      perTrialBillingDays: perTrialBillingDaysVal,
      fiscalYearStart: fiscalYearStartDate,
      currentFiscalYear: currentFiscalYearVal,
      detailedRecords: detailedRecordsArr,
    };
  }, [tasksWithDailyRevenue, company, selectedFiscalYear, pipelineStages]);

  // Sync selectedFiscalYear to currentFiscalYear on first load — bible ll. 237–239
  useEffect(() => {
    if (currentFiscalYear && selectedFiscalYear === null) {
      setSelectedFiscalYear(currentFiscalYear);
    }
  }, [currentFiscalYear, selectedFiscalYear]);

  if (isSalesDataLoading || showMyDeals === null) {
    return <PageLoader message="Loading projections..." />;
  }

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
        <div
          className="hidden lg:flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
          style={{ gap: 'var(--theme-card-gap)' }}
        >
          <div>
            <h1
              className="font-bold mb-2"
              style={{
                fontFamily: 'var(--theme-font-page-title)',
                fontSize: 'var(--theme-text-page-title)',
                color: 'var(--theme-stone-900)',
              }}
            >
              Projections
            </h1>
            <p style={{ fontSize: 'var(--theme-text-body)', color: 'var(--theme-stone-600)' }}>
              Revenue forecasting across the fiscal year
            </p>
          </div>
        </div>

        <RevenueProjectionsTab
          timePeriod={timePeriod}
          showCumulative={showCumulative}
          selectedFiscalYear={selectedFiscalYear}
          onTimePeriodChange={handleTimePeriodChange}
          onCumulativeToggle={handleCumulativeToggle}
          onFiscalYearChange={setSelectedFiscalYear}
          detailedRecords={detailedRecords}
          invoices={invoices}
          payments={collections}
          trials={trialRows as unknown as TrialRow[]}
          clients={clients}
          company={company}
          fiscalYearStart={fiscalYearStart}
          invoicePeriod={invoicePeriod}
          weeklyBillingDay={weeklyBillingDay}
          monthlyBillingDate={monthlyBillingDate}
          projectedInvoices={projectedInvoices}
          tasksWithDailyRevenue={tasksWithDailyRevenue}
          pipelineStages={pipelineStages}
        />
      </div>
    </div>
  );
}
