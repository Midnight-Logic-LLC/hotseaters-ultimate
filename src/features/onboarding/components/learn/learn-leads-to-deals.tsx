/**
 * learn-leads-to-deals.tsx — explainer between Tiers and Time.
 * BIBLE: LearnLeadsToDeals.jsx
 *
 * Q1 decision: visual "close, not pixel-identical". Information
 * matches bible prose verbatim. See change-210 LESSONS.
 */
import { ArrowRight, FileText, Handshake, Search, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { WizardNav } from '../wizard-nav';

interface Stage {
  icon: typeof UserPlus;
  bg: string;
  fg: string;
  name: string;
  blurb: string;
}

const STAGES: ReadonlyArray<Stage> = [
  {
    icon: UserPlus,
    bg: 'bg-blue-100',
    fg: 'text-blue-600',
    name: 'Lead',
    blurb:
      'Someone who might need your services — a law firm that called, a referral from a colleague, someone you met at a conference.',
  },
  {
    icon: Search,
    bg: 'bg-amber-100',
    fg: 'text-amber-600',
    name: 'Qualified',
    blurb:
      'A lead with an actual case they need help with — specific dates, services, and a budget.',
  },
  {
    icon: FileText,
    bg: 'bg-violet-100',
    fg: 'text-violet-600',
    name: 'Proposal Sent',
    blurb:
      'Deals live on your sales pipeline board (a Kanban view) where you can drag them through stages.',
  },
  {
    icon: Handshake,
    bg: 'bg-emerald-100',
    fg: 'text-emerald-600',
    name: 'Signed',
    blurb:
      'Contract signed — track estimated revenue, send proposals, and work toward closing the Deal.',
  },
];

export function LearnLeadsToDeals() {
  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-1">From Leads to Deals</h3>
      <p className="text-sm text-stone-600 mb-5">How your sales pipeline works in HotSeaters</p>

      <div className="flex flex-col md:flex-row md:items-stretch gap-3">
        {STAGES.map((stage, idx) => (
          <div key={stage.name} className="flex flex-col md:flex-row md:items-center md:flex-1 gap-3">
            <Card className="p-4 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-10 h-10 rounded-full ${stage.bg} flex items-center justify-center`}
                >
                  <stage.icon className={`w-5 h-5 ${stage.fg}`} />
                </div>
                <h4 className="font-semibold text-stone-900 text-sm">{stage.name}</h4>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">{stage.blurb}</p>
            </Card>
            {idx < STAGES.length - 1 && (
              <ArrowRight className="hidden md:block w-5 h-5 text-stone-400 shrink-0" />
            )}
          </div>
        ))}
      </div>

      <Card className="mt-5 p-5">
        <p className="text-sm text-stone-600 leading-relaxed">
          A <strong>Lead</strong> is someone who might need your services. At this stage,
          you're just tracking who they are and staying in touch. You might log calls, emails,
          or meeting notes to keep the relationship warm.
        </p>
        <p className="mt-2 text-sm text-stone-600 leading-relaxed">
          Once a lead has an actual case they need help with — specific dates, services, and a
          budget — you convert them into a <strong>Deal</strong>. Deals live on your sales
          pipeline board (a Kanban view) where you can drag them through stages like{' '}
          <em>Proposal Sent</em>, <em>Negotiating</em>, and <em>Contract Signed</em>.
        </p>
        <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-cyan-200 bg-cyan-50 px-3.5 py-2.5">
          <span className="text-lg leading-none mt-0.5">✨</span>
          <p className="text-cyan-800 text-sm font-medium">
            Even better, HotSeaters can automatically move your Deals down the pipe when you
            send a proposal or a client signs an engagement letter!
          </p>
        </div>
        <p className="mt-3 text-sm text-stone-600 leading-relaxed">
          In HotSeaters, <strong>Deals</strong> show up in several places — including the time
          clock. Since deals aren't active work yet, you might want to hide them from the time
          clock to reduce clutter. That's one of the options you'll see on the next screen. 👍
        </p>
      </Card>

      <WizardNav />
    </div>
  );
}
