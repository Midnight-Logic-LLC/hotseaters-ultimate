/**
 * step-services.tsx — services catalog, bible-parity rewrite.
 *
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepServices.jsx (402 LOC).
 *
 * Layout:
 *   1. Title + subtitle (matches WizardStepLayout in bible).
 *   2. Intro explainer + badge legend.
 *   3. Per-category section with inline-editable name, hover-revealed
 *      delete (if empty), desktop table (>= lg) / mobile cards (< lg) of
 *      services, and add-service inline button.
 *   4. Add-category inline button at the end.
 *   5. Travel service block (% multiplier) + Travel explainer.
 *
 * All mutation flows through the onboarding hook (RULE B). New components
 * live in this folder as kebab-case files (RULE A).
 */
import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { Briefcase, Plus, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import type {
  ServiceCategoryDraft,
  ServiceDraft,
} from '@/features/onboarding/stores/onboarding-store';
import { WizardNav } from '../wizard-nav';
import { ServiceRowDesktop, ServiceCardMobile } from './service-row';
import {
  ServicesIntroExplainer,
  ServiceBadgeLegend,
  TravelExplainer,
} from './service-info-banner';

// ──────────────────────────────────────────────────────────────────────
// AutoWidthInput — measures content to size the underlying <Input>.
// BIBLE: lines 189-212.
// ──────────────────────────────────────────────────────────────────────
function AutoWidthInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  const measureRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(60);

  useEffect(() => {
    if (measureRef.current) {
      setWidth(Math.max(60, measureRef.current.scrollWidth + 12));
    }
  }, [value]);

  return (
    <div className="relative inline-block">
      <span
        ref={measureRef}
        className={`invisible absolute whitespace-pre ${className ?? ''}`}
        style={{ font: 'inherit' }}
      >
        {value || ' '}
      </span>
      <Input value={value} onChange={onChange} className={className} style={{ width: `${width}px` }} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// AddServiceInline — bible lines 154-187.
// ──────────────────────────────────────────────────────────────────────
function AddServiceInline({
  categoryId,
  onAdd,
}: {
  categoryId: string;
  onAdd: (categoryId: string, name: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(categoryId, name.trim());
    setName('');
    setAdding(false);
  };

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 mt-1.5 ml-2"
      >
        <Plus className="w-3.5 h-3.5" /> Add service
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-1.5 ml-2">
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAdd();
          if (e.key === 'Escape') setAdding(false);
        }}
        placeholder="Service name"
        className="h-7 text-sm w-48"
      />
      <Button size="sm" onClick={handleAdd} disabled={!name.trim()} className="h-7 px-2 text-xs">
        Add
      </Button>
      <button
        type="button"
        onClick={() => {
          setAdding(false);
          setName('');
        }}
        className="text-stone-400 hover:text-stone-600"
        aria-label="Cancel"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// AddCategoryInline — bible lines 214-247.
// ──────────────────────────────────────────────────────────────────────
function AddCategoryInline({ onAdd }: { onAdd: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim());
    setName('');
    setAdding(false);
  };

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 mt-2"
      >
        <Plus className="w-3.5 h-3.5" /> Add category
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAdd();
          if (e.key === 'Escape') setAdding(false);
        }}
        placeholder="Category name"
        className="h-7 text-sm w-48"
      />
      <Button size="sm" onClick={handleAdd} disabled={!name.trim()} className="h-7 px-2 text-xs">
        Add
      </Button>
      <button
        type="button"
        onClick={() => {
          setAdding(false);
          setName('');
        }}
        className="text-stone-400 hover:text-stone-600"
        aria-label="Cancel"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// StepServices — public component.
