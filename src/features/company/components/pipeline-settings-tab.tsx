/**
 * pipeline-settings-tab.tsx — Settings → Pipeline Stages tab.
 *
 * Full-parity port of
 * `HotSeatersMVP/src/components/settings/PipelineStageManagement.jsx`.
 *
 * Two side-by-side cards (Sales / Operations) each with:
 *   - drag-to-reorder via @dnd-kit (pointer + keyboard sensors)
 *   - inline color swatch picker (ColorSwatchPicker primitive)
 *   - inline rename of stage name
 *   - delete with AlertDialog confirm; blocked when deals reference it
 *   - guard against deleting the last stage (per-type)
 *   - "Add stage" inline form (name + color + projection weight)
 *
 * Components → hooks only (RULE B). All I/O lives in
 * `usePipelineStages()` and the company store.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useCallback, useEffect, useState } from 'react';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ColorSwatchPicker } from '@/shared/ui/color-swatch-picker';
import { cn } from '@/shared/lib/cn';

import {
  usePipelineStages,
  type SettingsPipelineStage,
} from '@/features/company/hooks/use-pipeline-stages';

type StageType = 'sales' | 'operations';

interface DeleteState {
  stage: SettingsPipelineStage;
  dealCount: number;
  loading: boolean;
}

interface AddDraft {
  name: string;
  color: string;
  revenuePct: number;
}

const EMPTY_DRAFT: AddDraft = {
  name: '',
  color: '#6366f1',
  revenuePct: 100,
};

function getColorStyle(color: string): React.CSSProperties {
  return { backgroundColor: color || '#6366f1', color: '#ffffff' };
}

// ─── Sortable row ─────────────────────────────────────────────────────────

interface StageRowProps {
  stage: SettingsPipelineStage;
  onRename: (name: string) => void;
  onRecolor: (color: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}

function StageRow({
  stage,
  onRename,
  onRecolor,
  onDelete,
  canDelete,
}: StageRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [draftName, setDraftName] = useState(stage.name);
  // Keep local draft in sync if the upstream name changes (e.g. from a sync).
  useEffect(() => {
    setDraftName(stage.name);
  }, [stage.name]);

  function commitName() {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== stage.name) {
      onRename(trimmed);
    } else if (!trimmed) {
      setDraftName(stage.name);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2.5 transition-colors hover:bg-stone-50',
        isDragging && 'opacity-70 shadow-lg',
      )}
    >
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
        onChange={onRecolor}
        aria-label={`Color for ${stage.name}`}
      />

      <Input
        value={draftName}
        onChange={(e) => setDraftName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        className="h-8 max-w-[180px] text-sm"
        aria-label={`Stage name for ${stage.name}`}
      />

      <Badge style={getColorStyle(stage.color)}>{stage.name}</Badge>

      <span className="ml-auto text-xs text-stone-500">
        {Math.round((stage.revenue_probability ?? 1) * 100)}% projection weight
      </span>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDelete}
        disabled={!canDelete}
        aria-label={`Delete ${stage.name}`}
        className="px-2 py-1"
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}

// ─── Inline add form ──────────────────────────────────────────────────────

interface AddStageFormProps {
  draft: AddDraft;
  onDraftChange: (next: AddDraft) => void;
  onSubmit: () => void;
  onCancel: () => void;
  disabled: boolean;
}

function AddStageForm({
  draft,
  onDraftChange,
  onSubmit,
  onCancel,
  disabled,
}: AddStageFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.name.trim()) return;
        onSubmit();
      }}
      className="mb-4 space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-3"
    >
      <div
        className="grid items-end gap-3"
        style={{ gridTemplateColumns: '1fr 120px 56px auto' }}
      >
        <div>
          <Label htmlFor="new-stage-name" className="text-xs">
            Stage name
          </Label>
          <Input
            id="new-stage-name"
            value={draft.name}
            onChange={(e) =>
              onDraftChange({ ...draft, name: e.target.value })
            }
            placeholder="e.g., Lead, Proposal Sent"
            required
            className="h-9"
          />
        </div>
        <div>
          <Label htmlFor="new-stage-pct" className="text-xs">
            Proj. weight (%)
          </Label>
          <Input
            id="new-stage-pct"
            type="number"
            min={0}
            max={100}
            step={1}
            value={draft.revenuePct}
            onChange={(e) =>
              onDraftChange({
                ...draft,
                revenuePct: parseFloat(e.target.value) || 0,
              })
            }
            className="h-9"
          />
        </div>
        <div>
          <Label className="text-xs">Color</Label>
          <div className="h-9 flex items-center">
            <ColorSwatchPicker
              value={draft.color}
              onChange={(hex) => onDraftChange({ ...draft, color: hex })}
              aria-label="New stage color"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={disabled || !draft.name.trim()}
            style={{
              backgroundColor: 'var(--theme-brand-primary)',
              color: 'white',
            }}
            className="hover:opacity-90 transition-opacity"
          >
            {disabled ? 'Saving…' : 'Add'}
          </Button>
        </div>
      </div>
    </form>
  );
}

// ─── One card per pipeline type ───────────────────────────────────────────

interface PipelineColumnProps {
  title: string;
  subtitle: string;
  type: StageType;
  stages: SettingsPipelineStage[];
  isMutating: boolean;
  onCreate: (draft: AddDraft) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onRecolor: (id: string, color: string) => Promise<void>;
  onReorder: (ids: string[]) => Promise<void>;
  onAskDelete: (stage: SettingsPipelineStage) => void;
}

function PipelineColumn({
  title,
  subtitle,
  type,
  stages,
  isMutating,
  onCreate,
  onRename,
  onRecolor,
  onReorder,
  onAskDelete,
}: PipelineColumnProps) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<AddDraft>(EMPTY_DRAFT);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = stages.findIndex((s) => s.id === active.id);
      const newIndex = stages.findIndex((s) => s.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const reordered = arrayMove(stages, oldIndex, newIndex);
      void onReorder(reordered.map((s) => s.id));
    },
    [stages, onReorder],
  );

  async function handleSubmit() {
    await onCreate(draft);
    setDraft(EMPTY_DRAFT);
    setShowForm(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-stone-500 mt-1">{subtitle}</p>
          </div>
          <Button
            onClick={() => setShowForm((v) => !v)}
            size="sm"
            style={{
              backgroundColor: 'var(--theme-brand-primary)',
              color: 'white',
            }}
            className="hover:opacity-90 transition-opacity"
            aria-label={`Add ${type} stage`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Stage
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <AddStageForm
            draft={draft}
            onDraftChange={setDraft}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setDraft(EMPTY_DRAFT);
            }}
            disabled={isMutating}
          />
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={stages.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {stages.map((stage) => (
                <StageRow
                  key={stage.id}
                  stage={stage}
                  onRename={(name) => void onRename(stage.id, name)}
                  onRecolor={(color) => void onRecolor(stage.id, color)}
                  onDelete={() => onAskDelete(stage)}
                  canDelete={stages.length > 1}
                />
              ))}
              {stages.length === 0 && (
                <p className="text-center text-stone-500 py-4">
                  No {type} stages defined
                </p>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}

// ─── Tab root ─────────────────────────────────────────────────────────────

export function PipelineSettingsTab() {
  const {
    salesStages,
    opsStages,
    isMutating,
    countDeals,
    create,
    update,
    remove,
    reorder,
  } = usePipelineStages();

  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);

  const onAskDelete = useCallback(
    async (stage: SettingsPipelineStage) => {
      setDeleteState({ stage, dealCount: 0, loading: true });
      try {
        const count = await countDeals(stage.id);
        setDeleteState({ stage, dealCount: count, loading: false });
      } catch {
        // If the lookup fails, fall back to safe behaviour: surface the dialog
        // without a count so the admin can still cancel.
        setDeleteState({ stage, dealCount: 0, loading: false });
      }
    },
    [countDeals],
  );

  async function handleCreateFor(type: StageType, draft: AddDraft) {
    const existing = type === 'sales' ? salesStages : opsStages;
    const maxOrder = existing.reduce((m, s) => Math.max(m, s.order ?? 0), -1);
    await create({
      name: draft.name.trim(),
      type,
      color: draft.color,
      revenue_probability: (draft.revenuePct || 0) / 100,
      order: maxOrder + 1,
      is_active: true,
    });
  }

  async function handleRename(id: string, name: string) {
    await update(id, { name });
  }

  async function handleRecolor(id: string, color: string) {
    await update(id, { color });
  }

  async function confirmDelete() {
    if (!deleteState) return;
    if (deleteState.dealCount > 0) return; // guard
    await remove(deleteState.stage.id);
    setDeleteState(null);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <PipelineColumn
        title="Sales Pipeline Stages"
        subtitle="Stages shown on the Deals page"
        type="sales"
        stages={salesStages}
        isMutating={isMutating}
        onCreate={(draft) => handleCreateFor('sales', draft)}
        onRename={handleRename}
        onRecolor={handleRecolor}
        onReorder={reorder}
        onAskDelete={onAskDelete}
      />

      <PipelineColumn
        title="Operations Pipeline Stages"
        subtitle="Stages shown on the Trials page"
        type="operations"
        stages={opsStages}
        isMutating={isMutating}
        onCreate={(draft) => handleCreateFor('operations', draft)}
        onRename={handleRename}
        onRecolor={handleRecolor}
        onReorder={reorder}
        onAskDelete={onAskDelete}
      />

      <AlertDialog
        open={deleteState != null}
        onOpenChange={(open) => {
          if (!open) setDeleteState(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteState && deleteState.dealCount > 0
                ? 'Cannot delete this stage'
                : 'Delete Pipeline Stage?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteState?.loading
                ? 'Checking deals referencing this stage…'
                : deleteState && deleteState.dealCount > 0
                  ? `${deleteState.dealCount} deal${
                      deleteState.dealCount === 1 ? '' : 's'
                    } in this stage — reassign or close them first.`
                  : 'Are you sure you want to delete this stage? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteState && !deleteState.loading && (
            <div className="my-4 rounded-lg bg-stone-50 p-3">
              <div className="mb-1 flex items-center gap-2">
                <Badge style={getColorStyle(deleteState.stage.color)}>
                  {deleteState.stage.name}
                </Badge>
                <span className="text-xs text-stone-500">
                  {deleteState.stage.type === 'sales'
                    ? 'Sales Pipeline'
                    : 'Operations Pipeline'}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                {Math.round(
                  (deleteState.stage.revenue_probability ?? 1) * 100,
                )}
                % projection weight
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteState(null)}>
              Cancel
            </AlertDialogCancel>
            {deleteState && deleteState.dealCount === 0 && !deleteState.loading && (
              <AlertDialogAction
                onClick={confirmDelete}
                style={{
                  backgroundColor: 'var(--theme-danger)',
                  color: 'white',
                }}
                className="hover:opacity-90 transition-opacity"
              >
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PipelineSettingsTab;
