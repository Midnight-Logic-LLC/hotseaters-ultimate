/**
 * timeline-sidebar.tsx
 *
 * Port of HotSeatersMVP/src/components/schedule/TimelineSidebar.jsx.
 *
 * Lists trial/consultant groups with expand/collapse, service rows,
 * and time-off rows. Has a resizable right edge.
 *
 * RULE B: pure presentational — no stores, no I/O.
 */

import React from 'react';
import { ChevronDown, Gavel, User, Orbit } from 'lucide-react';
import type { GroupBy } from './timeline-toolbar';
import type { TimelineConsultant, TimelineTimeOff } from '../hooks/use-timeline-data';
import type { PipelineStage } from '@/shared/db/lookups-selectors';

// ─── Service row shape ────────────────────────────────────────────────────────

export interface SidebarService {
  id: string;
  service_name?: string | null;
  start_date?: string | null | undefined;
  end_date?: string | null | undefined;
  consultants?: TimelineConsultant[];
  consultant?: TimelineConsultant | null;
  isSubcontract?: boolean;
  isPending?: boolean;
}

export interface TrialGroup {
  trial: {
    id: string;
    case_name?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    pipeline_stage_id?: string | null;
    isSubcontractGig?: boolean;
    completion_type?: string | null;
  };
  client?: { firm_name?: string | null } | null;
  services: SidebarService[];
}

