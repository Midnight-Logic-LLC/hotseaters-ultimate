/**
 * revenue-detail-aggregator.ts — pure aggregation of revenue / unpaid /
 * projection detail items by the selected detail level.
 *
 * Ported EXACTLY (RULE J) from
 * `HotSeatersMVP/src/components/sales/revenueDetailAggregator.jsx`.
 *
 * Four exported functions produce `{ name, value }[]` arrays for the
 * RevenueProjectionsTab tooltip + data-table detail rows:
 *   - aggregateUnpaid       — over unpaid invoices for a period
 *   - aggregateRevenue      — over payments for a period
 *   - aggregateProjections  — over per-case projection items for a period
 *   - aggregateItems        — internal group-by helper (exported for tests)
 *
 * `detailLevel` controls grouping:
 *   - 'total'   → [] (the chart already shows the total; no breakdown)
 *   - 'invoice' → one row per item (invoiceLabel)
 *   - 'case'    → group-sum by caseLabel
 *   - 'client'  → group-sum by clientLabel
 *
 * Pure: no I/O, no React. HotSeatersMVP is the bible.
 */

export type DetailLevel = 'total' | 'invoice' | 'case' | 'client';

/** A `{ name, value }` row, the universal aggregator output shape. */
export interface DetailItem {
  name: string;
  value: number;
}

/** Invoice row shape consumed by `aggregateUnpaid`. */
export interface UnpaidInvoiceRow {
  trial_id?: string | null;
  invoice_number?: string | number | null;
  total?: number | null;
}

/** Payment row shape consumed by `aggregateRevenue`. */
export interface PaymentRow {
  invoice_id?: string | null;
  payment_reference?: string | null;
  amount?: number | null;
}

/** Invoice row shape consumed by `aggregateRevenue` (payment→invoice join). */
export interface RevenueInvoiceRow {
  id?: string | null;
  trial_id?: string | null;
  invoice_number?: string | number | null;
}

/** Trial row used for the trial→client join in all three aggregators. */
export interface AggregatorTrialRow {
  id?: string | null;
  case_name?: string | null;
  client_id?: string | null;
}

/** Client row used for the client-label resolution. */
export interface AggregatorClientRow {
  id?: string | null;
  firm_name?: string | null;
}

/** Pre-shaped item fed to `aggregateItems` (label trio + numeric value). */
export interface LabeledItem {
  invoiceLabel: string;
  caseLabel: string;
  clientLabel: string;
  value: number;
}

/**
 * aggregateUnpaid — bible lines 6–20.
 * Empty when there are no invoices or detailLevel is 'total'.
 */
export function aggregateUnpaid(
  unpaidInvoices: UnpaidInvoiceRow[] | null | undefined,
  trials: AggregatorTrialRow[],
  clients: AggregatorClientRow[],
  detailLevel: DetailLevel,
): DetailItem[] {
  if (!unpaidInvoices?.length) return [];
  if (detailLevel === 'total') return [];

  return aggregateItems(
    unpaidInvoices.map((inv) => {
      const trial = trials.find((t) => t.id === inv.trial_id);
      const client = trial ? clients.find((c) => c.id === trial.client_id) : null;
      const invLabel = inv.invoice_number ? `#${inv.invoice_number}` : 'Invoice';
      return {
        invoiceLabel: invLabel,
        caseLabel: trial?.case_name || invLabel,
        clientLabel: client?.firm_name || trial?.case_name || 'Unknown',
        value: inv.total || 0,
      };
    }),
    detailLevel,
  );
}

/**
 * aggregateRevenue — bible lines 22–37.
 * Empty when there are no payments or detailLevel is 'total'.
 */
export function aggregateRevenue(
  payments: PaymentRow[] | null | undefined,
  invoices: RevenueInvoiceRow[],
  trials: AggregatorTrialRow[],
  clients: AggregatorClientRow[],
  detailLevel: DetailLevel,
): DetailItem[] {
  if (!payments?.length) return [];
  if (detailLevel === 'total') return [];

  return aggregateItems(
    payments.map((p) => {
      const inv = invoices.find((i) => i.id === p.invoice_id);
      const trial = inv ? trials.find((t) => t.id === inv.trial_id) : null;
      const client = trial ? clients.find((c) => c.id === trial.client_id) : null;
      const invNumberLabel = inv?.invoice_number ? `#${inv.invoice_number}` : null;
      return {
        invoiceLabel: trial?.case_name || invNumberLabel || p.payment_reference || 'Payment',
        caseLabel: trial?.case_name || invNumberLabel || 'Payment',
        clientLabel: client?.firm_name || trial?.case_name || 'Unknown',
        value: p.amount || 0,
      };
    }),
    detailLevel,
  );
}

/**
 * aggregateProjections — bible lines 39–53.
 * Operates on already-shaped per-case items (`{ name, value }`).
 *   - 'total'              → []
 *   - 'invoice' | 'case'   → caseItems as-is
 *   - 'client'             → sum caseItems by client.firm_name (joined via
 *                            trial.case_name === item.name → client)
 */
export function aggregateProjections(
  caseItems: DetailItem[] | null | undefined,
  clients: AggregatorClientRow[],
  trials: AggregatorTrialRow[],
  detailLevel: DetailLevel,
): DetailItem[] {
  if (!caseItems?.length) return [];
  if (detailLevel === 'total') return [];
  if (detailLevel === 'invoice' || detailLevel === 'case') return caseItems;

  // Aggregate by client.
  const map: Record<string, number> = {};
  caseItems.forEach((item) => {
    const trial = trials.find((t) => t.case_name === item.name);
    const client = trial ? clients.find((c) => c.id === trial.client_id) : null;
    const key = client?.firm_name || item.name;
    map[key] = (map[key] || 0) + item.value;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

/**
 * aggregateItems — internal group-by helper, bible lines 55–67.
 *   - 'invoice' → one row per item keyed by invoiceLabel
 *   - 'case'    → group-sum by caseLabel
 *   - 'client'  → group-sum by clientLabel
 *
 * Exported for unit testing; not part of the consumer-facing surface.
 */
export function aggregateItems(items: LabeledItem[], detailLevel: DetailLevel): DetailItem[] {
  if (detailLevel === 'invoice') {
    return items.map((i) => ({ name: i.invoiceLabel, value: i.value }));
  }

  const labelKey: 'caseLabel' | 'clientLabel' =
    detailLevel === 'case' ? 'caseLabel' : 'clientLabel';
  const map: Record<string, number> = {};
  items.forEach((i) => {
    const key = i[labelKey];
    map[key] = (map[key] || 0) + i.value;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}
