/**
 * wizard-step3-pre-trial.tsx — step 3 (Pre-Trial Services) panel of DealWizard.
 *
 * Extracted verbatim from deal-wizard.tsx (RULE A file-size split), mirroring
 * wizard-step4-in-trial.tsx. Renders the pre-trial `WizardServicesGrid` with the
 * running "Pre-Trial Subtotal" footer. Behaviour and render are identical to the
 * inline original; all state lives in the parent wizard and is threaded through
 * props.
 *
 * HotSeatersMVP is the bible.
 */

import {
  WizardServicesGrid,
  type WizardServicesGridProps,
} from './wizard-services-grid';

/** The pre-trial variant of the grid props, minus the footer this panel owns. */
type PreTrialGridProps = Omit<
  Extract<WizardServicesGridProps, { phase: 'pre-trial' }>,
  'phase' | 'footer'
>;

interface WizardStep3PreTrialProps extends PreTrialGridProps {
  preTrialSubtotal: number;
}

export function WizardStep3PreTrial({
  preTrialSubtotal,
  ...gridProps
}: WizardStep3PreTrialProps) {
  return (
    <WizardServicesGrid
      phase="pre-trial"
      {...gridProps}
      footer={
        gridProps.preTrialServices.length > 0 ? (
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-stone-900">Pre-Trial Subtotal:</span>
              <span className="text-green-600 text-lg">${preTrialSubtotal.toLocaleString()}</span>
            </div>
          </div>
        ) : null
      }
    />
  );
}
