/**
 * step-pipeline-tiers.tsx — sales pipeline stages (Lead → … → Lost).
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepPipelineTiers.jsx
 */
import { Input } from '@/components/ui/input';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import { WizardNav } from '../wizard-nav';

export function StepPipelineTiers() {
  const wiz = useOnboardingWizard();

  function updateStage(name: string, patch: { revenue_probability?: number; color?: string }) {
    wiz.setPipelineStages(wiz.pipelineStages.map((s) => (s.name === name ? { ...s, ...patch } : s)));
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-1">Sales pipeline</h3>
      <p className="text-sm text-stone-500 mb-6">
        Stages a deal passes through. Revenue probability drives your forecast.
      </p>
      <div className="space-y-2">
        {wiz.pipelineStages.map((s) => (
          <div
            key={s.name}
            className="grid grid-cols-[16px_1fr_120px] gap-3 items-center border border-stone-200 rounded-lg p-3"
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: s.color, gridColumn: 1 }}
            />
            <div>
              <p className="font-medium text-stone-900">{s.name}</p>
              <p className="text-xs text-stone-500 capitalize">{s.type.replace(/_/g, ' ')}</p>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={s.revenue_probability}
                onChange={(e) => updateStage(s.name, { revenue_probability: parseFloat(e.target.value) || 0 })}
              />
              <span className="text-xs text-stone-400">prob.</span>
            </div>
          </div>
        ))}
      </div>
      <WizardNav onSkip={() => wiz.goNext()} />
    </div>
  );
}
