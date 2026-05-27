/**
 * HotSeatHubMarketingPage — port of HotSeatersMVP/src/pages/HotSeatHubMarketing.jsx
 *
 * Marketing page shown to companies whose HotSeatHub feature is not yet enabled.
 * Renders the deep-purple gradient hero, 4-up feature grid with tinted headers +
 * icon pinned bottom-right, a trust strip, and a final CTA panel.
 *
 * All visible strings, CSS tokens, and layout match the bible verbatim.
 * No Tier-2 data required — static marketing content only.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import {
  Orbit,
  UserPlus,
  Search,
  Handshake,
  Star,
  Users,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Network,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Static data ──────────────────────────────────────────────────────────────

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface TrustPoint {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: UserPlus,
    title: 'Post Help Wanted Gigs',
    description:
      'Need a hot-seater for a trial you can\'t cover? Post the gig and invite trusted firms to respond — without leaving HotSeaters.',
  },
  {
    icon: Search,
    title: 'Find Potential Gigs',
    description:
      'Browse open opportunities from other firms and respond with your available consultants and rates. Keep your team busy between trials.',
  },
  {
    icon: Handshake,
    title: 'Negotiate & Sign Online',
    description:
      'Counter rates, accept terms, and auto-generate signed subcontractor agreements — all in one place.',
  },
  {
    icon: Star,
    title: 'Build Your Reputation',
    description:
      'Earn HSH ratings and reviews from firms you\'ve worked with to grow your network and win more gigs.',
  },
];

const trustPoints: TrustPoint[] = [
  {
    icon: ShieldCheck,
    title: 'A closed, vetted network',
    description:
      'HotSeatHub is only open to active HotSeaters firms. No tire-kickers, no spam — just real trial-tech businesses.',
  },
  {
    icon: Network,
    title: 'Built into your workflow',
    description:
      'Gigs, agreements, time, and invoices all flow through the same HotSeaters you already use. Nothing extra to learn.',
  },
  {
    icon: Handshake,
    title: 'Collaboration without competition',
    description:
      'Sub out a trial you can\'t cover. Pick up a gig when you have a gap. Your client relationships stay yours.',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export function HotSeatHubMarketingPage() {
  return (
    <div
      style={{
        padding: 'var(--theme-page-padding)',
        fontFamily: 'var(--theme-font-body)',
      }}
      className="lg:px-8"
    >
      <div style={{ maxWidth: 'var(--theme-max-content-width)' }} className="mx-auto">

        {/* ── Hero — deep-purple gradient panel matching Landing's HSH section ── */}
        <section
          className="py-12 lg:py-16 px-6 lg:px-10 mb-10"
          style={{
            background:
              'linear-gradient(to bottom, #1e1b4b 0%, #4c1d95 35%, #7c3aed 65%, var(--theme-hsh-background) 100%)',
            borderRadius: 'var(--theme-card-radius)',
            boxShadow: 'var(--theme-card-shadow)',
            border: '1px solid color-mix(in srgb, var(--theme-hsh-primary) 25%, white)',
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.25)',
              }}
            >
              <Orbit className="w-4 h-4" />
              Included with every plan
            </div>
            <img
              src="https://media.base44.com/images/public/6914b56a550a79ca828626d4/ad7ed2892_HotSeatHubemailHeader.png"
              alt="HotSeatHub — Trial Tech Marketplace"
              className="w-full max-w-xl h-auto object-contain mb-6"
            />
            <p
              className="text-lg max-w-3xl mb-8"
              style={{ color: 'rgba(255, 255, 255, 0.95)' }}
            >
              The built-in marketplace where trial technology firms find each other. Hire trusted
              subcontractors when you're stretched thin, or pick up extra work when you have open
              capacity — all without leaving HotSeaters.
            </p>
            <Link
              to="/Settings?tab=marketplace"
              className={buttonVariants({ size: 'lg' }) + ' bg-white hover:bg-stone-50 text-base px-7 py-6 shadow-xl'}
              style={{
                color: 'var(--theme-hsh-primary)',
                borderRadius: 'var(--theme-button-radius)',
              }}
            >
              Turn On HotSeatHub
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <p className="text-sm mt-4" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Already included in your subscription · Toggle on or off anytime
            </p>
          </div>
        </section>

        {/* ── Feature Grid — 4 cards, tinted headers + icon pinned bottom-right ── */}
        <div className="grid md:grid-cols-2 mb-12" style={{ gap: 'var(--theme-card-gap)' }}>
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="relative bg-white hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
              style={{
                borderRadius: 'var(--theme-list-item-radius)',
                border: '1px solid color-mix(in srgb, var(--theme-hsh-primary) 15%, white)',
                boxShadow: 'var(--theme-list-item-shadow)',
              }}
            >
              {/* Tinted header strip */}
              <div
                className="rounded-t-lg px-6 py-5 min-h-[5rem] flex items-center"
                style={{
                  background:
                    'linear-gradient(135deg, color-mix(in srgb, var(--theme-hsh-primary) 18%, white) 0%, color-mix(in srgb, var(--theme-hsh-primary) 8%, white) 100%)',
                }}
              >
                <h4
                  className="text-xl font-bold leading-tight"
                  style={{ color: 'var(--theme-stone-900)' }}
                >
                  {feature.title}
                </h4>
              </div>
              {/* Body */}
              <div className="px-6 pt-4 pb-6 pr-32">
                <p style={{ color: 'var(--theme-stone-600)' }}>{feature.description}</p>
              </div>
              <div
                className="absolute bottom-4 right-4 w-20 h-20 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background:
                    'linear-gradient(135deg, var(--theme-hsh-primary) 0%, color-mix(in srgb, var(--theme-hsh-primary) 70%, black) 100%)',
                }}
              >
                <feature.icon className="w-10 h-10 text-white" />
              </div>
            </div>
          ))}
        </div>

        {/* ── Trust strip ── */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <p
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--theme-hsh-primary)' }}
            >
              Why firms join
            </p>
            <h3
              className="text-2xl lg:text-3xl font-bold"
              style={{ color: 'var(--theme-stone-900)' }}
            >
              A network worth being in
            </h3>
          </div>
          <div className="grid md:grid-cols-3" style={{ gap: 'var(--theme-card-gap)' }}>
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
                      'linear-gradient(135deg, color-mix(in srgb, var(--theme-hsh-primary) 15%, white) 0%, color-mix(in srgb, var(--theme-hsh-primary) 5%, white) 100%)',
                  }}
                >
                  <point.icon className="w-6 h-6" style={{ color: 'var(--theme-hsh-primary)' }} />
                </div>
                <h4
                  className="text-lg font-bold mb-2 leading-snug"
                  style={{ color: 'var(--theme-stone-900)' }}
                >
                  {point.title}
                </h4>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--theme-stone-600)' }}
                >
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA — purple gradient panel ── */}
        <section
          className="rounded-3xl p-10 lg:p-14 text-center shadow-xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 45%, #7c3aed 100%)',
          }}
        >
          {/* Decorative orbs */}
          <div
            className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full opacity-10 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
            }}
          />

          <div className="relative">
            <Users className="w-12 h-12 mx-auto mb-5 text-white opacity-90" />
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
              Ready to join the network?
            </h3>
            <p
              className="text-lg mb-8 max-w-xl mx-auto"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Flip on HotSeatHub in your settings and you'll be posting and finding gigs in minutes.
            </p>
            <Link
              to="/Settings?tab=marketplace"
              className={buttonVariants({ size: 'lg' }) + ' bg-white hover:bg-stone-50 text-base px-8 py-6 shadow-xl'}
              style={{ color: '#4c1d95', borderRadius: 'var(--theme-button-radius)' }}
            >
              Enable HotSeatHub Features
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <div
              className="flex flex-wrap justify-center gap-5 mt-7 text-sm"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Included in your plan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Toggle on or off anytime
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> No extra setup
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
