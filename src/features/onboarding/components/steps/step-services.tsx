/**
 * step-services.tsx — services catalog. Snapshot-seeded; editable rows.
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepServices.jsx (402 LOC).
 * This functional port shows the list with inline editing. Visual parity
 * polish (drag-to-reorder, category accordion) lands in Wave B.2.
 */
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import { WizardNav } from '../wizard-nav';
import type { ServiceDraft } from '@/features/onboarding/stores/onboarding-store';

export function StepServices() {
  const wiz = useOnboardingWizard();

  function updateService(id: string, patch: Partial<ServiceDraft>) {
    wiz.setServices(wiz.services.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function deleteService(id: string) {
    wiz.setServices(wiz.services.filter((s) => s.id !== id));
  }
  function addService(categoryKey: string) {
    const id = `svc-${Date.now()}`;
    wiz.setServices([
      ...wiz.services,
      {
        id,
        name: 'New service',
        category_key: categoryKey,
        base_rate: 175,
        rate_type: 'hourly',
        has_daily_minimum: false,
        service_availability: 'both',
        is_default: false,
        is_active: true,
        order: wiz.services.filter((s) => s.category_key === categoryKey).length,
      },
    ]);
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-1">Your services</h3>
      <p className="text-sm text-stone-500 mb-6">
        These appear on proposals and time entries. Defaults are pre-filled — edit, add, or remove freely.
      </p>
      <div className="space-y-6">
        {wiz.serviceCategories.map((cat) => (
          <div key={cat.id} className="border border-stone-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-stone-900">{cat.name}</h4>
              <Button size="sm" variant="outline" onClick={() => addService(cat.id)}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {wiz.services
                .filter((s) => s.category_key === cat.id)
                .map((s) => (
                  <div key={s.id} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_100px_32px] gap-2 items-center">
                    <Input value={s.name} onChange={(e) => updateService(s.id, { name: e.target.value })} />
                    <Input
                      type="number"
                      step="0.01"
                      value={s.base_rate}
                      onChange={(e) => updateService(s.id, { base_rate: parseFloat(e.target.value) || 0 })}
                    />
                    <select
                      value={s.rate_type}
                      onChange={(e) => updateService(s.id, { rate_type: e.target.value })}
                      className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm bg-white"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="flat">Flat</option>
                      <option value="per_unit">Per Unit</option>
                    </select>
                    <button
                      onClick={() => deleteService(s.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600"
                      aria-label="Delete service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      <WizardNav onSkip={() => wiz.goNext()} />
    </div>
  );
}
