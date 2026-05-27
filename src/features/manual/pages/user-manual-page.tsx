/**
 * UserManualPage — visual and functional parity with
 * HotSeatersMVP/src/pages/UserManual.jsx (213 lines).
 *
 * Adapter notes:
 *   - createPageUrl("X") → "/X" (our router uses bible-matching PascalCase paths)
 *   - <Link> from react-router-dom (same as bible)
 *   - ManualHero ported to self-hosted image (see manual-hero.tsx)
 *   - No base44 / TanStack Query usage — page is fully static
 *
 * RULE A: kebab-case filename.
 * RULE B: no store/db imports.
 * RULE F: lives under src/features/manual/pages/.
 */

import { Link } from 'react-router-dom';
import {
  Gavel,
  Clock,
  DollarSign,
  Orbit,
  TrendingUp,
  Award,
  ChevronRight,
  Building2,
  Lightbulb,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ManualHero } from '@/features/manual/components/manual-hero';

interface RoleEntry {
  role: string;
  desc: string;
  color: string;
  tag: string;
}

interface SectionEntry {
  label: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  page: string;
  items: string[];
}

interface TipGroup {
  title: string;
  color: string;
  tips: string[];
}

interface OverviewItem {
  label: string;
  detail: string;
}

const ROLES: RoleEntry[] = [
  {
    role: 'Owner',
    desc: 'Full platform access — subscription management, billing, all settings, marketplace configuration, theme customization, team invitations, referral program, and everything admins can do',
    color: '#9333ea',
    tag: 'Everything',
  },
  {
    role: 'Admin',
    desc: 'Manages trials, clients, team members, services, approvals, invoicing, collections, documents, pipeline stages, templates — everything except subscription and billing',
    color: '#3b82f6',
    tag: 'Most features',
  },
  {
    role: 'Sales',
    desc: 'Deals pipeline, client relationships, lead tracking, proposals, document generation, schedule viewing, and revenue projections',
    color: '#059669',
    tag: 'Sales focus',
  },
  {
    role: 'Consultant',
    desc: 'Logs time via clock or manual entry, submits expenses with receipt scanning, views personal assignments and schedule, receives notifications for changes',
    color: '#ea580c',
    tag: 'Execution',
  },
];

const SECTIONS: SectionEntry[] = [
  {
    label: 'Sales',
    desc: 'Dashboard analytics, lead management, deals pipeline, and client/contact database',
    icon: TrendingUp,
    color: '#059669',
    page: 'ManualSales',
    items: [
      'Dashboard KPIs',
      'Revenue Charts',
      'Leads Radar',
      'Deal Wizard',
      'Deals Pipeline',
      'Clients',
      'Contacts',
      'Import Wizard',
    ],
  },
  {
    label: 'Operations',
    desc: 'Trial management, interactive timeline, consultant assignments, and document workflows',
    icon: Gavel,
    color: '#0891b2',
    page: 'ManualOperations',
    items: [
      'Trial Details',
      'Service Assignments',
      'Gantt Timeline',
      'Drag & Drop',
      'Documents',
      'E-Signatures',
      'Calendar Sync',
    ],
  },
  {
    label: 'Time & Expenses',
    desc: 'Time clock, manual entries, receipt scanning, mileage tracking, and expense reports',
    icon: Clock,
    color: '#e11d48',
    page: 'ManualTimeExpenses',
    items: ['Time Clock', 'Manual Entry', 'Travel Time', 'Receipt AI', 'Mileage', 'Expense Reports'],
  },
  {
    label: 'Billing',
    desc: 'Approvals, invoice creation with templates, PDF generation, email delivery, payment tracking, and vendor bills',
    icon: DollarSign,
    color: '#6366f1',
    page: 'ManualBilling',
    items: [
      'Approvals',
      'Create Invoices',
      'Templates',
      'PDF Generation',
      'Email Delivery',
      'Collections',
      'Partial Payments',
      'Vendor Bills',
    ],
  },
  {
    label: 'HotSeatHub',
    desc: 'Subcontractor marketplace — post jobs, find gigs, negotiate rates, manage assignments',
    icon: Orbit,
    color: '#a855f7',
    page: 'ManualHSH',
    items: [
      'Post Jobs',
      'Find Gigs',
      'Rate Negotiation',
      'HSH Agreements',
      'Linked Entries',
      'Directory',
      'Reviews',
    ],
  },
  {
    label: 'Company',
    desc: 'Team management, role assignments, consultant tiers, settings, and notification system',
    icon: Building2,
    color: '#78716c',
    page: 'ManualCompany',
    items: [
      'Invitations',
      'Roles & Tiers',
      'Services Config',
      'Pipeline Stages',
      'Billing Settings',
      'Templates',
      'Theme',
      'Notifications',
    ],
  },
];

