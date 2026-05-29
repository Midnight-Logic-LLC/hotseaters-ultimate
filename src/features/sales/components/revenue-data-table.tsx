/**
 * revenue-data-table.tsx — collapsible per-period revenue breakdown table.
 *
 * Port of HotSeatersMVP/src/components/sales/RevenueDataTable.jsx. A toggle
 * reveals a 7-column grid (Period · Full Potential · Projected · Unpaid ·
 * Revenue · Total · Running Total). Each period row expands to show the
 * aggregated detail rows at the selected DetailLevel.
 *
 * HotSeatersMVP is the bible.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { DetailLevelSlider } from './detail-level-slider';
import {
  aggregateUnpaid,
  aggregateRevenue,
  aggregateProjections,
  type DetailLevel,
  type DetailItem,
} from '@/features/deals/business-rules/revenue-detail-aggregator';
import type {
  ChartRow,
  ClientRow,
  TrialRow,
  RevenueInvoiceRow,
} from './revenue-projections-types';

const GRID_COLS = '70px 1fr 1fr 1fr 1fr 85px 95px';

interface RevenueDataTableProps {
  chartData: ChartRow[];
  caseNames: string[];
  invoices: RevenueInvoiceRow[];
  trials: TrialRow[];
  clients?: ClientRow[];
  detailLevel?: DetailLevel;
  onDetailLevelChange?: (value: DetailLevel) => void;
}

function readVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function fmt(val: number | undefined): string {
  return val
    ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : '—';
}

export function RevenueDataTable({
  chartData,
  caseNames,
  invoices,
  trials,
  clients = [],
  detailLevel = 'invoice',
  onDetailLevelChange,
}: RevenueDataTableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedPeriods, setExpandedPeriods] = useState<Record<number, boolean>>({});

  const successColor = readVar('--theme-success', '#059669');
  const successLight = readVar('--theme-success-light', '#DCFCE7');

  const togglePeriod = (idx: number) => {
    setExpandedPeriods((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Build rows with running totals (immutable reduce).
  const rows = chartData.reduce<{
    runningTotal: number;
    elements: { row: ChartRow; idx: number; total: number; runningTotal: number }[];
  }>(
    (acc, row, idx) => {
      const total =
        (row.revenue || 0) + (row.unpaid || 0) + (row.projected || 0) + (row.fullPotentialDelta || 0);
      const runningTotal = acc.runningTotal + total;
      return {
        runningTotal,
        elements: [...acc.elements, { row, idx, total, runningTotal }],
      };
    },
    { runningTotal: 0, elements: [] },
  ).elements;

  return (
    <div style={{ marginTop: 'var(--theme-element-gap)' }}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--theme-stone-600)', fontFamily: 'var(--theme-font-body)' }}
        >
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Revenue Data Table
        </button>
        {isOpen && onDetailLevelChange && (
          <div className="flex items-center gap-2" style={{ paddingRight: '24px' }}>
            <DetailLevelSlider value={detailLevel} onChange={onDetailLevelChange} />
          </div>
        )}
      </div>

      {isOpen && (
        <div
          className="mt-3 border rounded-lg overflow-hidden"
          style={{ borderColor: 'var(--theme-stone-200)' }}
        >
          {/* Header row */}
          <div
            className="grid text-xs font-semibold"
            style={{
              gridTemplateColumns: GRID_COLS,
              backgroundColor: 'var(--theme-stone-100)',
              color: 'var(--theme-stone-600)',
              padding: '8px 12px',
              fontFamily: 'var(--theme-font-body)',
              borderBottom: '1px solid var(--theme-stone-200)',
            }}
          >
            <div>Period</div>
            <div className="text-right">Full Potential</div>
            <div className="text-right">Projected</div>
            <div className="text-right">Unpaid</div>
            <div className="text-right">Revenue</div>
            <div className="text-right">Total</div>
            <div className="text-right">Running Total</div>
          </div>

          {/* Data rows */}
          {rows.map(({ row, idx, total, runningTotal }) => {
            const expanded = expandedPeriods[idx];
            const hasDetails =
              (row.fullPotential || 0) > 0 ||
              (row.projected || 0) > 0 ||
              (row.unpaid || 0) > 0 ||
              (row.revenue || 0) > 0;

            const fullPotentialCases: DetailItem[] = caseNames
              .map((c) => ({ name: c, value: (row[`full_${c}`] as number) || 0 }))
              .filter((c) => c.value > 0);
            const projectedCases: DetailItem[] = caseNames
              .map((c) => ({ name: c, value: (row[`proj_${c}`] as number) || 0 }))
              .filter((c) => c.value > 0);
            const unpaidInvoices = row._unpaidInvoices || [];
            const periodPayments = row._payments || [];

            return (
              <div key={idx}>
                <button
                  type="button"
                  onClick={() => hasDetails && togglePeriod(idx)}
                  className="grid w-full text-xs transition-colors hover:bg-stone-50"
                  style={{
                    gridTemplateColumns: GRID_COLS,
                    padding: '6px 12px',
                    borderBottom: '1px solid var(--theme-stone-100)',
                    fontFamily: 'var(--theme-font-body)',
                    color: 'var(--theme-stone-700)',
                    cursor: hasDetails ? 'pointer' : 'default',
                    textAlign: 'left',
                  }}
                >
                  <div className="flex items-center gap-1 font-medium">
                    {hasDetails &&
                      (expanded ? (
                        <ChevronDown className="w-3 h-3" style={{ color: 'var(--theme-stone-400)' }} />
                      ) : (
                        <ChevronRight className="w-3 h-3" style={{ color: 'var(--theme-stone-400)' }} />
                      ))}
                    {row.month}
                  </div>
                  <div
                    className="text-right"
                    style={{ color: (row.fullPotential || 0) > 0 ? successColor : 'var(--theme-stone-400)' }}
                  >
                    {fmt(row.fullPotential)}
                  </div>
                  <div
                    className="text-right"
                    style={{ color: (row.projected || 0) > 0 ? successColor : 'var(--theme-stone-400)' }}
                  >
                    {fmt(row.projected)}
                  </div>
                  <div
                    className="text-right"
                    style={{ color: (row.unpaid || 0) > 0 ? '#F59E0B' : 'var(--theme-stone-400)' }}
                  >
                    {fmt(row.unpaid)}
                  </div>
                  <div
                    className="text-right"
                    style={{ color: (row.revenue || 0) > 0 ? '#4F46E5' : 'var(--theme-stone-400)' }}
                  >
                    {fmt(row.revenue)}
                  </div>
                  <div className="text-right font-semibold">{fmt(total)}</div>
                  <div className="text-right font-semibold" style={{ color: 'var(--theme-stone-800)' }}>
                    {fmt(runningTotal)}
                  </div>
                </button>

                {expanded && (
                  <div
                    style={{
                      backgroundColor: 'var(--theme-stone-50)',
                      borderBottom: '1px solid var(--theme-stone-200)',
                    }}
                  >
                    {(() => {
                      const aggFullPotential = aggregateProjections(
                        fullPotentialCases,
                        clients,
                        trials,
                        detailLevel,
                      );
                      const aggProjected = aggregateProjections(projectedCases, clients, trials, detailLevel);
                      const unpaidItems = aggregateUnpaid(unpaidInvoices, trials, clients, detailLevel);
                      const revenueItems = aggregateRevenue(
                        periodPayments,
                        invoices,
                        trials,
                        clients,
                        detailLevel,
                      );
                      const maxRows = Math.max(
                        aggFullPotential.length,
                        aggProjected.length,
                        unpaidItems.length,
                        revenueItems.length,
                      );
                      if (maxRows === 0) {
                        return detailLevel === 'total' ? null : (
                          <div className="text-xs py-2 px-3" style={{ color: 'var(--theme-stone-400)' }}>
                            No detail data
                          </div>
                        );
                      }
                      return Array.from({ length: maxRows }, (_, i) => (
                        <div
                          key={i}
                          className="grid text-xs"
                          style={{
                            gridTemplateColumns: GRID_COLS,
                            padding: '2px 12px',
                            borderBottom: i < maxRows - 1 ? '1px solid var(--theme-stone-100)' : 'none',
                          }}
                        >
                          <div />
                          <DetailCell item={aggFullPotential[i]} color={successLight} borderColor={successColor} />
                          <DetailCell item={aggProjected[i]} color={successColor} />
                          <DetailCell item={unpaidItems[i]} color="#F59E0B" />
                          <DetailCell item={revenueItems[i]} color="#4F46E5" />
                          <div />
                          <div />
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface DetailCellProps {
  item: DetailItem | undefined;
  color: string;
  borderColor?: string;
}

function DetailCell({ item, color, borderColor }: DetailCellProps) {
  if (!item) return <div />;
  const cell = `$${item.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  return (
    <div
      className="flex items-center justify-between gap-1 overflow-hidden"
      style={{ paddingLeft: '12px', paddingRight: '4px', minWidth: 0 }}
    >
      <div className="flex items-center gap-1 min-w-0">
        <div
          style={{
            width: 6,
            height: 6,
            flexShrink: 0,
            backgroundColor: color,
            borderRadius: 1,
            border: borderColor ? `1px solid ${borderColor}` : 'none',
          }}
        />
        <span className="truncate text-left" style={{ color: 'var(--theme-stone-500)' }}>
          {item.name}
        </span>
      </div>
      <span className="font-medium whitespace-nowrap text-right" style={{ color: 'var(--theme-stone-600)' }}>
        {cell}
      </span>
    </div>
  );
}
