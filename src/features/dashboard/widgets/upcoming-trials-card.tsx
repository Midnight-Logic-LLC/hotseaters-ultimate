/**
 * UpcomingTrialsCard — bible Dashboard.jsx lines 1254–1322.
 *
 * Shows the next 5 future-starting trials. Header has a "View Schedule"
 * link → /Timeline. Each row click → /Trials. Empty state: "No upcoming
 * trials scheduled".
 */

import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUpcomingTrials } from '@/features/dashboard/hooks/use-upcoming-trials';
import { cardStyle, headerPad } from './_styles';

function daysAway(dateIso: string | null): string {
  if (!dateIso) return '';
  const days = differenceInDays(parseISO(dateIso), new Date());
  if (days < 0) return 'starting now';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

export function UpcomingTrialsCard() {
  const navigate = useNavigate();
  const { items, isLoading } = useUpcomingTrials();

  return (
    <Card style={cardStyle()} data-testid="upcoming-trials-card">
      <CardHeader
        className="flex flex-row items-center justify-between"
        style={headerPad()}
      >
        <CardTitle
          style={{
            fontSize: 'var(--theme-text-card-title)',
            color: 'var(--theme-stone-900)',
          }}
        >
          Upcoming Trials
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/Timeline')}
          data-testid="upcoming-trials-view-schedule"
        >
          View Schedule
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && items.length === 0 ? (
          <div
            aria-busy="true"
            aria-label="Upcoming trials loading"
            className="animate-pulse rounded"
            style={{
              height: '5rem',
              backgroundColor: 'var(--theme-stone-200)',
            }}
          />
        ) : items.length === 0 ? (
          <p
            className="py-6 text-center"
            style={{
              fontSize: 'var(--theme-text-caption)',
              color: 'var(--theme-stone-500)',
            }}
          >
            No upcoming trials scheduled
          </p>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--theme-stone-200)' }}>
            {items.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => navigate('/Trials')}
                  data-testid={`upcoming-trial-${t.id}`}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left hover:opacity-80"
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate font-medium"
                      style={{ color: 'var(--theme-stone-900)' }}
                    >
                      {t.case_name || 'Untitled trial'}
                    </div>
                    <div
                      className="truncate"
                      style={{
                        fontSize: 'var(--theme-text-caption)',
                        color: 'var(--theme-stone-500)',
                      }}
                    >
                      {t.client_firm_name ?? 'Unknown client'} • {daysAway(t.start_date)}
                    </div>
                  </div>
                  <ChevronRight
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: 'var(--theme-stone-400)' }}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
