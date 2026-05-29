/**
 * revenue-projections-tab.tsx — Revenue Trend (fiscal year) chart + data table.
 *
 * Port of HotSeatersMVP/src/components/sales/RevenueProjectionsTab.jsx
 * (524 LOC). A stacked ComposedChart (Revenue · Unpaid · Projected ·
 * Full-Potential-delta bars) with breakeven/goal reference lines (per-period)
 * or cumulative line series, a custom tooltip, and a collapsible breakdown
 * table beneath. Year / period / cumulative controls live in the card header
 * (desktop) and above the card (mobile).
 *
 * Chart-series math is the pure `buildChartData` rule (RULE J). The tooltip and
 * table are sibling components; the detail-aggregation is the shared pure
 * aggregator. recharts is the GQAdonis fork — ResponsiveContainer carries the
 * min-dimension guards established in revenue-trend-card.tsx.
 *
 * DEFERRED (dev-only): the bible renders <RevenueTrendDebugCard> and (behind
 * `company.show_debug_info`) <RevenueProjectionDebug>. Both are diagnostic
 * panels, not customer-facing parity surfaces — see TODO below.
 *
 * HotSeatersMVP is the bible.
 */

import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  LabelList,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  buildChartData,
  type ChartPaymentRow,
  type ChartInvoiceRow,
} from '@/features/deals/business-rules/revenue-projection-chart-data';
import type { DetailLevel } from '@/features/deals/business-rules/revenue-detail-aggregator';
import type { PipelineStage } from '@/shared/db/lookups-selectors';
import { readCssVar } from '@/shared/lib/css-vars';
import { YearSelector } from './year-selector';
import { RevenueDataTable } from './revenue-data-table';
import { RevenueProjectionTooltip, type RevenueProjectionTooltipProps } from './revenue-projection-tooltip';
import type {
  ChartRow,
  DetailedRecord,
  ClientRow,
  TrialRow,
} from './revenue-projections-types';

const STACK_KEYS = ['revenue', 'unpaid', 'projected', 'fullPotentialDelta'] as const;

// Custom bar shape: round top corners only when this bar is the topmost
// visible segment in the stack (bible RoundedTopBar, lines 12–28). Typed loose
// to fit recharts' own `ActiveShape` callback signature under
// exactOptionalPropertyTypes.
interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: ChartRow;
  dataKey?: string | number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

function makeRoundedTopBar(stackKeys: readonly string[]) {
  return function RoundedTopBar(rawProps: unknown) {
    const props = rawProps as BarShapeProps;
    const { x = 0, y = 0, width = 0, height = 0, payload, dataKey } = props;
    if (!height || height <= 0) return null;

    const myIndex = stackKeys.indexOf(String(dataKey ?? ''));
    const isTopmost = stackKeys
      .slice(myIndex + 1)
      .every((k) => !(((payload?.[k] as number | undefined) ?? 0) > 0));
    const r = isTopmost ? 4 : 0;

    const path =
      r > 0
        ? `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`
        : `M${x},${y + height} L${x},${y} L${x + width},${y} L${x + width},${y + height} Z`;

    return <path d={path} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth || 0} />;
  };
}

/** Loose shape for the recharts <LabelList content> callback. */
interface LabelProps {
  x?: number;
  y?: number;
  index?: number;
  value?: number;
}

interface CompanyData {
  annual_revenue_target?: number | null;
  monthly_breakeven?: number | null;
  show_debug_info?: boolean | null;
}

export interface RevenueProjectionsTabProps {
  timePeriod: string;
  showCumulative: boolean;
  selectedFiscalYear: number | null;
  onTimePeriodChange: (p: string) => void;
  onCumulativeToggle: (v: boolean) => void;
  onFiscalYearChange: (y: number) => void;
  detailedRecords: DetailedRecord[];
  invoices: ChartInvoiceRow[];
  payments?: ChartPaymentRow[];
  trials?: TrialRow[];
  clients?: ClientRow[];
  company: CompanyData | null;
  fiscalYearStart: Date | null;
  invoicePeriod: string;
  weeklyBillingDay: string;
  monthlyBillingDate: number;
  projectedInvoices: Map<string, number>;
  tasksWithDailyRevenue: unknown[];
  pipelineStages: PipelineStage[];
}

