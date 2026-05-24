/**
 * MagicLinkSentPage — confirmation screen after submitting a magic-link form.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { Link, useLocation } from 'react-router-dom';
import { AuthCard } from '@/features/auth/components/auth-card';

interface LocationState {
  email?: string;
}

export function MagicLinkSentPage() {
  const location = useLocation();
  const email = (location.state as LocationState | null)?.email ?? null;

  return (
    <AuthCard
      title="Check your email"
      subtitle={
        email
          ? `We sent a one-time sign-in link to ${email}.`
          : 'We sent you a one-time sign-in link.'
      }
      footer={
        <Link
          to="/login"
          style={{ color: 'var(--theme-brand-primary)', textDecoration: 'underline' }}
        >
          Back to sign in
        </Link>
      }
    >
      <div
        style={{
          fontSize: 'var(--theme-text-body)',
          color: 'var(--theme-stone-600)',
          lineHeight: 1.5,
          textAlign: 'center',
        }}
      >
        Click the link in your inbox to finish signing in. The link expires after a few minutes —
        if you do not see it, check your spam folder.
      </div>
    </AuthCard>
  );
}
