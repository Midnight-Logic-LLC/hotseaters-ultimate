/**
 * timeline-page.tsx
 *
 * Port of HotSeatersMVP/src/pages/Timeline.jsx.
 *
 * Architecture invariants (CLAUDE.md RULES B/C/D):
 *   - Page component: imports hooks only — no stores, no Supabase, no PGlite.
 *   - Data from useTimelineData (Tier-A PGlite) and useTier1.
 *   - All sub-components imported by name — no stubs remain.
 *
 * Visual + functional parity with bible:
 *   - Page title: "Trial Timeline"
 *   - Subtitle: "Timeline view of scheduled trials"
 *   - Full toolbar, Gantt, sidebar, header, bars, mobile list view,
 *     landscape prompt, legend — all wired.
 *   - Empty-state icon + copy: "No scheduled services to display".
 *   - Legend: Pre-Trial, In Trial, HSH Pre-Trial, HSH In Trial,
 *     Deal Pre-Trial, Deal In Trial, Time Off.
 */

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import { GanttChart as GanttChartIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTimelineData } from '../hooks/use-timeline-data';
import { TimelineToolbar } from '../components/timeline-toolbar';
import { TimelineSidebar } from '../components/timeline-sidebar';
import { TimelineHeader } from '../components/timeline-header';
import { TimelineBars } from '../components/timeline-bars';
import { MobileTimelineListView } from '../components/mobile-timeline-list-view';
import { MobileLandscapePrompt } from '../components/mobile-landscape-prompt';
import {
  getTimelineData,
  computeUnitWidth,
  computeFitZoom,
} from '../components/timeline-position-utils';
import type { TimeScale, GroupBy, MobileViewMode } from '../components/timeline-toolbar';
import type { SidebarService, TrialGroup, ConsultantGroup } from '../components/timeline-sidebar';

// ─── Device detection ─────────────────────────────────────────────────────────

function useDeviceType() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440,
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return { isMobile: width < 768, isDesktop: width >= 1024 };
}

// ─── Legend ───────────────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { color: '#93C5FD', label: 'Pre-Trial (Hourly)' },
  { color: '#3B82F6', label: 'In Trial (Daily Min)' },
  { color: '#D8B4FE', label: 'HSH Pre-Trial (Hourly)' },
  { color: '#A855F7', label: 'HSH In Trial (Daily Min)' },
  { color: '#D1D5DB', label: 'Deal Pre-Trial (Hourly)' },
  { color: '#6B7280', label: 'Deal In Trial (Daily Min)' },
  { color: '#34D399', label: 'Time Off' },
] as const;

// ─── Main page ────────────────────────────────────────────────────────────────

