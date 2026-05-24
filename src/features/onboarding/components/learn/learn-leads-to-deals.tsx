/**
 * learn-leads-to-deals.tsx — explainer between Tiers and Time.
 * BIBLE: LearnLeadsToDeals.jsx
 */
import { BookOpen } from 'lucide-react';
import { WizardNav } from '../wizard-nav';

export function LearnLeadsToDeals() {
  return (
    <div>
      <div className="flex items-center gap-2 text-indigo-600 mb-2">
        <BookOpen className="w-5 h-5" />
        <span className="text-sm font-semibold uppercase tracking-wide">Quick concept</span>
      </div>
      <h3 className="text-xl font-bold text-stone-900 mb-3">Leads become Deals</h3>
      <div className="space-y-3 text-stone-600 leading-relaxed">
        <p>A <strong>Lead</strong> is an opportunity you're tracking — a law firm that's reached out.</p>
        <p>When you send a proposal or engagement letter, the lead promotes to a <strong>Deal</strong>. When signed, the deal becomes a <strong>Trial</strong> with assigned services + dates.</p>
        <p>The pipeline step lets you customize the stages between Lead and Signed.</p>
      </div>
      <WizardNav />
    </div>
  );
}
