/**
 * deal-tracker-page.tsx — port of HotSeatersMVP/src/pages/DealTracker.jsx.
 *
 * Visual + functional parity with the bible. Reads the deals scope from the
 * D01 hook `useDealsTrialsData({ scope: 'deals' })` and owns:
 *   • view mode (next_step / trial_date / sales_stage) — session state
 *   • show-my-deals + sales-stage date/status filters — session state
 *   • the DealUrgencyBanner + DealTrackerTab (Kanban) surface
 *
 * Adapter rules applied (RULE 0 — port runs on different primitives):
 *   - base44 mutations            → useDealsTrialsData actions (updateStage, …)
 *   - useDeviceType               → useIsMobile (inside the tab)
 *   - @hello-pangea/dnd           → @dnd-kit (inside the kanban grid)
 *   - DealWizard / TrialDetails   → cleanly stubbed (D03 wizard, trial-details
 *                                   are owned by other changes); the overlay
 *                                   wiring + handlers are preserved.
 *
 * Out of scope for D02 (stubbed cleanly): the DealWizard create/edit form
 * (change-D03), CascadeDeleteDialog (change-D04), and the TrialDetails /
 * HSHTrialDetails overlays (owned by the trials feature). Their entry points
 * (onAddDeal / onSelectTrial / mark-won / restore) call the real D01 actions
 * where those exist; the form/detail panels render a "coming soon" stub.
 *
 * RULE B: this page imports only hooks. RULE F: lives in features/deals/pages.
 * HotSeatersMVP is the bible.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { differenceInDays } from 'date-fns';

import { useDealsTrialsData } from '@/features/deals/hooks/use-deals-trials-data';
import { useClientsList } from '@/features/clients/hooks/use-clients-list';
import type { Trial } from '@/features/trials/entities';
import type { DealViewMode } from '@/features/deals/business-rules/deal-kanban-buckets';

import { DealUrgencyBanner } from '@/features/deals/components/deal-urgency-banner';
import { DealTrackerTab } from '@/features/deals/components/deal-tracker-tab';
import type {
  DealDateFilter,
  DealStatusFilter,
} from '@/features/deals/components/deal-tracker-sales-stage-filters';
import type { DealRow } from '@/features/deals/components/deal-card-types';

// ─── Inline page loader (shared PageLoader not yet ported) ───────────────────

function PageLoader({ message }: { message: string }) {
  return (
    <div
      className="flex items-center justify-center py-16 lg:px-8"
      style={{ color: 'var(--theme-stone-500)', fontFamily: 'var(--theme-font-body)' }}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{ borderColor: 'var(--theme-stone-200)', borderTopColor: 'var(--theme-primary)' }}
        />
        <span style={{ fontSize: 'var(--theme-text-body)' }}>{message}</span>
      </div>
    </div>
  );
}

// ─── Stub: deal create/edit wizard (change-D03) ──────────────────────────────

function DealWizardStub({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="rounded-lg border p-6" style={{ borderColor: 'var(--theme-stone-200)', color: 'var(--theme-stone-500)' }}>
      <p>Deal wizard arrives in change-D03.</p>
      <button onClick={onCancel} style={{ marginTop: '1rem', color: 'var(--theme-stone-700)' }}>
        Cancel
      </button>
    </div>
  );
}

// ─── Stub: trial details overlay (owned by the trials feature) ───────────────

function TrialDetailsStub({ trial, onClose }: { trial: Trial; onClose: () => void }) {
  return (
    <div className="rounded-lg border p-6" style={{ borderColor: 'var(--theme-stone-200)', color: 'var(--theme-stone-500)' }}>
      <p>Details for “{trial.case_name ?? 'this deal'}” open in the trial detail surface.</p>
      <button onClick={onClose} style={{ marginTop: '1rem', color: 'var(--theme-stone-700)' }}>
        Close
      </button>
    </div>
  );
}

function trialIsHSH(trial: Trial): boolean {
  return !!(trial as unknown as Record<string, unknown>).isHSH;
}

// ─── Main page component ─────────────────────────────────────────────────────

export function DealTrackerPage() {
  const [showMyDeals, setShowMyDeals] = useState(false);
  const [viewMode, setViewMode] = useState<DealViewMode>('next_step');

  // Sales-stage-only filters (session-scoped — not persisted, same as bible).
  const [dateFilter, setDateFilter] = useState<DealDateFilter>('this_year');
  const [statusFilter, setStatusFilter] = useState<DealStatusFilter>('active');

  // Page-level overlays.
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null);
  const [editingTrial, setEditingTrial] = useState<Trial | null>(null);
  const [showForm, setShowForm] = useState(false);

  const {
    trials,
    pipelineStages,
    isLoading,
    updateStage,
  } = useDealsTrialsData({ scope: 'deals' });
  const { clients } = useClientsList();

  // Sync selectedTrial when live data patches arrive.
  useEffect(() => {
    if (selectedTrial && trials.length > 0) {
      const updated = trials.find((t) => t.id === selectedTrial.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedTrial)) {
        setSelectedTrial(updated);
      }
    }
  }, [trials, selectedTrial]);

  // Scroll to top when Details opens.
  useEffect(() => {
    if (selectedTrial) {
      const mainEl =
        document.querySelector<HTMLElement>('.main-content-with-tabs') ??
        document.querySelector<HTMLElement>('main');
      if (mainEl) mainEl.scrollTop = 0;
      window.scrollTo(0, 0);
    }
  }, [selectedTrial?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Honor "?trialId=…" / "?edit=…" deep-links once, then clear.
  useEffect(() => {
    if (trials.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const trialId = params.get('trialId');
    const editId = params.get('edit');
    if (editId) {
      const t = trials.find((x) => x.id === editId);
      if (t && !trialIsHSH(t)) {
        setEditingTrial(t);
        setShowForm(true);
      }
      window.history.replaceState({}, '', window.location.pathname);
    } else if (trialId) {
      const t = trials.find((x) => x.id === trialId);
      if (t) setSelectedTrial(t);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [trials]);

  const handleViewModeChange = useCallback((mode: DealViewMode) => setViewMode(mode), []);

  const handleAddDeal = useCallback(() => {
    setShowForm(true);
    setEditingTrial(null);
    setSelectedTrial(null);
  }, []);

  const handleAddContact = useCallback(() => {
    // Add-contact wizard (contact-only prospect) lands with the activity change.
    setShowForm(true);
    setEditingTrial(null);
    setSelectedTrial(null);
  }, []);

  // sales_stage drag-and-drop → move the deal to the destination stage (D01 action).
  const handleDragEnd = useCallback(
    (dealId: string, destStageId: string) => {
      void updateStage(dealId, destStageId);
    },
    [updateStage],
  );

  // Base deal pool (bible lines 257–271). For sales_stage + Lost, swap in
  // lost/settled deals; all other views always show active sales deals.
  const inSalesStageLostMode = viewMode === 'sales_stage' && statusFilter === 'lost';

  const allDeals = useMemo<DealRow[]>(() => {
    let pool: Trial[];
    if (inSalesStageLostMode) {
      pool = trials.filter(
        (t) => t.completion_type === 'deal_lost' || t.completion_type === 'deal_settled',
      );
    } else {
      pool = trials.filter((t) => {
        const stage = pipelineStages.find((s) => s.id === t.pipeline_stage_id);
        if (t.completion_type === 'deal_lost' || t.completion_type === 'deal_settled') return false;
        return !!stage && stage.type === 'sales';
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return pool.map((deal) => ({
      ...deal,
      daysUntilTrial: deal.start_date
        ? differenceInDays(new Date(`${deal.start_date}T00:00:00`), today)
        : null,
    }));
  }, [trials, pipelineStages, inSalesStageLostMode]);

  const overlayActive = !!selectedTrial || showForm;

  // ── Loading gate ────────────────────────────────────────────────────────
  if (isLoading) {
    return <PageLoader message="Loading deals…" />;
  }

  return (
    <div
      className="w-full lg:px-8"
      style={{
        padding: 'var(--theme-page-padding)',
        fontFamily: 'var(--theme-font-body)',
        fontSize: 'var(--theme-text-body)',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 'var(--theme-max-content-width)' }}>
        {/* Page header — hidden on mobile (matches bible) */}
        <div
          className="hidden lg:flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
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
              Deal Tracker
            </h1>
            <p style={{ fontSize: 'var(--theme-text-body)', color: 'var(--theme-stone-600)' }}>
              Track active deals and manage the sales pipeline
            </p>
          </div>
        </div>

        {/* Page-level overlays — above the tracker so it stays mounted underneath. */}
        {showForm && (
          <DealWizardStub
            onCancel={() => {
              setShowForm(false);
              if (editingTrial) setSelectedTrial(editingTrial);
              setEditingTrial(null);
            }}
          />
        )}

        {selectedTrial && !showForm && (
          <TrialDetailsStub trial={selectedTrial} onClose={() => setSelectedTrial(null)} />
        )}

        {/* Tracker content — hidden (but still mounted) when an overlay is active. */}
        <div style={overlayActive ? { display: 'none' } : undefined}>
          <DealUrgencyBanner
            deals={allDeals}
            clients={clients}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />
          <DealTrackerTab
            allDeals={allDeals}
            clients={clients}
            pipelineStages={pipelineStages}
            attorneys={[]}
            documents={[]}
            documentSigners={[]}
            consultants={[]}
            salesActivities={[]}
            userInfo={null}
            showMyDeals={showMyDeals}
            onShowMyDealsChange={setShowMyDeals}
            onSelectTrial={setSelectedTrial}
            onAddDeal={handleAddDeal}
            onAddContact={handleAddContact}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onDragEnd={handleDragEnd}
          />
        </div>
      </div>
    </div>
  );
}
