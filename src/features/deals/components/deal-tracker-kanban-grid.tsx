/**
 * deal-tracker-kanban-grid.tsx — unified 3-view-mode Kanban grid, adapted from
 * HotSeatersMVP/src/components/sales/DealTrackerKanbanGrid.jsx.
 *
 * ── DnD library adaptation (RULE 0) ───────────────────────────────────────
 * The bible drives drag-and-drop with `@hello-pangea/dnd` and choreographs
 * cross-column view-mode transitions with a framer-motion "ghost + absolute
 * overlay" system. `@hello-pangea/dnd` is NOT a port dependency and must not
 * be added. This port reproduces the user-visible behaviour with `@dnd-kit`
 * (already a port dep):
 *   • sales_stage view: each deal card is a `useDraggable`; each stage column
 *     body is a `useDroppable`. Dropping a card over a different stage column
 *     calls `onDragEnd(dealId, destStageId)` — the same effect the bible's
 *     `handleDragEnd` produced (move the deal to that stage).
 *   • next_step / trial_date views: cards are bucketed by date thresholds and
 *     rendered statically (no DnD — the bible disables DnD outside sales_stage).
 *   • mobile/vertical: columns stack; collapse toggles per column.
 * The framer-motion ghost/overlay transition is a presentation nicety, not a
 * capability — it is intentionally not reproduced (cards simply re-bucket).
 *
 * HotSeatersMVP is the bible.
 */

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { Trial } from '@/features/trials/entities';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import {
  bucketItemsIntoColumns,
  columnsForViewMode,
  type DealViewMode,
  type KanbanColumn,
  type KanbanItem,
} from '@/features/deals/business-rules/deal-kanban-buckets';
import type { PipelineStage } from '@/shared/db/lookups-selectors';
import { DealTrackerColumnFrame } from './deal-tracker-column-frame';
import { OpportunityCard } from './opportunity-card';
import type {
  AttorneyRow,
  DealRow,
  SalesActivityRow,
  SharedCardProps,
} from './deal-card-types';

// Internal kanban item carrying the full payload alongside the bucketing keys.
interface GridItem extends KanbanItem {
  __deal?: DealRow;
  __attorney?: AttorneyRow | null;
}

interface DealTrackerKanbanGridProps {
  viewMode: DealViewMode;
  deals: DealRow[];
  prospects?: AttorneyRow[];
  pipelineStages: PipelineStage[];
  salesActivities: SalesActivityRow[];
  sharedCardProps: SharedCardProps;
  /** sales_stage-only: move a deal to a new pipeline stage. */
  onDragEnd?: (dealId: string, destStageId: string) => void;
}

function earliestPendingFollowUp(
  activities: readonly SalesActivityRow[],
  predicate: (a: SalesActivityRow) => boolean,
): string | null {
  const dates = activities
    .filter((a) => predicate(a) && a.status === 'pending' && a.scheduled_date)
    .map((a) => a.scheduled_date as string)
    .sort((a, b) => a.localeCompare(b));
  return dates[0] ?? null;
}

// ── Draggable card wrapper (sales_stage only) ────────────────────────────────
function DraggableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab',
        touchAction: 'none',
      }}
    >
      {children}
    </div>
  );
}

