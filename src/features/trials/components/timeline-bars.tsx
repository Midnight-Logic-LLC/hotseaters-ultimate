/**
 * timeline-bars.tsx
 *
 * Port of HotSeatersMVP/src/components/schedule/TimelineBars.jsx.
 *
 * Gantt bars for each service row, positioned by start/end date.
 * Supports drag-and-drop date editing, segment bars, time-off bars,
 * and hover tooltips.
 *
 * RULE B: presentational — receives all state/handlers from parent.
 */

import React from 'react';
import { parseISO, differenceInDays } from 'date-fns';
import type { GroupBy } from './timeline-toolbar';
import type { TimelineGeometry } from './timeline-header';
import type { TrialGroup, ConsultantGroup, SidebarService } from './timeline-sidebar';
import type { TimelineTimeOff, TimelineConsultant } from '../hooks/use-timeline-data';
import type { PipelineStage } from '@/shared/db/lookups-selectors';
import type { TrialSegment } from '@/features/trials/entities';

// ─── Color helpers ────────────────────────────────────────────────────────────

function getServiceBarColor(
  service: SidebarService,
  pipelineStages: PipelineStage[],
): string {
  if ((service as { isSubcontract?: boolean }).isSubcontract) return '#A855F7';
  if ((service as { isPending?: boolean }).isPending) return '#C084FC';
  const trialId = (service as { trial?: { pipeline_stage_id?: string | null } }).trial?.pipeline_stage_id;
  const stage = pipelineStages.find((s) => s.id === trialId);
  if (stage?.type === 'sales') return '#6B7280';
  const phase = (service as { service_phase?: string | null }).service_phase;
  if (phase === 'pre_trial') return '#93C5FD';
  return '#3B82F6';
}

function getTrialBarColor(trial: TrialGroup['trial'], pipelineStages: PipelineStage[]): string {
  const stage = pipelineStages.find((s) => s.id === trial.pipeline_stage_id);
  if (stage?.type === 'sales') return '#9CA3AF';
  if (trial.isSubcontractGig) return '#C084FC';
  return '#60A5FA';
}

// ─── Position helper ──────────────────────────────────────────────────────────

function getBarPosition(
  startStr: string | null | undefined,
  endStr: string | null | undefined,
  timeline: TimelineGeometry,
  unitWidth: number,
): { left: number; width: number } | null {
  if (!startStr) return null;
  try {
    const start = parseISO(startStr);
    const end = endStr ? parseISO(endStr) : start;
    const totalWidth = timeline.units * unitWidth;
    const totalDays = timeline.totalDays || 1;
    const startOff = differenceInDays(start, timeline.start);
    const endOff = differenceInDays(end, timeline.start) + 1;
    const left = (startOff / totalDays) * totalWidth;
    const width = Math.max(4, ((endOff - startOff) / totalDays) * totalWidth);
    return { left, width };
  } catch {
    return null;
  }
}

// ─── Single service bar ───────────────────────────────────────────────────────

interface ServiceBarProps {
  service: SidebarService;
  timeline: TimelineGeometry;
  unitWidth: number;
  pipelineStages: PipelineStage[];
  canEditDates: boolean;
  onDragStart?: ((service: SidebarService, type: 'move' | 'left' | 'right', e: React.MouseEvent | React.TouchEvent) => void) | undefined;
  onClick?: (service: SidebarService) => void;
}