const OVERVIEW_ITEMS: OverviewItem[] = [
  { label: 'Rate Formula', detail: 'Base Rate × Client Type × Tier Multiplier (or client override)' },
  { label: 'Pipeline', detail: 'Sales stages → Won → Operations stages → Completed' },
  { label: 'Time → Invoice', detail: 'Clock In → Pending → Approved → Billed → Paid' },
  {
    label: 'HSH Marketplace',
    detail: 'Post Job → Get Responses → Negotiate → Accept → Linked Entries',
  },
  {
    label: 'Documents',
    detail: 'Template → Generate → Send → E-Sign → Auto-Move Pipeline',
  },
  { label: 'Billing Periods', detail: 'Weekly, Monthly, or Per-Trial — configurable cycles' },
];

const TIP_GROUPS: TipGroup[] = [
  {
    title: 'Owners & Admins',
    color: '#9333ea',
    tips: [
      'Set up services, tiers, and pipeline stages before creating your first deal — all rate calculations depend on these being configured',
      'Build document templates early so proposals and engagement letters are consistent from day one',
      'Review time entries weekly — only approved items can go on invoices. Weekly approvals prevent end-of-month bottlenecks',
      'Use the Schedule view in consultant grouping mode to spot double-bookings and capacity gaps',
      'Configure billing settings (periods, invoice number format, default templates) before your first invoice cycle',
      'Set your annual revenue target and monthly breakeven in Company settings — they power the dashboard goal/breakeven lines',
    ],
  },
  {
    title: 'Sales Team',
    color: '#3b82f6',
    tips: [
      'Keep estimated values updated on every deal — revenue projections are only as accurate as your pipeline data',
      'Check consultant availability on the Schedule before quoting trial dates to clients — prevents over-promising',
      'Update pipeline stages promptly — dashboard metrics and Deal Tracker urgency depend on accurate stage data',
      'Use e-signatures to close deals faster — clients can sign from any device without creating an account',
      'Log lead activities regularly — the follow-up system flags stale leads based on last activity date',
      'Set client service overrides before creating deals — they auto-populate in the deal wizard to save time',
    ],
  },
  {
    title: 'Consultants',
    color: '#059669',
    tips: [
      'Use the time clock daily — the persistent timer badge means you never lose track of a running clock',
      'Add descriptions to time entries — admins need context for approval, and descriptions appear on client invoices',
      'Upload expense receipts immediately — the AI extracts vendor, amount, date, and category in seconds',
      'Watch the notification bell for schedule changes, new assignments, and expense rejections',
      'Connect Google Calendar in your profile — trial events sync automatically so you see assignments in your personal calendar',
      'If your time entry is rejected, read the admin\'s reason, fix the issue, and resubmit — don\'t create a new entry',
    ],
  },
];

