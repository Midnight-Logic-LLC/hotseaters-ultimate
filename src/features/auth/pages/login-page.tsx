/**
 * LoginPage — auth entry screen.
 *
 * Honors the bible's `AuthOptionsDialog.jsx` user-facing promise:
 * "sign in with your Google or Microsoft account, or create a new
 * account with email/password." The bible itself outsources auth to
 * base44's hosted screen; self-hosted GoTrue has no hosted screen, so
 * this page IS the screen the bible's dialog promises.
 *
 * Layout (matches user-supplied mockup):
 *   - Chameleon logo (80×80)
 *   - "Welcome to HotSeaters" / "Sign in to continue"
 *   - Continue with Google button
 *   - Continue with Microsoft button (disabled until Azure OAuth is
 *     provisioned — see microsoft-sign-in-button.tsx for the wire-up
 *     checklist)
 *   - OR divider
 *   - Email + Password form (SignInForm)
 *   - Forgot password? + Sign up links
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useState } from 'react';
import { AuthCard } from '@/features/auth/components/auth-card';
import { GoogleSignInButton } from '@/features/auth/components/google-sign-in-button';
import { MicrosoftSignInButton } from '@/features/auth/components/microsoft-sign-in-button';
import { SignInForm } from '@/features/auth/components/sign-in-form';
import { useAuth } from '@/features/auth/hooks/use-auth';

export function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [submittingGoogle, setSubmittingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    setSubmittingGoogle(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
      setSubmittingGoogle(false);
    }
  }

  return (
    <AuthCard
      title="Welcome to HotSeaters"
      subtitle="Sign in to continue"
    >
      <div className="flex flex-col gap-4">
        <GoogleSignInButton onClick={handleGoogle} loading={submittingGoogle} />
        <MicrosoftSignInButton />

        <div
          className="relative flex items-center"
          style={{ margin: '0.5rem 0', gap: '0.75rem' }}
          aria-hidden
        >
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--theme-stone-200)' }} />
          <span
            style={{
              color: 'var(--theme-stone-500)',
              fontSize: 'var(--theme-text-caption)',
              letterSpacing: '0.08em',
            }}
          >
            OR
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--theme-stone-200)' }} />
        </div>

        <SignInForm />

        {error && (
          <div
            role="alert"
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              borderRadius: 'var(--theme-card-radius, 8px)',
              backgroundColor: 'rgba(220, 38, 38, 0.08)',
              color: 'rgb(153, 27, 27)',
              fontSize: 'var(--theme-text-caption)',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </AuthCard>
  );
}
