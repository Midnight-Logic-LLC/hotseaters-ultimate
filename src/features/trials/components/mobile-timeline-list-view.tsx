/**
 * mobile-timeline-list-view.tsx
 *
 * Port of HotSeatersMVP/src/components/schedule/MobileTimelineListView.jsx.
 *
 * Mobile portrait list view of trial groups with service rows.
 * Replaces the interactive Gantt on phones for readability.
 *
 * RULE B: presentational — no stores, no I/O.
 */

import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import {
  Gavel,
  Orbit,
  Briefcase,
  User,
  Calendar,
} from 'lucide-react';
import type { TrialGroup, SidebarService } from './timeline-sidebar';
import type { PipelineStage } from '@/shared/db/lookups-selectors';
import type { TimelineTimeOff } from '../hooks/use-timeline-data';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MobileTimelineListViewProps {
  sortedTrialGroups: TrialGroup[];
  pipelineStages: PipelineStage[];
  activeTimeOffs?: TimelineTimeOff[];
  onSelectTrial?: (trial: TrialGroup['trial']) => void;
  onSelectService?: (service: SidebarService) => void;
}

// ─── Trial card ───────────────────────────────────────────────────────────────

function TrialCard({
  group,
  pipelineStages,
  onSelectTrial,
  onSelectService,
}: {
  group: TrialGroup;
  pipelineStages: PipelineStage[];
  onSelectTrial?: ((t: TrialGroup['trial']) => void) | undefined;
  onSelectService?: ((s: SidebarService) => void) | undefined;
}) {
  const { trial, client, services } = group;
  const trialStage = pipelineStages.find((s) => s.id === trial.pipeline_stage_id);
  const isDeal = trialStage?.type === 'sales';
  const isSub = trial.isSubcontractGig;
  const isContinued = trial.completion_type === 'case_continued';

  const trialStart = trial.start_date ? parseISO(trial.start_date) : null;
  const trialEnd = trial.end_date ? parseISO(trial.end_date) : trialStart;
  const daysUntil = trialStart ? differenceInDays(trialStart, new Date()) : null;
  const isActive =
    trialStart && trialEnd && !isPast(trialEnd) && isPast(trialStart);
  const isUpcoming = trialStart && !isPast(trialStart);

  const borderCls = isSub
    ? 'border-purple-300'
    : isDeal
    ? 'border-stone-300'
    : 'border-blue-200';
  const bgCls = isSub
    ? 'bg-purple-50/40'
    : isDeal
    ? 'bg-stone-50'
    : 'bg-white';

  return (
    <div
      className={`border rounded-xl ${borderCls} ${bgCls} overflow-hidden`}
      style={{ boxShadow: 'var(--theme-card-shadow)' }}
    >
      {/* Trial header */}
      <button
        className="w-full text-left p-3.5 flex items-start gap-3 active:bg-stone-50 transition-colors"
        onClick={() => onSelectTrial?.(trial)}
      >
        <div className="flex-shrink-0 mt-0.5">
          {isSub ? (
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
              <Orbit className="w-5 h-5 text-purple-600" />
            </div>
          ) : isDeal ? (
            <div className="w-9 h-9 rounded-lg bg-stone-200 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-stone-600" />
            </div>
          ) : (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor:
                  'color-mix(in srgb, var(--theme-brand-primary) 15%, white)',
              }}
            >
              <Gavel
                className="w-5 h-5"
                style={{ color: 'var(--theme-brand-primary)' }}
              />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className="font-semibold truncate"
                style={{
                  fontSize: 'var(--theme-text-card-title)',
                  color: isSub ? '#7c3aed' : 'var(--theme-stone-900)',
                }}
              >
                {trial.case_name ?? 'Unknown Trial'}
              </p>
              {client?.firm_name && (
                <p
                  className="truncate mt-0.5"
                  style={{
                    fontSize: 'var(--theme-text-small)',
                    color: 'var(--theme-stone-500)',
                  }}
                >
                  {client.firm_name}
                </p>
              )}
            </div>
            {isActive && (
              <span
                className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                }}
              >
                ACTIVE
              </span>
            )}
            {isUpcoming && daysUntil !== null && daysUntil <= 14 && (
              <span
                className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--theme-brand-primary) 15%, white)',
                  color: 'var(--theme-brand-primary)',
                }}
              >
                {daysUntil === 0 ? 'TODAY' : `${daysUntil}D`}
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            {trialStart && (
              <div className="flex items-center gap-1 text-[11px] text-stone-500">
                <Calendar className="w-3 h-3" />
                {format(trialStart, 'MMM d')}
                {trialEnd && trialStart.getTime() !== trialEnd.getTime() && (
                  <> – {format(trialEnd, 'MMM d, yyyy')}</>
                )}
              </div>
            )}
            {isContinued && (
              <span className="text-[10px] font-medium text-amber-600">
                Continued
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Service rows */}
      {services.length > 0 && (
        <div className="border-t border-stone-100 divide-y divide-stone-50">
          {services.map((svc) => {
            const consultant =
              svc.consultants?.[0] ?? svc.consultant ?? null;
            return (
              <button
                key={svc.id}
                className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-stone-50 active:bg-stone-100 transition-colors"
                onClick={() => onSelectService?.(svc)}
              >
                <User className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-stone-700 truncate">
                    {svc.service_name ?? 'Service'}
                  </p>
                  {consultant && (
                    <p className="text-[11px] text-stone-400 truncate">
                      {consultant.first_name} {consultant.last_name}
                    </p>
                  )}
                </div>
                {svc.start_date && (
                  <p className="text-[11px] text-stone-400 flex-shrink-0">
                    {format(parseISO(svc.start_date), 'MMM d')}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MobileTimelineListView({
  sortedTrialGroups,
  pipelineStages,
  activeTimeOffs: _activeTimeOffs = [],
  onSelectTrial,
  onSelectService,
}: MobileTimelineListViewProps) {
  if (sortedTrialGroups.length === 0) {
    return (
      <div
        className="text-center py-12"
        style={{ color: 'var(--theme-stone-500)' }}
      >
        <Gavel className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p style={{ fontSize: 'var(--theme-text-body)' }}>
          No scheduled services to display
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedTrialGroups.map((group) => (
        <TrialCard
          key={group.trial.id}
          group={group}
          pipelineStages={pipelineStages}
          onSelectTrial={onSelectTrial}
          onSelectService={onSelectService}
        />
      ))}
    </div>
  );
}
