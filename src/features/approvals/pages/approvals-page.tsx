/**
 * approvals-page.tsx — Owner/Admin queue of pending team members.
 *
 * BIBLE: HotSeatersMVP/src/pages/Approvals.jsx.
 *
 * Behavior:
 *   - Lists `user_info` rows where `account_status='pending'` AND
 *     `company_id = current company`.
 *   - Approve → calls `approve-sub-user` Edge Function (flips to 'active').
 *   - Reject  → calls `reject-sub-user` Edge Function (flips to 'rejected').
 *
 * RULE G: shadcn primitives (`<Card>`, `<Button>`) over raw HTML.
 * RULE B/C: this page uses `useApprovals()` only — no direct store reads.
 */
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Loader2, UserCheck } from 'lucide-react';
import { useApprovals } from '@/features/approvals/hooks/use-approvals';
import { useAuth } from '@/features/auth/hooks/use-auth';

export function ApprovalsPage() {
  const { companyId } = useAuth();
  const { pending, loading, error, approve, reject, mutatingId } = useApprovals(companyId);

  return (
    <div style={{ padding: 'var(--theme-page-padding)' }}>
      <header className="mb-6">
        <h1
          style={{
            fontSize: 'var(--theme-text-page-title)',
            fontFamily: 'var(--theme-font-display)',
            color: 'var(--theme-stone-900)',
            margin: 0,
          }}
        >
          Approvals
        </h1>
        <p className="text-sm" style={{ color: 'var(--theme-stone-500)' }}>
          Pending team members awaiting your approval.
        </p>
      </header>

      {loading && (
        <div className="flex items-center gap-2 text-stone-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 mb-4">{error}</p>
      )}

      {!loading && pending.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center text-center py-12 gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <UserCheck className="w-7 h-7 text-emerald-700" />
            </div>
            <p className="text-stone-700 font-medium">All caught up</p>
            <p className="text-sm text-stone-500">No team members are awaiting approval.</p>
          </CardContent>
        </Card>
      )}

      <ul className="space-y-3">
        {pending.map((m) => {
          const name = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email || m.id;
          const isMutating = mutatingId === m.id;
          return (
            <li key={m.id}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="text-sm text-stone-600 space-y-0.5">
                    <p>{m.email}</p>
                    <p>
                      <span className="text-stone-400">Requested role: </span>
                      <strong>{m.company_role ?? '—'}</strong>
                    </p>
                    <p className="text-xs text-stone-400">
                      Submitted {new Date(m.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 self-start sm:self-center">
                    <Button
                      variant="outline"
                      disabled={isMutating}
                      onClick={() => void reject(m.id)}
                      className="gap-1.5"
                    >
                      {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      Reject
                    </Button>
                    <Button
                      disabled={isMutating}
                      onClick={() => void approve(m.id)}
                      className="gap-1.5"
                      style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
                    >
                      {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