export function RevenueProjectionsTab({
  timePeriod,
  showCumulative,
  selectedFiscalYear,
  onTimePeriodChange,
  onCumulativeToggle,
  onFiscalYearChange,
  detailedRecords,
  invoices,
  payments = [],
  trials = [],
  clients = [],
  company,
  fiscalYearStart,
}: RevenueProjectionsTabProps) {
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('invoice');

  const annualRevenueTarget = company?.annual_revenue_target || 0;
  const monthlyBreakeven = company?.monthly_breakeven || 0;
  const periodsPerYear = timePeriod === 'week' ? 52 : 12;
  const breakevenPerPeriod = timePeriod === 'week' ? (monthlyBreakeven * 12) / 52 : monthlyBreakeven;
  const goalPerPeriod = annualRevenueTarget / periodsPerYear;
  const revenueGoalValue = showCumulative ? annualRevenueTarget : goalPerPeriod;

  const chartTimePeriod: 'week' | 'month' = timePeriod === 'week' ? 'week' : 'month';

  // Unique case names from detailedRecords (bible lines 65–69).
  const caseNames = useMemo(() => {
    const names = new Set<string>();
    detailedRecords.forEach((r) => {
      if (r.dealTrial) names.add(r.dealTrial);
    });
    return Array.from(names).sort();
  }, [detailedRecords]);

  const fyStartTime = fiscalYearStart ? fiscalYearStart.getTime() : null;
  const fyStart = useMemo(
    () => (fyStartTime != null ? new Date(fyStartTime) : new Date(new Date().getFullYear(), 0, 1)),
    [fyStartTime],
  );

  const finalChartData = useMemo(
    () =>
      buildChartData({
        detailedRecords,
        invoices,
        payments,
        caseNames,
        timePeriod: chartTimePeriod,
        fiscalYearStart: fyStart,
        showCumulative,
        monthlyBreakeven,
        annualRevenueTarget,
        breakevenPerPeriod,
        goalPerPeriod,
      }),
    [
      detailedRecords,
      invoices,
      payments,
      caseNames,
      chartTimePeriod,
      fyStart,
      showCumulative,
      monthlyBreakeven,
      annualRevenueTarget,
      breakevenPerPeriod,
      goalPerPeriod,
    ],
  );

  // The data table always shows non-cumulative rows (bible lines 170–202).
  const nonCumulativeChartData = useMemo(() => {
    if (!showCumulative) return finalChartData;
    return buildChartData({
      detailedRecords,
      invoices,
      payments,
      caseNames,
      timePeriod: chartTimePeriod,
      fiscalYearStart: fyStart,
      showCumulative: false,
      monthlyBreakeven,
      annualRevenueTarget,
      breakevenPerPeriod,
      goalPerPeriod,
    });
  }, [
    showCumulative,
    finalChartData,
    detailedRecords,
    invoices,
    payments,
    caseNames,
    chartTimePeriod,
    fyStart,
    monthlyBreakeven,
    annualRevenueTarget,
    breakevenPerPeriod,
    goalPerPeriod,
  ]);

  const successColor = readCssVar('--theme-success', '#059669');
  const successLight = readCssVar('--theme-success-light', '#DCFCE7');
  const roundedBar = makeRoundedTopBar(STACK_KEYS);

  const renderControls = () => (
    <div className="flex items-center flex-wrap" style={{ gap: 'var(--theme-element-gap)' }}>
      <YearSelector selectedYear={selectedFiscalYear} onYearChange={onFiscalYearChange} />
      <div
        className="flex items-center rounded-lg border overflow-hidden"
        style={{ borderColor: 'var(--theme-stone-200)' }}
      >
        {['week', 'month'].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onTimePeriodChange(p)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
            style={
              timePeriod === p
                ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' }
                : {
                    color: 'var(--theme-stone-600)',
                    backgroundColor: 'color-mix(in srgb, var(--theme-brand-primary) 10%, white)',
                  }
            }
          >
            {p === 'week' ? 'Week' : 'Month'}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onCumulativeToggle(!showCumulative)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
        style={{
          borderColor: showCumulative ? 'var(--theme-brand-primary)' : 'var(--theme-stone-200)',
          backgroundColor: showCumulative
            ? 'color-mix(in srgb, var(--theme-brand-primary) 10%, white)'
            : 'transparent',
          color: showCumulative ? 'var(--theme-brand-primary)' : 'var(--theme-stone-500)',
        }}
      >
        Cumulative
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile-only controls (no card header) */}
      <div
        className="lg:hidden flex items-center"
        style={{ gap: 'var(--theme-element-gap)', marginBottom: 'var(--theme-element-gap)' }}
      >
        {renderControls()}
      </div>

      <Card
        style={{
          marginBottom: 'var(--theme-section-gap)',
          borderRadius: 'var(--theme-card-radius)',
          boxShadow: 'var(--theme-card-shadow)',
          borderWidth: 'var(--theme-card-border)',
          borderColor: 'var(--theme-stone-200)',
          backgroundColor: 'var(--theme-card-bg)',
          overflow: 'hidden',
        }}
      >
        <CardHeader
          className="hidden lg:block"
          style={{
            backgroundColor: 'var(--theme-card-header-bg)',
            padding: 'var(--theme-card-header-padding)',
            borderBottom: '1px solid var(--theme-stone-200)',
          }}
        >
          <div className="flex items-center justify-between flex-wrap" style={{ gap: 'var(--theme-element-gap)' }}>
            <CardTitle
              className="flex items-center"
              style={{
                fontSize: 'var(--theme-text-card-title)',
                color: 'var(--theme-stone-900)',
                gap: 'var(--theme-element-gap)',
              }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--theme-brand-primary)' }} />
              Revenue Trend - Fiscal Year
            </CardTitle>
            {renderControls()}
          </div>
        </CardHeader>
        <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
          <div style={{ width: '100%', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={400} minWidth={1}>
              <ComposedChart data={finalChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" fill="var(--theme-stone-100)" />
                <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
                  domain={[0, (dataMax: number) => Math.max(dataMax, revenueGoalValue * 1.1)]}
                />
                <Tooltip
                  content={(props: { active?: boolean; payload?: unknown }) => (
                    <RevenueProjectionTooltip
                      active={props.active ?? false}
                      payload={props.payload as RevenueProjectionTooltipProps['payload']}
                      caseNames={caseNames}
                      detailLevel={detailLevel}
                      clients={clients}
                      trials={trials}
                      invoices={invoices}
                      showCumulative={showCumulative}
                    />
                  )}
                />
                <Legend
                  content={() => (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        gap: '16px',
                        marginTop: '8px',
                      }}
                    >
                      {[
                        { value: 'Full Potential', isLine: false, color: successLight, isFull: true },
                        { value: 'Projected', isLine: false, color: successColor, isFull: false },
                        { value: 'Unpaid', isLine: false, color: '#F59E0B', isFull: false },
                        { value: 'Revenue', isLine: false, color: '#4F46E5', isFull: false },
                        ...(annualRevenueTarget > 0
                          ? [
                              {
                                value: showCumulative
                                  ? 'Annual Goal'
                                  : timePeriod === 'week'
                                    ? 'Weekly Goal'
                                    : 'Monthly Goal',
                                isLine: true,
                                color: '#10B981',
                                isFull: false,
                              },
                            ]
                          : []),
                        ...(monthlyBreakeven > 0
                          ? [{ value: 'Breakeven', isLine: true, color: '#EF4444', isFull: false }]
                          : []),
                      ].map((entry, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {entry.isLine ? (
                            <svg width="14" height="14" viewBox="0 0 14 14">
                              <line
                                x1="0"
                                y1="7"
                                x2="14"
                                y2="7"
                                stroke={entry.color}
                                strokeWidth="2"
                                strokeDasharray="5 5"
                              />
                            </svg>
                          ) : (
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: entry.color,
                                borderRadius: '2px',
                                ...(entry.isFull ? { border: `1.5px solid ${successColor}` } : {}),
                              }}
                            />
                          )}
                          <span style={{ fontSize: '13px', color: '#6b7280' }}>{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                />

                <Bar dataKey="revenue" stackId="a" fill="#4F46E5" name="Revenue" legendType="none" shape={roundedBar} />
                <Bar dataKey="unpaid" stackId="a" fill="#F59E0B" name="Unpaid" legendType="none" shape={roundedBar} />
                <Bar
                  dataKey="projected"
                  stackId="a"
                  fill={successColor}
                  name="Projected"
                  legendType="none"
                  shape={roundedBar}
                />
                <Bar
                  dataKey="fullPotentialDelta"
                  stackId="a"
                  fill={successLight}
                  stroke={successColor}
                  strokeWidth={0.5}
                  name="Full Potential"
                  legendType="none"
                  shape={roundedBar}
                />

                {monthlyBreakeven > 0 && !showCumulative && (
                  <ReferenceLine
                    y={breakevenPerPeriod}
                    stroke="#EF4444"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={({ viewBox }: { viewBox: { x: number; y: number; width: number } }) => (
                      <text
                        x={viewBox.width + viewBox.x - 5}
                        y={viewBox.y - 6}
                        fill="#EF4444"
                        fontSize={11}
                        fontWeight={600}
                        textAnchor="end"
                      >
                        Breakeven ${(breakevenPerPeriod / 1000).toFixed(0)}k
                      </text>
                    )}
                  />
                )}
                {annualRevenueTarget > 0 && !showCumulative && (
                  <ReferenceLine
                    y={goalPerPeriod}
                    stroke="#10B981"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={({ viewBox }: { viewBox: { x: number; y: number; width: number } }) => (
                      <text
                        x={viewBox.width + viewBox.x - 5}
                        y={viewBox.y - 6}
                        fill="#10B981"
                        fontSize={11}
                        fontWeight={600}
                        textAnchor="end"
                      >
                        Goal ${(goalPerPeriod / 1000).toFixed(0)}k
                      </text>
                    )}
                  />
                )}
                {showCumulative && monthlyBreakeven > 0 && (
                  <Line
                    type="linear"
                    dataKey="cumulativeBreakeven"
                    stroke="#EF4444"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    name="Breakeven"
                    connectNulls
                  >
                    <LabelList
                      dataKey="cumulativeBreakeven"
                      position="top"
                      content={(raw: unknown) => {
                        const { x, y, index, value } = raw as LabelProps;
                        return index !== finalChartData.length - 1 ? null : (
                          <text x={x} y={(y ?? 0) - 6} fill="#EF4444" fontSize={11} fontWeight={600} textAnchor="end">
                            Breakeven ${((value ?? 0) / 1000).toFixed(0)}k
                          </text>
                        );
                      }}
                    />
                  </Line>
                )}
                {showCumulative && annualRevenueTarget > 0 && (
                  <Line
                    type="linear"
                    dataKey="cumulativeGoal"
                    stroke="#10B981"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    name="Annual Goal"
                    connectNulls
                  >
                    <LabelList
                      dataKey="cumulativeGoal"
                      position="top"
                      content={(raw: unknown) => {
                        const { x, y, index, value } = raw as LabelProps;
                        return index !== finalChartData.length - 1 ? null : (
                          <text x={x} y={(y ?? 0) - 6} fill="#10B981" fontSize={11} fontWeight={600} textAnchor="end">
                            Goal ${((value ?? 0) / 1000).toFixed(0)}k
                          </text>
                        );
                      }}
                    />
                  </Line>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <RevenueDataTable
            chartData={nonCumulativeChartData}
            caseNames={caseNames}
            invoices={invoices}
            trials={trials}
            clients={clients}
            detailLevel={detailLevel}
            onDetailLevelChange={setDetailLevel}
          />
          {/* TODO(sales): RevenueTrendDebugCard is rendered UNCONDITIONALLY in
              the bible (RevenueProjectionsTab.jsx:502–509) — it is a customer-
              visible 465-LOC collapsible per-day billing-record table, NOT a
              dev-only panel. Deferred to a follow-up because porting it inline
              would push this file past the 800-LOC ceiling; it should land as
              its own component (props: detailedRecords, timePeriod,
              fiscalYearStart, invoicePeriod, invoices — all already computed
              here). Separately, <RevenueProjectionDebug> (171 LOC) IS gated on
              company.show_debug_info in the bible and is genuinely dev-only —
              port it behind that flag when a debug surface lands. */}
        </CardContent>
      </Card>
    </>
  );
}
