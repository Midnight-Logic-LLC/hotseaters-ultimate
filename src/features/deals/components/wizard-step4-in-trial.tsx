/**
 * wizard-step4-in-trial.tsx — step 4 (In-Trial Services) panel of DealWizard.
 *
 * Extracted verbatim from deal-wizard.tsx (RULE A file-size split). Renders the
 * in-trial `WizardServicesGrid` with the retainer / weekend-billing footer
 * (`WizardStep4Footer`) wired into its `footer` slot. Behaviour and render are
 * identical to the inline original; all state lives in the parent wizard and is
 * threaded through props.
 *
 * HotSeatersMVP is the bible.
 */

import type { Dispatch, SetStateAction } from 'react';

import {
  WizardServicesGrid,
  type WizardServicesGridProps,
} from './wizard-services-grid';
import { WizardStep4Footer } from './wizard-step4-footer';
import type { DealFormData } from './deal-wizard-types';

/** The in-trial variant of the grid props, minus the slots this panel owns. */
type InTrialGridProps = Omit<
  Extract<WizardServicesGridProps, { phase: 'in-trial' }>,
  'phase' | 'footer'
>;

interface Step4FooterControls {
  setDealData: Dispatch<SetStateAction<DealFormData>>;
  defaultDailyMinimumHours: number;
  billForWeekends: boolean;
  setBillForWeekends: (next: boolean) => void;
  trialDays: number;
  estimatedValue: number;
  retainerEnabled: boolean;
  setRetainerEnabled: (next: boolean) => void;
  recalcRetainer: () => void;
}

type WizardStep4InTrialProps = InTrialGridProps & Step4FooterControls;

export function WizardStep4InTrial({
  setDealData,
  defaultDailyMinimumHours,
  billForWeekends,
  setBillForWeekends,
  trialDays,
  estimatedValue,
  retainerEnabled,
  setRetainerEnabled,
  recalcRetainer,
  ...gridProps
}: WizardStep4InTrialProps) {
  return (
    <WizardServicesGrid
      phase="in-trial"
      {...gridProps}
      footer={
        <WizardStep4Footer
          dealData={gridProps.dealData}
          setDealData={setDealData}
          defaultDailyMinimumHours={defaultDailyMinimumHours}
          billForWeekends={billForWeekends}
          setBillForWeekends={setBillForWeekends}
          trialDays={trialDays}
          estimatedValue={estimatedValue}
          retainerEnabled={retainerEnabled}
          setRetainerEnabled={setRetainerEnabled}
          recalcRetainer={recalcRetainer}
        />
      }
    />
  );
}