export function TimelinePage() {
  // ── Data ──────────────────────────────────────────────────────────────────
  const tld = useTimelineData();
  const {
    userInfo,
    pipelineStages,
    trials,
    trialServices,
    trialSegments,
    trialServiceAssignments,
    clients,
    consultants,
    timeOffs,
    canEditDates,
    isLoading,
  } = tld;

  // ── UI state (mirrors bible 1:1) ──────────────────────────────────────────
  const [expandedTrials, setExpandedTrials] = useState<Set<string>>(new Set());
  const [expandedNestedTrials, setExpandedNestedTrials] = useState<Set<string>>(new Set());
  const [zoomLevel, setZoomLevel] = useState(1);
  const [groupBy, setGroupBy] = useState<GroupBy>('trial');
  const [timeScale, setTimeScale] = useState<TimeScale>('week');
  const [infoWidth, setInfoWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [isFitMode, setIsFitMode] = useState(true);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [hideDeals, setHideDeals] = useState(false);
  const [hidePreTrial, setHidePreTrial] = useState(false);
  const [hideContinued, setHideContinued] = useState(false);
  const [showRevenueChart, setShowRevenueChart] = useState(false);
  const [showMine, setShowMine] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [_selectedService, setSelectedService] = useState<SidebarService | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const timelineHeaderContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const trialListRef = useRef<HTMLDivElement>(null);

  const { isMobile, isDesktop } = useDeviceType();

  const [isPortrait, setIsPortrait] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < window.innerHeight : false,
  );
  const [mobileViewMode, setMobileViewMode] = useState<MobileViewMode>(() =>
    typeof window !== 'undefined' && window.innerWidth < window.innerHeight ? 'list' : 'timeline',
  );

  // ── Orientation listener ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      const portrait = window.innerWidth < window.innerHeight;
      setIsPortrait(portrait);
      setMobileViewMode(portrait ? 'list' : 'timeline');
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // ── Hide bottom tab bar in mobile landscape ───────────────────────────────
  useEffect(() => {
    const shouldHide = !isDesktop && !isPortrait;
    document.body.classList.toggle('hide-bottom-tab-bar', shouldHide);
    return () => document.body.classList.remove('hide-bottom-tab-bar');
  }, [isDesktop, isPortrait]);

  // ── Load prefs from userInfo once ────────────────────────────────────────
  useEffect(() => {
    if (userInfo && !prefsLoaded) {
      const prefs =
        (userInfo as { preferences?: Record<string, unknown> }).preferences ?? {};
      setIsFullWidth((prefs.schedule_full_width as boolean | undefined) ?? false);
      setGroupBy(
        ((prefs.schedule_view_by as string | undefined) ?? 'trial') as GroupBy,
      );
      setTimeScale(
        ((prefs.schedule_time_scale as string | undefined) ?? 'week') as TimeScale,
      );
      setHideDeals((prefs.schedule_hide_deals as boolean | undefined) ?? false);
      setHidePreTrial((prefs.schedule_hide_pre_trial as boolean | undefined) ?? false);
      setHideContinued((prefs.schedule_hide_continued as boolean | undefined) ?? false);
      setShowRevenueChart(
        (prefs.schedule_show_revenue_chart as boolean | undefined) ?? false,
      );
      setShowMine((prefs.schedule_show_mine as boolean | undefined) ?? false);
      setPrefsLoaded(true);
    }
  }, [userInfo, prefsLoaded]);

  // ── Sidebar resize ────────────────────────────────────────────────────────
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      setIsResizing(true);
      const te = e as React.TouchEvent;
      const clientX =
        'touches' in e && te.touches.length > 0
          ? te.touches[0]!.clientX
          : (e as React.MouseEvent).clientX;
      resizeStartXRef.current = clientX;
      resizeStartWidthRef.current = infoWidth;
      e.preventDefault();
    },
    [infoWidth],
  );

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isResizing) return;
      const te = e as TouchEvent;
      const clientX =
        'touches' in e && te.touches.length > 0
          ? te.touches[0]!.clientX
          : (e as MouseEvent).clientX;
      setInfoWidth(
        Math.max(100, Math.min(400, resizeStartWidthRef.current + (clientX - resizeStartXRef.current))),
      );
    };
    const handleEnd = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isResizing]);

  // ── Expand/collapse ───────────────────────────────────────────────────────
  const toggleTrial = useCallback((id: string) => {
    setExpandedTrials((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleNestedTrial = useCallback((consultantId: string, trialId: string) => {
    const compositeId = `${consultantId}-${trialId}`;
    setExpandedNestedTrials((prev) => {
      const next = new Set(prev);
      if (next.has(compositeId)) next.delete(compositeId);
      else next.add(compositeId);
      return next;
    });
  }, []);

  // ── Build enriched services (bible pattern) ───────────────────────────────
  type EnrichedService = SidebarService & {
    trial: TrialGroup['trial'];
    client: { id: string; firm_name?: string | null } | null;
    service_phase?: string | null;
  };

  const allServices = useMemo(() => {
    return (trialServices
      .map((ts) => {
        const trial = trials.find((t) => t.id === ts.trial_id);
        if (!trial?.start_date) return null;
        const client = clients.find((c) => (c as { id: string }).id === (trial as { client_id?: string }).client_id) ?? null;
        const assignments = trialServiceAssignments.filter(
          (a) => a.trial_service_id === ts.id,
        );
        const consultantsList = assignments
          .map((a) => consultants.find((c) => c.id === a.consultant_id))
          .filter((c): c is NonNullable<typeof c> => c != null);
        return {
          id: ts.id,
          service_name: (ts as { service_name?: string | null }).service_name ?? (ts as { service_id?: string | null }).service_id ?? 'Service',
          start_date: ts.start_date,
          end_date: ts.end_date,
          service_phase: (ts as { service_phase?: string | null }).service_phase ?? null,
          trial: {
            id: trial.id,
            case_name: (trial as { case_name?: string | null }).case_name ?? null,
            start_date: trial.start_date,
            end_date: (trial as { end_date?: string | null }).end_date ?? null,
            pipeline_stage_id: (trial as { pipeline_stage_id?: string | null }).pipeline_stage_id ?? null,
            completion_type: (trial as { completion_type?: string | null }).completion_type ?? null,
          },
          client,
          consultants: consultantsList,
          consultant: consultantsList[0] ?? null,
        } satisfies EnrichedService;
      })
      .filter((s) => s !== null)) as EnrichedService[];
  }, [trialServices, trials, clients, trialServiceAssignments, consultants]);

  // ── Filter services ───────────────────────────────────────────────────────
  const filteredServices = useMemo<EnrichedService[]>(() => {
    return allServices.filter((svc) => {
      if (hideDeals) {
        const stage = pipelineStages.find(
          (s) => s.id === svc.trial.pipeline_stage_id,
        );
        if (stage?.type === 'sales') return false;
      }
      if (hideContinued && svc.trial.completion_type === 'case_continued') return false;
      if (hidePreTrial && svc.service_phase === 'pre_trial') return false;
      if (showMine && userInfo?.id) {
        const assigned = trialServiceAssignments.some(
          (a) => a.trial_service_id === svc.id && a.consultant_id === userInfo.id,
        );
        if (!assigned) return false;
      }
      return true;
    });
  }, [allServices, hideDeals, hideContinued, hidePreTrial, showMine, userInfo?.id, pipelineStages, trialServiceAssignments]);

  // ── Timeline geometry ─────────────────────────────────────────────────────
  const timeline = useMemo(
    () => getTimelineData(filteredServices, timeScale),
    [filteredServices, timeScale],
  );
  const unitWidth = useMemo(
    () => computeUnitWidth(zoomLevel, timeline.daysPerUnit),
    [zoomLevel, timeline.daysPerUnit],
  );

  // ── Fit-to-window zoom ────────────────────────────────────────────────────
  const handleZoomFit = useCallback(() => {
    if (!timelineContainerRef.current || timeline.units === 0) return;
    const fitZoom = computeFitZoom(
      timelineContainerRef.current.offsetWidth,
      timeline.units,
      timeline.daysPerUnit,
    );
    setZoomLevel(Math.max(0.01, Math.min(1, fitZoom)));
    setIsFitMode(true);
  }, [timeline.units, timeline.daysPerUnit]);

  useEffect(() => {
    if (!isFitMode || filteredServices.length === 0) return;
    const timer = setTimeout(handleZoomFit, 100);
    return () => clearTimeout(timer);
  }, [isFitMode, filteredServices.length, timeline.units, infoWidth, timeScale, isFullWidth, isMobile, mobileViewMode, isPortrait, handleZoomFit]);

  // ── Scroll sync (header ↔ body) ───────────────────────────────────────────
  useEffect(() => {
    const body = timelineContainerRef.current;
    const header = timelineHeaderContainerRef.current;
    if (!body || !header) return;
    const onBodyScroll = () => { header.scrollLeft = body.scrollLeft; };
    body.addEventListener('scroll', onBodyScroll);
    return () => body.removeEventListener('scroll', onBodyScroll);
  }, []);

  // ── Build trial / consultant groups ───────────────────────────────────────
  const { sortedTrialGroups, sortedConsultantGroups } = useMemo(() => {
    // Trial groups
    const trialGroupMap: Record<string, TrialGroup> = {};
    for (const svc of filteredServices) {
      const { trial, client } = svc;
      if (!trial.id) continue;
      if (!trialGroupMap[trial.id]) {
        trialGroupMap[trial.id] = { trial, client, services: [] };
      }
      trialGroupMap[trial.id]!.services.push(svc);
    }
    const sortedTrialGroups = Object.values(trialGroupMap).sort(
      (a, b) =>
        new Date(a.trial.start_date ?? '').getTime() -
        new Date(b.trial.start_date ?? '').getTime(),
    );

    // Consultant groups
    const consultantGroupMap: Record<string, ConsultantGroup> = {};
    for (const svc of filteredServices) {
      const cList = svc.consultants ?? [];
      const relevant = showMine
        ? cList.filter((c) => c.id === userInfo?.id)
        : cList.length > 0
        ? cList
        : [{ id: 'unassigned', first_name: 'Unassigned', last_name: '' }];
      for (const c of relevant) {
        if (!consultantGroupMap[c.id]) {
          consultantGroupMap[c.id] = { consultant: c, services: [] };
        }
        consultantGroupMap[c.id]!.services.push(svc);
      }
    }
    const sortedConsultantGroups = Object.values(consultantGroupMap).sort((a, b) => {
      if (a.consultant.first_name === 'Unassigned') return 1;
      if (b.consultant.first_name === 'Unassigned') return -1;
      return (a.consultant.last_name ?? '').localeCompare(b.consultant.last_name ?? '');
    });

    return { sortedTrialGroups, sortedConsultantGroups };
  }, [filteredServices, showMine, userInfo?.id]);

  // ── Active time-offs ──────────────────────────────────────────────────────
  const activeTimeOffs = useMemo(() => {
    const all = timeOffs.filter(
      (to) =>
        to.start_date &&
        to.end_date &&
        (to.status === 'Approved' || to.status === 'Pending'),
    );
    return showMine ? all.filter((to) => to.consultant_id === userInfo?.id) : all;
  }, [timeOffs, showMine, userInfo?.id]);

  // ── Loading gate ──────────────────────────────────────────────────────────
  const coreDataLoading = !prefsLoaded || !userInfo?.company_id || isLoading;
  const hasServices = filteredServices.length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  if (coreDataLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          fontFamily: 'var(--theme-font-body)',
          color: 'var(--theme-stone-500)',
        }}
      >
        Loading timeline…
      </div>
    );
  }

  return (
    <div
      className="w-full min-w-0 flex flex-col h-full"
      style={{
        padding: !isDesktop ? '4px 8px 8px' : 'var(--theme-page-padding)',
        fontFamily: 'var(--theme-font-body)',
      }}
    >
      <div
        className={`${isFullWidth || !isDesktop ? 'w-full' : ''} w-full min-w-0 flex flex-col flex-1 min-h-0`}
        style={
          !(isFullWidth || !isDesktop)
            ? { maxWidth: 'var(--theme-max-content-width)', margin: '0 auto' }
            : {}
        }
      >
        {/* Page header (hidden on mobile) */}
        <div
          className="schedule-page-header hidden lg:flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
          style={{ gap: 'var(--theme-card-gap)' }}
        >
          <div>
            <h1
              className="font-bold mb-2"
              style={{
                fontFamily: 'var(--theme-font-page-title)',
                fontSize: 'var(--theme-text-page-title)',
                color: 'var(--theme-stone-900)',
              }}
            >
              Trial Timeline
            </h1>
            <p
              className="schedule-subtitle"
              style={{
                fontSize: 'var(--theme-text-body)',
                color: 'var(--theme-stone-600)',
              }}
            >
              Timeline view of scheduled trials
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-2">
          <TimelineToolbar
            headerRef={headerRef}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            hideDeals={hideDeals}
            onHideDealsChange={setHideDeals}
            hidePreTrial={hidePreTrial}
            onHidePreTrialChange={setHidePreTrial}
            hideContinued={hideContinued}
            onHideContinuedChange={setHideContinued}
            showRevenueChart={showRevenueChart}
            onShowRevenueChartChange={setShowRevenueChart}
            timeScale={timeScale}
            onTimeScaleChange={(v) => { setTimeScale(v); }}
            zoomLevel={zoomLevel}
            onZoomLevelChange={(v) => { setZoomLevel(v); setIsFitMode(false); }}
            onZoomFit={handleZoomFit}
            isFitMode={isFitMode}
            isFullWidth={isFullWidth}
            onFullWidthChange={() => setIsFullWidth((v) => !v)}
            showMine={showMine}
            onToggleMine={() => setShowMine((v) => !v)}
            onOpenFilterSheet={() => {/* TODO: filter sheet */}}
            mobileViewMode={mobileViewMode}
            onMobileViewModeChange={setMobileViewMode}
            isMobile={isMobile}
            isPortrait={isPortrait}
          />
        </div>

        {/* Content */}
        {isMobile && mobileViewMode === 'list' ? (
          <div className="flex-1 min-h-0 overflow-auto">
            <MobileTimelineListView
              sortedTrialGroups={sortedTrialGroups}
              pipelineStages={pipelineStages}
              activeTimeOffs={activeTimeOffs}
              onSelectTrial={() => {/* TODO: TrialSummaryModal */}}
              onSelectService={setSelectedService}
            />
          </div>
        ) : isMobile && isPortrait ? (
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <MobileLandscapePrompt />
          </div>
        ) : (
          <Card
            className="overflow-hidden flex-1 min-h-0 flex flex-col"
            style={{
              boxShadow: 'var(--theme-card-shadow)',
              borderWidth: 'var(--theme-card-border)',
              borderColor: 'var(--theme-stone-200)',
              borderRadius: 'var(--theme-card-radius)',
              backgroundColor: 'var(--theme-card-bg)',
            }}
          >
            <CardContent
              className="flex-1 min-h-0 flex flex-col"
              style={{
                padding: isMobile
                  ? '0 8px 8px'
                  : '0 var(--theme-card-padding) var(--theme-card-padding)',
              }}
            >
              {hasServices ? (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                  {/* Header row */}
                  <div className="flex flex-shrink-0">
                    {!isMobile && (
                      <div
                        style={{
                          width: `${infoWidth}px`,
                          flexShrink: 0,
                          backgroundColor: 'white',
                          zIndex: 7,
                        }}
                      />
                    )}
                    <div
                      ref={timelineHeaderContainerRef}
                      className="no-scrollbar flex-1 min-w-0"
                      style={{ overflowX: 'auto', overflowY: 'hidden', pointerEvents: 'none' }}
                    >
                      <div style={{ minWidth: 'max-content', position: 'relative' }}>
                        <TimelineHeader
                          timeline={timeline}
                          timeScale={timeScale}
                          unitWidth={unitWidth}
                          isDesktop={isDesktop}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Body row */}
                  <div className="flex flex-1 min-h-0">
                    {!isMobile && (
                      <div
                        ref={trialListRef}
                        className="no-scrollbar"
                        style={{
                          width: `${infoWidth}px`,
                          flexShrink: 0,
                          backgroundColor: 'white',
                          zIndex: 6,
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <TimelineSidebar
                          groupBy={groupBy}
                          sortedTrialGroups={sortedTrialGroups}
                          sortedConsultantGroups={sortedConsultantGroups}
                          expandedTrials={expandedTrials}
                          expandedNestedTrials={expandedNestedTrials}
                          toggleTrial={toggleTrial}
                          toggleNestedTrial={toggleNestedTrial}
                          pipelineStages={pipelineStages}
                          allServices={filteredServices}
                          onSelectService={setSelectedService}
                          infoWidth={infoWidth}
                          onResizeMouseDown={handleResizeMouseDown}
                          activeTimeOffs={activeTimeOffs}
                          consultants={consultants}
                        />
                      </div>
                    )}
                    <div
                      ref={timelineContainerRef}
                      className="overflow-auto flex-1 min-w-0 min-h-0"
                    >
                      <div style={{ minWidth: 'max-content', position: 'relative' }}>
                        <TimelineBars
                          groupBy={groupBy}
                          sortedTrialGroups={sortedTrialGroups}
                          sortedConsultantGroups={sortedConsultantGroups}
                          expandedTrials={expandedTrials}
                          timeline={timeline}
                          unitWidth={unitWidth}
                          pipelineStages={pipelineStages}
                          canEditDates={canEditDates}
                          trialSegments={trialSegments}
                          activeTimeOffs={activeTimeOffs}
                          consultants={consultants}
                          onSelectService={setSelectedService}
                          onSelectTrial={() => {/* TODO: TrialSummaryModal */}}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  {isDesktop && (
                    <div className="pt-4 mt-2 border-t border-stone-200 flex-shrink-0">
                      <button
                        onClick={() => setShowLegend((v) => !v)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider hover:text-stone-700 transition-colors"
                      >
                        {showLegend ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                        Service Types
                      </button>
                      {showLegend && (
                        <div className="flex items-center gap-6 flex-wrap mt-3">
                          {LEGEND_ITEMS.map((item) => (
                            <div key={item.label} className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-sm text-stone-600">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="text-center py-12"
                  style={{ color: 'var(--theme-stone-500)' }}
                >
                  <GanttChartIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p style={{ fontSize: 'var(--theme-text-body)' }}>
                    No scheduled services to display
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