export function UserManualPage() {
  return (
    <div
      className="min-h-screen p-4 md:p-6 lg:p-8"
      style={{
        background: '#eae7e2',
        fontFamily: 'var(--theme-font-body)',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 'var(--theme-max-content-width)' }}>
        <ManualHero />

        {/* ── Platform Overview ── */}
        <div
          className="rounded-xl overflow-hidden mb-10"
          style={{ background: 'white', border: '1px solid #d6d3d1' }}
        >
          <div
            className="px-6 py-4 flex items-center gap-2.5"
            style={{ background: '#1c1917' }}
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">What is HotSeaters?</h2>
          </div>
          <div className="p-6">
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#44403c' }}>
              <strong>HotSeaters</strong> is an all-in-one business management platform for trial
              technology and trial consulting companies. It connects six core workflows into a single
              system: you win work through the <strong>Sales</strong> pipeline, manage engagements
              through <strong>Operations</strong>, track work through{' '}
              <strong>Time &amp; Expenses</strong>, get paid through <strong>Billing</strong>, find
              or provide subcontractors through the <strong>HotSeatHub</strong> marketplace, and
              configure everything through <strong>Company</strong> settings.
            </p>
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#44403c' }}>
              The core flow: a <strong>Lead</strong> becomes a <strong>Deal</strong> in your sales
              pipeline. When won, the deal becomes a <strong>Trial</strong> in your operations
              pipeline with a job number, services, and assigned consultants. Consultants log{' '}
              <strong>Time</strong> and <strong>Expenses</strong> against the trial. Admins{' '}
              <strong>approve</strong> entries and create <strong>Invoices</strong> from approved
              work. Clients pay, and you track <strong>Collections</strong>. The{' '}
              <strong>Dashboard</strong> and <strong>Revenue Projections</strong> show you the
              financial health of the entire business at every step.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {OVERVIEW_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="p-3 rounded-lg"
                  style={{ background: '#f5f3f0', border: '1px solid #e7e5e4' }}
                >
                  <p
                    className="text-[11px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: '#78716c' }}
                  >
                    {item.label}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: '#44403c' }}>
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Roles ── */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <Award className="w-5 h-5" style={{ color: '#7c3aed' }} />
            <h2 className="text-base font-bold" style={{ color: '#1c1917' }}>
              User Roles &amp; Permissions
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ROLES.map((r) => (
              <div
                key={r.role}
                className="rounded-xl p-4"
                style={{ background: 'white', border: '1px solid #d6d3d1' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold" style={{ color: r.color }}>
                    {r.role}
                  </span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: r.color + '18', color: r.color }}
                  >
                    {r.tag}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#57534e' }}>
                  {r.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section cards ── */}
        <div className="mb-10">
          <h2 className="text-base font-bold mb-4" style={{ color: '#1c1917' }}>
            Explore by Workflow
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SECTIONS.map((s) => (
              <Link
                key={s.page}
                to={`/${s.page}`}
                className="group rounded-xl overflow-hidden transition-all hover:shadow-md"
                style={{ background: 'white', border: '1px solid #d6d3d1' }}
              >
                <div className="h-1.5" style={{ background: s.color }} />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: s.color + '18' }}
                    >
                      <s.icon className="w-4.5 h-4.5" style={{ color: s.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold" style={{ color: '#1c1917' }}>
                        {s.label}
                      </h3>
                      <p className="text-[11px] leading-snug" style={{ color: '#78716c' }}>
                        {s.desc}
                      </p>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity"
                      style={{ color: s.color }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {s.items.map((item) => (
                      <span
                        key={item}
                        className="px-2 py-0.5 rounded text-[10px] font-medium"
                        style={{ background: s.color + '12', color: s.color }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Pro Tips ── */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'white', border: '1px solid #d6d3d1' }}
        >
          <div
            className="px-6 py-3.5 flex items-center gap-2"
            style={{ background: 'var(--theme-brand-primary)' }}
          >
            <h2 className="text-sm font-bold text-white">Quick Tips by Role</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3">
            {TIP_GROUPS.map((group, gi) => (
              <div
                key={group.title}
                className="p-5"
                style={{ borderLeft: gi > 0 ? '1px solid #e7e5e4' : '' }}
              >
                <h4
                  className="text-xs font-bold mb-3 uppercase tracking-wider"
                  style={{ color: group.color }}
                >
                  {group.title}
                </h4>
                <ul className="space-y-2.5">
                  {group.tips.map((tip) => (
                    <li
                      key={tip}
                      className="flex items-start gap-2 text-xs leading-relaxed"
                      style={{ color: '#57534e' }}
                    >
                      <span style={{ color: group.color }} className="mt-0.5 flex-shrink-0">
                        ▸
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-center mt-6" style={{ color: '#a8a29e' }}>
          Last updated: 2026-04-29
        </p>
      </div>
    </div>
  );
}
