/**
 * pipeline-stage-row.tsx — single sortable row in the pipeline stage list.
 *
 * Drag handle + color swatch picker + name input + revenue-probability
 * slider + auto_move_trigger select + delete button. Drag via @dnd-kit
 * `useSortable` with keyboard sensor wired upstream (Tab → Space → Arrow).
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Slider } from '@/components/ui/slider';
import { ColorSwatchPicker } from '@/shared/ui/color-swatch-picker';
import { cn } from '@/shared/lib/cn';
import type {
  PipelineAutoMoveTrigger,
  PipelineStageDraft,
} from '@/features/onboarding/stores/onboarding-store';

interface PipelineStageRowProps {
  stage: PipelineStageDraft;
  onPatch: (patch: Partial<PipelineStageDraft>) => void;
  onDelete: () => void;
  canDelete: boolean;
}

/** Bible-aligned labels for the four enum values. */
const TRIGGER_OPTIONS: ReadonlyArray<{ value: PipelineAutoMoveTrigger; label: string }> = [
  { value: 'none', label: 'No automation' },
  { value: 'signed_deal', label: 'When deal signed' },
  { value: 'invoice_paid', label: 'When invoice paid' },
  { value: 'trial_completed', label: 'When trial completed' },
];

export function PipelineStageRow({
  stage,
  onPatch,
  onDelete,
  canDelete,
}: PipelineStageRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const pct = Math.round((stage.revenue_probability ?? 0) * 100);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2.5',
        isDragging && 'opacity-70 shadow-lg',
      )}
    >
      {/* Drag handle — keyboard activates via Space (dnd-kit default). */}
      <button
        type="button"
        aria-label={`Reorder ${stage.name}`}
        className="cursor-grab touch-none text-stone-400 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <ColorSwatchPicker
        value={stage.color}
        onChange={(hex) => onPatch({ color: hex })}
        aria-label={`Color for ${stage.name}`}
      />

      <Input
        value={stage.name}
        onChange={(e) => onPatch({ name: e.target.value })}
        className="h-8 max-w-[140px] text-sm"
        aria-label="Stage name"
      />

      <div className="flex flex-1 items-center gap-2">
        <Slider
          value={[pct]}
          min={0}
          max={100}
          step={1}
          onValueChange={(v) => {
            const next = Array.isArray(v) ? (v[0] ?? 0) : v;
            onPatch({ revenue_probability: next / 100 });
          }}
          aria-label={`Revenue probability for ${stage.name}`}
          className="flex-1"
        />
        <span className="w-10 text-right font-mono text-xs text-stone-500">{pct}%</span>
      </div>

      <NativeSelect
        value={stage.auto_move_trigger}
        onChange={(e) =>
          onPatch({ auto_move_trigger: e.target.value as PipelineAutoMoveTrigger })
        }
        className="h-8 max-w-[170px] text-xs"
        aria-label={`Auto-move trigger for ${stage.name}`}
      >
        {TRIGGER_OPTIONS.map((opt) => (
          <NativeSelectOption key={opt.value} value={opt.value}>
            {opt.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      <button
        type="button"
        onClick={onDelete}
        disabled={!canDelete}
        aria-label={`Delete ${stage.name}`}
        className="text-stone-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
