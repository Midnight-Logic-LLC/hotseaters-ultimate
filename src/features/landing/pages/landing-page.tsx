/**
 * LandingPage — pixel-for-pixel port of `HotSeatersMVP/src/pages/Landing.jsx`
 * (bible @ 29ae47e3, the Leads→Deals refresh).
 *
 * RULE 0 (pixel + functional parity): this file mirrors the bible
 * section-for-section. Every copy string, every CSS value, every icon, every
 * animation, every inline style is bible-verbatim. Do NOT vary.
 *
 * Differences from the bible — adapter shims only, never UI:
 *   - bible's `base44.auth.redirectToLogin(...)` → our `navigate('/login')`
 *     (single login surface; AuthOptionsDialog was removed).
 *   - bible's `useTier1Data()` → our `useAuth()` + `useCurrentUser()` hooks
 *     (same shape: loading, authenticated, companyId, pending-invitation check,
 *     plus the Layout.jsx last-viewed-page restoration branch table).
 *   - bible's `generateThemeCSS(defaultTheme)` → our `generateThemeCSS(
 *     MARKETING_THEME)` emitting the same CSS-variable block.
 *   - bible's `media.base44.com` brand PNGs → self-hosted `/brand/*.png`
 *     (RULE 1: no third-party CDNs).
 *     `HotseatersemailHeader.png`            → `/brand/hotseaters-header.png`
 *     `Hotseaterslogochameleon-…-Thickv2.png`→ `/brand/chameleon-logo.png`
 *     `HotSeatHubemailHeader.png`            → `/brand/hotseathub-header.png`
 *
 * HotSeatersMVP is the bible. Self-hosted Supabase only.
 */
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Briefcase,
  CalendarCheck,
  CalendarX,
  Clock,
  DollarSign,
  FileSignature,
  FileText,
  FileWarning,
  GanttChart,
  Gift,
  Handshake,
  Layers,
  Mail,
  Orbit,
  Receipt,
  Search,
  Sparkles,
  Star,
  StickyNote,
  Table,
  Timer,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PolicyViewerModal } from '@/features/marketing/components/policy-viewer-modal';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { buildGoogleFontsUrl, generateThemeCSS, MARKETING_THEME } from '@/shared/lib/theme';

// ── Bible arrays — verbatim from Landing.jsx lines 60-109 ─────────────────

const FEATURES = [
  {
    icon: Briefcase,
    title: 'Complete Pipeline Management',
    description:
      'Track every deal from initial contact to trial completion with customizable pipeline stages.',
  },
  {
    icon: FileText,
    title: 'Automated Sales Documents',
    description:
      'Generate professional client proposals and engagement letters with built-in e-signature capabilities.',
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
    description: 'Log billable hours with ease and track utilization across your entire team.',
  },
  {
    icon: DollarSign,
    title: 'Professional Invoicing',
    description:
      'Create detailed invoices automatically from tracked time and expenses with customizable templates.',
  },
] as const;

const PAIN_POINTS = [
  { icon: CalendarX, title: 'Scheduling Chaos', text: 'Double-booked techs and last-minute trial scrambles.' },
  { icon: Mail, title: 'Deals Lost in Inboxes', text: 'Engagement letters buried in endless email threads.' },
  { icon: StickyNote, title: 'Sticky-Note Time Tracking', text: 'Missed billables and guesswork hours every week.' },
  { icon: FileWarning, title: 'Manual Proposals', text: 'Retyping the same engagement letter for every client.' },
  { icon: Users, title: 'Scrambling to Fill Gigs', text: "Cold-calling friends to cover trials you can't staff." },
  { icon: AlertTriangle, title: 'No Revenue Visibility', text: 'Zero insight into pipeline health or capacity.' },
] as const;

const TRANSFORMATIONS = [
  { icon: CalendarCheck, title: 'Visual Schedule', description: "See every tech's availability on a drag-and-drop timeline." },
  { icon: FileSignature, title: 'Proposals in Minutes', description: 'Generate, send, and e-sign engagement letters in one flow.' },
  { icon: Clock, title: 'Effortless Time Tracking', description: 'Log billable hours from any device — desktop, tablet, or phone.' },
  { icon: Receipt, title: 'Automated Invoicing', description: 'Turn approved time and expenses into branded invoices instantly.' },
  { icon: Orbit, title: 'HotSeatHub Marketplace', description: 'Find trusted subs to fill gigs — or pick up extra work yourself.' },
  { icon: TrendingUp, title: 'Revenue You Can See', description: 'Live projections, pipeline health, and utilization at a glance.' },
] as const;

