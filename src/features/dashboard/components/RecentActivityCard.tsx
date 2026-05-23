/**
 * RecentActivityCard — Recent Wins (trials with a `won_date`) plus a
 * Tier-C stub for "Recent Invoices" (Invoice entity not synced in v0.1).
 *
 * Ports the "Recent Activity" card from `HotSeatersMVP/src/pages/Dashboard.jsx`.
 */

import { useNavigate } from 'react-router-dom';
import { Activity, CheckCircle2, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useRecentWins } from '@/features/dashboard/hooks/use-dashboard-card-data';

export function RecentActivityCard() {
  const navigate = useNavigate();
  const wins = useRecentWins(3);

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
          <Activity className="h-5 w-5 text-indigo-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
        {wins.length > 0 ? (
          <div className="space-y-4">
            <div>
              <h4
                className="mb-2 uppercase tracking-wider"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--theme-stone-500)',
                }}
              >
                Recent Wins
              </h4>
              <ul className="space-y-2">
                {wins.map((win) => (
                  <li key={win.id}>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/Trials?id=${encodeURIComponent(win.id)}`)
                      }
                      className="flex w-full items-start gap-3 rounded-lg p-2 text-left hover:bg-stone-50"
                      style={{ minHeight: '44px' }}
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate font-medium"
                          style={{
                            fontSize: 'var(--theme-text-body)',
                            color: 'var(--theme-stone-900)',
                          }}
                        >
                          {win.case_name}
                        </p>
                        <p
                          style={{
                            fontSize: 'var(--theme-text-caption)',
                            color: 'var(--theme-stone-500)',
                          }}
                        >
                          {format(parseISO(win.won_date), 'MMM d')}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-dashed p-3 text-center">
              <FileText
                className="mx-auto mb-1 h-5 w-5"
                style={{ color: 'var(--theme-stone-400)' }}
              />
              <p
                style={{
                  fontSize: 'var(--theme-text-caption)',
                  color: 'var(--theme-stone-500)',
                }}
              >
                Recent invoices land in v0.2 (Invoice not yet synced).
              </p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center" style={{ color: 'var(--theme-stone-500)' }}>
            <Activity className="mx-auto mb-3 h-12 w-12 opacity-30" />
            <p style={{ fontSize: 'var(--theme-text-body)' }}>No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
