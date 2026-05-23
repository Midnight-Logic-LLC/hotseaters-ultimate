/**
 * InviteAcceptPanel — body of the AcceptInvitePage as a reusable component.
 *
 * Renders the decision branches:
 *   - invalid-token / expired / already-accepted → error messages
 *   - auth-required → "Sign in to accept" CTAs (Google + magic link)
 *   - wrong-account → warning + sign-out CTA
 *   - accept → "Accept invitation" CTA
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GoogleSignInButton } from './GoogleSignInButton';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useInvitation } from '@/features/auth/hooks/use-invitation';

export interface InviteAcceptPanelProps {
  token: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  Owner: 'Owner',
  Admin: 'Admin',
  Sales: 'Sales',
  'Trial Consultant': 'Trial Consultant',
};

export function InviteAcceptPanel({ token }: InviteAcceptPanelProps) {
  const navigate = useNavigate();
  const { signInWithGoogle, signOut } = useAuth();
  const {
    loading,
    decision,
    decoded,
    companyName,
    storeTokenAndSignIn,
    acceptNow,
    accepting,
    acceptError,
  } = useInvitation(token);

  if (loading) {
    return <p style={{ textAlign: 'center', color: 'var(--theme-stone-600)' }}>Loading…</p>;
  }

  const companyLabel = companyName ?? 'a HotSeaters firm';
  const roleLabel = ROLE_LABELS[decoded?.role ?? ''] ?? decoded?.role ?? 'member';

  if (!decision || decision.kind === 'invalid-token') {
    return (
      <Message
        title="Invalid invitation"
        body="This invitation link is not valid. Please ask your firm's owner for a new invite."
      />
    );
  }

  if (decision.kind === 'expired') {
    return (
      <Message
        title="Invitation expired"
        body="This invitation has expired. Ask the firm's owner to send a new one."
      />
    );
  }

  if (decision.kind === 'already-accepted') {
    return (
      <Message
        title="Already accepted"
        body="This invitation has already been accepted. Sign in to continue."
        action={
          <Button onClick={() => navigate('/login')} className="w-full">
            Go to sign in
          </Button>
        }
      />
    );
  }

  if (decision.kind === 'wrong-account') {
    return (
      <Message
        title="Wrong account"
        body={`This invite is for ${decision.expectedEmail}. Sign out and sign in with that email to accept it.`}
        action={
          <Button onClick={() => void signOut()} variant="outline" className="w-full">
            Sign out
          </Button>
        }
      />
    );
  }

  if (decision.kind === 'auth-required') {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2
            style={{
              fontFamily: 'var(--theme-font-brand-title)',
              fontSize: 'var(--theme-text-section-title)',
              color: 'var(--theme-stone-900)',
              margin: 0,
            }}
          >
            You&apos;re invited
          </h2>
          <p
            style={{
              marginTop: '0.5rem',
              color: 'var(--theme-stone-600)',
              fontSize: 'var(--theme-text-body)',
            }}
          >
            Join <strong>{companyLabel}</strong> as <strong>{roleLabel}</strong>.
          </p>
        </div>

        <GoogleSignInButton
          onClick={async () => {
            storeTokenAndSignIn();
            await signInWithGoogle();
          }}
          label="Sign in with Google to accept"
        />
        <Button
          variant="outline"
          onClick={() => {
            storeTokenAndSignIn();
            navigate('/login');
          }}
          className="w-full h-11"
          style={{ borderRadius: 'var(--theme-button-radius)' }}
        >
          Sign in with email instead
        </Button>
      </div>
    );
  }

  // decision.kind === 'accept'
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2
          style={{
            fontFamily: 'var(--theme-font-brand-title)',
            fontSize: 'var(--theme-text-section-title)',
            color: 'var(--theme-stone-900)',
            margin: 0,
          }}
        >
          Accept invitation
        </h2>
        <p
          style={{
            marginTop: '0.5rem',
            color: 'var(--theme-stone-600)',
            fontSize: 'var(--theme-text-body)',
          }}
        >
          You&apos;re joining <strong>{companyLabel}</strong> as <strong>{roleLabel}</strong>.
        </p>
      </div>
      <Button
        onClick={() => {
          void (async () => {
            await acceptNow();
            navigate('/Dashboard');
          })();
        }}
        disabled={accepting}
        className="w-full h-11 justify-center"
        style={{
          borderRadius: 'var(--theme-button-radius)',
          backgroundColor: 'var(--theme-brand-primary)',
          color: '#fff',
        }}
      >
        {accepting ? 'Accepting…' : 'Accept and continue'}
      </Button>
      {acceptError && (
        <p role="alert" style={{ color: 'rgb(153, 27, 27)', fontSize: 'var(--theme-text-caption)' }}>
          {acceptError}
        </p>
      )}
    </div>
  );
}

interface MessageProps {
  title: string;
  body: string;
  action?: React.ReactNode;
}

function Message({ title, body, action }: MessageProps) {
  return (
    <div className="flex flex-col gap-3 text-center">
      <h2
        style={{
          fontFamily: 'var(--theme-font-brand-title)',
          fontSize: 'var(--theme-text-section-title)',
          color: 'var(--theme-stone-900)',
          margin: 0,
        }}
      >
        {title}
      </h2>
      <p style={{ color: 'var(--theme-stone-600)' }}>{body}</p>
      {action}
    </div>
  );
}
