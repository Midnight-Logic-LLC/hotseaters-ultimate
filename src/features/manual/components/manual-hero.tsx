/**
 * ManualHero — hero banner for the User Manual page.
 *
 * Bible: HotSeatersMVP/src/components/manual/ManualHero.jsx
 * Adapter: CDN image replaced with locally-hosted /brand/chameleon-logo.png
 *          (RULE 0: all image assets self-hosted under public/brand/).
 *
 * RULE B: no store/db imports.
 * RULE A: kebab-case filename.
 */

import { Briefcase, Gavel, Users, Orbit, Clock, DollarSign } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const FEATURE_PILLS: [LucideIcon, string][] = [
  [Briefcase, 'Sales Pipeline'],
  [Gavel, 'Trial Ops'],
  [Users, 'Team'],
  [Clock, 'Time & Expenses'],
  [DollarSign, 'Invoicing'],
  [Orbit, 'Marketplace'],
];

export function ManualHero() {
  return (
    <div
      className="relative overflow-hidden rounded-xl mb-8"
      style={{ background: 'var(--theme-brand-primary)' }}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 translate-y-1/3 -translate-x-1/4" />
      </div>
      <div className="relative px-6 py-6 md:px-10 md:py-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <img
                src="/brand/chameleon-logo.png"
                alt="HotSeaters"
                className="w-10 h-10 object-contain"
              />
              <span className="text-white/50 text-xs font-medium tracking-wider uppercase">
                User Manual
              </span>
            </div>
            <h1
              className="text-2xl md:text-3xl font-bold text-white mb-2"
              style={{ fontFamily: 'var(--theme-font-brand-title)' }}
            >
              HotSeaters
            </h1>
            <p className="text-white/75 text-sm leading-relaxed max-w-md">
              Your complete guide to the trial consulting platform — from sales pipeline through
              trial execution, billing, and marketplace.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 md:w-80 flex-shrink-0">
            {FEATURE_PILLS.map(([Icon, label]) => (
              <div
                key={label}
                className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-2"
              >
                <Icon className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
                <span className="text-white text-[11px] font-medium leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
