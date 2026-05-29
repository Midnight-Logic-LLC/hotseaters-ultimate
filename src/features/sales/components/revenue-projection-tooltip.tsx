/**
 * revenue-projection-tooltip.tsx — custom recharts tooltip for the Revenue
 * Projections chart.
 *
 * Port of the `renderTooltip` closure in
 * HotSeatersMVP/src/components/sales/RevenueProjectionsTab.jsx (lines 205–322).
 * Shows Full Potential / Projected / Unpaid / Revenue, each with an aggregated
 * per-detail-level breakdown, plus cumulative goal/breakeven rows.
 *
 * HotSeatersMVP is the bible.
 */

import {
  aggregateUnpaid,
  aggregateRevenue,
  aggregateProjections,
  type DetailLevel,
  type DetailItem,
} from '@/features/deals/business-rules/revenue-detail-aggregator';
import { readCssVar } from '@/shared/lib/css-vars';
import type {
  ChartRow,
  ClientRow,
  TrialRow,
  RevenueInvoiceRow,
} from './revenue-projections-types';

interface TooltipPayloadEntry {
  payload?: ChartRow;
}

export interface RevenueProjectionTooltipProps {
  active?: boolean;
  payload?: readonly TooltipPayloadEntry[] | undefined;
  caseNames: string[];
  detailLevel: DetailLevel;
  clients: ClientRow[];
  trials: TrialRow[];
  invoices: RevenueInvoiceRow[];
  showCumulative: boolean;
}

interface DetailRowProps {
  items: DetailItem[];
  color: string;
  borderColor?: string;
}

function DetailRows({ items, color, borderColor }: DetailRowProps) {
  return (
    <>
      {items.map((c, idx) => (
        <div
          key={idx}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '20px', marginBottom: '1px' }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              backgroundColor: color,
              border: borderColor ? `1px solid ${borderColor}` : undefined,
              borderRadius: 1,
            }}
          />
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{c.name}:</span>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280' }}>
            ${c.value.toLocaleString()}
          </span>
        </div>
      ))}
    </>
  );
}

export function RevenueProjectionTooltip({
  active,
  payload,
  caseNames,
  detailLevel,
  clients,
  trials,
  invoices,
  showCumulative,
}: RevenueProjectionTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const dataPoint = payload[0]?.payload;
  if (!dataPoint) return null;

  const successColor = readCssVar('--theme-success', '#059669');
  const successLight = readCssVar('--theme-success-light', '#DCFCE7');

  const rawProjectedCases = caseNames
    .map((c) => ({ name: c, value: (dataPoint[`proj_${c}`] as number) || 0 }))
    .filter((c) => c.value > 0);
  const rawFullPotentialCases = caseNames
    .map((c) => ({ name: c, value: (dataPoint[`full_${c}`] as number) || 0 }))
    .filter((c) => c.value > 0);
  const projectedCases = aggregateProjections(rawProjectedCases, clients, trials, detailLevel);
  const fullPotentialCases = aggregateProjections(rawFullPotentialCases, clients, trials, detailLevel);

  const totalFullPotential = dataPoint.fullPotential || 0;
  const totalProjected = dataPoint.projected || 0;
  const unpaid = dataPoint.unpaid || 0;
  const revenue = dataPoint.revenue || 0;

  return (
    <div
      style={{
        backgroundColor: 'white',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '320px',
      }}
    >
      <p style={{ marginBottom: '8px', fontWeight: 600, color: '#374151' }}>{dataPoint.month}</p>

      {totalFullPotential > 0 && (
        <div style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <div
              style={{
                width: 12,
                height: 12,
                backgroundColor: successLight,
                border: `1.5px solid ${successColor}`,
                borderRadius: 2,
              }}
            />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Full Potential:</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              ${totalFullPotential.toLocaleString()}
            </span>
          </div>
          <DetailRows items={fullPotentialCases} color={successLight} borderColor={successColor} />
        </div>
      )}

      {totalProjected > 0 && (
        <div style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <div style={{ width: 12, height: 12, backgroundColor: successColor, borderRadius: 2 }} />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Projected:</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              ${totalProjected.toLocaleString()}
            </span>
          </div>
          <DetailRows items={projectedCases} color={successColor} />
        </div>
      )}

      {unpaid > 0 && (
        <div style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <div style={{ width: 12, height: 12, backgroundColor: '#F59E0B', borderRadius: 2 }} />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Unpaid:</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              ${unpaid.toLocaleString()}
            </span>
          </div>
          <DetailRows
            items={aggregateUnpaid(dataPoint._unpaidInvoices, trials, clients, detailLevel)}
            color="#F59E0B"
          />
        </div>
      )}

      {revenue > 0 && (
        <div style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <div style={{ width: 12, height: 12, backgroundColor: '#4F46E5', borderRadius: 2 }} />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Revenue:</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              ${revenue.toLocaleString()}
            </span>
          </div>
          <DetailRows
            items={aggregateRevenue(dataPoint._payments, invoices, trials, clients, detailLevel)}
            color="#4F46E5"
          />
        </div>
      )}

      {showCumulative && (dataPoint.cumulativeGoal != null || dataPoint.cumulativeBreakeven != null) && (
        <>
          <div style={{ borderTop: '1px solid #e5e7eb', margin: '6px 0' }} />
          {dataPoint.cumulativeGoal != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <svg width="14" height="14" viewBox="0 0 14 14">
                <line x1="0" y1="7" x2="14" y2="7" stroke="#10B981" strokeWidth="2" strokeDasharray="5 5" />
              </svg>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Annual Goal:</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                ${dataPoint.cumulativeGoal.toLocaleString()}
              </span>
            </div>
          )}
          {dataPoint.cumulativeBreakeven != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <svg width="14" height="14" viewBox="0 0 14 14">
                <line x1="0" y1="7" x2="14" y2="7" stroke="#EF4444" strokeWidth="2" strokeDasharray="5 5" />
              </svg>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Breakeven:</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                ${dataPoint.cumulativeBreakeven.toLocaleString()}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
