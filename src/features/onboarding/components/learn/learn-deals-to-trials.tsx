/**
 * learn-deals-to-trials.tsx — explainer between Billing and Pipeline.
 * BIBLE: LearnDealsToTrials.jsx
 */
import { BookOpen } from 'lucide-react';
import { WizardNav } from '../wizard-nav';

export function LearnDealsToTrials() {
  return (
    <div>
      <div className="flex items-center gap-2 text-indigo-600 mb-2">
        <BookOpen className="w-5 h-5" />
        <span className="text-sm font-semibold uppercase tracking-wide">Quick concept</span>
      </div>
      <h3 className="text-xl font-bold text-stone-900 mb-3">Signed deals become Trials</h3>
      <div className="space-y-3 text-stone-600 leading-relaxed">
        <p>Once a deal is signed, it carries over the services + tiers you priced — and HotSeaters automatically creates a <strong>Trial</strong> with scheduled services and assigned consultants.</p>
        <p>The pipeline stages below auto-progress when a document is sent or signed — set those triggers on the next step if you want.</p>
      </div>
      <WizardNav />
    </div>
  );
}
