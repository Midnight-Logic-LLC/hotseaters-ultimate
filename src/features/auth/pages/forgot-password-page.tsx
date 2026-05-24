/**
 * ForgotPasswordPage — request a password-reset email.
 *
 * Same shell as RegisterPage: no brand icon, "← Back to sign in" link,
 * single email field, dark submit button.
 *
 * Self-hosted Supabase only.
 */

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { AuthCard } from '@/features/auth/components/auth-card';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export function ForgotPasswordPage() {
  return (
    <AuthCard
      hideIcon
      title="Reset your password"
      subtitle="We'll email you a link to set a new password."
    >
      <ForgotPasswordForm />

      <Link
        to="/login"
        className="inline-flex items-center gap-1.5"
        style={{
          position: 'absolute',
          top: 'calc(var(--theme-card-padding, 2rem) * 0.75)',
          left: 'var(--theme-card-padding, 2rem)',
          color: 'var(--theme-stone-500)',
          fontSize: 'var(--theme-text-caption)',
          textDecoration: 'none',
          fontFamily: 'var(--theme-font-body)',
        }}
      >
        <ArrowLeft size={14} aria-hidden />
        <span>Back to sign in</span>
      </Link>
    </AuthCard>
  );
}
