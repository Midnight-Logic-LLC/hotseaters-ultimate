/**
 * tier-row.tsx — single sortable row in a client- or consultant-tier list.
 *
 * Mirrors `pipeline-stage-row.tsx` (change-203): keyboard-accessible drag
 * handle (`GripVertical`), name input, multiplier input (clamped >= 0),
 * helper tooltip explaining the multiplier semantics, and delete button.
 *
 * Drag wiring lives in the parent via `<DndContext>` + `<SortableContext>`;
 * this row only consumes `useSortable` with its stable `id`.
 *
 * BIBLE: `HotSeatersMVP/src/components/onboarding/EditableTierList.jsx`.
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Info, Trash2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/shared/lib/cn';

interface TierRowProps {
  id: string;
  name: string;
  multiplier: number;
  onNameChange: (name: string) => void;
  onMultiplierChange: (multiplier: number) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function TierRow({
  id,
  name,
  multiplier,
  onNameChange,
  onMultiplierChange,
  onDelete,
  canDelete,
}: TierRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-2 py-2',
        isDragging && 'opacity-70 shadow-lg',
      )}
    >
      {/* Drag handle — keyboard activates via Space (dnd-kit default) + arrows. */}
      <button
        type="button"
        aria-label={`Drag tier ${name}`}
        className="cursor-grab touch-none text-stone-400 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <Input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        aria-label="Tier name"
        className="h-8 flex-1 text-sm"
      />

      <div className="flex items-center gap-1">
        <Input
          type="number"
          min="0"
          step="0.05"
          value={multiplier}
          onChange={(e) => {
            const raw = parseFloat(e.target.value);
            const next = Number.isFinite(raw) ? Math.max(0, raw) : 0;
            onMultiplierChange(next);
          }}
          aria-label={`Multiplier for ${name}`}
          className="h-8 w-20 text-sm font-mono"
        />
        <HoverCard>
          <HoverCardTrigger
            render={
              <button
                type="button"
                aria-label="What does multiplier do?"
                className="text-stone-400 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            }
          />
          <HoverCardContent className="text-xs leading-relaxed w-64">
            Multiplier &gt; 1 = premium, &lt; 1 = discount. Applied to service
            base rates when creating deals. E.g. $175/hr × 0.9 = $157.50/hr.
          </HoverCardContent>
        </HoverCard>
      </div>

      <button
        type="button"
        onClick={onDelete}
        disabled={!canDelete}
        aria-label={`Delete tier ${name}`}
        className="p-1 text-stone-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
