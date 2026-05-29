/**
 * revenue-projections-types.ts — shared row/record shapes for the Revenue
 * Projections tab + data table. Extracted so the tab, the chart, and the table
 * agree on a single type (DRY) without importing each other.
 *
 * HotSeatersMVP is the bible.
 */

import type {
  AggregatorTrialRow,
  AggregatorClientRow,
  UnpaidInvoiceRow,
  PaymentRow,
  RevenueInvoiceRow,
} from '@/features/deals/business-rules/revenue-detail-aggregator';

/** One billing-day record produced by the page's projection math. */
export interface DetailedRecord {
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

/**
 * One chart period row. Fixed numeric series plus dynamic per-case keys
 * (`proj_<caseName>`, `full_<caseName>`) and the raw arrays the tooltip /
 * table detail rows aggregate over.
 */
export interface ChartRow {
  month: string;
  revenue: number;
  unpaid: number;
  projected: number;
  fullPotential: number;
  fullPotentialDelta: number;
  cumulativeGoal?: number;
  cumulativeBreakeven?: number;
  _payments?: PaymentRow[];
  _unpaidInvoices?: UnpaidInvoiceRow[];
  /** Dynamic per-case `proj_<name>` / `full_<name>` numeric columns. */
  [caseKey: string]: number | string | PaymentRow[] | UnpaidInvoiceRow[] | undefined;
}

export type TrialRow = AggregatorTrialRow & {
  start_date?: string | null;
  bill_for_weekends?: boolean | null;
  pipeline_stage_id?: string | null;
};

export type { AggregatorClientRow as ClientRow, RevenueInvoiceRow, PaymentRow, UnpaidInvoiceRow };
