/**
 * LandingPage — pixel-for-pixel port of `HotSeatersMVP/src/pages/Landing.jsx`.
 *
 * RULE 0 (pixel parity): this file mirrors the bible section-for-section.
 * Every copy string, every CSS value, every icon, every animation, every
 * inline style is bible-verbatim. Do NOT vary.
 *
 * Differences from the bible — adapter shims only, never UI:
 *   - bible's `base44.auth.redirectToLogin(...)` → our `AuthOptionsDialog`
 *     opened with the same redirect target.
 *   - bible's `useTier1Data()` → our `useAuth()` hook (same shape: loading,
 *     authenticated, companyId, plus pending-invitation token check).
 *   - bible's `generateThemeCSS(defaultTheme)` → our `generateThemeCSS(
 *     MARKETING_THEME)` emitting the same CSS-variable block.
 *   - bible's `media.base44.com` brand PNGs → self-hosted `/brand/*.png`
 *     (RULE 1: no third-party CDNs).
 *
 * MarketingShell is intentionally NOT used — Landing inlines its own header
 * and footer to stay faithful to the bible's structure.
 *
 * HotSeatersMVP is the bible. Self-hosted Supabase only.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Handshake,
  Mail,
  Orbit,
  Receipt,
  Search,
  Sparkles,
  Sparkles as _Sparkles, // alias retained for explicit bible parity
  Star,
  StickyNote,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthOptionsDialog } from '@/features/auth/components/AuthOptionsDialog';
import { PolicyViewerModal } from '@/features/marketing/components/policy-viewer-modal';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  buildGoogleFontsUrl,
  generateThemeCSS,
  MARKETING_THEME,
} from '@/shared/lib/theme';

// Silence unused-alias warning while preserving the bible import order.
void _Sparkles;

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

const STATS = [
  { value: '1', label: 'Platform for everything' },
  { value: '15 min', label: 'From signup to invoice-ready' },
  { value: '0', label: 'Spreadsheets required' },
  { value: '90 days', label: 'Free to try, no card needed' },
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

export function LandingPage() {
  const { isLoading, isAuthenticated, companyId } = useAuth();
  const navigate = useNavigate();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogRedirect, setAuthDialogRedirect] = useState('/Dashboard');
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyModalData, setPolicyModalData] = useState<{
    type: 'privacy' | 'terms';
    title: string;
  }>({ type: 'privacy', title: 'Privacy Policy' });

  // Bible auth-aware redirect (Landing.jsx lines 26-44).
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

  const handleLogin = () => {
    setAuthDialogRedirect('/Dashboard');
    setAuthDialogOpen(true);
  };

  const handleSignup = () => {
    setAuthDialogRedirect('/Onboarding');
    setAuthDialogOpen(true);
  };

  // Bible: authenticated branch returns null while redirect resolves.
  if (isAuthenticated) return null;

  const googleFontsUrl = buildGoogleFontsUrl();

  return (
    <>
      <style>{generateThemeCSS(MARKETING_THEME)}</style>
      <style>{RIPPLE_CSS}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={googleFontsUrl} rel="stylesheet" />
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-indigo-50">
        {/* Header */}
        <header
          className="border-b sticky top-0 z-50"
          style={{
            borderColor: 'var(--theme-stone-200)',
            backgroundColor: 'var(--theme-card-bg)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/brand/chameleon-logo.png"
                alt="HotSeaters Logo"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1
                  className="font-bold text-xl"
                  style={{
                    fontFamily: 'var(--theme-font-brand-title)',
                    color: 'var(--theme-stone-900)',
                  }}
                >
                  HotSeaters
                </h1>
                <p
                  className="text-xs"
                  style={{
                    fontFamily: 'var(--theme-font-brand-subtitle)',
                    color: 'var(--theme-stone-500)',
                  }}
                >
                  Trial Tech Toolkit
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogin}
              variant="outline"
              style={{
                borderRadius: 'var(--theme-button-radius)',
                boxShadow: 'var(--theme-button-shadow)',
                fontFamily: 'var(--theme-font-body)',
              }}
            >
              Login
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h2
              className="text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              style={{
                fontFamily: 'var(--theme-font-body)',
                color: 'var(--theme-stone-900)',
              }}
            >
              The Complete Business Toolkit for{' '}
              <span style={{ color: 'var(--theme-brand-primary)' }}>Trial Techs</span>
            </h2>
            <p
              className="text-xl mb-8 leading-relaxed"
              style={{
                fontFamily: 'var(--theme-font-body)',
                color: 'var(--theme-stone-600)',
              }}
            >
              Streamline your trial consulting business with the only app built specifically for litigation support professionals.
              Manage deals, generate proposals and engagement letters with e-signatures, schedule trials for yourself or your team, track time, invoice clients, and take payments online.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleSignup}
                size="lg"
                className="shadow-xl text-lg px-8 py-6"
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
                className="text-lg px-8 py-6"
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
              className="text-sm mt-6"
              style={{
                fontFamily: 'var(--theme-font-body)',
                color: 'var(--theme-stone-500)',
              }}
            >
              Try it free for 90 days • Setup in 5 minutes
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section
          className="max-w-7xl mx-auto px-6 py-12"
          style={{
            background:
              'linear-gradient(to bottom, #0c1e3d 0%, #1E3A8A 35%, #0891B2 70%, #e0f2fe 100%)',
            borderRadius: 'var(--theme-card-radius)',
            boxShadow: 'var(--theme-card-shadow)',
            border: '1px solid color-mix(in srgb, var(--theme-brand-primary) 25%, white)',
          }}
        >
          <div className="flex flex-col items-center text-center mb-10">
            <img
              src="/brand/hotseaters-header.png"
              alt="HotSeaters — Trial Tech Toolkit"
              className="w-full max-w-xl h-auto object-contain mb-4"
            />
            <p
              className="text-base max-w-2xl"
              style={{
                fontFamily: 'var(--theme-font-body)',
                color: 'rgba(255, 255, 255, 0.95)',
              }}
            >
              Purpose-built features for trial technology consulting firms
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
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
                  <div
                    className="rounded-t-lg px-6 py-5 min-h-[5rem] flex items-center"
                    style={{
                      background:
                        'linear-gradient(135deg, color-mix(in srgb, var(--theme-brand-primary) 18%, white) 0%, color-mix(in srgb, var(--theme-brand-primary) 8%, white) 100%)',
                    }}
                  >
                    <h4
                      className="text-xl font-bold leading-tight"
                      style={{
                        fontFamily: 'var(--theme-font-body)',
                        color: 'var(--theme-stone-900)',
                      }}
                    >
                      {feature.title}
                    </h4>
                  </div>
                  <div className="px-6 pt-4 pb-6 pr-32">
                    <p
                      style={{
                        fontFamily: 'var(--theme-font-body)',
                        color: 'var(--theme-stone-600)',
                      }}
                    >
                      {feature.description}
                    </p>
                  </div>
                  <div
                    className="absolute bottom-4 right-4 w-20 h-20 rounded-xl flex items-center justify-center shadow-lg"
                    style={{
                      background:
                        'linear-gradient(135deg, var(--theme-brand-primary) 0%, color-mix(in srgb, var(--theme-brand-primary) 70%, black) 100%)',
                    }}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Transform Section — Before vs After */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-3xl mx-auto mb-14">
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
              className="text-3xl lg:text-5xl font-bold mb-4 leading-tight"
              style={{
                fontFamily: 'var(--theme-font-body)',
                color: 'var(--theme-stone-900)',
              }}
            >
              From Chaos to{' '}
              <span style={{ color: 'var(--theme-brand-primary)' }}>Clarity</span>
            </h3>
            <p
              className="text-lg text-balance"
              style={{
                fontFamily: 'var(--theme-font-body)',
                color: 'var(--theme-stone-600)',
              }}
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
                className="flex items-center gap-5 mb-6 -mx-2 -mt-2 px-6 py-6 rounded-xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(254, 202, 202, 0.6) 0%, rgba(254, 215, 170, 0.5) 100%)',
                  border: '1px solid rgba(252, 165, 165, 0.5)',
                }}
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
                  }}
                >
                  <AlertTriangle className="w-10 h-10 text-white" />
                </div>
                <div>
                  <p
                    className="text-base uppercase tracking-wider font-bold text-red-600"
                    style={{ fontFamily: 'var(--theme-font-body)' }}
                  >
                    Before
                  </p>
                  <h4
                    className="text-3xl lg:text-4xl font-bold leading-tight"
                    style={{
                      fontFamily: 'var(--theme-font-body)',
                      color: 'var(--theme-stone-900)',
                    }}
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
                          style={{
                            fontFamily: 'var(--theme-font-body)',
                            color: 'var(--theme-stone-700)',
                          }}
                        >
                          {pain.title}
                        </p>
                        <p
                          className="text-sm leading-snug mt-0.5 line-through decoration-red-400/40 decoration-1"
                          style={{
                            fontFamily: 'var(--theme-font-body)',
                            color: 'var(--theme-stone-500)',
                          }}
                        >
                          {pain.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Arrow connector — desktop */}
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

            {/* Arrow connector — mobile/tablet */}
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
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-20"
                style={{
                  background: 'radial-gradient(circle, white 0%, transparent 70%)',
                }}
              />
              <div
                className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full opacity-10"
                style={{
                  background: 'radial-gradient(circle, white 0%, transparent 70%)',
                }}
              />

              <div
                className="relative flex items-center gap-5 mb-6 -mx-2 -mt-2 px-6 py-6 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-lg p-2 flex-shrink-0">
                  <img
                    src="/brand/chameleon-logo.png"
                    alt="HotSeaters"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p
                    className="text-base uppercase tracking-wider font-bold text-white/90"
                    style={{ fontFamily: 'var(--theme-font-body)' }}
                  >
                    After
                  </p>
                  <h4
                    className="text-3xl lg:text-4xl font-bold leading-tight"
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
            className="mt-12 rounded-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6"
            style={{
              backgroundColor: 'var(--theme-card-bg)',
              border: '1px solid var(--theme-stone-200)',
              boxShadow: 'var(--theme-card-shadow)',
            }}
          >
            {STATS.map((stat, idx) => (
              <div key={idx} className="text-center">
                <p
                  className="text-3xl lg:text-4xl font-bold mb-1"
                  style={{
                    fontFamily: 'var(--theme-font-body)',
                    color: 'var(--theme-brand-primary)',
                  }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-sm"
                  style={{
                    fontFamily: 'var(--theme-font-body)',
                    color: 'var(--theme-stone-600)',
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* HotSeatHub Section */}
        <section
          className="max-w-7xl mx-auto px-6 py-20 mt-12"
          style={{
            background:
              'linear-gradient(to bottom, #1e1b4b 0%, #4c1d95 35%, #7c3aed 65%, var(--theme-hsh-background) 100%)',
            borderRadius: 'var(--theme-card-radius)',
            boxShadow: 'var(--theme-card-shadow)',
            border: '1px solid color-mix(in srgb, var(--theme-hsh-primary) 25%, white)',
          }}
        >
          <div className="flex flex-col items-center text-center mb-16">
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
              className="w-full max-w-xl h-auto object-contain mb-6"
            />
            <p
              className="text-lg max-w-3xl"
              style={{
                fontFamily: 'var(--theme-font-body)',
                color: 'rgba(255, 255, 255, 0.95)',
              }}
            >
              The built-in marketplace where trial technology firms find each other. Hire trusted subcontractors when you're stretched thin, or pick up extra work when you have open capacity — all without leaving HotSeaters.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                  <div
                    className="rounded-t-lg px-6 py-5 min-h-[5rem] flex items-center"
                    style={{
                      background:
                        'linear-gradient(135deg, color-mix(in srgb, var(--theme-hsh-primary) 18%, white) 0%, color-mix(in srgb, var(--theme-hsh-primary) 8%, white) 100%)',
                    }}
                  >
                    <h4
                      className="text-xl font-bold leading-tight"
                      style={{
                        fontFamily: 'var(--theme-font-body)',
                        color: 'var(--theme-stone-900)',
                      }}
                    >
                      {feature.title}
                    </h4>
                  </div>
                  <div className="px-6 pt-4 pb-6 pr-32">
                    <p
                      style={{
                        fontFamily: 'var(--theme-font-body)',
                        color: 'var(--theme-stone-600)',
                      }}
                    >
                      {feature.description}
                    </p>
                  </div>
                  <div
                    className="absolute bottom-4 right-4 w-20 h-20 rounded-xl flex items-center justify-center shadow-lg"
                    style={{
                      background:
                        'linear-gradient(135deg, var(--theme-hsh-primary) 0%, color-mix(in srgb, var(--theme-hsh-primary) 70%, black) 100%)',
                    }}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div
            className="p-12 lg:p-20 text-center shadow-2xl"
            style={{
              background:
                'linear-gradient(to right, var(--theme-brand-primary), color-mix(in srgb, var(--theme-brand-primary) 80%, black))',
              borderRadius: 'var(--theme-card-radius)',
            }}
          >
            <h3
              className="text-3xl lg:text-5xl font-bold text-white mb-6"
              style={{ fontFamily: 'var(--theme-font-body)' }}
            >
              Ready to Transform Your Business?
            </h3>
            <p
              className="text-xl mb-8 max-w-2xl mx-auto"
              style={{
                fontFamily: 'var(--theme-font-body)',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              Join leading trial technology professionals who trust HotSeaters to manage their operations.
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
          style={{
            borderColor: 'var(--theme-stone-200)',
            backgroundColor: 'var(--theme-card-bg)',
          }}
        >
          <div
            className="max-w-7xl mx-auto px-6 py-8"
            style={{
              fontFamily: 'var(--theme-font-body)',
              color: 'var(--theme-stone-600)',
            }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p>&copy; 2026 HotSeaters. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => {
                    setPolicyModalData({ type: 'privacy', title: 'Privacy Policy' });
                    setPolicyModalOpen(true);
                  }}
                  className="hover:text-stone-900 transition-colors text-sm cursor-pointer bg-transparent border-none p-0"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => {
                    setPolicyModalData({ type: 'terms', title: 'Terms of Service' });
                    setPolicyModalOpen(true);
                  }}
                  className="hover:text-stone-900 transition-colors text-sm cursor-pointer bg-transparent border-none p-0"
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

        <AuthOptionsDialog
          open={authDialogOpen}
          onClose={() => setAuthDialogOpen(false)}
          redirectUrl={authDialogRedirect}
        />
      </div>
    </>
  );
}