const HSH_FEATURES = [
  { icon: UserPlus, title: 'Post Help Wanted Gigs', description: "Need a hot-seater for a trial you can't cover? Post the gig and invite trusted firms to respond." },
  { icon: Search, title: 'Find Potential Gigs', description: 'Browse open opportunities from other firms and respond with your available consultants and rates.' },
  { icon: Handshake, title: 'Negotiate & Sign Online', description: 'Counter rates, accept terms, and auto-generate signed subcontractor agreements — all in one place.' },
  { icon: Star, title: 'Build Your Reputation', description: "Earn HSH ratings and reviews from firms you've worked with to grow your network and win more gigs." },
] as const;

// Stats banner — bible Landing.jsx lines 445-450 (icon + value + optional unit + label).
const STATS = [
  { icon: Layers, value: '1', unit: undefined as string | undefined, label: 'Platform for everything' },
  { icon: Timer, value: '15', unit: 'min', label: 'From signup to invoice-ready' },
  { icon: Table, value: '0', unit: undefined as string | undefined, label: 'Spreadsheets required' },
  { icon: Gift, value: '90', unit: 'days', label: 'Free to try, no card required' },
] as const;

// Ripple keyframes — bible Landing.jsx lines 118-139, verbatim.
const RIPPLE_CSS = `
  @keyframes rippleItem {
    0%, 70%, 100% { transform: scale(1); box-shadow: 0 0 0 0 transparent; }
    15% { transform: scale(1.04); box-shadow: 0 12px 28px -8px rgba(0,0,0,0.18); }
    35% { transform: scale(1); }
  }
  @keyframes rippleIcon {
    0%, 70%, 100% { transform: scale(1) rotate(0deg); }
    15% { transform: scale(1.25) rotate(-6deg); }
    35% { transform: scale(1) rotate(0deg); }
  }
  .ripple-item {
    animation: rippleItem 6s ease-in-out infinite;
    transform-origin: left center;
  }
  .ripple-item-icon {
    animation: rippleIcon 6s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .ripple-item, .ripple-item-icon { animation: none; }
  }
`;

/**
 * Auth skip-list — mirrors `<LastRouteTracker>` so a stale
 * `preferences.lastViewedPage === 'Onboarding'` (or any other public page)
 * does NOT route the user back into the public surface from Landing.
 */
const LAST_VIEWED_SKIP = new Set<string>([
  'Landing',
  'Onboarding',
  'AcceptInvite',
  'SignDocument',
  'ViewDocument',
  'PrivacyPolicy',
  'TermsOfService',
  'login',
  'register',
  'forgot-password',
]);

/**
 * Bible branch table — `Layout.jsx:364-419`. Returns the destination path
 * for an authenticated visitor on `/` or `/Landing`, or `null` if the
 * visitor should remain on the marketing surface (still loading, etc.).
 */
function pickAuthedDestination(input: {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompany: boolean;
  userInfo: { status: string | null; company_id: string | null; preferences: Record<string, unknown> | null } | null;
  userInfoLoading: boolean;
}): string | null {
  if (input.isLoading) return null;
  if (!input.isAuthenticated) return null;

  // (1) Pending invitation token short-circuits every other branch.
  let pendingToken: string | null = null;
  try {
    pendingToken = localStorage.getItem('pending_invitation_token');
  } catch {
    pendingToken = null;
  }
  if (pendingToken) {
    try {
      localStorage.removeItem('pending_invitation_token');
    } catch {
      /* private mode — non-fatal */
    }
    return `/AcceptInvite?token=${pendingToken}`;
  }

  // Wait for the userInfo row to resolve before evaluating the userInfo
  // branches; otherwise we'd race the row in and bounce through /Onboarding.
  if (input.userInfoLoading) return null;

  // (2) Auth claims already resolved a company, but the cold entity graph has
  // not returned the user_info row yet. Continue to the app shell; SyncGate
  // owns hydration behind authenticated routes.
  if (!input.userInfo && input.hasCompany) return '/Dashboard';

  // (3) No UserInfo row yet → Onboarding (will create it).
  if (!input.userInfo) return '/Onboarding';

  // (4) Inactive user — explicit account-rejected screen (do NOT silently
  // reactivate; deactivation was a deliberate admin action).
  if (input.userInfo.status === 'inactive') return '/account-rejected';

  // (5) No company yet → Onboarding.
  if (!input.userInfo.company_id) return '/Onboarding';

  // (6) Last-viewed page restoration (skip the skip-list + Dashboard
  // self-loop). Bible Layout.jsx:407-417.
  const lastPage = input.userInfo.preferences?.['lastViewedPage'];
  if (
    typeof lastPage === 'string' &&
    lastPage.length > 0 &&
    lastPage !== 'Dashboard' &&
    !LAST_VIEWED_SKIP.has(lastPage)
  ) {
    return `/${lastPage}`;
  }

  // (7) Default → /Dashboard.
  return '/Dashboard';
}

