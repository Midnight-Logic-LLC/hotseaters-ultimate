/**
 * wizard-nav.tsx — Back / Next / Skip / Finish footer used by all steps.
 */
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';

interface Props {
  /** Override default `goNext`; e.g. final step calls `finalize`. */
  onNext?: () => void | Promise<void>;
  /** When true, hides the Skip button. Default: shown when an `onSkip` is set. */
  onSkip?: () => void;
  /** Disable Next (e.g. validation failed). */
  nextDisabled?: boolean;
  /** Label override for Next (e.g. "Finish & Launch"). */
  nextLabel?: string;
}

export function WizardNav({ onNext, onSkip, nextDisabled, nextLabel }: Props) {
  const wiz = useOnboardingWizard();
  return (
    <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-stone-100">
      <Button
        variant="outline"
        onClick={wiz.goBack}
        disabled={wiz.isFirstStep}
        className="gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      <div className="flex items-center gap-3">
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-sm text-stone-500 hover:text-stone-700"
          >
            Skip
          </button>
        )}
        <Button
          onClick={onNext ?? wiz.goNext}
          disabled={nextDisabled}
          className="gap-1.5"
          style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
        >
          {nextLabel ?? (wiz.isLastStep ? 'Finish & Launch' : 'Next')}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
