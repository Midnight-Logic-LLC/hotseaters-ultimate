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

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { differenceInDays } from 'date-fns';

import { useDealsTrialsData } from '@/features/deals/hooks/use-deals-trials-data';
import { useClientsList } from '@/features/clients/hooks/use-clients-list';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import type { Trial } from '@/features/trials/entities';
import type { DealViewMode } from '@/features/deals/business-rules/deal-kanban-buckets';

import { DealUrgencyBanner } from '@/features/deals/components/deal-urgency-banner';
import { DealTrackerTab } from '@/features/deals/components/deal-tracker-tab';
import { DealWizard } from '@/features/deals/components/deal-wizard';
import type { DealWritePayload } from '@/features/deals/hooks/use-deals-trials-data';
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

// ─── Stub: add-contact wizard (change-D04 sales-activity surface) ────────────

function AddContactWizardStub({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="rounded-lg border p-6" style={{ borderColor: 'var(--theme-stone-200)', color: 'var(--theme-stone-500)' }}>
      <p>Add Contact wizard arrives in change-D04.</p>
      <button type="button" onClick={onCancel} style={{ marginTop: '1rem', color: 'var(--theme-stone-700)' }}>
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
  const { userInfo } = useCurrentUser();

  const [showMyDeals, setShowMyDeals] = useState(false);
  const [viewMode, setViewMode] = useState<DealViewMode>('next_step');

  // Bible (DealTracker.jsx ~86–91): hydrate showMyDeals + viewMode from
  // userInfo.preferences once, the first time userInfo resolves.
  // The port's preferences are a free-form jsonb bag (`Record<string, unknown>`),
  // so we read the bible's keys (`salesHubShowMyDeals`, `dealTrackerViewMode`)
  // defensively and fall back to the bible defaults (false / 'next_step').
  // TODO(D07/prefs): persisting these back to userInfo.preferences on change
  // (bible's debounced UserInfo.update) lands with the preferences change.
  const prefsLoadedRef = useRef(false);
  useEffect(() => {
    if (!userInfo || prefsLoadedRef.current) return;
    prefsLoadedRef.current = true;
    const prefs = userInfo.preferences ?? {};
    setShowMyDeals(prefs.salesHubShowMyDeals === true);
    const savedMode = prefs.dealTrackerViewMode;
    if (savedMode === 'next_step' || savedMode === 'trial_date' || savedMode === 'sales_stage') {
      setViewMode(savedMode);
    }
  }, [userInfo]);

  // Sales-stage-only filters (session-scoped — not persisted, same as bible).
  const [dateFilter, setDateFilter] = useState<DealDateFilter>('this_year');
  const [statusFilter, setStatusFilter] = useState<DealStatusFilter>('active');

  // Page-level overlays.
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null);
  const [editingTrial, setEditingTrial] = useState<Trial | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  const {
    trials,
    pipelineStages,
    isLoading,
    updateStage,
    createDeal,
    updateDeal,
  } = useDealsTrialsData({ scope: 'deals' });
  const { clients } = useClientsList();

  // Wizard submit → create or update the deal (D03). Returns the trial so the
  // wizard can reuse it (e.g. return-to-details on edit).
  const handleWizardSubmit = useCallback(
    async (payload: DealWritePayload, isEditing: boolean): Promise<Trial> => {
      const result = isEditing
        ? await updateDeal(payload as DealWritePayload & { id: string })
        : await createDeal(payload);
      setShowForm(false);
      if (isEditing && editingTrial) setSelectedTrial(result);
      else setSelectedTrial(null);
      setEditingTrial(null);
      return result;
    },
    [createDeal, updateDeal, editingTrial],
  );

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
    // Add-contact wizard (contact-only prospect) is its OWN surface in the
    // bible — distinct from the deal wizard. The real AddContactWizard lands
    // in change-D04; until then we open a clearly-labeled contact stub so the
    // "Add Contact" and "Add Deal" buttons never share a destination.
    setShowAddContact(true);
    setShowForm(false);
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

    // Bible (DealTracker.jsx ~271): "My Deals" narrows the pool to deals whose
    // consultant is the signed-in user.
    if (showMyDeals) {
      pool = pool.filter((d) => d.consultant_id === userInfo?.id);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return pool.map((deal) => ({
      ...deal,
      daysUntilTrial: deal.start_date
        ? differenceInDays(new Date(`${deal.start_date}T00:00:00`), today)
        : null,
    }));
  }, [trials, pipelineStages, inSalesStageLostMode, showMyDeals, userInfo?.id]);

  const overlayActive = !!selectedTrial || showForm || showAddContact;

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
          <DealWizard
            trial={editingTrial}
            mode="deal"
            onSubmit={handleWizardSubmit}
            onCancel={() => {
              setShowForm(false);
              if (editingTrial) setSelectedTrial(editingTrial);
              setEditingTrial(null);
            }}
          />
        )}

        {showAddContact && (
          <AddContactWizardStub onCancel={() => setShowAddContact(false)} />
        )}

        {selectedTrial && !showForm && !showAddContact && (
          <TrialDetailsStub trial={selectedTrial} onClose={() => setSelectedTrial(null)} />
        )}

        {/* Tracker content — hidden (but still mounted) when an overlay is active. */}
        <div style={overlayActive ? { display: 'none' } : undefined}>
          {/*
           * salesActivities/attorneys/prospects arrive with the sales-activity
           * surface (change-D04); banner + contact-only cards stay empty until
           * then. The DealUrgencyBanner's three sections are derived entirely
           * from pending sales activities, so with no activity data there is
           * nothing urgent to surface — we pass empty deals/prospects/activities
           * and the banner self-suppresses (returns null) for bible parity
           * (the banner is absent when nothing is urgent).
           */}
          <DealUrgencyBanner
            deals={[]}
            prospects={[]}
            attorneys={[]}
            clients={clients}
            salesActivities={[]}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />
          <DealTrackerTab
            allDeals={allDeals}
            clients={clients}
            pipelineStages={pipelineStages}
            // attorneys/documents/documentSigners/consultants/salesActivities
            // arrive with the sales-activity surface (change-D04); contact-only
            // prospect cards + LOE status stay empty until then.
            attorneys={[]}
            documents={[]}
            documentSigners={[]}
            consultants={[]}
            salesActivities={[]}
            userInfo={userInfo}
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
