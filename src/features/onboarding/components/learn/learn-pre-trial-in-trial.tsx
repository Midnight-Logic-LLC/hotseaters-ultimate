/**
 * learn-pre-trial-in-trial.tsx — quick explainer slotted between
 * Company and Services. BIBLE: LearnPreTrialInTrial.jsx
 */
import { BookOpen } from 'lucide-react';
import { WizardNav } from '../wizard-nav';

export function LearnPreTrialInTrial() {
  return (
    <div>
      <div className="flex items-center gap-2 text-indigo-600 mb-2">
        <BookOpen className="w-5 h-5" />
        <span className="text-sm font-semibold uppercase tracking-wide">Quick concept</span>
      </div>
      <h3 className="text-xl font-bold text-stone-900 mb-3">Billing phases: Pre-Trial vs In-Trial</h3>
      <div className="space-y-3 text-stone-600 leading-relaxed">
        <p><strong>Pre-Trial</strong> work is anything before the first day in court — exhibit prep, demonstrative graphics, deposition reviews. Usually invoiced hourly.</p>
        <p><strong>In-Trial</strong> work is courtroom presentation — the in-seat trial-tech time. Usually has a daily minimum.</p>
        <p>The services step lets you mark each one. We'll roll them into the right invoice section automatically.</p>
      </div>
      <WizardNav />
    </div>
  );
}
