/**
 * RecentActivityCard — bible Dashboard.jsx lines 991–1090.
 *
 * Two sections: Recently Won deals (top 3) + Recent Invoices (top 3).
 * Empty state when both lists are empty: "No recent activity".
 */

import { Activity, CheckCircle2, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRecentActivity } from '@/features/dashboard/hooks/use-recent-activity';
import { cardStyle, headerPad } from './_styles';

function safeDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return iso;
  }
}

export function RecentActivityCard() {
  const navigate = useNavigate();
  const { recentlyWon, recentInvoices, isLoading } = useRecentActivity();
  const empty =
    !isLoading && recentlyWon.length === 0 && recentInvoices.length === 0;

  return (
    <Card style={cardStyle()} data-testid="recent-activity-card" className="overflow-hidden">
      <CardHeader
        className="border-b rounded-t-lg"
        style={{
          ...headerPad(),
          borderColor: 'var(--theme-stone-200)',
          backgroundColor: 'var(--theme-stone-50)',
        }}
      >
        <CardTitle
          className="flex items-center gap-2"
          style={{
            fontSize: 'var(--theme-text-card-title)',
            color: 'var(--theme-stone-900)',
          }}
        >
          <Activity className="h-4 w-4" aria-hidden="true" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && recentlyWon.length === 0 && recentInvoices.length === 0 ? (
          <div
            aria-busy="true"
            aria-label="Recent activity loading"
            className="animate-pulse rounded"
            style={{ height: '8rem', backgroundColor: 'var(--theme-stone-200)' }}
          />
        ) : empty ? (
          <p
            className="py-6 text-center"
            style={{
              fontSize: 'var(--theme-text-caption)',
              color: 'var(--theme-stone-500)',
            }}
          >
            No recent activity
          </p>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--theme-stone-200)' }}>
            {recentlyWon.map((w) => (
              <li
                key={`win-${w.id}`}
                className="flex items-center gap-3 py-3"
                data-testid={`recent-win-${w.id}`}
              >
                <CheckCircle2
                  className="h-4 w-4 flex-shrink-0 text-green-600"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate font-medium"
                    style={{ color: 'var(--theme-stone-900)' }}
                  >
                    {w.case_name || 'Trial won'}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--theme-text-caption)',
                      color: 'var(--theme-stone-500)',
                    }}
                  >
                    Won {safeDate(w.won_date)}
                  </div>
                </div>
                <Badge variant="secondary">Won</Badge>
              </li>
            ))}
            {recentInvoices.map((inv) => (
              <li key={`inv-${inv.id}`} data-testid={`recent-invoice-${inv.id}`}>
                <button
                  type="button"
                  onClick={() => navigate('/Invoices')}
                  className="flex w-full items-center gap-3 py-3 text-left hover:opacity-80"
                >
                  <Receipt
                    className="h-4 w-4 flex-shrink-0 text-amber-600"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate font-medium"
                      style={{ color: 'var(--theme-stone-900)' }}
                    >
                      {inv.invoice_number ?? 'Invoice'}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--theme-text-caption)',
                        color: 'var(--theme-stone-500)',
                      }}
                    >
                      {safeDate(inv.invoice_date)} • ${Math.round(inv.total).toLocaleString()}
                    </div>
                  </div>
                  {inv.status && (
                    <Badge
                      variant={inv.status === 'paid' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {inv.status}
                    </Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
