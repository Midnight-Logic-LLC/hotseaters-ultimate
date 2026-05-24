/**
 * TeamPage — list current `user_info` rows scoped to the active company.
 * Port of MVP `pages/Team.jsx` (collapsed to v0.1 scope).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useTeam } from '@/features/company/hooks/use-team';

type Role = 'Owner' | 'Admin' | 'Sales' | 'Trial Consultant';
const ROLES: ReadonlyArray<Role> = ['Owner', 'Admin', 'Sales', 'Trial Consultant'];

export function TeamPage() {
  const { companyId, isAuthenticated, isLoading } = useAuth();
  const { members, isLoading: teamLoading, invite, invitePending, inviteError } =
    useTeam(companyId);

  if (!isLoading && !isAuthenticated) return <Navigate to="/login" replace />;
  if (!isLoading && !companyId) return <Navigate to="/onboarding" replace />;

  return (
    <div style={{ padding: 'var(--theme-page-padding)' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--theme-font-brand-title)',
              fontSize: 'var(--theme-text-page-title)',
              color: 'var(--theme-stone-900)',
              margin: 0,
            }}
          >
            Team
          </h1>
          <p style={{ color: 'var(--theme-stone-500)', marginTop: '0.25rem' }}>
            Members of your firm.
          </p>
        </div>

        <InviteMemberSheet
          companyId={companyId ?? ''}
          onInvite={invite}
          pending={invitePending}
          error={inviteError}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          {teamLoading ? (
            <p>Loading…</p>
          ) : members.length === 0 ? (
            <p style={{ color: 'var(--theme-stone-500)' }}>
              No team members yet. Invite your first teammate.
            </p>
          ) : (
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--theme-stone-500)' }}>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Name</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Email</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Role</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} style={{ borderTop: '1px solid var(--theme-stone-200)' }}>
                    <td style={{ padding: '0.75rem' }}>
                      {[m.first_name, m.last_name].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{m.email ?? '—'}</td>
                    <td style={{ padding: '0.75rem' }}>{m.company_role ?? '—'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <Badge variant={m.account_status === 'active' ? 'default' : 'outline'}>
                        {m.account_status ?? 'unknown'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface InviteMemberSheetProps {
  companyId: string;
  onInvite: (payload: { email: string; role: Role; company_id: string }) => Promise<void>;
  pending: boolean;
  error: string | null;
}

function InviteMemberSheet({ companyId, onInvite, pending, error }: InviteMemberSheetProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Trial Consultant');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await onInvite({ email: email.trim(), role, company_id: companyId });
      setOpen(false);
      setEmail('');
    } catch {
      // surface via `error` from parent
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button>Invite member</Button>} />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Invite a team member</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" style={{ marginTop: '1rem' }}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="h-10 rounded-md border px-3"
              style={{ borderColor: 'var(--theme-stone-200)' }}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={pending || !email}>
            {pending ? 'Sending…' : 'Send invitation'}
          </Button>
          {error && (
            <p role="alert" style={{ color: 'rgb(153, 27, 27)' }}>
              {error}
            </p>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}
