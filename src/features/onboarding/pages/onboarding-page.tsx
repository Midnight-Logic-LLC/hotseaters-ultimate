/**
 * onboarding-page.tsx — auth-gate + wizard host. Replaces the legacy
 * 191-LOC single-step `features/auth/pages/OnboardingPage.tsx`.
 *
 * BIBLE: HotSeatersMVP/src/pages/Onboarding.jsx — the gate that decides
 * whether to: bounce to AcceptInvite (pending invite token), bounce to
 * Landing (unauth), bounce to Dashboard (already has company), or
 * render the wizard.
 */
import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { OnboardingWizard } from '@/features/onboarding/components/onboarding-wizard';
import { useOnboardingStore } from '@/features/onboarding/stores/onboarding-store';

export function OnboardingPage() {
  const { isAuthenticated, isLoading, companyId } = useAuth();
  const navigate = useNavigate();
  const reset = useOnboardingStore((s) => s.reset);

  // Pending-invitation handoff (bible Landing.jsx auth-aware redirect).
  useEffect(() => {
    let pendingToken: string | null = null;
    try {
      pendingToken = localStorage.getItem('pending_invitation_token');
    } catch {
      // private mode — ignore
    }
    if (pendingToken) {
      navigate(`/AcceptInvite?token=${pendingToken}`, { replace: true });
    }
  }, [navigate]);

  // Reactivated-user path (`force_onboarding` localStorage flag set by an
  // admin tool that wiped a user's company link). Clears the persisted
  // wizard state and proceeds.
  useEffect(() => {
    let force: string | null = null;
    try {
      force = localStorage.getItem('force_onboarding');
    } catch {
      // ignore
    }
    if (force) {
      try {
        localStorage.removeItem('force_onboarding');
      } catch {
        // ignore
      }
      reset();
    }
  }, [reset]);

  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (companyId) {
    return <Navigate to="/Dashboard" replace />;
  }

  return <OnboardingWizard />;
}