function ServiceBar({
  service,
  timeline,
  unitWidth,
  pipelineStages,
  canEditDates,
  onDragStart,
  onClick,
}: ServiceBarProps) {
  const pos = getBarPosition(
    service.start_date,
    service.end_date,
    timeline,
    unitWidth,
  );
  if (!pos) return null;

  const color = getServiceBarColor(service, pipelineStages);
  const isEditable =
    canEditDates &&
    !(service as { isSubcontract?: boolean }).isSubcontract &&
    !(service as { isPending?: boolean }).isPending;

  const label = service.service_name ?? '';
  const showLabel = pos.width > 40;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${pos.left}px`,
        width: `${pos.width}px`,
        height: '28px',
        backgroundColor: color,
        borderRadius: '5px',
        cursor: isEditable ? 'grab' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        userSelect: 'none',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}
      onMouseDown={
        isEditable && onDragStart
          ? (e) => onDragStart(service, 'move', e)
          : undefined
      }
      onTouchStart={
        isEditable && onDragStart
          ? (e) => onDragStart(service, 'move', e)
          : undefined
      }
      onClick={() => onClick?.(service)}
    >
      {/* Left resize handle */}
      {isEditable && onDragStart && (
        <div
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', cursor: 'w-resize', zIndex: 2 }}
          onMouseDown={(e) => { e.stopPropagation(); onDragStart(service, 'left', e); }}
          onTouchStart={(e) => { e.stopPropagation(); onDragStart(service, 'left', e); }}
        />
      )}
      {showLabel && (
        <span
          style={{
            paddingLeft: '6px',
            paddingRight: '6px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'white',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </span>
      )}
      {/* Right resize handle */}
      {isEditable && onDragStart && (
        <div
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', cursor: 'e-resize', zIndex: 2 }}
          onMouseDown={(e) => { e.stopPropagation(); onDragStart(service, 'right', e); }}
          onTouchStart={(e) => { e.stopPropagation(); onDragStart(service, 'right', e); }}
        />
      )}
    </div>
  );
}

// ─── Trial header bar ─────────────────────────────────────────────────────────

function TrialBar({
  trial,
  timeline,
  unitWidth,
  pipelineStages,
  onClick,
}: {
  trial: TrialGroup['trial'];
  timeline: TimelineGeometry;
  unitWidth: number;
  pipelineStages: PipelineStage[];
  onClick?: () => void;
}) {
  const pos = getBarPosition(trial.start_date, trial.end_date, timeline, unitWidth);
  if (!pos) return null;
  const color = getTrialBarColor(trial, pipelineStages);
  const showLabel = pos.width > 60;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${pos.left}px`,
        width: `${pos.width}px`,
        height: '24px',
        backgroundColor: color,
        borderRadius: '5px',
        opacity: 0.6,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        userSelect: 'none',
      }}
      onClick={onClick}
    >
      {showLabel && (
        <span
          style={{
            paddingLeft: '6px',
            fontSize: '10px',
            fontWeight: 700,
            color: 'white',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {trial.case_name}
        </span>
      )}
    </div>
  );
}

// ─── Time-off bar ─────────────────────────────────────────────────────────────

function TimeOffBar({
  timeOff,
  timeline,
  unitWidth,
}: {
  timeOff: TimelineTimeOff;
  timeline: TimelineGeometry;
  unitWidth: number;
}) {
  const pos = getBarPosition(timeOff.start_date, timeOff.end_date, timeline, unitWidth);
  if (!pos) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: `${pos.left}px`,
        width: `${pos.width}px`,
        height: '20px',
        backgroundColor: '#34D399',
        borderRadius: '4px',
        opacity: 0.8,
      }}
    />
  );
}

// ─── Segment bar ──────────────────────────────────────────────────────────────

function SegmentBar({
  segment,
  timeline,
  unitWidth,
}: {
  segment: TrialSegment;
  timeline: TimelineGeometry;
  unitWidth: number;
}) {
  const pos = getBarPosition(segment.start_date, segment.end_date, timeline, unitWidth);
  if (!pos) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: `${pos.left}px`,
        width: `${pos.width}px`,
        height: '6px',
        backgroundColor: '#6366F1',
        borderRadius: '3px',
        bottom: 0,
        opacity: 0.7,
      }}
      title={`Segment ${segment.segment_number ?? ''}`}
    />
  );
}

// ─── Grid background ──────────────────────────────────────────────────────────

