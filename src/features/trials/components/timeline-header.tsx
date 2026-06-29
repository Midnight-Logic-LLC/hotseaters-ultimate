/**
 * timeline-header.tsx
 *
 * Port of HotSeatersMVP/src/components/schedule/TimelineHeader.jsx.
 *
 * Renders the date ruler (day/week/month labels), weekend shading,
 * dividers, and a "today" indicator line.
 *
 * RULE B: pure presentational — no stores, no hooks with I/O.
 */

import React from 'react';
import {
  format,
  addDays,
  addMonths,
  differenceInDays,
} from 'date-fns';
import type { TimeScale } from './timeline-toolbar';

// ─── Timeline geometry types (shared with TimelineBars) ───────────────────────

export interface TimelineGeometry {
  start: Date;
  end: Date;
  units: number;
  totalDays: number;
  daysPerUnit: number;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TimelineHeaderProps {
  timeline: TimelineGeometry;
  timeScale: TimeScale;
  unitWidth: number;
  /** Forwarded ref so the parent can measure height for scroll sync. */
  timelineHeaderRef?: React.RefObject<HTMLDivElement>;
  isDesktop?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUnitStart(timelineStart: Date, unitIdx: number, timeScale: TimeScale): Date {
  switch (timeScale) {
    case 'day':    return addDays(timelineStart, unitIdx);
    case 'week':   return addDays(timelineStart, unitIdx * 7);
    case 'month':  return addMonths(timelineStart, unitIdx);
    case 'quarter':return addMonths(timelineStart, unitIdx * 3);
    case 'year':   return addMonths(timelineStart, unitIdx * 12);
    default:       return addDays(timelineStart, unitIdx * 7);
  }
}

function getFormatStrings(timeScale: TimeScale): { f1: string; f2: string } {
  switch (timeScale) {
    case 'day':    return { f1: 'MMM d', f2: 'EEE' };
    case 'week':   return { f1: 'MMM d', f2: 'yyyy' };
    case 'month':  return { f1: 'MMM',   f2: 'yyyy' };
    case 'quarter':return { f1: 'QQQ',   f2: 'yyyy' };
    case 'year':   return { f1: 'yyyy',  f2: '' };
    default:       return { f1: 'MMM d', f2: 'yyyy' };
  }
}

function isWeekendDay(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

// ─── Today indicator (exported so parent can overlay it) ─────────────────────

export function TodayIndicator({
  timeline,
  unitWidth,
}: {
  timeline: TimelineGeometry;
  unitWidth: number;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOffset = differenceInDays(today, timeline.start);
  if (dayOffset < 0 || dayOffset > timeline.totalDays) return null;
  const left = (dayOffset / timeline.totalDays) * (timeline.units * unitWidth);
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: `${left}px`,
        width: '2px',
        backgroundColor: 'var(--theme-brand-primary)',
        opacity: 0.7,
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  );
}

export function HeaderTodayLabel({
  timeline,
  unitWidth,
}: {
  timeline: TimelineGeometry;
  unitWidth: number;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOffset = differenceInDays(today, timeline.start);
  if (dayOffset < 0 || dayOffset > timeline.totalDays) return null;
  const left = (dayOffset / timeline.totalDays) * (timeline.units * unitWidth);
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: `${left}px`,
        transform: 'translateX(-50%)',
        fontSize: '10px',
        fontWeight: 700,
        color: 'var(--theme-brand-primary)',
        whiteSpace: 'nowrap',
        zIndex: 6,
        pointerEvents: 'none',
      }}
    >
      Today
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TimelineHeader({
  timeline,
  timeScale,
  unitWidth,
  timelineHeaderRef,
  isDesktop = true,
}: TimelineHeaderProps) {
  const labelFontSize = isDesktop ? '0.75rem' : '0.55rem';
  const { f1, f2 } = getFormatStrings(timeScale);

  return (
    <div
      ref={timelineHeaderRef}
      className="flex py-2 mb-3 relative items-center overflow-visible"
      style={{ marginLeft: '1px' }}
    >
      {Array.from({ length: timeline.units }).map((_, unitIdx) => {
        const unitStart = getUnitStart(timeline.start, unitIdx, timeScale);
        const weekend = timeScale === 'day' && isWeekendDay(unitStart);
        return (
          <div
            key={unitIdx}
            className={`text-center relative ${weekend ? 'bg-stone-200' : ''}`}
            style={{ width: `${unitWidth}px`, flexShrink: 0 }}
          >
            <div
              className="font-semibold text-stone-700 relative z-10"
              style={{ fontSize: labelFontSize }}
            >
              {format(unitStart, f1)}
            </div>
            {f2 && (
              <div className="text-stone-500 relative z-10" style={{ fontSize: labelFontSize }}>
                {format(unitStart, f2)}
              </div>
            )}
          </div>
        );
      })}

      {/* Week mode weekend shading + dividers */}
      {timeScale === 'week' &&
        Array.from({ length: timeline.units }).map((_, idx) => (
          <React.Fragment key={`weekend-${idx}`}>
            <div
              className="absolute top-0 bg-stone-200 pointer-events-none z-0"
              style={{
                left: `${idx * unitWidth}px`,
                width: `${unitWidth / 7}px`,
                bottom: '-12px',
              }}
            />
            <div
              className="absolute top-0 bg-stone-200 pointer-events-none z-0"
              style={{
                left: `${idx * unitWidth + (unitWidth / 7) * 6}px`,
                width: `${unitWidth / 7}px`,
                bottom: '-12px',
              }}
            />
            <div
              className="absolute top-0 border-l border-stone-200 pointer-events-none z-[2]"
              style={{ left: `${(idx + 1) * unitWidth}px`, bottom: '-12px' }}
            />
          </React.Fragment>
        ))}

      <TodayIndicator timeline={timeline} unitWidth={unitWidth} />
      <HeaderTodayLabel timeline={timeline} unitWidth={unitWidth} />
    </div>
  );
}
