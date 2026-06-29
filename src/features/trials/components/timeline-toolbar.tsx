/**
 * timeline-toolbar.tsx
 *
 * Port of HotSeatersMVP/src/components/schedule/TimelineToolbar.jsx.
 *
 * Renders the full toolbar: Mine/All, mobile view toggle, group-by,
 * hide toggles, revenue chart toggle, time-scale, zoom slider, fit,
 * full-width, and filter button.
 *
 * Props receive all state + handlers from the parent page (RULE B —
 * components own no store or I/O).
 */

import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  TrendingUp,
  GanttChart,
  Users,
  SlidersHorizontal,
  List,
  User as UserIcon,
  Gavel,
  Telescope,
  Pause,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TimeScale = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type GroupBy = 'trial' | 'consultant';
export type MobileViewMode = 'list' | 'timeline';

export interface TimelineToolbarProps {
  groupBy: GroupBy;
  onGroupByChange: (v: GroupBy) => void;

  hideDeals: boolean;
  onHideDealsChange: (v: boolean) => void;

  hidePreTrial: boolean;
  onHidePreTrialChange: (v: boolean) => void;

  hideContinued: boolean;
  onHideContinuedChange: (v: boolean) => void;

  showRevenueChart: boolean;
  onShowRevenueChartChange: (v: boolean) => void;

  timeScale: TimeScale;
  onTimeScaleChange: (v: TimeScale) => void;

  zoomLevel: number;
  onZoomLevelChange: (v: number) => void;
  onZoomFit: () => void;
  isFitMode: boolean;

  isFullWidth: boolean;
  onFullWidthChange: () => void;

  showMine: boolean;
  onToggleMine: () => void;

  onOpenFilterSheet: () => void;

  mobileViewMode: MobileViewMode;
  onMobileViewModeChange: (v: MobileViewMode) => void;

  isMobile: boolean;
  isPortrait: boolean;

  /** Passed ref for the toolbar element itself (used for height measurement). */
  headerRef?: React.RefObject<HTMLDivElement | null>;
}

// ─── Shared toggle group ──────────────────────────────────────────────────────

interface ToggleGroupProps<T extends string> {
  options: { value: T; label: string; icon: React.ElementType }[];
  value: T;
  onChange: (v: T) => void;
}

