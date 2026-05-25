/**
 * SalesPipelineChart — bible Dashboard.jsx lines 891–924.
 *
 * Vertical bar chart of deals-by-stage with $ value labels above each bar.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePipelineSummary } from '@/features/dashboard/hooks/use-pipeline-summary';
import { cardStyle, headerPad } from './_styles';

export function SalesPipelineChart() {
  const { dealsByStage, isLoading } = usePipelineSummary();

  return (
    <Card style={cardStyle()} data-testid="sales-pipeline-chart">
      <CardHeader style={headerPad()}>
        <CardTitle
          className="flex items-center gap-2"
          style={{
            fontSize: 'var(--theme-text-card-title)',
            color: 'var(--theme-stone-900)',
          }}
        >
          <Briefcase className="h-4 w-4" aria-hidden="true" />
          Sales Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && dealsByStage.length === 0 ? (
          <div
            aria-busy="true"
            aria-label="Sales pipeline chart loading"
            className="animate-pulse rounded"
            style={{ height: '14rem', backgroundColor: 'var(--theme-stone-200)' }}
          />
        ) : dealsByStage.length === 0 ? (
          <p
            className="py-6 text-center"
            style={{
              fontSize: 'var(--theme-text-caption)',
              color: 'var(--theme-stone-500)',
            }}
          >
            No active sales deals
          </p>
        ) : (
          <div style={{ width: '100%', height: '14rem', minWidth: 0, minHeight: '14rem' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={dealsByStage} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-stone-200)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--theme-stone-500)', fontSize: 11 }}
                />
                <YAxis tick={{ fill: 'var(--theme-stone-500)', fontSize: 11 }} />
                <Tooltip
                  formatter={(v) =>
                    typeof v === 'number'
                      ? `$${v.toLocaleString()}`
                      : String(v ?? '')
                  }
                />
                <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(v) =>
                      typeof v === 'number' && v > 0
                        ? `$${Math.round(v / 1000)}k`
                        : ''
                    }
                    fill="var(--theme-stone-600)"
                    style={{ fontSize: 11 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