// ── Droppable column body ────────────────────────────────────────────────────
function DroppableColumn({
  column,
  count,
  isCollapsed,
  onToggle,
  children,
}: {
  column: KanbanColumn;
  count: number;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const dropId = column.stageId ?? column.key;
  const { setNodeRef, isOver } = useDroppable({ id: dropId });
  return (
    <DealTrackerColumnFrame
      column={column}
      count={count}
      isCollapsed={isCollapsed}
      onToggle={onToggle}
      bodyRef={setNodeRef}
      isDropTarget={isOver}
    >
      {children}
    </DealTrackerColumnFrame>
  );
}

export function DealTrackerKanbanGrid({
  viewMode,
  deals,
  prospects = [],
  pipelineStages,
  salesActivities,
  sharedCardProps,
  onDragEnd,
}: DealTrackerKanbanGridProps) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const columns = useMemo(
    () => columnsForViewMode(viewMode, pipelineStages),
    [viewMode, pipelineStages],
  );

  // Annotate deals + (next_step only) contact-only prospects.
  const items = useMemo<GridItem[]>(() => {
    const annotatedDeals: GridItem[] = deals.map((d) => ({
      id: d.id,
      __kind: 'deal',
      __nextFollowUpDate: earliestPendingFollowUp(salesActivities, (a) => a.trial_id === d.id),
      daysUntilTrial: d.daysUntilTrial,
      pipeline_stage_id: d.pipeline_stage_id,
      __deal: d,
    }));

    if (viewMode !== 'next_step') return annotatedDeals;

    const annotatedProspects: GridItem[] = prospects.map((a) => ({
      id: `prospect-${a.id}`,
      __kind: 'prospect',
      __nextFollowUpDate: earliestPendingFollowUp(
        salesActivities,
        (sa) => sa.attorney_id === a.id && !sa.trial_id,
      ),
      __attorney: a,
    }));
    return [...annotatedDeals, ...annotatedProspects];
  }, [deals, prospects, salesActivities, viewMode]);

  const columnItems = useMemo(
    () => bucketItemsIntoColumns(items, columns, viewMode),
    [items, columns, viewMode],
  );

  const toggleColumn = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderCardInner = (item: GridItem) =>
    item.__kind === 'prospect' ? (
      <OpportunityCard attorney={item.__attorney ?? null} disableInitialAnimation {...sharedCardProps} />
    ) : (
      <OpportunityCard deal={item.__deal ?? null} disableInitialAnimation {...sharedCardProps} />
    );

  const isDnD = viewMode === 'sales_stage' && typeof onDragEnd === 'function';

  // Map a card id → its destination stage on drop.
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    if (!isDnD || !onDragEnd) return;
    const { active, over } = event;
    if (!over) return;
    const dealId = String(active.id);
    if (dealId.startsWith('prospect-')) return; // prospects aren't draggable
    const destStageId = String(over.id);
    // over.id is the column's stageId (set via droppable id). Only fire when a
    // real stage is the target and it differs from the current stage.
    const targetIsStage = columns.some((c) => c.stageId === destStageId);
    if (!targetIsStage) return;
    const current = deals.find((d) => d.id === dealId);
    if (current && current.pipeline_stage_id === destStageId) return;
    onDragEnd(dealId, destStageId);
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const activeItem = activeId
    ? items.find((i) => i.id === activeId) ?? null
    : null;

  const containerClass = isMobile
    ? 'flex flex-col pb-4 w-full'
    : 'flex flex-row pb-4 overflow-x-auto w-full';
  const columnStyle = isMobile
    ? { width: '100%' as const }
    : { flex: '1 1 0', minWidth: '240px' as const };

  // ── Non-DnD render (next_step / trial_date, and any mobile view) ──────────
  if (!isDnD) {
    return (
      <div className={containerClass} style={{ gap: 'var(--theme-card-gap)' }}>
        {columns.map((col) => {
          const colItems = (columnItems[col.key] ?? []) as GridItem[];
          return (
            <div key={col.key} style={columnStyle}>
              <DealTrackerColumnFrame
                column={col}
                count={colItems.length}
                isCollapsed={!!collapsed[col.key]}
                onToggle={() => toggleColumn(col.key)}
              >
                {colItems.map((item) => (
                  <div key={item.id} id={item.__kind === 'prospect' ? `flash-target-attorney-${item.__attorney?.id}` : `flash-target-${item.id}`}>
                    {renderCardInner(item)}
                  </div>
                ))}
              </DealTrackerColumnFrame>
            </div>
          );
        })}
      </div>
    );
  }

  // ── DnD render (sales_stage, desktop + mobile) ────────────────────────────
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className={containerClass} style={{ gap: 'var(--theme-card-gap)' }}>
        {columns.map((col) => {
          const colItems = (columnItems[col.key] ?? []) as GridItem[];
          return (
            <div key={col.key} style={columnStyle}>
              <DroppableColumn
                column={col}
                count={colItems.length}
                isCollapsed={!!collapsed[col.key]}
                onToggle={() => toggleColumn(col.key)}
              >
                {colItems.map((item) =>
                  item.__kind === 'prospect' ? (
                    <div key={item.id} id={`flash-target-attorney-${item.__attorney?.id}`}>
                      {renderCardInner(item)}
                    </div>
                  ) : (
                    <DraggableCard key={item.id} id={item.id}>
                      <div id={`flash-target-${item.id}`}>{renderCardInner(item)}</div>
                    </DraggableCard>
                  ),
                )}
              </DroppableColumn>
            </div>
          );
        })}
      </div>
      <DragOverlay>
        {activeItem ? <div style={{ width: '260px' }}>{renderCardInner(activeItem)}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}

export type { Trial };
