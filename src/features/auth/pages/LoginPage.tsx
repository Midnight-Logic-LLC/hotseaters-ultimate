/**
 * LoginPage — Google OAuth + magic-link sign-in.
 *
 * MVP-faithful copy and behavior. Two CTAs:
 *   1. "Continue with Google" → supabase.auth.signInWithOAuth (via hook)
 *   2. "Email me a magic link" → supabase.auth.signInWithOtp (via hook)
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/hooks/use-auth';

export function LoginPage() {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [submittingMagicLink, setSubmittingMagicLink] = useState(false);
  const [submittingGoogle, setSubmittingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setSubmittingGoogle(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
      setSubmittingGoogle(false);
    }
  };

  const handleMagicLink = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Enter your email to receive a magic link.');
      return;
    }
    setSubmittingMagicLink(true);
    try {
      await signInWithMagicLink(email.trim());
      navigate('/magic-link-sent', { state: { email: email.trim() } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send magic link');
    } finally {
      setSubmittingMagicLink(false);
    }
  };

  return (
    <AuthCard
      title="Sign in to HotSeaters"
      subtitle="Trial Tech Toolkit — your trial services platform"
      footer={
        <span>
          Self-hosted Supabase only. By signing in you accept our{' '}
          <a
            href="/manual/terms"
            style={{ color: 'var(--theme-brand-primary)', textDecoration: 'underline' }}
          >
            terms
          </a>
          .
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        <GoogleSignInButton onClick={handleGoogle} loading={submittingGoogle} />

        <div
          className="relative flex items-center"
          style={{ margin: '0.5rem 0', gap: '0.75rem' }}
          aria-hidden
        >
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--theme-stone-200)' }} />
          <span style={{ color: 'var(--theme-stone-500)', fontSize: 'var(--theme-text-caption)' }}>
            or
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--theme-stone-200)' }} />
        </div>

        <form onSubmit={handleMagicLink} className="flex flex-col gap-3" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@firm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submittingMagicLink}
            />
          </div>
          <Button
            type="submit"
            disabled={submittingMagicLink || !email}
            className="h-11 w-full justify-center"
            style={{
              borderRadius: 'var(--theme-button-radius)',
              backgroundColor: 'var(--theme-brand-primary)',
              color: '#fff',
            }}
          >
            {submittingMagicLink ? 'Sending link…' : 'Email me a magic link'}
          </Button>
        </form>

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