function ToggleGroup<T extends string>({ options, value, onChange }: ToggleGroupProps<T>) {
  return (
    <div
      className="flex items-center rounded-lg border overflow-hidden divide-x"
      style={{ borderColor: 'var(--theme-stone-200)' }}
    >
      {options.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
          style={
            value === v
              ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' }
              : {
                  color: 'var(--theme-stone-600)',
                  backgroundColor:
                    'color-mix(in srgb, var(--theme-brand-primary) 10%, white)',
                }
          }
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Visibility toggle button ─────────────────────────────────────────────────

interface VisToggleProps {
  active: boolean;
  onToggle: () => void;
  label: string;
  icon: React.ElementType;
}

function VisToggle({ active, onToggle, label, icon: Icon }: VisToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
      style={
        active
          ? {
              backgroundColor: 'var(--theme-stone-700)',
              color: 'white',
              borderColor: 'var(--theme-stone-700)',
            }
          : {
              borderColor: 'var(--theme-stone-200)',
              color: 'var(--theme-stone-600)',
              backgroundColor:
                'color-mix(in srgb, var(--theme-brand-primary) 10%, white)',
            }
      }
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const TIME_SCALE_OPTIONS: { value: TimeScale; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

export function TimelineToolbar({
  groupBy,
  onGroupByChange,
  hideDeals,
  onHideDealsChange,
  hidePreTrial,
  onHidePreTrialChange,
  hideContinued,
  onHideContinuedChange,
  showRevenueChart,
  onShowRevenueChartChange,
  timeScale,
  onTimeScaleChange,
  zoomLevel,
  onZoomLevelChange,
  onZoomFit,
  isFitMode,
  isFullWidth,
  onFullWidthChange,
  showMine,
  onToggleMine,
  onOpenFilterSheet,
  mobileViewMode,
  onMobileViewModeChange,
  isMobile,
  isPortrait,
  headerRef,
}: TimelineToolbarProps) {
  const showLandscapePrompt = isMobile && mobileViewMode === 'timeline' && isPortrait;
  const showTimelineControls = !showLandscapePrompt && (!isMobile || mobileViewMode === 'timeline');

  return (
    <div
      ref={headerRef}
      className="schedule-toolbar flex items-center flex-wrap mb-2 lg:mb-4"
      style={{ gap: 'var(--theme-element-gap)' }}
    >
      {/* Mine / All */}
      <ToggleGroup<'mine' | 'all'>
        options={[
          { value: 'mine', label: 'Mine', icon: UserIcon },
          { value: 'all', label: 'All', icon: Users },
        ]}
        value={showMine ? 'mine' : 'all'}
        onChange={(v) => {
          if ((v === 'mine') !== showMine) onToggleMine();
        }}
      />

      {/* Mobile view toggle — portrait only */}
      {isMobile && isPortrait && (
        <ToggleGroup<MobileViewMode>
          options={[
            { value: 'list', label: 'List', icon: List },
            { value: 'timeline', label: 'Timeline', icon: GanttChart },
          ]}
          value={mobileViewMode}
          onChange={onMobileViewModeChange}
        />
      )}

      {/* Group By */}
      {showTimelineControls && (
        <ToggleGroup<GroupBy>
          options={[
            { value: 'trial', label: 'By Trial', icon: Gavel },
            { value: 'consultant', label: 'By Consultant', icon: Users },
          ]}
          value={groupBy}
          onChange={onGroupByChange}
        />
      )}

      {/* Hide Deals */}
      {showTimelineControls && (
        <VisToggle
          active={hideDeals}
          onToggle={() => onHideDealsChange(!hideDeals)}
          label="Hide Deals"
          icon={Telescope}
        />
      )}

      {/* Hide Pre-Trial */}
      {showTimelineControls && (
        <VisToggle
          active={hidePreTrial}
          onToggle={() => onHidePreTrialChange(!hidePreTrial)}
          label="Hide Pre-Trial"
          icon={Pause}
        />
      )}

      {/* Hide Continued */}
      {showTimelineControls && (
        <VisToggle
          active={hideContinued}
          onToggle={() => onHideContinuedChange(!hideContinued)}
          label="Hide Continued"
          icon={Pause}
        />
      )}

      {/* Show Revenue Chart */}
      {showTimelineControls && (
        <VisToggle
          active={showRevenueChart}
          onToggle={() => onShowRevenueChartChange(!showRevenueChart)}
          label="Revenue Chart"
          icon={TrendingUp}
        />
      )}

      {/* Time Scale */}
      {showTimelineControls && (
        <div
          className="flex items-center rounded-lg border overflow-hidden divide-x"
          style={{ borderColor: 'var(--theme-stone-200)' }}
        >
          {TIME_SCALE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onTimeScaleChange(value)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                timeScale === value
                  ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' }
                  : {
                      color: 'var(--theme-stone-600)',
                      backgroundColor:
                        'color-mix(in srgb, var(--theme-brand-primary) 10%, white)',
                    }
              }
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Zoom controls */}
      {showTimelineControls && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              onZoomLevelChange(Math.max(0.01, zoomLevel - 0.05));
            }}
            className="p-1.5 rounded-lg border transition-colors hover:bg-stone-100"
            style={{ borderColor: 'var(--theme-stone-200)' }}
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5 text-stone-600" />
          </button>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(zoomLevel * 100)}
            onChange={(e) => {
              onZoomLevelChange(Number(e.target.value) / 100);
            }}
            className="w-24 accent-[var(--theme-brand-primary)]"
            aria-label="Zoom level"
          />
          <button
            onClick={() => {
              onZoomLevelChange(Math.min(1, zoomLevel + 0.05));
            }}
            className="p-1.5 rounded-lg border transition-colors hover:bg-stone-100"
            style={{ borderColor: 'var(--theme-stone-200)' }}
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5 text-stone-600" />
          </button>
          <button
            onClick={onZoomFit}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
            style={
              isFitMode
                ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white', borderColor: 'var(--theme-brand-primary)' }
                : { borderColor: 'var(--theme-stone-200)', color: 'var(--theme-stone-600)' }
            }
          >
            Fit
          </button>
        </div>
      )}

      {/* Full Width */}
      {showTimelineControls && (
        <button
          onClick={onFullWidthChange}
          className="p-1.5 rounded-lg border transition-colors hover:bg-stone-100"
          style={{ borderColor: 'var(--theme-stone-200)' }}
          aria-label={isFullWidth ? 'Compact width' : 'Full width'}
        >
          {isFullWidth ? (
            <Minimize2 className="w-3.5 h-3.5 text-stone-600" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5 text-stone-600" />
          )}
        </button>
      )}

      {/* Filter */}
      <button
        onClick={onOpenFilterSheet}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors hover:bg-stone-100"
        style={{ borderColor: 'var(--theme-stone-200)', color: 'var(--theme-stone-600)' }}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Filter
      </button>
    </div>
  );
}