export interface ConsultantGroup {
  consultant: TimelineConsultant;
  services: SidebarService[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TimelineSidebarProps {
  groupBy: GroupBy;
  sortedTrialGroups: TrialGroup[];
  sortedConsultantGroups: ConsultantGroup[];
  expandedTrials: Set<string>;
  expandedNestedTrials: Set<string>;
  toggleTrial: (id: string) => void;
  toggleNestedTrial: (consultantId: string, trialId: string) => void;
  pipelineStages: PipelineStage[];
  allServices: SidebarService[];
  onSelectService: (service: SidebarService) => void;
  infoWidth: number;
  onResizeMouseDown: (e: React.MouseEvent | React.TouchEvent) => void;
  activeTimeOffs?: TimelineTimeOff[];
  consultants?: TimelineConsultant[];
}

// ─── Time-off sidebar row ─────────────────────────────────────────────────────

function TimeOffSidebarRow({
  timeOff: _timeOff,
  consultant,
}: {
  timeOff: TimelineTimeOff;
  consultant?: TimelineConsultant;
}) {
  const name = consultant
    ? `${consultant.first_name} ${consultant.last_name}`
    : 'Unknown';
  return (
    <div
      className="flex items-center gap-2 p-2 rounded text-xs text-stone-500"
      style={{ background: '#d1fae5' }}
    >
      <User className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
      <span className="truncate font-medium text-emerald-700">
        Time Off — {name}
      </span>
    </div>
  );
}

// ─── Service sidebar row ──────────────────────────────────────────────────────

function ServiceSidebarRow({
  service,
  onSelect,
}: {
  service: SidebarService;
  onSelect: () => void;
}) {
  const consultantName =
    service.consultants && service.consultants.length > 0
      ? `${service.consultants[0]!.first_name} ${service.consultants[0]!.last_name}`
      : service.consultant
      ? `${service.consultant.first_name} ${service.consultant.last_name}`
      : 'Unassigned';

  return (
    <button
      onClick={onSelect}
      className="w-full text-left flex items-center gap-1.5 py-1.5 px-2 hover:bg-stone-50 transition-colors rounded text-xs"
    >
      <User className="w-3 h-3 text-stone-400 flex-shrink-0" />
      <span className="truncate text-stone-700 font-medium">
        {service.service_name ?? 'Service'}
      </span>
      <span className="truncate text-stone-400 ml-auto">{consultantName}</span>
    </button>
  );
}

// ─── Trial sidebar group ──────────────────────────────────────────────────────

function TrialSidebarGroup({
  group,
  isExpanded,
  onToggle,
  pipelineStages,
  allServices: _allServices,
  onSelectService,
}: {
  group: TrialGroup;
  isExpanded: boolean;
  onToggle: () => void;
  pipelineStages: PipelineStage[];
  allServices: SidebarService[];
  onSelectService: (s: SidebarService) => void;
}) {
  const trialStage = pipelineStages.find(
    (s) => s.id === group.trial.pipeline_stage_id,
  );
  const isDeal = trialStage?.type === 'sales';
  const isSub = group.trial.isSubcontractGig;

  const borderCls = isSub
    ? 'border-purple-300 bg-purple-50/30'
    : isDeal
    ? 'border-stone-200 bg-stone-100'
    : 'border-stone-200 bg-white';

  const hoverCls = isSub
    ? 'hover:bg-purple-100/50'
    : isDeal
    ? 'hover:bg-stone-200'
    : 'hover:bg-stone-50';

  return (
    <div className={`border rounded-lg ${borderCls}`}>
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 ${hoverCls} p-2 rounded transition-colors w-full h-10`}
      >
        <ChevronDown
          className={`w-3.5 h-3.5 ${isSub ? 'text-purple-500' : 'text-stone-500'} flex-shrink-0 transition-transform ${!isExpanded ? '-rotate-90' : ''}`}
        />
        {isSub ? (
          <Orbit className="w-4 h-4 text-purple-600 flex-shrink-0" />
        ) : isDeal ? (
          <Gavel className="w-4 h-4 text-stone-500 flex-shrink-0" />
        ) : (
          <Gavel
            className="w-4 h-4 flex-shrink-0"
            style={{ color: 'var(--theme-brand-primary)' }}
          />
        )}
        <div className="flex flex-col min-w-0 text-left">
          <span
            className="text-xs font-semibold truncate"
            style={{ color: isSub ? '#7c3aed' : 'var(--theme-stone-800)' }}
          >
            {group.trial.case_name ?? 'Unknown Trial'}
          </span>
          {group.client?.firm_name && (
            <span className="text-[10px] text-stone-500 truncate">
              {group.client.firm_name}
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="pb-1 px-1 space-y-0.5">
          {group.services.map((svc) => (
            <ServiceSidebarRow
              key={svc.id}
              service={svc}
              onSelect={() => onSelectService(svc)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Consultant sidebar group ─────────────────────────────────────────────────

function ConsultantSidebarGroup({
  group,
  groupId: _groupId,
  isExpanded,
  onToggle,
  onSelectService,
}: {
  group: ConsultantGroup;
  groupId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectService: (s: SidebarService) => void;
}) {
  const name = `${group.consultant.first_name} ${group.consultant.last_name}`;
  return (
    <div className="border rounded-lg border-stone-200 bg-white">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 hover:bg-stone-50 p-2 rounded transition-colors w-full h-10"
      >
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-500 flex-shrink-0 transition-transform ${!isExpanded ? '-rotate-90' : ''}`}
        />
        <User className="w-4 h-4 text-stone-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-stone-800 truncate">
          {name}
        </span>
      </button>
      {isExpanded && (
        <div className="pb-1 px-1 space-y-0.5">
          {group.services.map((svc) => (
            <ServiceSidebarRow
              key={svc.id}
              service={svc}
              onSelect={() => onSelectService(svc)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TimelineSidebar({
  groupBy,
  sortedTrialGroups,
  sortedConsultantGroups,
  expandedTrials,
  expandedNestedTrials: _expandedNestedTrials,
  toggleTrial,
  toggleNestedTrial: _toggleNestedTrial,
  pipelineStages,
  allServices,
  onSelectService,
  infoWidth,
  onResizeMouseDown,
  activeTimeOffs = [],
  consultants = [],
}: TimelineSidebarProps) {
  return (
    <div
      className="flex-shrink-0 relative bg-white z-10"
      style={{ width: `${infoWidth}px` }}
    >
      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 cursor-col-resize hover:bg-indigo-500 active:bg-indigo-600 transition-colors z-20 touch-none"
        onMouseDown={onResizeMouseDown}
        onTouchStart={onResizeMouseDown}
        style={{
          userSelect: 'none',
          width: '6px',
          backgroundColor: '#d6d3d1',
        }}
      />

      <div className="space-y-0.5 pr-2">
        {groupBy === 'trial' &&
          (() => {
            type Item =
              | { type: 'trial'; sortDate: string; data: TrialGroup }
              | { type: 'timeoff'; sortDate: string; data: TimelineTimeOff };

            const trialItems: Item[] = sortedTrialGroups.map((g) => ({
              type: 'trial',
              sortDate: g.trial.start_date ?? '',
              data: g,
            }));
            const timeOffItems: Item[] = activeTimeOffs.map((to) => ({
              type: 'timeoff',
              sortDate: to.start_date ?? '',
              data: to,
            }));
            const merged = [...trialItems, ...timeOffItems].sort(
              (a, b) =>
                new Date(a.sortDate).getTime() - new Date(b.sortDate).getTime(),
            );

            return merged.map((item) => {
              if (item.type === 'timeoff') {
                const consultant = consultants.find(
                  (c) => c.id === (item.data as TimelineTimeOff).consultant_id,
                );
                return (
                  <TimeOffSidebarRow
                    key={`to-${(item.data as TimelineTimeOff).id}`}
                    timeOff={item.data as TimelineTimeOff}
                    {...(consultant !== undefined ? { consultant } : {})}
                  />
                );
              }
              const group = item.data as TrialGroup;
              return (
                <TrialSidebarGroup
                  key={group.trial.id}
                  group={group}
                  isExpanded={expandedTrials.has(group.trial.id)}
                  onToggle={() => toggleTrial(group.trial.id)}
                  pipelineStages={pipelineStages}
                  allServices={allServices}
                  onSelectService={onSelectService}
                />
              );
            });
          })()}

        {groupBy === 'consultant' &&
          sortedConsultantGroups.map((group) => {
            const groupId =
              group.consultant.first_name + group.consultant.last_name;
            return (
              <ConsultantSidebarGroup
                key={groupId}
                group={group}
                groupId={groupId}
                isExpanded={expandedTrials.has(groupId)}
                onToggle={() => toggleTrial(groupId)}
                onSelectService={onSelectService}
              />
            );
          })}
      </div>
    </div>
  );
}
