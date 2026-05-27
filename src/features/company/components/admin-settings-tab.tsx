/**
 * admin-settings-tab.tsx — adapted port of
 * `HotSeatersMVP/src/components/admin/AdminPanel.jsx`.
 *
 * The bible's AdminPanel surfaces cross-tenant admin tools (list companies,
 * list users, list trials, analyze + delete with progress streams) backed by
 * base44 Edge Functions. The port maps these to the equivalent shapes the
 * hotseaters-ultimate architecture exposes today and stubs the destructive
 * cross-tenant actions until their Edge Function counterparts ship.
 *
 * Three sections (match bible structure):
 *   1. Admin Tools — header + intro copy.
 *   2. Team Members — inline team table from `useTeam()`.
 *   3. System Diagnostics — schema version + sync metadata + env mode.
 *
 * Components → hooks only (RULE B). All I/O lives in the hooks.
 * Gated to admin users via `role === 'admin'`.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { ShieldAlert, Users, Wrench } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { useTier1 } from '@/app/tier1-provider';
import { useTeam } from '@/features/company/hooks/use-team';
import { useDatabaseStatus } from '@/features/company/hooks/use-database-status';

function emptyDash(value: string | null | undefined): string {
  return value && value.length > 0 ? value : '—';
}

export function AdminSettingsTab() {
  const { role, company } = useTier1();
  const companyId = company?.id ?? null;
  const team = useTeam(companyId);
  const dbStatus = useDatabaseStatus();

  if (role !== 'admin') {
    return (
      <div
        role="alert"
        className="text-muted-foreground rounded-md border p-6 text-sm"
      >
        Admin tools are only available to platform administrators.
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Admin Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>
            Platform-level administration for the current tenant. Cross-tenant
            tooling (analyze + delete by company, by user, by trial) is
            available via the supabase Edge Function suite —{' '}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">
              delete-company-with-progress
            </code>{' '}
            and{' '}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">
              delete-user-complete
            </code>
            .
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {team.isLoading ? (
            <div className="text-muted-foreground">Loading team…</div>
          ) : team.members.length === 0 ? (
            <div className="text-muted-foreground">
              No team members in this tenant yet.
            </div>
          ) : (
            <ul className="divide-y">
              {team.members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <div className="font-medium">
                      {emptyDash(
                        [m.first_name, m.last_name]
                          .filter(Boolean)
                          .join(' '),
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {emptyDash(m.email)}
                    </div>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {emptyDash(m.company_role)} ·{' '}
                    {emptyDash(m.account_status)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            System Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <dl className="text-muted-foreground grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs">
            <dt>PGlite schema</dt>
            <dd className="font-mono">
              {emptyDash(dbStatus.status?.schemaVersion ?? null)}
            </dd>
            <dt>Tenant id</dt>
            <dd className="font-mono">
              {emptyDash(dbStatus.status?.tenantId ?? null)}
            </dd>
            <dt>Last hydrated</dt>
            <dd>{emptyDash(dbStatus.status?.hydratedAt ?? null)}</dd>
            <dt>Build mode</dt>
            <dd>{import.meta.env.MODE}</dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
