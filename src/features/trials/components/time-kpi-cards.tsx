/**
 * time-kpi-cards.tsx — 4 KPI stat cards for the Time & Expenses page.
 *
 * RULE B: no store imports.
 * RULE G: uses @/components/ui/* primitives.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

type TimeEntryRow = Record<string, unknown> & {
  id: string;
  start_time: string;
  end_time?: string;
  duration_hours?: number;
  status?: string;
};

interface TimeKpiCardsProps {
  timeEntries: TimeEntryRow[];
  company: Record<string, unknown> | null;
}

function getElapsedHours(entry: TimeEntryRow): number {
  if (entry.status === 'in_progress' && !entry.end_time) {
    return (Date.now() - new Date(entry.start_time).getTime()) / 3600000;
  }
  return (entry.duration_hours as number) || 0;
}

function formatHours(h: number, company: Record<string, unknown> | null): string {
  if (company?.['time_format'] === 'decimal') return `${h.toFixed(2)}h`;
  const hours = Math.floor(h);
  const mins = String(Math.round((h % 1) * 60)).padStart(2, '0');
  return `${hours}h ${mins}m`;
}

function sumHours(entries: TimeEntryRow[]): number {
  return entries.reduce((sum, e) => sum + getElapsedHours(e), 0);
}

export function TimeKpiCards({ timeEntries, company }: TimeKpiCardsProps) {
  const now = new Date();

  const todayEntries = timeEntries.filter(
    (e) => new Date(e.start_time).toDateString() === now.toDateString(),
  );

  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const weekEntries = timeEntries.filter((e) => new Date(e.start_time) >= weekAgo);

  const monthEntries = timeEntries.filter((e) => {
    const d = new Date(e.start_time);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const pendingEntries = timeEntries.filter((e) => e.status === 'pending');
  const pendingHours = pendingEntries.reduce((sum, e) => sum + ((e.duration_hours as number) || 0), 0);

  const cards = [
    { label: 'Today', value: formatHours(sumHours(todayEntries), company) },
    { label: 'This Week', value: formatHours(sumHours(weekEntries), company) },
    { label: 'This Month', value: formatHours(sumHours(monthEntries), company) },
    { label: 'Pending', value: formatHours(pendingHours, company) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4" style={{ color: 'var(--theme-stone-400)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--theme-stone-500)' }}>
                {card.label}
              </span>
            </div>
            <p
              className="text-2xl font-bold"
              style={{ color: 'var(--theme-stone-900)', fontFamily: 'var(--theme-font-body)' }}
            >
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default TimeKpiCards;
