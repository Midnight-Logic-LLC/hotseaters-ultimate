/**
 * SignUpForm — email + password + confirm-password registration form.
 *
 * Pixel-for-pixel mirror of the user-supplied "Create your account"
 * mockup: email field (envelope icon), password (lock icon, placeholder
 * "Min. 8 characters"), confirm password (lock icon, placeholder
 * "Re-enter password"), dark "Create account" submit button.
 *
 * Validation:
 *   - email required
 *   - password ≥ 8 chars
 *   - confirm matches password
 *
 * On success: Supabase sends a confirmation email; we navigate to
 * `/magic-link-sent` (re-used page) with copy adapted to "Check your
 * email — confirm your account." Once the user clicks the link in the
 * email, GoTrue redirects them through /auth/callback with a session.
 *
 * Self-hosted Supabase only.
 */

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/hooks/use-auth';

const MIN_PASSWORD_LEN = 8;

export function SignUpForm() {
  const navigate = useNavigate();
  const { signUpWithPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Enter your email.');
      return;
    }
    if (password.length < MIN_PASSWORD_LEN) {
      setError(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await signUpWithPassword(cleanEmail, password);
      navigate('/magic-link-sent', {
        state: { email: cleanEmail, intent: 'confirm-signup' },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            size={16}
            style={{ color: 'var(--theme-stone-400)' }}
          />
          <Input
            id="signup-email"
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
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Lock
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            size={16}
            style={{ color: 'var(--theme-stone-400)' }}
          />
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            placeholder={`Min. ${MIN_PASSWORD_LEN} characters`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={MIN_PASSWORD_LEN}
            disabled={submitting}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-confirm">Confirm Password</Label>
        <div className="relative">
          <Lock
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            size={16}
            style={{ color: 'var(--theme-stone-400)' }}
          />
          <Input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={MIN_PASSWORD_LEN}
            disabled={submitting}
            className="pl-9"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting || !email || !password || !confirm}
        className="h-11 w-full justify-center"
        style={{
          borderRadius: 'var(--theme-button-radius)',
          backgroundColor: 'var(--theme-stone-900, #0f172a)',
          color: '#fff',
        }}
      >
        {submitting ? 'Creating account…' : 'Create account'}
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
