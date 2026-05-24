/**
 * step-pipeline-tiers.tsx — sales pipeline stages with drag-reorder,
 * per-stage color picker, revenue-probability slider, and auto-move
 * trigger select.
 *
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepPipelineTiers.jsx
 *
 * Extensions beyond the bible (per OpenSpec change-203):
 *  - Drag-reorder via @dnd-kit (pointer + keyboard sensors for a11y).
 *  - Per-stage color picker (12 brand swatches + custom hex).
 *  - `auto_move_trigger` enum select (signed_deal | invoice_paid |
 *    trial_completed | none) collapses the bible's per-event keys.
 *  - "Reset to defaults" restores bible's six default stages.
 */
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { GitBranch, Plus, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import {
  DEFAULT_PIPELINE_STAGES,
  type PipelineStageDraft,
} from '@/features/onboarding/stores/onboarding-store';
import { DEFAULT_BRAND_SWATCHES } from '@/shared/ui/color-swatch-picker';
import { WizardNav } from '../wizard-nav';
import { PipelineStageRow } from './pipeline-stage-row';

/** Pick the next unused brand color when appending a stage. */
function nextUnusedColor(stages: PipelineStageDraft[]): string {
  const used = new Set(stages.map((s) => s.color.toLowerCase()));
  return (
    DEFAULT_BRAND_SWATCHES.find((c) => !used.has(c.toLowerCase())) ??
    DEFAULT_BRAND_SWATCHES[0]!
  );
}

export function StepPipelineTiers() {
  const wiz = useOnboardingWizard();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Sorted view for the SortableContext. Source of truth = store.
  const sortedStages = useMemo(
    () => [...wiz.pipelineStages].sort((a, b) => a.display_order - b.display_order),
    [wiz.pipelineStages],
  );

  function patchStage(id: string, patch: Partial<PipelineStageDraft>) {
    wiz.setPipelineStages(
      wiz.pipelineStages.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }

  function deleteStage(id: string) {
    const next = wiz.pipelineStages
      .filter((s) => s.id !== id)
      .sort((a, b) => a.display_order - b.display_order)
      .map((s, i) => ({ ...s, display_order: i, order: i }));
    wiz.setPipelineStages(next);
  }

  function addStage() {
    const nextIdx = sortedStages.length;
    const newStage: PipelineStageDraft = {
      id: `stage-${Date.now()}`,
      name: `Stage ${nextIdx + 1}`,
      type: 'sales',
      color: nextUnusedColor(wiz.pipelineStages),
      order: nextIdx,
      display_order: nextIdx,
      revenue_probability: 0.5,
      auto_move_trigger: 'none',
      auto_move_on_document_sent_key: null,
      auto_move_on_document_signed_key: null,
      auto_move_on_earliest_task_start: false,
      auto_move_on_trial_start: false,
    };
    wiz.setPipelineStages([...wiz.pipelineStages, newStage]);
  }

  function resetToDefaults() {
    wiz.setPipelineStages(DEFAULT_PIPELINE_STAGES.map((s) => ({ ...s })));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedStages.findIndex((s) => s.id === active.id);
    const newIndex = sortedStages.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    // Recompute monotonic display_order 0..N-1 after the move.
    const reordered = arrayMove(sortedStages, oldIndex, newIndex).map((s, i) => ({
      ...s,
      display_order: i,
      order: i,
    }));
    // Preserve any stages not in sortedStages (defensive — should be empty).
    const reorderedIds = new Set(reordered.map((s) => s.id));
    const untouched = wiz.pipelineStages.filter((s) => !reorderedIds.has(s.id));
    wiz.setPipelineStages([...reordered, ...untouched]);
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="mb-1 flex items-center gap-2 text-xl font-bold text-stone-900">
            <GitBranch className="h-5 w-5 text-indigo-600" />
            Sales pipeline
          </h3>
          <p className="text-sm text-stone-500">
            Drag to reorder. Pick a color, set probability, and choose when
            deals auto-advance. These drive your CRM boards and forecasts.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetToDefaults}
          className="shrink-0 gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to defaults
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedStages.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sortedStages.map((stage) => (
              <PipelineStageRow
                key={stage.id}
                stage={stage}
                onPatch={(patch) => patchStage(stage.id, patch)}
                onDelete={() => deleteStage(stage.id)}
                canDelete={sortedStages.length > 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addStage}
        className="mt-3 gap-1.5"
      >
        <Plus className="h-4 w-4" />
        Add stage
      </Button>

      <WizardNav onSkip={() => wiz.goNext()} />
    </div>
  );
}