function TimelineGridBackground({
  timeline,
  unitWidth,
}: {
  timeline: TimelineGeometry;
  unitWidth: number;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {Array.from({ length: timeline.units }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${i * unitWidth}px`,
            width: '1px',
            top: 0,
            bottom: 0,
            backgroundColor: '#e7e5e4',
          }}
        />
      ))}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TimelineBarsProps {
  groupBy: GroupBy;
  sortedTrialGroups: TrialGroup[];
  sortedConsultantGroups: ConsultantGroup[];
  expandedTrials: Set<string>;
  timeline: TimelineGeometry;
  unitWidth: number;
  pipelineStages: PipelineStage[];
  canEditDates: boolean;
  trialSegments?: TrialSegment[];
  activeTimeOffs?: TimelineTimeOff[];
  consultants?: TimelineConsultant[];
  onSelectService: (service: SidebarService) => void;
  onSelectTrial: (trial: TrialGroup['trial']) => void;
  onServiceDragStart?: (
    service: SidebarService,
    type: 'move' | 'left' | 'right',
    e: React.MouseEvent | React.TouchEvent,
  ) => void;
}

// ─── Row heights ──────────────────────────────────────────────────────────────

const TRIAL_ROW_HEIGHT = 40;
const SERVICE_ROW_HEIGHT = 36;
const TIMEOFF_ROW_HEIGHT = 32;

// ─── Main component ───────────────────────────────────────────────────────────

export function TimelineBars({
  groupBy,
  sortedTrialGroups,
  sortedConsultantGroups,
  expandedTrials,
  timeline,
  unitWidth,
  pipelineStages,
  canEditDates,
  trialSegments = [],
  activeTimeOffs = [],
  consultants: _consultants = [],
  onSelectService,
  onSelectTrial,
  onServiceDragStart,
}: TimelineBarsProps) {
  const totalWidth = timeline.units * unitWidth;

  if (groupBy === 'trial') {
    type RowItem =
      | { type: 'trial'; group: TrialGroup }
      | { type: 'timeoff'; timeOff: TimelineTimeOff };

    const rows: RowItem[] = [
      ...sortedTrialGroups.map((g) => ({ type: 'trial' as const, group: g })),
      ...activeTimeOffs.map((to) => ({ type: 'timeoff' as const, timeOff: to })),
    ].sort((a, b) => {
      const aDate = a.type === 'trial' ? a.group.trial.start_date : a.timeOff.start_date;
      const bDate = b.type === 'trial' ? b.group.trial.start_date : b.timeOff.start_date;
      return new Date(aDate ?? '').getTime() - new Date(bDate ?? '').getTime();
    });

    let top = 0;
    const rowEls: React.ReactNode[] = [];

    for (const row of rows) {
      if (row.type === 'timeoff') {
        rowEls.push(
          <div
            key={`to-${row.timeOff.id}`}
            style={{ position: 'absolute', top: `${top}px`, left: 0, right: 0, height: `${TIMEOFF_ROW_HEIGHT}px` }}
          >
            <TimeOffBar timeOff={row.timeOff} timeline={timeline} unitWidth={unitWidth} />
          </div>,
        );
        top += TIMEOFF_ROW_HEIGHT;
        continue;
      }

      const { group } = row;
      const isExpanded = expandedTrials.has(group.trial.id);
      const segments = trialSegments.filter((s) => s.trial_id === group.trial.id);

      // Trial header row
      rowEls.push(
        <div
          key={`trial-${group.trial.id}`}
          style={{ position: 'absolute', top: `${top}px`, left: 0, right: 0, height: `${TRIAL_ROW_HEIGHT}px` }}
        >
          <TrialBar
            trial={group.trial}
            timeline={timeline}
            unitWidth={unitWidth}
            pipelineStages={pipelineStages}
            onClick={() => onSelectTrial(group.trial)}
          />
          {segments.map((seg) => (
            <SegmentBar key={seg.id} segment={seg} timeline={timeline} unitWidth={unitWidth} />
          ))}
        </div>,
      );
      top += TRIAL_ROW_HEIGHT;

      // Service rows (only when expanded)
      if (isExpanded) {
        for (const svc of group.services) {
          rowEls.push(
            <div
              key={`svc-${svc.id}`}
              style={{ position: 'absolute', top: `${top}px`, left: 0, right: 0, height: `${SERVICE_ROW_HEIGHT}px`, display: 'flex', alignItems: 'center' }}
            >
              <ServiceBar
                service={svc}
                timeline={timeline}
                unitWidth={unitWidth}
                pipelineStages={pipelineStages}
                canEditDates={canEditDates}
                onDragStart={onServiceDragStart}
                onClick={() => onSelectService(svc)}
              />
            </div>,
          );
          top += SERVICE_ROW_HEIGHT;
        }
      }
    }

    return (
      <div
        style={{
          position: 'relative',
          width: `${totalWidth}px`,
          height: `${top}px`,
          minHeight: '100%',
        }}
      >
        <TimelineGridBackground timeline={timeline} unitWidth={unitWidth} />
        {rowEls}
      </div>
    );
  }

  // ── Consultant grouping ────────────────────────────────────────────────────

  let top = 0;
  const rowEls: React.ReactNode[] = [];

  for (const group of sortedConsultantGroups) {
    const groupId = group.consultant.first_name + group.consultant.last_name;
    const isExpanded = expandedTrials.has(groupId);

    rowEls.push(
      <div
        key={`consultant-${groupId}`}
        style={{ position: 'absolute', top: `${top}px`, left: 0, right: 0, height: `${TRIAL_ROW_HEIGHT}px` }}
      />,
    );
    top += TRIAL_ROW_HEIGHT;

    if (isExpanded) {
      for (const svc of group.services) {
        rowEls.push(
          <div
            key={`svc-${svc.id}`}
            style={{ position: 'absolute', top: `${top}px`, left: 0, right: 0, height: `${SERVICE_ROW_HEIGHT}px`, display: 'flex', alignItems: 'center' }}
          >
            <ServiceBar
              service={svc}
              timeline={timeline}
              unitWidth={unitWidth}
              pipelineStages={pipelineStages}
              canEditDates={canEditDates}
              onDragStart={onServiceDragStart}
              onClick={() => onSelectService(svc)}
            />
          </div>,
        );
        top += SERVICE_ROW_HEIGHT;
      }
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width: `${totalWidth}px`,
        height: `${top}px`,
        minHeight: '100%',
      }}
    >
      <TimelineGridBackground timeline={timeline} unitWidth={unitWidth} />
      {rowEls}
    </div>
  );
}
