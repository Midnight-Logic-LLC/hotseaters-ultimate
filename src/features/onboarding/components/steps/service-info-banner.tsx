/**
 * service-info-banner.tsx — explainer + badge legend stack shown above the
 * services table in StepServices.
 *
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepServices.jsx
 *   - `ExplainerBox` (lines 10-17)
 *   - `BadgeLegend`  (lines 19-39)
 *   - bottom Travel explainer (lines 393-396)
 *
 * Copy is reproduced verbatim per RULE 0 (pixel parity) and RULE J (preserve
 * every business rule).
 */
import { Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ReactNode } from 'react';

function ExplainerBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-4">
      <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
      <div className="text-xs text-indigo-700 leading-relaxed">{children}</div>
    </div>
  );
}

export function ServicesIntroExplainer() {
  return (
    <ExplainerBox>
      <p className="font-medium mb-1">How services work in HotSeaters</p>
      <p>
        Each service represents a type of work you bill clients for. Services are assigned to jobs
        (deals/trials) and used to build proposals, track time, and generate invoices. The{' '}
        <strong>rate</strong> is the default hourly or daily charge — it can be adjusted per client
        or per trial if needed.
      </p>
    </ExplainerBox>
  );
}

export function TravelExplainer() {
  return (
    <ExplainerBox>
      <p className="font-medium mb-1">Travel Time is optional</p>
      <p>
        You're not required to use the built-in Travel Time service. You could create your own
        travel line item instead. However, the built-in Travel Time integrates with the Deal
        Wizard and Timeline — it automatically calculates travel billing based on the percentage
        you set here. Use <strong>100%</strong> to bill your full rate for travel, or{' '}
        <strong>0%</strong> to track travel without billing for it.
      </p>
    </ExplainerBox>
  );
}

export function ServiceBadgeLegend() {
  return (
    <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 mb-4">
      <p className="text-xs font-semibold text-stone-600 mb-2">What the labels mean:</p>
      <div className="space-y-1.5 text-xs text-stone-600">
        <div className="flex items-start gap-2">
          <Badge className="bg-blue-50 text-blue-600 text-xs px-1.5 py-0 flex-shrink-0 mt-0.5">
            Pre-Trial
          </Badge>
          <span>
            Available before the trial begins (e.g. depo editing, graphics, courtroom survey).
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Badge className="bg-purple-50 text-purple-600 text-xs px-1.5 py-0 flex-shrink-0 mt-0.5">
            In-Trial
          </Badge>
          <span>Available during the actual trial dates (e.g. Hot Seating!).</span>
        </div>
        <div className="flex items-start gap-2">
          <Badge className="bg-green-50 text-green-600 text-xs px-1.5 py-0 flex-shrink-0 mt-0.5">
            Daily Min
          </Badge>
          <span>
            On trial days, this service bills a minimum number of hours per day (set in Billing
            settings), even if actual hours are fewer.
          </span>
        </div>
      </div>
    </div>
  );
}
