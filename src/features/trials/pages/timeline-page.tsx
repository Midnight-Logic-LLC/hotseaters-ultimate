/**
 * timeline-page.tsx
 *
 * Port of HotSeatersMVP/src/pages/Timeline.jsx.
 *
 * Architecture invariants (CLAUDE.md RULES B/C/D):
 *   - This file is a React page component; it imports hooks only — no stores,
 *     no Supabase, no Electric, no PGlite.
 *   - Data from the entity graph flows through useTier1() (Tier-1).
 *   - Tier-2 trial/service data is stubbed as empty arrays pending the
 *     trials-store Tier-2 integration.
 *
 * Visual + functional parity with bible:
 *   - Page title: "Trial Timeline"
 *   - Subtitle: "Timeline view of scheduled trials"
 *   - Sub-components not yet ported: rendered as clearly-labelled stubs.
 *   - All CSS tokens, visible strings, and layout structure match the bible.
 *   - Empty-state icon + copy: "No scheduled services to display".
 *   - Legend: Pre-Trial, In Trial, HSH Pre-Trial, HSH In Trial, Deal
 *     Pre-Trial, Deal In Trial, Time Off.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GanttChart as GanttChartIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTier1 } from '@/app/tier1-provider';

// ─── Stub helpers ────────────────────────────────────────────────────────────

/** Rendered in place of every sub-component that isn't yet ported. */
function ComingSoonStub({ name }: { name: string }) {
  return (
    <div
      style={{
        padding: '8px 12px',
        border: '1px dashed var(--theme-stone-300)',
        borderRadius: '6px',
        color: 'var(--theme-stone-500)',
        fontSize: '12px',
        background: 'var(--theme-stone-50)',
        textAlign: 'center',
      }}
    >
      {name} — Coming soon
    </div>
  );
}

// ─── Device detection (lightweight, no external dep) ─────────────────────────

function useDeviceType() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440,
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return {
    isMobile: width < 768,
    isDesktop: width >= 1024,
  };
}

// ─── Legend ──────────────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { color: '#93C5FD', label: 'Pre-Trial (Hourly)' },
  { color: '#3B82F6', label: 'In Trial (Daily Min)' },
  { color: '#D8B4FE', label: 'HSH Pre-Trial (Hourly)' },
  { color: '#A855F7', label: 'HSH In Trial (Daily Min)' },
  { color: '#D1D5DB', label: 'Deal Pre-Trial (Hourly)' },
  { color: '#6B7280', label: 'Deal In Trial (Daily Min)' },
  { color: '#34D399', label: 'Time Off' }, // emerald-400
] as const;

// ─── Main page ────────────────────────────────────────────────────────────────

