/**
 * AuthCallbackPage — handles `/auth/callback` for both Google OAuth and
 * email magic-link sign-ins. Uses `useAuthCallback` for orchestration.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { Navigate } from 'react-router-dom';
import { AuthCard } from '@/features/auth/components/auth-card';
import { useAuthCallback } from '@/features/auth/hooks/use-auth-callback';

export function AuthCallbackPage() {
  const { state, error, redirectTo } = useAuthCallback();

  if (redirectTo) return <Navigate to={redirectTo} replace />;

  if (state === 'error') {
    return (
      <AuthCard title="Sign-in failed" subtitle={error ?? 'Something went wrong.'}>
        <p style={{ textAlign: 'center', color: 'var(--theme-stone-600)' }}>
          <a
            href="/login"
            style={{ color: 'var(--theme-brand-primary)', textDecoration: 'underline' }}
          >
            Return to sign in
          </a>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={state === 'accepting-invite' ? 'Accepting your invitation…' : 'Signing you in…'}
      subtitle="One moment."
    >
      <div className="flex items-center justify-center" style={{ padding: '2rem 0' }}>
        <div
          aria-label="Loading"
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '3px solid var(--theme-stone-200)',
            borderTopColor: 'var(--theme-brand-primary)',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </AuthCard>
  );
}
