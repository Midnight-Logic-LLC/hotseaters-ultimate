/**
 * RecentClientsCard — most-recently-touched clients for the current company.
 * Rows deep-link to the clients feature page.
 */

import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRecentClients } from '@/features/dashboard/hooks/use-recent-clients';

export function RecentClientsCard() {
  const navigate = useNavigate();
  const clients = useRecentClients(5);

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
          <Users className="h-5 w-5 text-emerald-600" />
          Recent Clients
        </CardTitle>
      </CardHeader>
      <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
        {clients.length === 0 ? (
          <div className="py-6 text-center" style={{ color: 'var(--theme-stone-500)' }}>
            <p style={{ fontSize: 'var(--theme-text-caption)' }}>
              No clients yet. Open Clients to add one.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {clients.map((client) => (
              <li key={client.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/clients/${encodeURIComponent(client.id)}`)}
                  className="group flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-stone-50"
                  style={{ minHeight: '44px' }}
                >
                  <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate font-medium group-hover:text-emerald-700"
                      style={{
                        fontSize: 'var(--theme-text-body)',
                        color: 'var(--theme-stone-900)',
                      }}
                    >
                      {client.firm_name}
                    </p>
                    {client.status && (
                      <Badge
                        className={
                          client.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-stone-100 text-stone-600'
                        }
                      >
                        {client.status}
                      </Badge>
                    )}
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
