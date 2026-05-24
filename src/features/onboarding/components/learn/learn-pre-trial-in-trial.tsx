/**
 * learn-pre-trial-in-trial.tsx — quick explainer slotted between
 * Company and Services. BIBLE: LearnPreTrialInTrial.jsx
 *
 * Q1 decision: visual is "close, not pixel-identical" to bible.
 * Information matches bible prose verbatim. See change-210 LESSONS.
 */
import { Briefcase, Calendar, Clock, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { WizardNav } from '../wizard-nav';

export function LearnPreTrialInTrial() {
  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-1">How Billing Phases Work</h3>
      <p className="text-sm text-stone-600 mb-5">A quick overview before you set up your services</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-stone-900">Pre-Trial</h4>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            All the prep work before the trial starts (creating graphics, organizing exhibits,
            editing video depositions, courtroom surveys, etc.)
          </p>
          <p className="mt-2 text-xs text-stone-500">
            <strong>Hourly</strong> — You bill for the exact hours worked. Simple and common
            for pre-trial prep work.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-semibold text-stone-900">In-Trial</h4>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            The actual trial days when you're in the courtroom doing the actual Hot Seating!
          </p>
          <p className="mt-2 text-xs text-stone-500">
            <strong>Daily Minimum</strong> — Once you're on site at the trial (especially out
            of town trials), you bill a minimum number of hours per day. This is standard for
            in-trial work.
          </p>
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <h4 className="font-semibold text-stone-900">Timeline</h4>
        </div>
        <div className="flex w-full overflow-hidden rounded-md ring-1 ring-stone-200">
          <div className="flex-1 bg-blue-100 py-3 text-center text-xs font-medium text-blue-800">
            Pre-Trial prep
          </div>
          <div className="flex-1 bg-purple-100 py-3 text-center text-xs font-medium text-purple-800">
            In-Trial courtroom
          </div>
        </div>
        <p className="mt-3 text-sm text-stone-600">
          HotSeaters treats both phases separately because they're usually billed differently.
        </p>
      </Card>

      <Card className="mt-5 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
            <Layers className="w-5 h-5 text-violet-600" />
          </div>
          <h4 className="font-semibold text-stone-900">How this affects your services</h4>
        </div>
        <p className="text-sm text-stone-600 leading-relaxed">
          On the next screen, you'll see your list of billable services. Each one is tagged
          with when it's available:
        </p>
        <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-stone-600">
          <li>
            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-1.5 py-0.5 rounded">
              Pre-Trial
            </span>{' '}
            — Only available during the prep phase
          </li>
          <li>
            <span className="inline-block bg-purple-100 text-purple-700 text-xs font-medium px-1.5 py-0.5 rounded">
              In-Trial
            </span>{' '}
            — Only available during trial days
          </li>
          <li>
            Some services will have both tagged, and are available in both phases. Graphics is
            a good example of one of these services.
          </li>
        </ul>
        <p className="mt-2 text-sm text-stone-600">
          Services marked with{' '}
          <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-1.5 py-0.5 rounded">
            Daily Min
          </span>{' '}
          will use daily minimum billing during trial. Everything else bills hourly.
        </p>
      </Card>

      <WizardNav />
    </div>
  );
}
