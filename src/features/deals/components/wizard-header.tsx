/**
 * wizard-header.tsx — the deal-wizard card header: title + clickable step pips
 * with the progress connectors. Extracted from deal-wizard.tsx to keep that
 * component under the RULE A 800-line limit. Behaviour is identical to the
 * inline header it replaced. HotSeatersMVP is the bible.
 */

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';

interface WizardStep {
  number: number;
  title: string;
}

interface WizardHeaderProps {
  title: string;
  steps: WizardStep[];
  currentStep: number;
  isEditing: boolean;
  busy: boolean;
  onCancel: () => void;
  onStepClick: (step: number) => void;
}

export function WizardHeader({
  title,
  steps,
  currentStep,
  isEditing,
  busy,
  onCancel,
  onStepClick,
}: WizardHeaderProps) {
  return (
    <CardHeader className="border-b border-stone-100">
      <div className="flex items-center justify-between mb-4">
        <CardTitle className="text-xl">{title}</CardTitle>
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => (
          <div key={step.number} className="contents">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => isEditing && onStepClick(step.number)}
                disabled={!isEditing}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-all ${
                  currentStep > step.number
                    ? 'bg-green-600 text-white'
                    : currentStep === step.number
                      ? 'text-white'
                      : 'bg-stone-200 text-stone-600'
                } ${isEditing ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                style={
                  currentStep === step.number
                    ? { backgroundColor: 'var(--theme-brand-operations)' }
                    : {}
                }
              >
                {currentStep > step.number ? <CheckCircle2 className="w-5 h-5" /> : step.number}
              </button>
              <span
                className={`text-sm font-medium ${
                  currentStep === step.number ? 'text-stone-900' : 'text-stone-500'
                }`}
              >
                {step.title}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  currentStep > step.number ? 'bg-green-600' : 'bg-stone-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </CardHeader>
  );
}
