/**
 * deal-tracker-column-frame.tsx — visual chrome for a single Kanban column,
 * adapted from HotSeatersMVP/src/components/sales/DealTrackerColumnFrame.jsx.
 *
 * Adaptation (RULE 0): the bible's frame renders INVISIBLE "ghost" cards whose
 * bounding rects feed an absolutely-positioned framer-motion overlay so cards
 * can fly between columns on view-mode change. That ghost/overlay choreography
 * is a transition implementation detail of `@hello-pangea/dnd` + framer-motion
 * layout animation, NOT user-accessible behaviour. Our @dnd-kit port renders
 * real cards directly inside the column body (passed as `children`). The
 * RENDERED output — header, count badge, left color accent, collapse toggle,
 * subtitle, "None" empty state — matches the bible.
 *
 * HotSeatersMVP is the bible.
 */

import type { ReactNode, Ref } from 'react';
import { ChevronDown } from 'lucide-react';
import type { KanbanColumn } from '@/features/deals/business-rules/deal-kanban-buckets';

interface DealTrackerColumnFrameProps {
  column: KanbanColumn;
  count: number;
  isCollapsed: boolean;
  onToggle: () => void;
  /** Real cards live here (drop target on the body via @dnd-kit). */
  children?: ReactNode;
  /** Ref to the column body (set by the @dnd-kit droppable, when applicable). */
  bodyRef?: Ref<HTMLDivElement>;
  /** Visual feedback when a card is dragged over this column. */
  isDropTarget?: boolean;
}

export function DealTrackerColumnFrame({
  column,
  count,
  isCollapsed,
  onToggle,
  children,
  bodyRef,
  isDropTarget = false,
}: DealTrackerColumnFrameProps) {
  return (
    <div
      className="bg-white border relative overflow-hidden"
      style={{
        height: 'auto',
        borderRadius: 'var(--theme-card-radius)',
        boxShadow: 'var(--theme-card-shadow)',
        borderWidth: 'var(--theme-card-border)',
        backgroundColor: 'var(--theme-card-bg)',
        padding: 'var(--theme-card-padding)',
        borderLeft: `4px solid ${column.color}`,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="lg:pointer-events-none hover:opacity-70 transition-opacity text-left w-full"
        style={{ marginBottom: !isCollapsed ? 'var(--theme-card-gap)' : '0' }}
      >
        <div className="flex items-start" style={{ gap: 'var(--theme-element-gap)' }}>
          <ChevronDown
            className={`w-5 h-5 mt-0.5 transition-transform lg:hidden ${isCollapsed ? '-rotate-90' : ''}`}
            style={{ color: column.color }}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ gap: 'var(--theme-element-gap)', color: column.color }}>
                <h3 className="font-semibold" style={{ fontSize: 'var(--theme-text-card-title)' }}>
                  {column.label}
                </h3>
              </div>
              <span
                className="text-xs font-normal px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `color-mix(in srgb, ${column.color} 12%, white)`,
                  color: column.color,
                }}
              >
                {count}
              </span>
            </div>
            {column.subtitle && (
              <p className="mt-0.5" style={{ fontSize: 'var(--theme-text-caption)', color: column.color }}>
                {column.subtitle}
              </p>
            )}
          </div>
        </div>
      </button>

      <div className={isCollapsed ? 'hidden lg:block' : ''}>
        <div style={{ height: '1px', backgroundColor: column.color, marginBottom: 'var(--theme-element-gap)', opacity: 0.3 }} />
        <div
          ref={bodyRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--theme-element-gap)',
            minHeight: '60px',
            backgroundColor: isDropTarget ? `color-mix(in srgb, ${column.color} 8%, transparent)` : 'transparent',
            borderRadius: 'var(--theme-card-radius)',
            transition: 'background-color 120ms ease',
          }}
        >
          {count === 0 && (
            <p className="text-xs italic py-2" style={{ color: 'var(--theme-stone-400)' }}>
              None
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
