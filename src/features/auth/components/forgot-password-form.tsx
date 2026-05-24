/**
 * ForgotPasswordForm — sends a password-reset email via GoTrue.
 *
 * After submission, GoTrue's email template sends the user a link that
 * (when clicked) lands on /auth/reset-password with a recovery session
 * already established by `detectSessionInUrl: true`. The reset page
 * itself is a follow-up (Change 3.b) — the email link works regardless
 * because the recovery session bridges to the auth-callback handler.
 *
 * Self-hosted Supabase only.
 */

import { useState, type FormEvent } from 'react';
import { Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/hooks/use-auth';

export function ForgotPasswordForm() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Enter your email.');
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(cleanEmail);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset link');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        style={{
          padding: '1rem',
          borderRadius: 'var(--theme-card-radius, 8px)',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          color: 'rgb(6, 95, 70)',
          fontSize: 'var(--theme-text-body)',
        }}
      >
        Check your email — we sent a password-reset link to{' '}
        <strong>{email.trim()}</strong>.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-email">Email</Label>
        <div className="relative">
          <Mail
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            size={16}
            style={{ color: 'var(--theme-stone-400)' }}
          />
          <Input
            id="reset-email"
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

      <Button
        type="submit"
        disabled={submitting || !email}
        className="h-11 w-full justify-center"
        style={{
          borderRadius: 'var(--theme-button-radius)',
          backgroundColor: 'var(--theme-stone-900, #0f172a)',
          color: '#fff',
        }}
      >
        {submitting ? 'Sending link…' : 'Send reset link'}
      </Button>

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