// ──────────────────────────────────────────────────────────────────────
export function StepServices() {
  const wiz = useOnboardingWizard();

  // ─── service mutators ─────────────────────────────────────────────
  function updateService(id: string, patch: Partial<ServiceDraft>) {
    wiz.setServices(wiz.services.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function deleteService(id: string) {
    wiz.setServices(wiz.services.filter((s) => s.id !== id));
  }
  function addService(categoryKey: string, name: string) {
    const id = `svc-${Date.now()}`;
    const order = wiz.services.filter((s) => s.category_key === categoryKey).length;
    wiz.setServices([
      ...wiz.services,
      {
        id,
        name,
        category_key: categoryKey,
        base_rate: 175,
        rate_type: 'hourly',
        has_daily_minimum: false,
        service_availability: 'both',
        is_default: false,
        is_active: true,
        travel_multiplier: null,
        order,
      },
    ]);
  }

  // ─── category mutators ────────────────────────────────────────────
  function updateCategory(id: string, patch: Partial<ServiceCategoryDraft>) {
    wiz.setServiceCategories(
      wiz.serviceCategories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
  }
  function deleteCategory(id: string) {
    wiz.setServiceCategories(wiz.serviceCategories.filter((c) => c.id !== id));
  }
  function addCategory(name: string) {
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '_') || `cat_${Date.now()}`;
    const order = wiz.serviceCategories.length;
    wiz.setServiceCategories([...wiz.serviceCategories, { id: key, name, order }]);
  }

  // ─── derivations (bible lines 250-263) ────────────────────────────
  const activeServices = wiz.services.filter((s) => s.is_active !== false && !s.is_default);
  const travelService = wiz.services.find((s) => s.is_default);

  const sortedCategories = wiz.serviceCategories
    .filter((c) => c.name !== 'Travel')
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const getServicesForCategory = (catId: string) =>
    activeServices
      .filter((s) => s.category_key === catId)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const canDeleteCategory = (catId: string) => getServicesForCategory(catId).length === 0;

  // ─── render ───────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#0891B2' }}
        >
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-stone-900">Services &amp; Rates</h3>
          <p className="text-sm text-stone-500 mt-1">
            These are the services your team provides to clients. Review the defaults and adjust
            names or rates to match your business.
          </p>
          <p className="text-xs text-stone-400 mt-1.5 italic">
            You can add, remove, or reorganize services later in Settings → Services &amp; Rates.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <ServicesIntroExplainer />
        <ServiceBadgeLegend />

        {/* ── Desktop table layout ── */}
        <div className="hidden lg:block">
          {sortedCategories.map((cat) => {
            const catServices = getServicesForCategory(cat.id);
            return (
              <div key={cat.id} className="mb-4">
                <div className="flex items-center gap-2 mb-2 group/cat">
                  <AutoWidthInput
                    value={cat.name}
                    onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                    className="h-6 text-xs font-semibold text-stone-500 uppercase tracking-wider border-transparent hover:border-stone-200 focus:border-indigo-300 bg-transparent px-1"
                  />
                  {canDeleteCategory(cat.id) && (
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat.id)}
                      className="opacity-0 group-hover/cat:opacity-100 transition-opacity p-0.5 text-stone-400 hover:text-red-500"
                      title="Delete empty category"
                      aria-label="Delete category"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {catServices.length > 0 && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-stone-400 uppercase tracking-wider">
                        <th className="text-left font-medium pb-1.5 pl-2">Service</th>
                        <th className="font-medium pb-1.5 w-28 text-right pr-4">Rate</th>
                        <th className="font-medium pb-1.5 w-20 text-center">
                          <span className="text-blue-500">Pre-Trial</span>
                        </th>
                        <th className="font-medium pb-1.5 w-20 text-center">
                          <span className="text-purple-500">In-Trial</span>
                        </th>
                        <th className="font-medium pb-1.5 w-20 text-center">
                          <span className="text-green-600">Daily Min</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {catServices.map((service) => (
                        <ServiceRowDesktop
                          key={service.id}
                          service={service}
                          onUpdate={updateService}
                          onDelete={deleteService}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
                {catServices.length === 0 && (
                  <p className="text-xs text-stone-400 italic ml-2 mb-1">No services yet</p>
                )}
                <AddServiceInline categoryId={cat.id} onAdd={addService} />
              </div>
            );
          })}
          <AddCategoryInline onAdd={addCategory} />
        </div>

        {/* ── Mobile card layout ── */}
        <div className="lg:hidden space-y-4">
          {sortedCategories.map((cat) => {
            const catServices = getServicesForCategory(cat.id);
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-2">
                  <AutoWidthInput
                    value={cat.name}
                    onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                    className="h-6 text-xs font-semibold text-stone-500 uppercase tracking-wider border-transparent hover:border-stone-200 focus:border-indigo-300 bg-transparent px-1"
                  />
                  {canDeleteCategory(cat.id) && (
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat.id)}
                      className="p-0.5 text-stone-400 hover:text-red-500"
                      title="Delete empty category"
                      aria-label="Delete category"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {catServices.map((service) => (
                    <ServiceCardMobile
                      key={service.id}
                      service={service}
                      onUpdate={updateService}
                      onDelete={deleteService}
                    />
                  ))}
                  {catServices.length === 0 && (
                    <p className="text-xs text-stone-400 italic ml-2">No services yet</p>
                  )}
                </div>
                <AddServiceInline categoryId={cat.id} onAdd={addService} />
              </div>
            );
          })}
          <AddCategoryInline onAdd={addCategory} />
        </div>

        {travelService && (
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Travel
            </p>
            <p className="text-xs text-stone-500 mb-2">
              Travel time is billed as a percentage of the associated service's rate. For example,
              if a consultant's service rate is $150/hr and travel is 50%, travel time bills at
              $75/hr.
            </p>
            <div className="border border-stone-200 rounded-lg p-3 bg-stone-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-800">{travelService.name}</p>
                  <p className="text-xs text-stone-500">% of the associated service rate</p>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={Math.round((travelService.travel_multiplier ?? 0.5) * 100)}
                    onChange={(e) =>
                      updateService(travelService.id, {
                        travel_multiplier: (parseFloat(e.target.value) || 50) / 100,
                      })
                    }
                    className="h-8 w-16 text-sm text-right"
                  />
                  <span className="text-xs text-stone-500">%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <TravelExplainer />
      </div>

      <WizardNav onSkip={() => wiz.goNext()} />
    </div>
  );
}
