/**
 * kanban-column.tsx — Visual chrome for a billing approval Kanban column.
 *
 * Ported from HotSeatersMVP/src/components/kanban/KanbanColumnBase.jsx
 *
 * Renders: top-color border, icon, title, total badge, children body, loading overlay.
 */
import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface KanbanColumnProps {
  title: string;
  count: number;
  /** Formatted string shown in the header right (e.g. "$1,234.56") */
  total?: string;
  colorBorder: string;
  icon?: ReactNode;
  children?: ReactNode;
  isLoading?: boolean;
}

export function KanbanColumn({
  title,
  count,
  total,
  colorBorder,
  icon,
  children,
  isLoading = false,
}: KanbanColumnProps) {
  return (
    <div
      className="overflow-hidden"
      style={{
        borderTop: `4px solid ${colorBorder}`,
        borderRadius: 'var(--theme-card-radius)',
        boxShadow: 'var(--theme-card-shadow)',
        backgroundColor: 'var(--theme-card-bg)',
        border: '1px solid var(--theme-stone-200)',
        borderTopColor: colorBorder,
      }}
    >
      {/* Header */}
      <div
        className="border-b"
        style={{
          borderBottomColor: colorBorder,
          borderRadius: 'var(--theme-card-radius) var(--theme-card-radius) 0 0',
          padding: 'var(--theme-card-header-padding, 12px 16px)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center gap-3">
            {icon && (
              <span style={{ color: colorBorder, opacity: 0.25 }}>
                {icon}
              </span>
            )}
            <h3 className="font-semibold" style={{ color: 'var(--theme-stone-900)', fontSize: 'var(--theme-text-card-title)' }}>
              {title}
            </h3>
            <span
              className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--theme-stone-100)', color: 'var(--theme-stone-600)' }}
            >
              {count}
            </span>
          </div>
          {total !== undefined && (
            <div className="text-lg font-bold" style={{ color: colorBorder }}>
              {total}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          padding: 'var(--theme-card-padding)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--theme-element-gap)',
          minHeight: '500px',
          position: 'relative',
        }}
      >
        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(2px)',
              borderRadius: '0 0 var(--theme-card-radius) var(--theme-card-radius)',
              zIndex: 10,
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-stone-400)' }} />
              <p className="text-xs" style={{ color: 'var(--theme-stone-600)' }}>Loading...</p>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