export function TimelinePage() {
  // ── Tier-1 (user, company, pipelineStages) ────────────────────────────────
  const { userInfo, isLoading: tier1Loading } = useTier1();

  // ── Tier-2 stubs (trials store pending) ──────────────────────────────────
  // These are intentionally empty until the trials-store Tier-2 integration
  // lands. The page renders the empty-state correctly in the interim.
  const trials: unknown[] = [];

  // ── Local UI state (mirrors bible 1:1) ───────────────────────────────────
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [showRevenueChart, setShowRevenueChart] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'gantt'>('list');
  const [isPortrait, setIsPortrait] = useState(() =>
    typeof window !== 'undefined'
      ? window.innerWidth < window.innerHeight
      : false,
  );
  const [infoWidth, setInfoWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);

  const timelineContainerRef = useRef<HTMLDivElement>(null);

  const { isMobile, isDesktop } = useDeviceType();

  // ── Prefs: load from userInfo once tier-1 ready ──────────────────────────
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  useEffect(() => {
    if (userInfo && !prefsLoaded) {
      const prefs = (userInfo as { preferences?: Record<string, unknown> })
        .preferences ?? {};
      setIsFullWidth((prefs.schedule_full_width as boolean | undefined) ?? false);
      setShowRevenueChart(
        (prefs.schedule_show_revenue_chart as boolean | undefined) ?? false,
      );
      setMobileViewMode(
        ((prefs.schedule_mobile_view as string | undefined) ?? 'list') as
          | 'list'
          | 'gantt',
      );
      setPrefsLoaded(true);
    }
  }, [userInfo, prefsLoaded]);

  // ── Orientation listener ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = () =>
      setIsPortrait(window.innerWidth < window.innerHeight);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // ── Hide bottom tab bar in mobile landscape (bible behaviour) ────────────
  useEffect(() => {
    const shouldHide = !isDesktop && !isPortrait;
    if (shouldHide) {
      document.body.classList.add('hide-bottom-tab-bar');
    } else {
      document.body.classList.remove('hide-bottom-tab-bar');
    }
    return () => document.body.classList.remove('hide-bottom-tab-bar');
  }, [isDesktop, isPortrait]);

  // ── Resize handle for sidebar divider ────────────────────────────────────
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      setIsResizing(true);
      const touchEvent = e as React.TouchEvent;
      const clientX =
        'touches' in e && touchEvent.touches.length > 0
          ? touchEvent.touches[0]!.clientX
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
      const delta = clientX - resizeStartXRef.current;
      setInfoWidth(
        Math.max(100, Math.min(400, resizeStartWidthRef.current + delta)),
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

  // ── Derived: "are we still loading core data?" ───────────────────────────
  // Mirrors bible's coreDataLoading gate: !prefsLoaded || !userInfo?.company_id
  const coreDataLoading =
    !prefsLoaded || !userInfo?.company_id || tier1Loading;

  // ── No scheduled services (Tier-2 stub means this is always true) ────────
  // The empty-state branch in the bible uses allServices.length === 0.
  const hasServices = trials.length > 0;

  // ─── Render ──────────────────────────────────────────────────────────────

  if (coreDataLoading) {
    // Mirrors bible's <PageLoader message="Loading timeline..." />
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
        {/* ── Page header (hidden on mobile, matches bible lg:flex) ── */}
        <div
          className="schedule-page-header hidden lg:flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
          style={{ gap: 'var(--theme-card-gap)' }}
        >
          <div>
            <h1
              className="font-bold mb-2"
              style={{
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

        {/* ── Toolbar stub ── */}
        <div className="mb-2">
          <ComingSoonStub name="TimelineToolbar" />
        </div>

        {/* ── Mobile list view / portrait prompt / desktop Gantt ── */}
        {isMobile && mobileViewMode === 'list' ? (
          /* Mobile list view stub */
          <div className="flex-1 min-h-0">
            <ComingSoonStub name="MobileTimelineListView" />
          </div>
        ) : isMobile && isPortrait ? (
          /* Landscape prompt stub */
          <div className="flex-1 min-h-0">
            <ComingSoonStub name="MobileLandscapePrompt" />
          </div>
        ) : (
          /* Desktop / landscape Gantt card */
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
                /* ── Gantt body (stubbed sub-components) ── */
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    minHeight: 0,
                  }}
                >
                  {/* Top row: sidebar label column + header */}
                  <div className="flex flex-shrink-0">
                    {!isMobile && (
                      <div
                        style={{
                          width: `${infoWidth}px`,
                          flexShrink: 0,
                          backgroundColor: 'white',
                          zIndex: 7,
                          overflow: 'visible',
                        }}
                      >
                        {showRevenueChart && (
                          <div style={{ height: '96px', marginTop: '8px' }}>
                            <ComingSoonStub name="RevenueChartLabels" />
                          </div>
                        )}
                      </div>
                    )}
                    <div
                      className="no-scrollbar flex-1 min-w-0"
                      style={{
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        style={{ minWidth: 'max-content', position: 'relative' }}
                      >
                        {showRevenueChart && (
                          <ComingSoonStub name="TimelineRevenueChart" />
                        )}
                        <ComingSoonStub name="TimelineHeader" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom row: sidebar + bars */}
                  <div className="flex flex-1 min-h-0">
                    {!isMobile && (
                      <div
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
                        <ComingSoonStub name="TimelineSidebar" />
                        {/* Resize handle */}
                        <div
                          onMouseDown={handleMouseDown}
                          onTouchStart={handleMouseDown}
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            cursor: 'col-resize',
                            zIndex: 10,
                          }}
                        />
                      </div>
                    )}
                    <div
                      ref={timelineContainerRef}
                      className="overflow-auto flex-1 min-w-0 min-h-0"
                    >
                      <div
                        style={{ minWidth: 'max-content', position: 'relative' }}
                      >
                        <ComingSoonStub name="TimelineBars" />
                      </div>
                    </div>
                  </div>

                  {/* Legend (desktop only) */}
                  {isDesktop && (
                    <div className="pt-4 mt-2 border-t border-stone-200 flex-shrink-0">
                      <button
                        onClick={() => setShowLegend(!showLegend)}
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
                            <div
                              key={item.label}
                              className="flex items-center gap-2"
                            >
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-sm text-stone-600">
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* ── Empty state (bible copy verbatim) ── */
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
