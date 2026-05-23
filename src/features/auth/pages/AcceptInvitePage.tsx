/**
 * AcceptInvitePage — `/accept-invite?token=...` entry point for invitees.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useSearchParams } from 'react-router-dom';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { InviteAcceptPanel } from '@/features/auth/components/InviteAcceptPanel';

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get('token');

  return (
    <AuthCard
      title="HotSeaters invitation"
      subtitle="Welcome aboard — let&rsquo;s get you set up."
    >
      <InviteAcceptPanel token={token} />
    </AuthCard>
  );
}
