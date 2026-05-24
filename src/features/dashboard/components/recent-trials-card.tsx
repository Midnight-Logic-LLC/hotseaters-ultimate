/**
 * RecentTrialsCard — list of the most-recently-updated trials for the
 * current company. Each row deep-links to the trials feature page (RULE 3:
 * no mutations here).
 *
 * Ports the "Recent Trials" treatment from `HotSeatersMVP/src/pages/Dashboard.jsx`.
 */

import { useNavigate } from 'react-router-dom';
import { Gavel, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useRecentTrials } from '@/features/dashboard/hooks/use-recent-trials';

export function RecentTrialsCard() {
  const navigate = useNavigate();
  const trials = useRecentTrials(5);

  return (
    <Card
      className="overflow-hidden"
      style={{
        borderRadius: 'var(--theme-card-radius)',
        boxShadow: 'var(--theme-card-shadow)',
        borderWidth: 'var(--theme-card-border)',
        backgroundColor: 'var(--theme-card-bg)',
      }}
    >
      <CardHeader
        className="border-b"
        style={{
          padding: 'var(--theme-card-header-padding)',
          backgroundColor: 'var(--theme-card-header-bg)',
          borderBottomColor: 'var(--theme-stone-100)',
        }}
      >
        <CardTitle
          className="flex items-center"
          style={{
            fontSize: 'var(--theme-text-card-title)',
            color: 'var(--theme-stone-900)',
            gap: 'var(--theme-element-gap)',
          }}
        >
          <Gavel className="h-5 w-5 text-indigo-600" />
          Recent Trials
        </CardTitle>
      </CardHeader>
      <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
        {trials.length === 0 ? (
          <div className="py-6 text-center" style={{ color: 'var(--theme-stone-500)' }}>
            <p style={{ fontSize: 'var(--theme-text-caption)' }}>
              No trials yet. Open Trials to create one.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {trials.map((trial) => (
              <li key={trial.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/Trials?id=${encodeURIComponent(trial.id)}`)}
                  className="group flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-stone-50"
                  style={{ minHeight: '44px' }}
                >
                  <Gavel className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" />
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate font-medium group-hover:text-indigo-700"
                      style={{
                        fontSize: 'var(--theme-text-body)',
                        color: 'var(--theme-stone-900)',
                      }}
                    >
                      {trial.case_name}
                    </p>
                    <p
                      className="truncate"
                      style={{
                        fontSize: 'var(--theme-text-caption)',
                        color: 'var(--theme-stone-500)',
                      }}
                    >
                      {trial.client_name ?? 'No client'}
                      {trial.start_date && (
                        <>
                          {' • '}
                          {format(parseISO(trial.start_date), 'MMM d, yyyy')}
                        </>
                      )}
                    </p>
                  </div>
                  <ChevronRight
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: 'var(--theme-stone-400)' }}
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