export function LandingPage() {
  const { isLoading, isAuthenticated, hasCompany } = useAuth();
  const { userInfo, isLoading: userInfoLoading } = useCurrentUser();
  const navigate = useNavigate();
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyModalData, setPolicyModalData] = useState<{
    type: 'privacy' | 'terms';
    title: string;
  }>({ type: 'privacy', title: 'Privacy Policy' });

  const destination = pickAuthedDestination({
    isLoading,
    isAuthenticated,
    hasCompany,
    userInfo: userInfo
      ? {
          status: userInfo.status,
          company_id: userInfo.company_id,
          preferences: (userInfo.preferences as Record<string, unknown> | null) ?? null,
        }
      : null,
    userInfoLoading,
  });

  // bible: handleLogin → /Dashboard redirect, handleSignup → /Onboarding
  // redirect. We collapse both onto the single `/login` surface (the port
  // removed AuthOptionsDialog); the post-auth branch table above sends the
  // user on to Dashboard / Onboarding once authenticated.
  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/login');
  };

  if (destination) {
    return <Navigate to={destination} replace />;
  }

  const googleFontsUrl = buildGoogleFontsUrl();

  return (
    <>
      <style>{generateThemeCSS(MARKETING_THEME)}</style>
      <style>{RIPPLE_CSS}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={googleFontsUrl} rel="stylesheet" />
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-indigo-50">
        {/* Hero & Features Combined Section */}
        <section
          className="w-full pt-10 sm:pt-16 lg:pt-20 pb-8 sm:pb-12"
          style={{
            background:
              'linear-gradient(to bottom, #0c1e3d 0%, #1E3A8A 35%, #0891B2 70%, #e0f2fe 100%)',
            borderBottom: '1px solid color-mix(in srgb, var(--theme-brand-primary) 25%, white)',
          }}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col items-center text-center mb-10">
              <img
                src="/brand/hotseaters-header.png"
                alt="Trial Tech Toolkit"
                className="w-full max-w-[22rem] sm:max-w-sm lg:max-w-xl h-auto object-contain mb-3 sm:mb-4"
              />
              <div className="mb-6 sm:mb-10 lg:mb-12" />

              <div
                className="w-full max-w-4xl mx-auto px-2 py-5 sm:py-7 rounded-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.10)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <h2
                  className="text-xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 leading-tight px-4 sm:px-8"
                  style={{ fontFamily: 'var(--theme-font-body)', color: 'white' }}
                >
                  The Complete Business Toolkit for{' '}
                  <span className="text-cyan-300">Trial Techs</span>
                </h2>
                <p
                  className="text-xs sm:text-base lg:text-lg leading-snug sm:leading-relaxed px-4 sm:px-8"
                  style={{ fontFamily: 'var(--theme-font-body)', color: 'rgba(255, 255, 255, 0.9)' }}
                >
                  Streamline your trial consulting business with the only app built specifically for
                  litigation support professionals. Manage deals, generate proposals and engagement
                  letters with e-signatures, schedule trials for yourself or your team, track time,
                  invoice clients, and take payments online.
                </p>
              </div>
            </div>

            <h3
              className="text-base sm:text-xl lg:text-2xl text-center max-w-2xl mx-auto mb-4 sm:mb-6 px-2 font-semibold"
              style={{ fontFamily: "'Michroma', sans-serif", color: 'rgba(255, 255, 255, 0.95)' }}
            >
              Purpose-Built Features for Trial Technology Consulting Firms
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pt-4 pb-8 sm:pb-12">
              {FEATURES.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className="relative bg-white hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                    style={{
                      borderRadius: 'var(--theme-list-item-radius)',
                      border: '1px solid color-mix(in srgb, var(--theme-brand-primary) 15%, white)',
                      boxShadow: 'var(--theme-list-item-shadow)',
                    }}
                  >
                    {/* Tinted header strip with full-width title */}
                    <div
                      className="rounded-t-lg px-4 sm:px-4 py-2 sm:py-2.5 min-h-[2.5rem] sm:min-h-[3rem] flex items-center"
                      style={{
                        background:
                          'linear-gradient(135deg, color-mix(in srgb, var(--theme-brand-primary) 18%, white) 0%, color-mix(in srgb, var(--theme-brand-primary) 8%, white) 100%)',
                      }}
                    >
                      <h4
                        className="text-base sm:text-base font-bold leading-tight"
                        style={{ fontFamily: "'Michroma', sans-serif", color: 'var(--theme-stone-900)' }}
                      >
                        {feature.title}
                      </h4>
                    </div>
                    {/* Body — description with room for icon, icon absolutely pinned bottom-right */}
                    <div className="px-4 sm:px-4 pt-2 sm:pt-2.5 pb-3 sm:pb-3.5 pr-24 sm:pr-32">
                      <p
                        className="text-sm sm:text-sm"
                        style={{ fontFamily: 'var(--theme-font-body)', color: 'var(--theme-stone-600)' }}
                      >
                        {feature.description}
                      </p>
                    </div>
                    <div
                      className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-lg"
                      style={{
                        background:
                          'linear-gradient(135deg, var(--theme-brand-primary) 0%, color-mix(in srgb, var(--theme-brand-primary) 70%, black) 100%)',
                      }}
                    >
                      <Icon className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center max-w-4xl mx-auto pb-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleSignup}
                  size="lg"
                  className="shadow-xl text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto"
                  style={{
                    backgroundColor: 'var(--theme-brand-primary)',
                    color: 'white',
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
                  className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-white hover:bg-stone-50 w-full sm:w-auto"
                  style={{
                    color: 'var(--theme-brand-primary)',
                    borderRadius: 'var(--theme-button-radius)',
                    boxShadow: 'var(--theme-button-shadow)',
                    fontFamily: 'var(--theme-font-body)',
                  }}
                >
                  Watch Demo
                </Button>
              </div>
              <p
                className="text-sm mt-6 mb-8"
                style={{ fontFamily: 'var(--theme-font-body)', color: 'rgba(255, 255, 255, 0.8)' }}
              >
                Try it free for 90 days • Setup in 5 minutes
              </p>

              {/* MOBILE VERSION - stacked: logo, text, button */}
              <div
                className="sm:hidden bg-white p-4 mt-2 flex flex-col items-center gap-3 shadow-2xl border border-stone-100 w-full max-w-sm mx-auto"
                style={{ borderRadius: 'calc(var(--theme-card-radius) + 0.25rem)' }}
              >
                <img
                  src="/brand/chameleon-logo.png"
                  alt="HotSeaters"
                  className="w-10 h-10 object-contain"
                />
                <p
                  className="text-stone-700 font-medium text-sm text-center"
                  style={{ fontFamily: 'var(--theme-font-body)' }}
                >
                  Already have a HotSeaters account?
                </p>
                <Button
                  onClick={handleLogin}
                  variant="outline"
                  className="w-full hover:bg-stone-50"
                  style={{
                    borderRadius: 'var(--theme-button-radius)',
                    fontFamily: 'var(--theme-font-body)',
                    color: 'var(--theme-brand-primary)',
                  }}
                >
                  Login
                </Button>
              </div>
              {/* DESKTOP VERSION - one line: logo, text, button */}
              <div
                className="hidden sm:inline-flex bg-white px-6 py-4 mt-2 items-center gap-4 shadow-2xl border border-stone-100"
                style={{ borderRadius: 'calc(var(--theme-card-radius) + 0.25rem)' }}
              >
                <img
                  src="/brand/chameleon-logo.png"
                  alt="HotSeaters"
                  className="w-10 h-10 object-contain flex-shrink-0"
                />
                <p
                  className="text-stone-700 font-medium text-sm whitespace-nowrap"
                  style={{ fontFamily: 'var(--theme-font-body)' }}
                >
                  Already have a HotSeaters account?
                </p>
                <Button
                  onClick={handleLogin}
                  variant="outline"
                  className="hover:bg-stone-50"
                  style={{
                    borderRadius: 'var(--theme-button-radius)',
                    fontFamily: 'var(--theme-font-body)',
                    color: 'var(--theme-brand-primary)',
                  }}
                >
                  Login
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Transform Section — Before vs After */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--theme-brand-primary) 10%, white)',
                color: 'var(--theme-brand-primary)',
                fontFamily: 'var(--theme-font-body)',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '1px solid color-mix(in srgb, var(--theme-brand-primary) 20%, white)',
              }}
            >
              <Sparkles className="w-4 h-4" />
              The HotSeaters Difference
            </div>
            <h3
              className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-4 leading-tight"
              style={{ fontFamily: 'var(--theme-font-body)', color: 'var(--theme-stone-900)' }}
            >
              From Chaos to <span style={{ color: 'var(--theme-brand-primary)' }}>Clarity</span>
            </h3>
            <p
              className="text-lg text-balance"
              style={{ fontFamily: 'var(--theme-font-body)', color: 'var(--theme-stone-600)' }}
            >
              See exactly how HotSeaters replaces the mess most trial-tech firms live with every day.
            </p>
          </div>

          <div className="relative grid lg:grid-cols-2 gap-6 lg:gap-4 items-stretch">
            {/* BEFORE — chaos */}
            <div
              className="relative rounded-2xl p-8 lg:p-10 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)',
                border: '1px solid #fecaca',
                boxShadow: '0 20px 50px -10px rgba(239, 68, 68, 0.25)',
              }}
            >
              <div
                className="flex items-center gap-3 sm:gap-5 mb-6 -mx-2 -mt-2 px-4 sm:px-6 py-4 sm:py-6 rounded-xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(254, 202, 202, 0.6) 0%, rgba(254, 215, 170, 0.5) 100%)',
                  border: '1px solid rgba(252, 165, 165, 0.5)',
                }}
              >
                <div
                  className="w-12 h-12 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' }}
                >
                  <AlertTriangle className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
                </div>
                <div>
                  <p
                    className="text-xs sm:text-base uppercase tracking-wider font-bold text-red-600"
                    style={{ fontFamily: 'var(--theme-font-body)' }}
                  >
                    Before
                  </p>
                  <h4
                    className="text-xl sm:text-3xl lg:text-4xl font-bold leading-tight"
                    style={{ fontFamily: 'var(--theme-font-body)', color: 'var(--theme-stone-900)' }}
                  >
                    The Old Way
                  </h4>
                </div>
              </div>
              <div className="space-y-2.5">
                {PAIN_POINTS.map((pain, idx) => {
                  const Icon = pain.icon;
                  return (
                    <div
                      key={idx}
                      className="ripple-item flex items-start gap-3 p-2.5 rounded-lg bg-white/60 backdrop-blur-sm"
                      style={{ animationDelay: `${idx * 0.4}s` }}
                    >
                      <div
                        className="ripple-item-icon flex-shrink-0 w-8 h-8 rounded-md bg-red-100 flex items-center justify-center"
                        style={{ animationDelay: `${idx * 0.4}s` }}
                      >
                        <Icon className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-base leading-tight line-through decoration-red-400/60 decoration-1"
                          style={{ fontFamily: 'var(--theme-font-body)', color: 'var(--theme-stone-700)' }}
                        >
                          {pain.title}
                        </p>
                        <p
                          className="text-sm leading-snug mt-0.5 line-through decoration-red-400/40 decoration-1"
                          style={{ fontFamily: 'var(--theme-font-body)', color: 'var(--theme-stone-500)' }}
                        >
                          {pain.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Arrow connector — desktop only, absolutely positioned between panels */}
            <div
              className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full items-center justify-center shadow-xl"
              style={{
                background:
                  'linear-gradient(135deg, var(--theme-brand-primary) 0%, color-mix(in srgb, var(--theme-brand-primary) 70%, black) 100%)',
                border: '4px solid white',
              }}
            >
              <ArrowRight className="w-7 h-7 text-white" />
            </div>

            {/* Mobile/tablet arrow — sits in grid flow between Before and After */}
            <div className="lg:hidden flex justify-center -my-3 z-10">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
                style={{
                  background:
                    'linear-gradient(135deg, var(--theme-brand-primary) 0%, color-mix(in srgb, var(--theme-brand-primary) 70%, black) 100%)',
                  border: '4px solid white',
                }}
              >
                <ArrowDown className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* AFTER — clarity */}
            <div
              className="relative rounded-2xl p-8 lg:p-10 overflow-hidden text-white"
              style={{
                background:
                  'linear-gradient(135deg, var(--theme-brand-primary) 0%, color-mix(in srgb, var(--theme-brand-primary) 75%, black) 100%)',
                boxShadow:
                  '0 20px 50px -10px color-mix(in srgb, var(--theme-brand-primary) 40%, transparent)',
              }}
            >
              {/* Decorative orbs */}
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }}
              />
              <div
                className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full opacity-10"
                style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }}
              />

              <div
                className="relative flex items-center gap-3 sm:gap-5 mb-6 -mx-2 -mt-2 px-4 sm:px-6 py-4 sm:py-6 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-2xl bg-white flex items-center justify-center shadow-lg p-1.5 sm:p-2 flex-shrink-0">
                  <img
                    src="/brand/chameleon-logo.png"
                    alt="HotSeaters"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p
                    className="text-xs sm:text-base uppercase tracking-wider font-bold text-white/90"
                    style={{ fontFamily: 'var(--theme-font-body)' }}
                  >
                    After
                  </p>
                  <h4
                    className="text-xl sm:text-3xl lg:text-4xl font-bold leading-tight"
                    style={{ fontFamily: 'var(--theme-font-body)' }}
                  >
                    The HotSeaters Way
                  </h4>
                </div>
              </div>

              <div className="relative space-y-2.5">
                {TRANSFORMATIONS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="ripple-item flex items-start gap-3 p-2.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15"
                      style={{ animationDelay: `${idx * 0.4}s` }}
                    >
                      <div
                        className="ripple-item-icon flex-shrink-0 w-8 h-8 rounded-md bg-white flex items-center justify-center shadow-md"
                        style={{ animationDelay: `${idx * 0.4}s` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: 'var(--theme-brand-primary)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-base leading-tight"
                          style={{ fontFamily: 'var(--theme-font-body)' }}
                        >
                          {item.title}
                        </p>
                        <p
                          className="text-sm text-white/85 leading-snug mt-0.5"
                          style={{ fontFamily: 'var(--theme-font-body)' }}
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stats banner */}
          <div
            className="relative mt-8 sm:mt-12 rounded-2xl p-6 sm:p-8 bg-white border border-stone-200 shadow-lg"
            style={{ zIndex: 10 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
              {STATS.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="flex items-start gap-4 sm:gap-6">
                    <Icon className="w-6 h-6 sm:w-9 sm:h-9 text-slate-700 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p
                        className="text-2xl sm:text-3xl font-bold leading-none mb-0.5"
                        style={{ fontFamily: 'var(--theme-font-body)', color: 'var(--theme-brand-primary)' }}
                      >
                        {stat.value}
                        {stat.unit && <span className="text-sm ml-1">{stat.unit}</span>}
                      </p>
                      <p
                        className="text-sm sm:text-sm text-stone-700"
                        style={{ fontFamily: 'var(--theme-font-body)' }}
                      >
                        {stat.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* HotSeatHub Section */}
        <section
          className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 lg:py-16 mt-6 sm:mt-12"
          style={{
            background:
              'linear-gradient(to bottom, #1e1b4b 0%, #4c1d95 35%, #7c3aed 65%, var(--theme-hsh-background) 100%)',
            borderRadius: 'var(--theme-card-radius)',
            boxShadow: 'var(--theme-card-shadow)',
            border: '1px solid color-mix(in srgb, var(--theme-hsh-primary) 25%, white)',
          }}
        >
          <div className="flex flex-col items-center text-center mb-8 sm:mb-16">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                fontFamily: 'var(--theme-font-body)',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.25)',
              }}
            >
              <Orbit className="w-4 h-4" />
              Included with every plan
            </div>
            <img
              src="/brand/hotseathub-header.png"
              alt="HotSeatHub — Trial Tech Marketplace"
              className="w-full max-w-xs sm:max-w-sm lg:max-w-xl h-auto object-contain mb-4 sm:mb-6"
            />
            <p
              className="text-xs sm:text-base lg:text-lg leading-snug sm:leading-relaxed max-w-3xl px-2"
              style={{ fontFamily: 'var(--theme-font-body)', color: 'rgba(255, 255, 255, 0.95)' }}
            >
              The built-in marketplace where trial technology firms find each other. Hire trusted
              subcontractors when you're stretched thin, or pick up extra work when you have open
              capacity — all without leaving HotSeaters.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {HSH_FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="relative bg-white hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                  style={{
                    borderRadius: 'var(--theme-list-item-radius)',
                    border: '1px solid color-mix(in srgb, var(--theme-hsh-primary) 15%, white)',
                    boxShadow: 'var(--theme-list-item-shadow)',
                  }}
                >
                  {/* Tinted header strip with full-width title */}
                  <div
                    className="rounded-t-lg px-4 sm:px-4 py-2 sm:py-2.5 min-h-[2.5rem] sm:min-h-[3rem] flex items-center"
                    style={{
                      background:
                        'linear-gradient(135deg, color-mix(in srgb, var(--theme-hsh-primary) 18%, white) 0%, color-mix(in srgb, var(--theme-hsh-primary) 8%, white) 100%)',
                    }}
                  >
                    <h4
                      className="text-base sm:text-base font-bold leading-tight"
                      style={{ fontFamily: "'Michroma', sans-serif", color: 'var(--theme-stone-900)' }}
                    >
                      {feature.title}
                    </h4>
                  </div>
                  {/* Body — description with room for icon, icon absolutely pinned bottom-right */}
                  <div className="px-4 sm:px-4 pt-2 sm:pt-2.5 pb-3 sm:pb-3.5 pr-24 sm:pr-32">
                    <p
                      className="text-sm sm:text-sm"
                      style={{ fontFamily: 'var(--theme-font-body)', color: 'var(--theme-stone-600)' }}
                    >
                      {feature.description}
                    </p>
                  </div>
                  <div
                    className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      background:
                        'linear-gradient(135deg, var(--theme-hsh-primary) 0%, color-mix(in srgb, var(--theme-hsh-primary) 70%, black) 100%)',
                    }}
                  >
                    <Icon className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20">
          <div
            className="p-8 sm:p-12 lg:p-20 text-center shadow-2xl"
            style={{
              background: 'linear-gradient(to bottom, #0c1e3d 0%, #1E3A8A 35%, #0891B2 100%)',
              borderRadius: 'var(--theme-card-radius)',
            }}
          >
            <h3
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6"
              style={{ fontFamily: 'var(--theme-font-brand-subtitle)' }}
            >
              Ready to Transform Your Business?
            </h3>
            <p
              className="text-base sm:text-xl mb-8 max-w-2xl mx-auto"
              style={{ fontFamily: 'var(--theme-font-body)', color: 'rgba(255, 255, 255, 0.9)' }}
            >
              Join leading trial technology professionals who trust HotSeaters to manage their
              operations.
            </p>
            <Button
              onClick={handleSignup}
              size="lg"
              className="bg-white hover:bg-stone-50 text-lg px-6 sm:px-12 py-6 shadow-xl max-w-full"
              style={{
                color: 'var(--theme-brand-primary)',
                borderRadius: 'var(--theme-button-radius)',
                fontFamily: 'var(--theme-font-body)',
              }}
            >
              Start Your Free Trial
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer
          className="border-t"
          style={{ borderColor: 'var(--theme-stone-200)', backgroundColor: 'var(--theme-card-bg)' }}
        >
          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 py-1 sm:py-8"
            style={{ fontFamily: 'var(--theme-font-body)', color: 'var(--theme-stone-600)' }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-0.5 sm:gap-4">
              <p className="text-xs sm:text-sm">&copy; 2026 HotSeaters. All rights reserved.</p>
              <div className="flex items-center gap-4 sm:gap-6">
                <button
                  onClick={() => {
                    setPolicyModalData({ type: 'privacy', title: 'Privacy Policy' });
                    setPolicyModalOpen(true);
                  }}
                  className="hover:text-stone-900 transition-colors text-xs sm:text-sm cursor-pointer bg-transparent border-none p-0"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => {
                    setPolicyModalData({ type: 'terms', title: 'Terms of Service' });
                    setPolicyModalOpen(true);
                  }}
                  className="hover:text-stone-900 transition-colors text-xs sm:text-sm cursor-pointer bg-transparent border-none p-0"
                >
                  Terms of Service
                </button>
              </div>
            </div>
          </div>
        </footer>

        <PolicyViewerModal
          open={policyModalOpen}
          onClose={() => setPolicyModalOpen(false)}
          policyType={policyModalData.type}
          title={policyModalData.title}
        />
      </div>
    </>
  );
}
