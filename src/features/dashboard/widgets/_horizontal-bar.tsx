/**
 * _horizontal-bar.tsx — internal recharts wrapper shared by the
 * team-performance and active-trial-performance widgets.
 *
 * Renders a horizontal bar chart with wrapped Y-axis names and one or
 * two bars per row (e.g. hours + revenue). Not exported from the public
 * widgets surface — call sites are widgets/* files.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface CustomYAxisTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
}

function CustomYAxisTick({ x, y, payload }: CustomYAxisTickProps) {
  const text = payload?.value ?? '';
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length * 6 > 120 && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return (
    <g>
      {lines.map((line, i) => (
        <text
          key={i}
          x={x}
          y={(y ?? 0) + (i - (lines.length - 1) / 2) * 12}
          textAnchor="end"
          fill="var(--theme-stone-500)"
          fontSize="11px"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

export interface HorizontalBarDatum {
  name: string;
  /** Optional accent flag (e.g. HSH subcontractor row in team perf). */
  accent?: boolean;
  [key: string]: unknown;
}

export interface HorizontalBarProps<T extends HorizontalBarDatum> {
  data: T[];
  bars: Array<{
    dataKey: keyof T;
    fill: string;
    name: string;
    /** Tooltip formatter — e.g. (v) => `$${v.toLocaleString()}`. */
    formatter?: (v: number) => string;
  }>;
  /** Pixel height; ResponsiveContainer fills width. Defaults to 14rem. */
  height?: string;
}

export function HorizontalBar<T extends HorizontalBarDatum>({
  data,
  bars,
  height = '14rem',
}: HorizontalBarProps<T>) {
  return (
    <div style={{ width: '100%', height, minWidth: 0, minHeight: '14rem' }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-stone-200)" />
          <XAxis type="number" tick={{ fill: 'var(--theme-stone-500)', fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={<CustomYAxisTick />}
            interval={0}
          />
          <Tooltip
            formatter={(value, name) => {
              const def = bars.find((b) => b.name === name);
              if (def?.formatter && typeof value === 'number') return def.formatter(value);
              return value;
            }}
          />
          {bars.map((b) => (
            <Bar
              key={String(b.dataKey)}
              dataKey={String(b.dataKey)}
              fill={b.fill}
              name={b.name}
              radius={[0, 4, 4, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
