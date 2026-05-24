/**
 * step-tiers.tsx — client tiers + consultant tiers (rate multipliers).
 *
 * Both lists are drag-reorderable via @dnd-kit with full keyboard a11y
 * (PointerSensor 4px activation + KeyboardSensor w/ sortableKeyboardCoordinates).
 * Each list is wrapped in its own `<DndContext>` + `<SortableContext>` so
 * dragging within one list never moves rows across the boundary. On drag
 * end, `display_order` is recomputed monotonically (0..N-1) and persisted
 * to the store.
 *
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepTiers.jsx
 */
import { Layers, Plus, Info } from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { Button } from '@/components/ui/button';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import type {
  ClientTierDraft,
  ConsultantTierDraft,
} from '@/features/onboarding/stores/onboarding-store';
import { WizardNav } from '../wizard-nav';
import { TierRow } from './tier-row';

/** Recompute monotonic display_order (0..N-1) and copy onto each row. */
function withMonotonicOrder<T extends { display_order: number }>(rows: T[]): T[] {
  return rows.map((r, i) => ({ ...r, display_order: i }));
}

export function StepTiers() {
  const wiz = useOnboardingWizard();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── client tiers ────────────────────────────────────────────────────────
  function addClientTier() {
    const next: ClientTierDraft = {
      id: `ct-${Date.now()}`,
      name: 'New tier',
      multiplier: 1.0,
      display_order: wiz.clientTiers.length,
    };
    wiz.setClientTiers([...wiz.clientTiers, next]);
  }
  function updateClientTier(id: string, patch: Partial<ClientTierDraft>) {
    wiz.setClientTiers(wiz.clientTiers.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
  function deleteClientTier(id: string) {
    wiz.setClientTiers(withMonotonicOrder(wiz.clientTiers.filter((t) => t.id !== id)));
  }
  function onClientDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = wiz.clientTiers.findIndex((t) => t.id === active.id);
    const to = wiz.clientTiers.findIndex((t) => t.id === over.id);
    if (from === -1 || to === -1) return;
    wiz.setClientTiers(withMonotonicOrder(arrayMove(wiz.clientTiers, from, to)));
  }

  // ── consultant tiers ────────────────────────────────────────────────────
  function addConsultantTier() {
    const ts = Date.now();
    const next: ConsultantTierDraft = {
      id: `cot-${ts}`,
      key: `tier_${ts}`,
      name: 'New tier',
      multiplier: 1.0,
      is_active: true,
      display_order: wiz.consultantTiers.length,
    };
    wiz.setConsultantTiers([...wiz.consultantTiers, next]);
  }
  function updateConsultantTier(id: string, patch: Partial<ConsultantTierDraft>) {
    wiz.setConsultantTiers(
      wiz.consultantTiers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }
  function deleteConsultantTier(id: string) {
    wiz.setConsultantTiers(
      withMonotonicOrder(wiz.consultantTiers.filter((t) => t.id !== id)),
    );
  }
  function onConsultantDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = wiz.consultantTiers.findIndex((t) => t.id === active.id);
    const to = wiz.consultantTiers.findIndex((t) => t.id === over.id);
    if (from === -1 || to === -1) return;
    wiz.setConsultantTiers(withMonotonicOrder(arrayMove(wiz.consultantTiers, from, to)));
  }

  return (
    <div>
      <div className="mb-6 flex items-start gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}
        >
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-stone-900">Pricing Tiers</h3>
          <p className="mt-1 text-sm text-stone-500">
            Set up rate multipliers for clients and team members. These adjust your base
            service rates when creating deals. Tiers are optional — if you don&apos;t need
            this level of complexity, just keep one Client Tier and one Team Member Tier,
            both set to 1.0×.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* ── Client Tiers ─────────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" style={{ color: '#D97706' }} />
              <div>
                <h4 className="font-semibold text-stone-900">Client Tiers</h4>
                <p className="text-xs text-stone-500">
                  Rate multipliers applied when creating deals
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={addClientTier}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onClientDragEnd}
          >
            <SortableContext
              items={wiz.clientTiers.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {wiz.clientTiers.map((t) => (
                  <TierRow
                    key={t.id}
                    id={t.id}
                    name={t.name}
                    multiplier={t.multiplier}
                    onNameChange={(name) => updateClientTier(t.id, { name })}
                    onMultiplierChange={(multiplier) =>
                      updateClientTier(t.id, { multiplier })
                    }
                    onDelete={() => deleteClientTier(t.id)}
                    canDelete={wiz.clientTiers.length > 1}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        {/* ── Team Member Tiers ────────────────────────────────────────── */}
        <section className="border-t border-stone-100 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" style={{ color: '#9333EA' }} />
              <div>
                <h4 className="font-semibold text-stone-900">Team Member Tiers</h4>
                <p className="text-xs text-stone-500">
                  Rate multipliers for consultant pricing
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={addConsultantTier}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onConsultantDragEnd}
          >
            <SortableContext
              items={wiz.consultantTiers.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {wiz.consultantTiers.map((t) => (
                  <TierRow
                    key={t.id}
                    id={t.id}
                    name={t.name}
                    multiplier={t.multiplier}
                    onNameChange={(name) => updateConsultantTier(t.id, { name })}
                    onMultiplierChange={(multiplier) =>
                      updateConsultantTier(t.id, { multiplier })
                    }
                    onDelete={() => deleteConsultantTier(t.id)}
                    canDelete={wiz.consultantTiers.length > 1}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        <div className="flex gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-indigo-400" />
          <p className="text-xs leading-relaxed text-indigo-700">
            Tier multipliers adjust your base service rates. For example, if a service
            costs $175/hr and a client is &quot;Premium&quot; (×0.9), the deal rate becomes
            $157.50/hr — a 10% discount. Team member tiers work the same way for
            consultant cost calculations.
          </p>
        </div>
      </div>

      <WizardNav onSkip={() => wiz.goNext()} />
    </div>
  );
}
