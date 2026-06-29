/**
 * AcceptInvitePage — `/accept-invite?token=...` entry point for invitees.
 *
 * BIBLE: HotSeatersMVP/src/pages/AcceptInvite.jsx
 *
 * Renders a full-page layout (NOT AuthCard) matching the bible exactly:
 *   - Gradient header (purple/indigo) with logo + "You're Invited!" + company/role
 *   - "Here's how it works" 3-step explainer
 *   - Email reminder block (amber)
 *   - "Get Started" CTA
 *   - Processing state with spinner
 *   - Error state with "Go to Home"
 *   - After acceptance: NewMemberWizard
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, UserPlus, Settings, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { applyThemeVars, DEFAULT_THEME, MARKETING_THEME } from '@/shared/lib/theme';
import { NewMemberWizard } from '@/features/onboarding/components/new-member/new-member-wizard';
import { useInvitation } from '@/features/auth/hooks/use-invitation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useAuthSession } from '@/features/auth/stores/auth-store';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  sales: 'Sales',
  trial_consultant: 'Trial Consultant',
};

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create Your Account',
    description:
      'Sign in or create your account using the email this invitation was sent to.',
  },
  {
    icon: Settings,
    title: 'Get Set Up',
    description:
      'Complete your profile and connect your calendar to get started.',
  },
  {
    icon: Users,
    title: 'Start Collaborating',
    description:
      'Access trials, manage your schedule, and start working with the team.',
  },
];

type PagePhase = 'welcome' | 'processing' | 'error';

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const isAuthenticated = useAuthSession((s) => s.isAuthenticated);
  const sessionUser = useAuthSession((s) => s.user);

  const { decoded, companyName, storeTokenAndSignIn, acceptNow, accepting } =
    useInvitation(token);

  const [phase, setPhase] = useState<PagePhase>('welcome');
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<{
    companyName: string;
    role: string;
    assignedServiceNames: string[];
    firstName: string | null;
  } | null>(null);

  // Apply marketing theme vars on mount, restore on unmount
  useEffect(() => {
    applyThemeVars(MARKETING_THEME);
    return () => applyThemeVars(DEFAULT_THEME);
  }, []);

  // Handle returning from auth with a pending token
  useEffect(() => {
    if (!isAuthenticated) return;
    const pending = localStorage.getItem('pending_invitation_token');
    if (!pending) return;
    localStorage.removeItem('pending_invitation_token');

    // Verify the logged-in user matches the invite email before auto-processing
    const inviteEmail = decoded?.email ?? '';
    if (inviteEmail && sessionUser?.email) {
      if (sessionUser.email.toLowerCase() !== inviteEmail.toLowerCase()) {
        // Wrong account — show welcome so they can try again
        return;
      }
    }
    void handleProcessInvitation(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleProcessInvitation = async (tokenToUse?: string) => {
    const t = tokenToUse ?? token;
    if (!t) return;
    setPhase('processing');
    try {
      const result = await acceptNow();
      if (!result) {
        setError('Failed to process invitation. Please try again.');
        setPhase('error');
        return;
      }
      setAccepted({
        companyName: result.companyName ?? companyName ?? 'your team',
        role: decoded?.role ?? 'trial_consultant',
        assignedServiceNames: [],
        firstName: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process invitation');
      setPhase('error');
    }
  };

  const handleGetStarted = async () => {
    if (!token) {
      setError('Invalid invitation link. No token was found.');
      setPhase('error');
      return;
    }

    if (isAuthenticated) {
      // Check if the right account is signed in
      const inviteEmail = decoded?.email ?? '';
      if (inviteEmail && sessionUser?.email) {
        if (sessionUser.email.toLowerCase() !== inviteEmail.toLowerCase()) {
          // Wrong account — sign out and redirect back here
          localStorage.setItem('pending_invitation_token', token);
          await signOut();
          return;
        }
      }
      await handleProcessInvitation();
    } else {
      // Not logged in — store token and redirect to login
      localStorage.setItem('pending_invitation_token', token);
      storeTokenAndSignIn();
      navigate('/login');
    }
  };

  // After successful acceptance: show onboarding wizard
  if (accepted) {
    return (
      <NewMemberWizard
        companyName={accepted.companyName}
        role={accepted.role}
        firstName={accepted.firstName}
        assignedServiceNames={accepted.assignedServiceNames}
      />
    );
  }

  const displayCompanyName = companyName ?? '';
  const inviteEmail = decoded?.email ?? '';
  const inviteRole = decoded?.role ?? '';
  const roleLabel = ROLE_LABELS[inviteRole] ?? inviteRole;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{
        backgroundColor: 'var(--theme-page-bg, #f5f5f4)',
        fontFamily: 'var(--theme-font-body)',
      }}
    >
      <div className="w-full max-w-lg">
        {/* Processing state */}
        {phase === 'processing' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-stone-800 mb-2">
              Setting Up Your Account
            </h2>
            <p className="text-stone-500">
              Linking you to {displayCompanyName || 'your team'}...
            </p>
          </div>
        )}

        {/* Error state */}
        {phase === 'error' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-stone-800 mb-2">
              Something Went Wrong
            </h2>
            <p className="text-stone-500 mb-6 text-sm">{error}</p>
            <Button
              onClick={() => navigate('/Landing')}
              className="hover:opacity-90 transition-opacity"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: 'white',
                borderRadius: '8px',
              }}
            >
              Go to Home
            </Button>
          </div>
        )}

        {/* Welcome state — the main invitation landing */}
        {phase === 'welcome' && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Gradient header */}
            <div
              className="text-center px-6 pt-8 pb-6"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              }}
            >
              <img
                src="/brand/hotseaters-header.png"
                alt="HotSeaters"
                className="mx-auto mb-4"
                style={{ maxWidth: '260px', width: '100%', height: 'auto' }}
              />
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                You&#39;re Invited!
              </h1>
              {displayCompanyName && (
                <p className="text-indigo-100 text-base sm:text-lg">
                  Join <strong className="text-white">{displayCompanyName}</strong>
                  {roleLabel && (
                    <>
                      {' '}
                      as a <strong className="text-white">{roleLabel}</strong>
                    </>
                  )}
                </p>
              )}
              {!displayCompanyName && inviteEmail && (
                <p className="text-indigo-100 text-sm">
                  Invitation for <strong className="text-white">{inviteEmail}</strong>
                </p>
              )}
            </div>

            {/* How it works steps */}
            <div className="px-6 py-6">
              <p className="text-stone-500 text-sm font-medium uppercase tracking-wider mb-4 text-center">
                Here&#39;s how it works
              </p>
              <div className="space-y-4">
                {STEPS.map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-800 text-sm">
                        {step.title}
                      </p>
                      <p className="text-stone-500 text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Email reminder */}
            {inviteEmail && (
              <div className="mx-6 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-center">
                <Badge className="bg-amber-200 text-amber-800 font-bold text-xs mb-2">
                  Important
                </Badge>
                <p className="text-amber-800 text-sm">
                  Please sign in using:
                </p>
                <p className="text-amber-900 font-semibold text-sm my-1">
                  {inviteEmail}
                </p>
                <p className="text-amber-700 text-xs">
                  (the email this invitation was sent to)
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="px-6 pb-8">
              <Button
                onClick={() => void handleGetStarted()}
                disabled={accepting}
                size="lg"
                className="w-full text-base font-semibold h-12 hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: 'var(--theme-brand-primary, #4f46e5)',
                  color: 'white',
                  borderRadius: '8px',
                }}
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing…
                  </>
                ) : (
                  'Get Started'
                )}
              </Button>
              <p className="text-center text-xs text-stone-400 mt-3">
                Sign in with your Google or Microsoft account, or create an email login
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
