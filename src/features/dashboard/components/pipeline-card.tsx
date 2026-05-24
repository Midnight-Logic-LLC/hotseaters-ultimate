/**
 * PipelineCard — Sales Pipeline chart for `owner`/`admin`/`sales` roles.
 *
 * Ports `HotSeatersMVP/src/pages/Dashboard.jsx` "Sales Pipeline" card. On
 * viewports `< md` the chart is replaced with a compact list (RULE 4 — no
 * charts on small screens unless they're touch-friendly).
 */

import { Briefcase } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { usePipelineByStage } from '@/features/dashboard/hooks/use-dashboard-card-data';

interface PipelineCardProps {
  stageType?: 'sales' | 'operations';
}

export function PipelineCard({ stageType = 'sales' }: PipelineCardProps) {
  const stages = usePipelineByStage(stageType);
  const isMobile = useIsMobile();
  const title = stageType === 'sales' ? 'Sales Pipeline' : 'Operations Pipeline';

  return (
    <Card
      style={{
        borderRadius: 'var(--theme-card-radius)',
        boxShadow: 'var(--theme-card-shadow)',
        borderWidth: 'var(--theme-card-border)',
        backgroundColor: 'var(--theme-card-bg)',
      }}
    >
      <CardHeader style={{ padding: 'var(--theme-card-header-padding)' }}>
        <CardTitle
          className="flex items-center"
          style={{
            fontSize: 'var(--theme-text-card-title)',
            color: 'var(--theme-stone-900)',
            gap: 'var(--theme-element-gap)',
          }}
        >
          <Briefcase className="h-5 w-5 text-purple-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stages.length === 0 ? (
          <div
            className="py-6 text-center"
            style={{
              color: 'var(--theme-stone-500)',
              fontSize: 'var(--theme-text-caption)',
            }}
          >
            No pipeline data yet.
          </div>
        ) : isMobile ? (
          <ul className="space-y-2">
            {stages.map((stage) => (
              <li
                key={stage.id}
                className="flex items-center justify-between rounded-lg p-2"
                style={{
                  minHeight: '44px',
                  backgroundColor: 'var(--theme-stone-50)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--theme-text-body)',
                    color: 'var(--theme-stone-700)',
                  }}
                >
                  {stage.name}
                </span>
                <span
                  className="font-semibold"
                  style={{
                    fontSize: 'var(--theme-text-body)',
                    color: 'var(--theme-stone-900)',
                  }}
                >
                  {stage.count}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[...stages].reverse()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '11px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                formatter={(value, name) => {
                  const v = typeof value === 'number' ? value : Number(value ?? 0);
                  return name === 'count'
                    ? [`${v} deals`, 'Deals']
                    : [`$${Math.round(v).toLocaleString()}`, 'Value'];
                }}
              />
              <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
