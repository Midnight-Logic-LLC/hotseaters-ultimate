/**
 * SignInForm — email + password sign-in form for /login.
 *
 * Calls `signInWithPassword` via `useAuth()`. After a successful sign-in,
 * navigation falls through to the `/auth/callback` route guard (or to the
 * `AuthGate` if the user deep-linked) which decides between /onboarding
 * and /Dashboard based on `hasCompany`.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible (which promises
 * email/password via its AuthOptionsDialog copy).
 */

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/hooks/use-auth';

export interface SignInFormProps {
  /** Optional override for where to navigate on success. */
  redirectTo?: string;
}

export function SignInForm({ redirectTo }: SignInFormProps) {
  const navigate = useNavigate();
  const { signInWithPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await signInWithPassword(email.trim(), password);
      navigate(redirectTo ?? '/auth/callback', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signin-email">Email</Label>
        <div className="relative">
          <Mail
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            size={16}
            style={{ color: 'var(--theme-stone-400)' }}
          />
          <Input
            id="signin-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signin-password">Password</Label>
        <div className="relative">
          <Lock
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            size={16}
            style={{ color: 'var(--theme-stone-400)' }}
          />
          <Input
            id="signin-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={submitting}
            className="pl-9"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting || !email || !password}
        className="h-11 w-full justify-center"
        style={{
          borderRadius: 'var(--theme-button-radius)',
          backgroundColor: 'var(--theme-stone-900, #0f172a)',
          color: '#fff',
        }}
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>

      <div
        className="flex items-center justify-between text-sm"
        style={{ fontFamily: 'var(--theme-font-body)' }}
      >
        <Link
          to="/forgot-password"
          style={{ color: 'var(--theme-stone-700)', textDecoration: 'none' }}
        >
          Forgot password?
        </Link>
        <span style={{ color: 'var(--theme-stone-500)' }}>
          Need an account?{' '}
          <Link
            to="/register"
            style={{ color: 'var(--theme-stone-900)', fontWeight: 600 }}
          >
            Sign up
          </Link>
        </span>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: '0.25rem',
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
    </form>
  );
}
