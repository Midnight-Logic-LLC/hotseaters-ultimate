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
import { toast } from 'sonner';

import { useDealsTrialsData } from '@/features/deals/hooks/use-deals-trials-data';
import { useClientsList } from '@/features/clients/hooks/use-clients-list';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useTeam } from '@/features/company/hooks/use-team';
import { useSalesActivities } from '@/features/deals/hooks/use-sales-activities';
import type { Trial } from '@/features/trials/entities';
import type { DealViewMode } from '@/features/deals/business-rules/deal-kanban-buckets';

import { DealUrgencyBanner } from '@/features/deals/components/deal-urgency-banner';
import { DealTrackerTab } from '@/features/deals/components/deal-tracker-tab';
import { DealWizard } from '@/features/deals/components/deal-wizard';
import { AddContactWizard } from '@/features/deals/components/add-contact-wizard';
import type { DealWritePayload } from '@/features/deals/hooks/use-deals-trials-data';
import type {
  DealDateFilter,
  DealStatusFilter,
} from '@/features/deals/components/deal-tracker-sales-stage-filters';
import type {
  AttorneyRow,
  DealRow,
  SalesActivityRow,
} from '@/features/deals/components/deal-card-types';

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
  return 'isHSH' in trial && !!(trial as Record<string, unknown>).isHSH;
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
    deleteDeal,
    deleteDealChildren,
    invalidate,
  } = useDealsTrialsData({ scope: 'deals' });
  const { clients } = useClientsList();
  const { members } = useTeam(userInfo?.company_id ?? null);
  const { salesActivities, attorneys, prospects, reload: reloadActivities } =
    useSalesActivities();

  // Card props mapped to the minimal shapes the cards consume.
  const cardAttorneys = useMemo<AttorneyRow[]>(
    () =>
      attorneys.map((a) => ({
        id: a.id,
        client_id: a.client_id,
        first_name: a.first_name,
        last_name: a.last_name,
        email: a.email,
        phone: a.phone,
        is_active_prospect: a.is_active_prospect,
      })),
    [attorneys],
  );
  const cardProspects = useMemo<AttorneyRow[]>(
    () =>
      prospects.map((a) => ({
        id: a.id,
        client_id: a.client_id,
        first_name: a.first_name,
        last_name: a.last_name,
        email: a.email,
        phone: a.phone,
        is_active_prospect: a.is_active_prospect,
      })),
    [prospects],
  );
  const cardActivities = useMemo<SalesActivityRow[]>(
    () =>
      salesActivities.map((a) => ({
        id: a.id,
        trial_id: a.trial_id,
        attorney_id: a.attorney_id,
        status: a.status,
        scheduled_date: a.scheduled_date,
        activity_type: a.activity_type,
        content: a.content,
      })),
    [salesActivities],
  );
  const consultants = useMemo(
    () =>
      members.map((m) => ({
        id: m.id,
        first_name: m.first_name,
        last_name: m.last_name,
      })),
    [members],
  );

  // Wizard submit → create or update the deal (D03). Returns the trial so the
  // wizard can reuse it (e.g. return-to-details on edit). On failure we surface
  // a toast, keep the wizard open (don't clear showForm), and invalidate so any
  // partial write reconciles from server state, then re-throw so the wizard's
  // own catch can show its inline error too.
  const handleWizardSubmit = useCallback(
    async (payload: DealWritePayload, isEditing: boolean): Promise<Trial> => {
      try {
        const result = isEditing
          ? await updateDeal(payload as DealWritePayload & { id: string })
          : await createDeal(payload);
        setShowForm(false);
        if (isEditing && editingTrial) setSelectedTrial(result);
        else setSelectedTrial(null);
        setEditingTrial(null);
        return result;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : `Failed to ${isEditing ? 'update' : 'create'} deal`;
        toast.error(message);
        invalidate();
        throw err;
      }
    },
    [createDeal, updateDeal, editingTrial, invalidate],
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

  // AddContactWizard renders as a modal (self-shows via `open`), so it does NOT
  // hide the tracker underneath — only the deal wizard + details overlays do.
  const overlayActive = !!selectedTrial || showForm;

  const handleAddDealForContact = useCallback((attorney: AttorneyRow) => {
    // Bible: "Add Deal" on a contact-only card opens the deal wizard. The
    // wizard's contact prefill from an attorney is a D-later refinement; for
    // now this opens the create-deal wizard (same destination as Add Deal).
    void attorney;
    setShowForm(true);
    setEditingTrial(null);
    setSelectedTrial(null);
  }, []);

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

        <AddContactWizard
          open={showAddContact}
          onOpenChange={setShowAddContact}
          userInfo={userInfo}
          onCreated={() => {
            setShowAddContact(false);
            reloadActivities();
          }}
        />

        {selectedTrial && !showForm && !showAddContact && (
          <TrialDetailsStub trial={selectedTrial} onClose={() => setSelectedTrial(null)} />
        )}

        {/* Tracker content — hidden (but still mounted) when an overlay is active. */}
        <div style={overlayActive ? { display: 'none' } : undefined}>
          {/*
           * D04: the urgency banner + cards consume real sales-activity data.
           * The banner derives its three sections (Needs Attention / Overdue /
           * Due Today) from pending activities anchored to the active deal pool
           * and the contact-only prospects; it self-suppresses (returns null)
           * when nothing is urgent, matching the bible.
           */}
          <DealUrgencyBanner
            deals={allDeals}
            prospects={cardProspects}
            attorneys={cardAttorneys}
            clients={clients}
            salesActivities={cardActivities}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />
          <DealTrackerTab
            allDeals={allDeals}
            prospectAttorneys={cardProspects}
            clients={clients}
            pipelineStages={pipelineStages}
            attorneys={cardAttorneys}
            documents={[]}
            documentSigners={[]}
            consultants={consultants}
            salesActivities={cardActivities}
            userInfo={userInfo}
            showMyDeals={showMyDeals}
            onShowMyDealsChange={setShowMyDeals}
            onSelectTrial={setSelectedTrial}
            onAddDeal={handleAddDeal}
            onAddContact={handleAddContact}
            onAddDealForContact={handleAddDealForContact}
            onDeleteTrial={async (id) => {
              await deleteDeal(id);
              reloadActivities();
            }}
            onDeleteTrialChildren={deleteDealChildren}
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
