/**
 * deal-kanban-buckets.ts — pure column configs + bucketers + sorters for the
 * Deal Tracker Kanban grid (port of the logic embedded in the bible's
 * `DealTrackerKanbanGrid.jsx`).
 *
 * The bible keeps three view modes:
 *   - next_step   — bucket by the next pending follow-up date
 *   - trial_date  — bucket by `daysUntilTrial`
 *   - sales_stage — bucket by `pipeline_stage_id` (one column per active sales stage)
 *
 * Extracted from the bible's component body so the bucketing thresholds and
 * sort orders are unit-tested in isolation (RULE J). No I/O, no React.
 *
 * HotSeatersMVP is the bible. Self-hosted Supabase only.
 */

import type { PipelineStage } from '@/shared/db/lookups-selectors';

export type DealViewMode = 'next_step' | 'trial_date' | 'sales_stage';

export interface KanbanColumn {
  key: string;
  label: string;
  subtitle: string | null;
  color: string;
  /** Only set for sales_stage columns — the backing pipeline stage id. */
  stageId?: string;
}

/** Annotated kanban item — either a deal (trial) or a contact-only prospect. */
export interface KanbanItem {
  id: string;
  __kind: 'deal' | 'prospect';
  /** Earliest pending follow-up date (yyyy-mm-dd) or null. */
  __nextFollowUpDate: string | null;
  /** Days until trial start; null for contact-only prospects. */
  daysUntilTrial?: number | null;
  /** Current pipeline stage (deals only). */
  pipeline_stage_id?: string | null | undefined;
  /** Attorney payload for contact-only prospects. */
  __attorney?: { id?: string | null } | null;
}

// ── Static column configs (bible DealTrackerKanbanGrid lines 34–46) ──────────

export const NEXT_STEP_COLUMNS: readonly KanbanColumn[] = [
  { key: 'needsAttention', label: 'Needs Attention', subtitle: 'Overdue or no next step', color: '#dc2626' },
  { key: 'dueSoon', label: 'Due Soon', subtitle: 'Within 7 days', color: 'var(--theme-warning, #d97706)' },
  { key: 'onDeck', label: 'On Deck', subtitle: '8 – 30 days out', color: 'var(--theme-brand-primary)' },
  { key: 'planned', label: 'Planned', subtitle: '30+ days out', color: 'var(--theme-stone-500)' },
];

export const TRIAL_DATE_COLUMNS: readonly KanbanColumn[] = [
  { key: 'urgent', label: '< 10 Days', subtitle: 'Action Required', color: '#dc2626' },
  { key: 'warning', label: '10 – 30 Days', subtitle: 'At Risk', color: 'var(--theme-warning, #d97706)' },
  { key: 'upcoming', label: '30 – 90 Days', subtitle: 'In Progress', color: 'var(--theme-brand-primary)' },
  { key: 'future', label: '90+ Days', subtitle: 'Planning Phase', color: 'var(--theme-stone-500)' },
];

/** Resolve a stage color string into a CSS value (bible getStageColor). */
export function stageColorToCss(stageColor: string | null | undefined): string {
  if (!stageColor) return 'var(--theme-stone-500)';
  if (stageColor.startsWith('#')) return stageColor;
  return `var(--theme-${stageColor})`;
}

/** Build the per-active-sales-stage columns (bible salesStageColumns). */
export function buildSalesStageColumns(
  pipelineStages: readonly PipelineStage[],
): KanbanColumn[] {
  return (pipelineStages || [])
    .filter((s) => s.type === 'sales' && s.is_active !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((s) => ({
      key: `stage-${s.id}`,
      label: s.name,
      subtitle: null,
      color: stageColorToCss(s.color),
      stageId: s.id,
    }));
}

/** Active column set for the current view mode. */
export function columnsForViewMode(
  viewMode: DealViewMode,
  pipelineStages: readonly PipelineStage[],
): KanbanColumn[] {
  if (viewMode === 'next_step') return [...NEXT_STEP_COLUMNS];
  if (viewMode === 'trial_date') return [...TRIAL_DATE_COLUMNS];
  return buildSalesStageColumns(pipelineStages);
}

// ── Bucketers (bible nextStepBucket / trialDateBucket) ───────────────────────

/**
 * next_step bucket. `today` is injectable for deterministic tests; defaults to
 * the runtime clock (matches the bible's `new Date()`).
 */
export function nextStepBucket(item: KanbanItem, today: Date = new Date()): string {
  const fu = item.__nextFollowUpDate;
  if (!fu) return 'needsAttention';
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(`${fu}T00:00:00`);
  const diff = Math.ceil((target.getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'needsAttention';
  if (diff <= 7) return 'dueSoon';
  if (diff <= 30) return 'onDeck';
  return 'planned';
}

/** trial_date bucket (bible trialDateBucket). */
export function trialDateBucket(item: KanbanItem): string {
  const d = item.daysUntilTrial;
  if (d == null || !Number.isFinite(d)) return 'future';
  if (d < 10) return 'urgent';
  if (d <= 30) return 'warning';
  if (d <= 90) return 'upcoming';
  return 'future';
}

/**
 * Partition annotated items into columns for the given view mode.
 * Mirrors the bible's `columnItems` build + per-column sort.
 */
export function bucketItemsIntoColumns(
  items: readonly KanbanItem[],
  columns: readonly KanbanColumn[],
  viewMode: DealViewMode,
  today: Date = new Date(),
): Record<string, KanbanItem[]> {
  const out: Record<string, KanbanItem[]> = {};
  columns.forEach((c) => {
    out[c.key] = [];
  });

  items.forEach((item) => {
    let key: string | undefined;
    if (viewMode === 'next_step') key = nextStepBucket(item, today);
    else if (viewMode === 'trial_date') key = trialDateBucket(item);
    else {
      const found = columns.find((c) => c.stageId === item.pipeline_stage_id);
      key = found ? found.key : columns[0]?.key;
    }
    if (key === undefined) return;
    const bucket = out[key];
    if (bucket) bucket.push(item);
  });

  // Sort each column (bible: next_step sorts by follow-up date then trial
  // proximity; other modes sort by trial proximity).
  Object.keys(out).forEach((k) => {
    const arr = out[k];
    if (!arr) return;
    if (viewMode === 'next_step') {
      arr.sort((a, b) => {
        const aFU = a.__nextFollowUpDate || '';
        const bFU = b.__nextFollowUpDate || '';
        if (aFU && bFU) return aFU.localeCompare(bFU);
        if (aFU) return -1;
        if (bFU) return 1;
        const aD = Number.isFinite(a.daysUntilTrial) ? (a.daysUntilTrial as number) : Infinity;
        const bD = Number.isFinite(b.daysUntilTrial) ? (b.daysUntilTrial as number) : Infinity;
        return aD - bD;
      });
    } else {
      arr.sort((a, b) => {
        const aD = Number.isFinite(a.daysUntilTrial) ? (a.daysUntilTrial as number) : Infinity;
        const bD = Number.isFinite(b.daysUntilTrial) ? (b.daysUntilTrial as number) : Infinity;
        return aD - bD;
      });
    }
  });

  return out;
}
