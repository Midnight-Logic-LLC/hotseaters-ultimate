/**
 * step-tiers.tsx — client tiers + consultant tiers (rate multipliers).
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepTiers.jsx
 */
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import { WizardNav } from '../wizard-nav';

export function StepTiers() {
  const wiz = useOnboardingWizard();

  function addClientTier() {
    wiz.setClientTiers([...wiz.clientTiers, { id: `ct-${Date.now()}`, name: 'New tier', multiplier: 1.0 }]);
  }
  function updateClientTier(id: string, patch: { name?: string; multiplier?: number }) {
    wiz.setClientTiers(wiz.clientTiers.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
  function deleteClientTier(id: string) {
    wiz.setClientTiers(wiz.clientTiers.filter((t) => t.id !== id));
  }

  function addConsultantTier() {
    wiz.setConsultantTiers([
      ...wiz.consultantTiers,
      { id: `cot-${Date.now()}`, key: `tier_${Date.now()}`, name: 'New tier', multiplier: 1.0, is_active: true },
    ]);
  }
  function updateConsultantTier(id: string, patch: { name?: string; multiplier?: number }) {
    wiz.setConsultantTiers(wiz.consultantTiers.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
  function deleteConsultantTier(id: string) {
    wiz.setConsultantTiers(wiz.consultantTiers.filter((t) => t.id !== id));
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-1">Rate tiers</h3>
      <p className="text-sm text-stone-500 mb-6">
        Multipliers applied to service base rates per client or consultant. Default is 1.0.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="border border-stone-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-stone-900">Client tiers</h4>
            <Button size="sm" variant="outline" onClick={addClientTier}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {wiz.clientTiers.map((t) => (
              <div key={t.id} className="grid grid-cols-[1fr_100px_32px] gap-2 items-center">
                <Input value={t.name} onChange={(e) => updateClientTier(t.id, { name: e.target.value })} />
                <Input
                  type="number"
                  step="0.01"
                  value={t.multiplier}
                  onChange={(e) => updateClientTier(t.id, { multiplier: parseFloat(e.target.value) || 0 })}
                />
                <button onClick={() => deleteClientTier(t.id)} className="p-1.5 text-stone-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="border border-stone-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-stone-900">Consultant tiers</h4>
            <Button size="sm" variant="outline" onClick={addConsultantTier}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {wiz.consultantTiers.map((t) => (
              <div key={t.id} className="grid grid-cols-[1fr_100px_32px] gap-2 items-center">
                <Input value={t.name} onChange={(e) => updateConsultantTier(t.id, { name: e.target.value })} />
                <Input
                  type="number"
                  step="0.01"
                  value={t.multiplier}
                  onChange={(e) => updateConsultantTier(t.id, { multiplier: parseFloat(e.target.value) || 0 })}
                />
                <button onClick={() => deleteConsultantTier(t.id)} className="p-1.5 text-stone-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
      <WizardNav onSkip={() => wiz.goNext()} />
    </div>
  );
}
