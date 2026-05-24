/**
 * AcceptInvitePage — `/accept-invite?token=...` entry point for invitees.
 *
 * Phase: auth-registration-onboarding-parity (Wave C).
 *
 * BIBLE state machine: decoding → welcome → processing → onboarding → error.
 * Implemented as a 2-state container that delegates to:
 *   - `<InviteAcceptPanel>` for decoding/welcome/auth-required/wrong-account/
 *     expired/already-accepted/accept (server-side acceptance flow).
 *   - `<NewMemberWizard>` after acceptNow() succeeds — runs the 5-step
 *     intro/welcome/services/photo/done micro-wizard.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthCard } from '@/features/auth/components/auth-card';
import { InviteAcceptPanel } from '@/features/auth/components/invite-accept-panel';
import { NewMemberWizard } from '@/features/onboarding/components/new-member/new-member-wizard';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const currentUser = useCurrentUser();
  const [accepted, setAccepted] = useState<null | {
    companyName: string;
    role: string;
    assignedServiceNames: string[];
  }>(null);

  if (accepted) {
    return (
      <NewMemberWizard
        companyName={accepted.companyName}
        role={accepted.role}
        firstName={currentUser.userInfo?.first_name ?? null}
        assignedServiceNames={accepted.assignedServiceNames}
      />
    );
  }

  return (
    <AuthCard
      title="HotSeaters invitation"
      subtitle="Welcome aboard — let's get you set up."
    >
      <InviteAcceptPanel
        token={token}
        onAccepted={(ctx) => setAccepted(ctx)}
      />
    </AuthCard>
  );
}
