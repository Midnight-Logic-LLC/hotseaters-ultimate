/**
 * LandingPage — marketing landing for unauthenticated visitors.
 *
 * Bible: `HotSeatersMVP/src/pages/Landing.jsx` (355 lines). Verbatim copy,
 * verbatim layout, verbatim styling. Component code structure adapted to
 * Base UI primitives and our entity-graph hooks where the bible used Radix
 * + Base44. All values flow through CSS variables emitted from
 * MARKETING_THEME (the bible's defaultTheme.jsx).
 *
 * Auth-aware redirect: authenticated users with a company go to /Dashboard;
 * authenticated users without a company go to /Onboarding; pending invite
 * tokens redirect to /AcceptInvite?token=…; unauthenticated visitors see
 * the marketing page.
 *
 * HotSeatersMVP is the bible. Self-hosted Supabase only.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  GanttChart,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingShell } from '@/features/marketing/components/MarketingShell';
import { AuthOptionsDialog } from '@/features/auth/components/AuthOptionsDialog';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { applyThemeVars, MARKETING_THEME } from '@/shared/lib/theme';

interface FeatureCard {
  icon: typeof Briefcase;
  title: string;
  description: string;
}

// Bible (Landing.jsx lines 56-89) — verbatim copy. Do NOT vary.
const FEATURES: FeatureCard[] = [
  {
    icon: Briefcase,
    title: 'Complete Pipeline Management',
    description:
      'Track every deal from initial contact to trial completion with customizable pipeline stages.',
  },
  {
    icon: FileText,
    title: 'Automated Proposals & Engagement Letters',
    description:
      'Dynamically generate professional client proposals and engagement letters instantly with built-in e-signature capabilities.',
  },
  {
    icon: GanttChart,
    title: 'Smart Scheduling',
    description:
      'Visualize trial schedules and team availability with an interactive drag-and-drop timeline.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Assign trial techs, track workload, and ensure optimal resource allocation across all trials.',
  },
  {
    icon: Clock,
    title: 'Time Tracking',
    description:
      'Log billable hours with ease and track utilization across your entire team.',
  },
  {
    icon: DollarSign,
    title: 'Professional Invoicing',
    description:
      'Create detailed invoices automatically from tracked time and expenses with customizable templates.',
  },
];

// Bible (Landing.jsx lines 91-95) — verbatim. Do NOT vary.
const BENEFITS: readonly string[] = [
  'Eliminate double-booking and scheduling conflicts',
  'Close deals faster with professional proposals and e-signatures',
  'Generate professional invoices with ease',
  'Increase revenue with accurate time tracking and billing',
  'Scale your business with confidence',
];

export function LandingPage() {
  const { isLoading, isAuthenticated, companyId } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authRedirect, setAuthRedirect] = useState('/Dashboard');

  // Marketing theme — pale blue page bg + custom Google Fonts (Zen Dots /
  // Michroma / Montserrat / Syncopate). Bible: Landing.jsx wraps its content
  // in <style>{generateThemeCSS(defaultTheme)}</style>. Our equivalent is
  // applyThemeVars(MARKETING_THEME) on mount.
  useEffect(() => {
    applyThemeVars(MARKETING_THEME);
  }, []);

  // Bible auth-aware redirect (Landing.jsx lines 16-46). Authenticated users
  // never see the marketing page.
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;

    let pendingToken: string | null = null;
    try {
      pendingToken = localStorage.getItem('pending_invitation_token');
    } catch {
      pendingToken = null;
    }
    if (pendingToken) {
      navigate(`/AcceptInvite?token=${pendingToken}`, { replace: true });
      return;
    }

    if (!companyId) {
      navigate('/Onboarding', { replace: true });
      return;
    }

    navigate('/Dashboard', { replace: true });
  }, [isLoading, isAuthenticated, companyId, navigate]);

  // Bible (Landing.jsx line 56): authenticated branch returns null while the
  // redirect effect resolves.
  if (isAuthenticated) return null;

  const handleLogin = () => {
    setAuthRedirect('/Dashboard');
    setAuthOpen(true);
  };
  const handleSignup = () => {
    setAuthRedirect('/Onboarding');
    setAuthOpen(true);
  };

  return (
    <MarketingShell loginRedirectUrl="/Dashboard">
      {/* Hero — Landing.jsx lines 130-170 */}
      <section
        className="mx-auto px-6 py-20 lg:py-32"
        style={{ maxWidth: 'var(--theme-max-content-width)' }}
      >
        <div className="mx-auto max-w-4xl text-center">
          <h2
            className="mb-6 text-5xl font-bold leading-tight lg:text-6xl"
            style={{
              fontFamily: 'var(--theme-font-body)',
              color: 'var(--theme-stone-900)',
            }}
          >
            The Complete Business Toolkit for{' '}
            <span style={{ color: 'var(--theme-brand-primary)' }}>Trial Techs</span>
          </h2>
          <p
            className="mb-8 text-xl leading-relaxed"
            style={{
              fontFamily: 'var(--theme-font-body)',
              color: 'var(--theme-stone-600)',
            }}
          >
            Streamline your trial consulting business with the only app built specifically
            for litigation support professionals. Manage deals, generate proposals and
            engagement letters with e-signatures, schedule trials for yourself or your team,
            track time, invoice clients, and take payments online.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              onClick={handleSignup}
              size="lg"
              className="px-8 py-6 text-lg shadow-xl"
              style={{
                backgroundColor: 'var(--theme-brand-primary)',
                color: '#ffffff',
                borderRadius: 'var(--theme-button-radius)',
                boxShadow: 'var(--theme-button-shadow)',
                fontFamily: 'var(--theme-font-body)',
              }}
            >
              Get Started Free
            </Button>
            <Button
              onClick={handleLogin}
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg"
              style={{
                borderRadius: 'var(--theme-button-radius)',
                boxShadow: 'var(--theme-button-shadow)',
                fontFamily: 'var(--theme-font-body)',
              }}
            >
              Watch Demo
            </Button>
          </div>
          <p
            className="mt-6 text-sm"
            style={{
              fontFamily: 'var(--theme-font-body)',
              color: 'var(--theme-stone-500)',
            }}
          >
            Try it free for 14 days • Setup in 5 minutes
          </p>
        </div>
      </section>

      {/* Features Grid — Landing.jsx lines 173-225 */}
      <section
        className="mx-auto px-6 py-20"
        style={{
          maxWidth: 'var(--theme-max-content-width)',
          backgroundColor: 'var(--theme-card-bg)',
          borderRadius: 'var(--theme-card-radius)',
          boxShadow: 'var(--theme-card-shadow)',
        }}
      >
        <div className="mb-16 text-center">
          <h3
            className="mb-4 text-3xl font-bold lg:text-4xl"
            style={{
              fontFamily: 'var(--theme-font-body)',
              color: 'var(--theme-stone-900)',
            }}
          >
            Everything You Need to Run Your Business
          </h3>
          <p
            className="text-lg"
            style={{
              fontFamily: 'var(--theme-font-body)',
              color: 'var(--theme-stone-600)',
            }}
          >
            Purpose-built features for trial technology consulting firms
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="p-6 transition-all hover:shadow-lg"
                style={{
                  borderRadius: 'var(--theme-list-item-radius)',
                  border: '1px solid var(--theme-stone-200)',
                  boxShadow: 'var(--theme-list-item-shadow)',
                }}
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--theme-brand-primary) 10%, white)',
                  }}
                >
                  <Icon className="h-6 w-6" style={{ color: 'var(--theme-brand-primary)' }} />
                </div>
                <h4
                  className="mb-2 text-xl font-semibold"
                  style={{
                    fontFamily: 'var(--theme-font-body)',
                    color: 'var(--theme-stone-900)',
                  }}
                >
                  {feature.title}
                </h4>
                <p
                  style={{
                    fontFamily: 'var(--theme-font-body)',
                    color: 'var(--theme-stone-600)',
                  }}
                >
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits Section — Landing.jsx lines 228-275 */}
      <section
        className="mx-auto px-6 py-20"
        style={{ maxWidth: 'var(--theme-max-content-width)' }}
      >
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h3
              className="mb-6 text-3xl font-bold lg:text-4xl"
              style={{
                fontFamily: 'var(--theme-font-body)',
                color: 'var(--theme-stone-900)',
              }}
            >
              Transform How You Manage Trials
            </h3>
            <p
              className="mb-8 text-lg"
              style={{
                fontFamily: 'var(--theme-font-body)',
                color: 'var(--theme-stone-600)',
              }}
            >
              Stop juggling spreadsheets, emails, and sticky notes. HotSeaters brings
              everything together in one intuitive platform designed for the unique demands
              of trial consulting.
            </p>
            <div className="space-y-4">
              {BENEFITS.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-600" />
                  <p
                    className="text-lg"
                    style={{
                      fontFamily: 'var(--theme-font-body)',
                      color: 'var(--theme-stone-600)',
                    }}
                  >
                    {benefit}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 p-12">
            <TrendingUp className="h-64 w-64 text-indigo-600 opacity-50" />
          </div>
        </div>
      </section>

      {/* CTA Band — Landing.jsx lines 278-303 */}
      <section
        className="mx-auto px-6 py-20"
        style={{ maxWidth: 'var(--theme-max-content-width)' }}
      >
        <div
          className="p-12 text-center shadow-2xl lg:p-20"
          style={{
            background:
              'linear-gradient(to right, var(--theme-brand-primary), color-mix(in srgb, var(--theme-brand-primary) 80%, black))',
            borderRadius: 'var(--theme-card-radius)',
          }}
        >
          <h3
            className="mb-6 text-3xl font-bold text-white lg:text-5xl"
            style={{ fontFamily: 'var(--theme-font-body)' }}
          >
            Ready to Transform Your Business?
          </h3>
          <p
            className="mx-auto mb-8 max-w-2xl text-xl"
            style={{
              fontFamily: 'var(--theme-font-body)',
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            Join leading trial technology professionals who trust HotSeaters to manage their
            operations.
          </p>
          <Button
            onClick={handleSignup}
            size="lg"
            className="px-12 py-6 text-lg shadow-xl"
            style={{
              backgroundColor: '#ffffff',
              color: 'var(--theme-brand-primary)',
              borderRadius: 'var(--theme-button-radius)',
              fontFamily: 'var(--theme-font-body)',
            }}
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* AuthOptionsDialog mounted at the page level so all the Landing CTAs
          (Get Started Free / Watch Demo / Start Your Free Trial) can open it
          with the appropriate redirectUrl. MarketingShell's own header Login
          button has its own copy of this dialog — that's fine, two instances
          render the same modal markup. */}
      <AuthOptionsDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        redirectUrl={authRedirect}
      />
    </MarketingShell>
  );
}
