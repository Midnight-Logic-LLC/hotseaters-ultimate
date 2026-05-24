/**
 * learn-deals-to-trials.tsx — explainer between Billing and Pipeline.
 * BIBLE: LearnDealsToTrials.jsx
 *
 * Q1 decision: visual "close, not pixel-identical". Information
 * matches bible prose verbatim. See change-210 LESSONS.
 */
import {
  BarChart3,
  Briefcase,
  CheckCircle2,
  Clock,
  DollarSign,
  FileSignature,
  Gavel,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { WizardNav } from '../wizard-nav';

const TRIAL_TASKS = [
  { icon: CheckCircle2, label: 'Scheduling', bg: 'bg-emerald-100', fg: 'text-emerald-600' },
  { icon: Briefcase, label: 'Team', bg: 'bg-violet-100', fg: 'text-violet-600' },
  { icon: Clock, label: 'Time tracking', bg: 'bg-blue-100', fg: 'text-blue-600' },
  { icon: DollarSign, label: 'Expenses', bg: 'bg-amber-100', fg: 'text-amber-600' },
  { icon: Gavel, label: 'Billing', bg: 'bg-rose-100', fg: 'text-rose-600' },
] as const;

export function LearnDealsToTrials() {
  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-1">From Deals to Trials</h3>
      <p className="text-sm text-stone-600 mb-5">How work flows through your pipeline</p>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <FileSignature className="w-5 h-5 text-emerald-600" />
          </div>
          <h4 className="font-semibold text-stone-900">Signed Deal</h4>
        </div>
        <p className="text-sm text-stone-600 leading-relaxed">
          Remember, a <strong>Deal</strong> is an active sales opportunity. When the client
          signs the contract and you've officially booked the work, that deal gets "won" and
          transitions into a <strong>Trial</strong>.
        </p>
        <p className="mt-2 text-sm text-stone-600 leading-relaxed">
          Trials are where the real action happens — scheduling team members, tracking time,
          managing expenses, and billing the client.
        </p>
      </Card>

      <Card className="mt-5 p-5">
        <h4 className="font-semibold text-stone-900 mb-3">What happens in a Trial</h4>
        <div className="flex flex-wrap gap-3">
          {TRIAL_TASKS.map((task) => (
            <div
              key={task.label}
              className="flex items-center gap-2 rounded-lg ring-1 ring-stone-200 px-3 py-2"
            >
              <div
                className={`w-8 h-8 rounded-full ${task.bg} flex items-center justify-center`}
              >
                <task.icon className={`w-4 h-4 ${task.fg}`} />
              </div>
              <span className="text-sm text-stone-700">{task.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-5 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
            <Gavel className="w-5 h-5 text-violet-600" />
          </div>
          <h4 className="font-semibold text-stone-900">Two pipeline boards, one flow</h4>
        </div>
        <p className="text-sm text-stone-600 leading-relaxed">HotSeaters uses two connected Kanban boards:</p>
        <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-stone-600">
          <li>
            <strong>Sales Pipeline</strong> — Tracks deals from first contact to signed
            contract
          </li>
          <li>
            <strong>Operations Pipeline</strong> — Tracks trials from pre-trial prep through
            completion
          </li>
        </ul>
        <p className="mt-2 text-sm text-stone-600 leading-relaxed">
          When you win a deal, it automatically moves to the operations side. No duplicate data
          entry needed.
        </p>
      </Card>

      <Card className="mt-5 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="font-semibold text-stone-900">
            Pipeline percentages and revenue forecasting
          </h4>
        </div>
        <p className="text-sm text-stone-600 leading-relaxed">
          Each pipeline stage has a <strong>probability percentage</strong> that represents how
          likely a deal is to close at that stage.
        </p>
        <p className="mt-2 text-sm text-stone-600 leading-relaxed">For example:</p>
        <ul className="mt-1 ml-5 list-disc space-y-1 text-sm text-stone-600">
          <li>
            <em>New Lead</em> at 10% — early stage, just exploring
          </li>
          <li>
            <em>Proposal Sent</em> at 30% — they're interested
          </li>
          <li>
            <em>Contract Signed</em> at 90% — almost locked in
          </li>
        </ul>
        <p className="mt-2 text-sm text-stone-600 leading-relaxed">
          HotSeaters uses these percentages to calculate your <strong>projected revenue</strong>{' '}
          — so a $50,000 deal at 30% contributes $15,000 to your forecast. This helps you plan
          ahead without being overly optimistic.
        </p>
      </Card>

      <WizardNav />
    </div>
  );
}
