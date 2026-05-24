/**
 * RegisterPage — email + password sign-up.
 *
 * Pixel-for-pixel mirror of the user-supplied "Create your account"
 * mockup: no brand icon, "← Back to sign in" link at top-left, large
 * centered title, email + password + confirm-password fields with
 * lock/envelope icons, dark "Create account" button.
 *
 * Self-hosted Supabase only.
 */

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { AuthCard } from '@/features/auth/components/auth-card';
import { SignUpForm } from '@/features/auth/components/sign-up-form';

export function RegisterPage() {
  return (
    <AuthCard hideIcon title="Create your account">
      <div className="flex flex-col gap-4">
        <SignUpForm />
      </div>

      {/*
        The back-link sits ABOVE the title in the mockup. Render it as
        an absolutely-positioned overlay so AuthCard's centered title
        block stays untouched.
       */}
      <BackToSignInLink />
    </AuthCard>
  );
}

function BackToSignInLink() {
  return (
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
  );
}
