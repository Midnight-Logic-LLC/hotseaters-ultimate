import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Orbit,
  ArrowRight,
  Quote,
  ShieldCheck,
  Handshake,
  Network,
  Sparkles,
  Zap,
  Calendar,
  FileSignature,
  Clock,
  Receipt,
  TrendingUp,
  Users,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';

export function ReferralLandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const urlParams = new URLSearchParams(window.location.search);
  const refCompany = urlParams.get('ref_company') ?? '';
  const refBy = urlParams.get('ref_by') ?? '';
  const refPhoto = urlParams.get('ref_photo') ?? '';
  const refInvitee = urlParams.get('ref_invitee') ?? '';
  const hasReferrer = Boolean(refBy);
  const referrerInitial = (refBy || '?').trim().charAt(0).toUpperCase();

  const handleGetStarted = () => {
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('pending_referral_token', token);
    }
    navigate('/Onboarding');
  };

  const handleAlreadyHaveAccount = () => {
    if (isAuthenticated) {
      navigate('/Dashboard');
    } else {
      navigate('/login');
    }
  };

  // Trust-building points — framed as "what your peer already knows"
  const trustPoints = [
    {
      icon: ShieldCheck,
      title: 'Built by trial techs, for trial techs',
      description:
        'Not a generic CRM. Every feature exists because someone running a real trial-tech firm needed it.',
    },
    {
      icon: Network,
      title: 'Your peers are already here',
      description:
        'HotSeatHub is a closed network of vetted trial technology firms. The more peers join, the more valuable it gets — for everyone.',
    },
    {
      icon: Handshake,
      title: 'Collaboration without competition',
      description:
        "Sub out a trial you can't cover. Pick up a gig when you have a gap. Get paid through the platform. Keep your client relationships yours.",
    },
  ];

  // HotSeatHub-specific value (why referrer probably sent them)
  const hshValue = [
    {
      icon: Users,
      label: 'Find each other',
      description: 'Browse and connect with trusted trial tech firms in your area.',
    },
    {
      icon: Handshake,
      label: 'Negotiate online',
      description: 'Counter rates, accept terms, and auto-generate signed agreements.',
    },
    {
      icon: Star,
      label: 'Build reputation',
      description: 'Earn ratings and reviews that follow you across every gig.',
    },
    {
      icon: Orbit,
      label: 'Grow together',
      description: 'Take on bigger trials together than either firm could solo.',
    },
  ];

  // What you actually get with the account (compact, scannable)
  const platformPerks = [
    { icon: Calendar, text: 'Drag-and-drop trial scheduling' },
    { icon: FileSignature, text: 'E-signature proposals & engagement letters' },
    { icon: Clock, text: 'Mobile time tracking for your whole team' },
    { icon: Receipt, text: 'Auto-generated branded invoices' },
    { icon: TrendingUp, text: 'Live revenue projections & pipeline health' },
    { icon: Zap, text: 'Expense capture with receipt OCR' },
  ];

  const firstName = hasReferrer ? refBy.split(' ')[0] : 'they';

  return (
    <>
      <style>{`
        @keyframes orbitPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes connectLine {
          0% { stroke-dashoffset: 200; }
          100% { stroke-dashoffset: 0; }
        }
        .orbit-ring { animation: orbitPulse 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .orbit-ring { animation: none; }
        }
      `}</style>

      <div
        className="min-h-screen"
        style={{
          background: 'linear-gradient(180deg, #fef7ed 0%, #fff7ed 30%, #ffffff 100%)',
        }}
      >
        {/* Compact header — no big nav, just brand + login */}
        <header
          className="border-b"
          style={{
            borderColor: 'var(--theme-stone-200)',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.svg"
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
              onClick={handleAlreadyHaveAccount}
              variant="ghost"
              size="sm"
              style={{ fontFamily: 'var(--theme-font-body)' }}
            >
              Already have an account?
            </Button>
          </div>
        </header>

        {/* HERO — Referrer Spotlight */}
        <section className="max-w-5xl mx-auto px-6 pt-12 pb-20">
          {/* Personalized greeting to the invitee */}
          {refInvitee && (
            <div className="text-center mb-6">
              <h1
                className="text-4xl lg:text-5xl font-bold leading-tight"
                style={{
                  fontFamily: 'var(--theme-font-body)',
                  color: 'var(--theme-stone-900)',
                }}
              >
                Hey{' '}
                <span style={{ color: 'var(--theme-brand-primary)' }}>{refInvitee}</span>{' '}
                👋
              </h1>
              <p
                className="text-lg mt-2"
                style={{
                  fontFamily: 'var(--theme-font-body)',
                  color: 'var(--theme-stone-600)',
                }}
              >
                Someone you know wanted you to see this.
              </p>
            </div>
          )}

          <div className="text-center mb-10">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--theme-brand-primary) 12%, white)',
                color: 'var(--theme-brand-primary)',
                border: '1px solid color-mix(in srgb, var(--theme-brand-primary) 25%, white)',
                fontFamily: 'var(--theme-font-body)',
              }}
            >
              <Sparkles className="w-4 h-4" />
              You've been personally invited
            </div>
          </div>

          {/* The "letter" card — referrer is the star */}
          <div
            className="relative rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
              border: '1px solid color-mix(in srgb, var(--theme-brand-primary) 20%, white)',
            }}
          >
            {/* Decorative chameleon watermark */}
            <div className="absolute -top-12 -right-12 w-80 h-80 opacity-[0.10] pointer-events-none">
              <img
                src="/logo.svg"
                alt=""
                className="w-full h-full object-contain"
              />
            </div>

            <div className="relative grid md:grid-cols-[auto_1fr] gap-8 p-8 md:p-12 items-center">
              {/* Referrer avatar — big and prominent */}
              <div className="flex flex-col items-center md:items-start">
                <div className="relative">
                  {/* Pulsing orbit ring around avatar */}
                  <div
                    className="absolute inset-0 -m-3 rounded-full orbit-ring"
                    style={{
                      background:
                        'radial-gradient(circle, color-mix(in srgb, var(--theme-brand-primary) 25%, transparent) 0%, transparent 70%)',
                    }}
                  />
                  {refPhoto ? (
                    <div
                      className="relative rounded-full overflow-hidden shadow-xl border-4 border-white"
                      style={{
                        width: '5.95rem',
                        height: '5.95rem',
                        backgroundColor: 'var(--theme-stone-200)',
                      }}
                    >
                      <img
                        src={refPhoto}
                        alt={refBy}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="relative rounded-full flex items-center justify-center text-5xl font-bold text-white shadow-xl"
                      style={{
                        width: '5.95rem',
                        height: '5.95rem',
                        background:
                          'linear-gradient(135deg, var(--theme-brand-primary) 0%, color-mix(in srgb, var(--theme-brand-primary) 60%, black) 100%)',
                        fontFamily: 'var(--theme-font-body)',
                      }}
                    >
                      {referrerInitial}
                    </div>
                  )}
                  {/* HS logo badge in corner */}
                  <div
                    className="absolute -bottom-2 -right-2 rounded-full bg-white flex items-center justify-center shadow-lg border-2 p-1"
                    style={{
                      borderColor: 'var(--theme-brand-primary)',
                      width: '2.72rem',
                      height: '2.72rem',
                    }}
                  >
                    <img
                      src="/logo.svg"
                      alt="HotSeaters"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                {hasReferrer && (
                  <div className="text-center md:text-left mt-4">
                    <p
                      className="font-bold text-lg"
                      style={{
                        fontFamily: 'var(--theme-font-body)',
                        color: 'var(--theme-stone-900)',
                      }}
                    >
                      {refBy}
                    </p>
                    {refCompany && (
                      <p
                        className="text-sm"
                        style={{
                          fontFamily: 'var(--theme-font-body)',
                          color: 'var(--theme-stone-500)',
                        }}
                      >
                        {refCompany}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* The message */}
              <div>
                <Quote
                  className="w-10 h-10 mb-3"
                  style={{
                    color: 'color-mix(in srgb, var(--theme-brand-primary) 40%, white)',
                  }}
                />
                <h2
                  className="text-3xl lg:text-4xl font-bold mb-4 leading-tight"
                  style={{
                    fontFamily: 'var(--theme-font-body)',
                    color: 'var(--theme-stone-900)',
                  }}
                >
                  {hasReferrer ? (
                    <>
                      <span style={{ color: 'var(--theme-brand-primary)' }}>{refBy}</span>
                      <span> thinks you'd be a great fit for HotSeaters.</span>
                    </>
                  ) : (
                    <>
                      You've been invited to{' '}
                      <span style={{ color: 'var(--theme-brand-primary)' }}>HotSeaters</span>
                      .
                    </>
                  )}
                </h2>
                <p
                  className="text-lg leading-relaxed mb-6"
                  style={{
                    fontFamily: 'var(--theme-font-body)',
                    color: 'var(--theme-stone-600)',
                  }}
                >
                  {hasReferrer ? (
                    <>
                      {refCompany ? (
                        <>
                          <strong>{refCompany}</strong> uses HotSeaters
                        </>
                      ) : (
                        <>They use HotSeaters</>
                      )}{' '}
                      to run their trial technology business — and they're inviting you into{' '}
                      <strong>HotSeatHub</strong>, the closed marketplace where firms like yours
                      collaborate, sub out trials, and grow together.
                    </>
                  ) : (
                    <>
                      HotSeaters is the all-in-one toolkit trial technology firms use to run their
                      business. And HotSeatHub is the network where they collaborate.
                    </>
                  )}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <Button
                    onClick={handleGetStarted}
                    size="lg"
                    className="shadow-xl text-base px-7 py-6 w-full sm:w-auto"
                    style={{
                      backgroundColor: 'var(--theme-brand-primary)',
                      color: 'white',
                      borderRadius: 'var(--theme-button-radius)',
                      fontFamily: 'var(--theme-font-body)',
                    }}
                  >
                    Accept Invitation
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <p
                    className="text-sm"
                    style={{
                      fontFamily: 'var(--theme-font-body)',
                      color: 'var(--theme-stone-500)',
                    }}
                  >
                    Free for 90 days · No credit card
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust-building strip */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="text-center mb-10">
            <p
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{
                color: 'var(--theme-brand-primary)',
                fontFamily: 'var(--theme-font-body)',
              }}
            >
              Why peers refer peers
            </p>
            <h3
              className="text-3xl lg:text-4xl font-bold"
              style={{
                fontFamily: 'var(--theme-font-body)',
                color: 'var(--theme-stone-900)',
              }}
            >
              What {firstName} already know
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {trustPoints.map((point, idx) => (
              <div
                key={idx}
                className="p-7 rounded-2xl bg-white"
                style={{
                  border: '1px solid var(--theme-stone-200)',
                  boxShadow: '0 4px 16px -4px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background:
                      'linear-gradient(135deg, color-mix(in srgb, var(--theme-brand-primary) 15%, white) 0%, color-mix(in srgb, var(--theme-brand-primary) 5%, white) 100%)',
                  }}
                >
                  <point.icon
                    className="w-6 h-6"
                    style={{ color: 'var(--theme-brand-primary)' }}
                  />
                </div>
                <h4
                  className="text-lg font-bold mb-2 leading-snug"
                  style={{
                    fontFamily: 'var(--theme-font-body)',
                    color: 'var(--theme-stone-900)',
                  }}
                >
                  {point.title}
                </h4>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    fontFamily: 'var(--theme-font-body)',
                    color: 'var(--theme-stone-600)',
                  }}
                >
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* HotSeatHub — the main reason they were referred */}
        <section className="max-w-6xl mx-auto px-6 mb-20">
          <div
            className="relative rounded-3xl overflow-hidden p-10 lg:p-16"
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 45%, #7c3aed 100%)',
            }}
          >
            {/* Decorative orbs */}
            <div
              className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
              }}
            />
            <div
              className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full opacity-10"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
              }}
            />

            <div className="relative grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mb-5"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.25)',
                    fontFamily: 'var(--theme-font-body)',
                  }}
                >
                  <Orbit className="w-4 h-4" />
                  The real reason you're here
                </div>
                <h3
                  className="text-4xl lg:text-5xl font-bold mb-5 text-white leading-tight"
                  style={{ fontFamily: 'var(--theme-font-body)' }}
                >
                  HotSeatHub gets stronger with you in it.
                </h3>
                <p
                  className="text-lg leading-relaxed mb-6"
                  style={{
                    fontFamily: 'var(--theme-font-body)',
                    color: 'rgba(255,255,255,0.9)',
                  }}
                >
                  {hasReferrer ? (
                    <>
                      {refBy} wants to be able to sub out gigs to you — and pick up gigs from you
                      when you need help. That only works if you're in the network.
                    </>
                  ) : (
                    <>
                      Trial tech firms collaborate when capacity is tight. Sub out gigs you can't
                      cover. Pick up gigs when you have room. Get paid through the platform.
                    </>
                  )}
                </p>
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="bg-white hover:bg-stone-50 text-base px-7 py-6 shadow-xl"
                  style={{
                    color: '#4c1d95',
                    borderRadius: 'var(--theme-button-radius)',
                    fontFamily: 'var(--theme-font-body)',
                  }}
                >
                  Join the Network
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {hshValue.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl backdrop-blur-sm"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      border: '1px solid rgba(255,255,255,0.18)',
                    }}
                  >
                    <item.icon className="w-7 h-7 text-white mb-2.5" />
                    <p
                      className="font-bold text-white text-base mb-1"
                      style={{ fontFamily: 'var(--theme-font-body)' }}
                    >
                      {item.label}
                    </p>
                    <p
                      className="text-sm leading-snug"
                      style={{
                        fontFamily: 'var(--theme-font-body)',
                        color: 'rgba(255,255,255,0.85)',
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* "And the rest of the platform" — compact perks list */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <p
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{
                color: 'var(--theme-brand-primary)',
                fontFamily: 'var(--theme-font-body)',
              }}
            >
              And while you're at it
            </p>
            <h3
              className="text-3xl lg:text-4xl font-bold mb-3"
              style={{
                fontFamily: 'var(--theme-font-body)',
                color: 'var(--theme-stone-900)',
              }}
            >
              Run your entire business from one place
            </h3>
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{
                fontFamily: 'var(--theme-font-body)',
                color: 'var(--theme-stone-600)',
              }}
            >
              Your free account includes the full HotSeaters platform. Not just the marketplace.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {platformPerks.map((perk, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 rounded-xl bg-white"
                style={{ border: '1px solid var(--theme-stone-200)' }}
              >
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      'linear-gradient(135deg, color-mix(in srgb, var(--theme-brand-primary) 15%, white) 0%, color-mix(in srgb, var(--theme-brand-primary) 5%, white) 100%)',
                  }}
                >
                  <perk.icon
                    className="w-5 h-5"
                    style={{ color: 'var(--theme-brand-primary)' }}
                  />
                </div>
                <p
                  className="text-base font-medium"
                  style={{
                    fontFamily: 'var(--theme-font-body)',
                    color: 'var(--theme-stone-800)',
                  }}
                >
                  {perk.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA — back to the personal ask */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <div
            className="rounded-3xl p-10 lg:p-14 text-center shadow-xl"
            style={{
              background:
                'linear-gradient(135deg, var(--theme-brand-primary) 0%, color-mix(in srgb, var(--theme-brand-primary) 70%, black) 100%)',
            }}
          >
            <h3
              className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight"
              style={{ fontFamily: 'var(--theme-font-body)' }}
            >
              {hasReferrer ? (
                <>Don't leave {refBy.split(' ')[0]} hanging.</>
              ) : (
                <>Ready when you are.</>
              )}
            </h3>
            <p
              className="text-lg mb-8 max-w-xl mx-auto"
              style={{
                fontFamily: 'var(--theme-font-body)',
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              {hasReferrer ? (
                <>Join {refBy.split(' ')[0]} on HotSeaters and start collaborating in minutes.</>
              ) : (
                <>Join HotSeaters and start collaborating in minutes.</>
              )}
            </p>
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-white hover:bg-stone-50 text-base px-8 py-6 shadow-xl"
              style={{
                color: 'var(--theme-brand-primary)',
                borderRadius: 'var(--theme-button-radius)',
                fontFamily: 'var(--theme-font-body)',
              }}
            >
              Accept Your Invitation
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <div
              className="flex flex-wrap justify-center gap-5 mt-7 text-sm"
              style={{
                fontFamily: 'var(--theme-font-body)',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 90-day free trial
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> No credit card
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Cancel anytime
              </span>
            </div>
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
            className="max-w-6xl mx-auto px-6 py-6 text-center"
            style={{
              fontFamily: 'var(--theme-font-body)',
              color: 'var(--theme-stone-500)',
              fontSize: '0.875rem',
            }}
          >
            &copy; 2026 HotSeaters. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}
