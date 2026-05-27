/**
 * deal-tracker-page.tsx — port of HotSeatersMVP/src/pages/DealTracker.jsx
 *
 * Visual + functional parity with the bible. Sub-components that have not yet
 * been ported (DealTrackerTab, PipelineTabContent, DealWizard, TrialDetails,
 * HSHTrialDetails) are rendered as placeholder stubs so the page mounts,
 * routes, and typechecks cleanly. Replace each stub with the real port as
 * those components land.
 *
 * Adapter rules applied:
 *   - base44.entities.X  → hooks + useTier1() + useTrialsList()
 *   - useTier1Data()     → useTier1() from @/app/tier1-provider
 *   - createPageUrl("X") → "/X"
 *   - base44.auth.*      → useAuth().signOut()
 *   - PageLoader         → inline spinner (shared PageLoader not yet ported)
 *   - LayoutGroup (framer-motion) → no-op wrapper (no framer dep in port)
 *
 * RULE B: this page imports only hooks — no stores, no PGlite, no Supabase.
 * RULE F: lives in src/features/deals/pages/.
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { differenceInDays } from 'date-fns';
import { Telescope, KanbanSquare } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTier1 } from '@/app/tier1-provider';
import { useTrialsList } from '@/features/trials/hooks/use-trials-list';
import { useClientsList } from '@/features/clients/hooks/use-clients-list';
import type { Trial } from '@/features/trials/entities';

// ─── Placeholder stubs — replace with real ports as they land ────────────────

interface DealTrackerTabProps {
  urgentDeals: TrialWithDays[];
  warningDeals: TrialWithDays[];
  upcomingDeals: TrialWithDays[];
  futureDeals: TrialWithDays[];
  clients: unknown[];
  pipelineStages: unknown[];
  attorneys: unknown[];
  documents: unknown[];
  documentSigners: unknown[];
  trials: Trial[];
  templates: unknown[];
  trialContacts: unknown[];
  userInfo: unknown;
  consultants: unknown[];
  salesActivities: unknown[];
  showMyDeals: boolean;
  setShowMyDeals: (v: boolean) => void;
  savePreference: (key: string, value: unknown) => Promise<void>;
  onShowMyDealsChange: (v: boolean) => void;
  onSelectTrial: (t: Trial) => void;
  onAddDeal: () => void;
}

function DealTrackerTabPlaceholder(_props: DealTrackerTabProps) {
  return (
    <div
      className="rounded-lg border p-6"
      style={{ borderColor: 'var(--theme-stone-200)', color: 'var(--theme-stone-500)' }}
    >
      Coming soon: Deal Tracker Tab
    </div>
  );
}

interface PipelineTabContentProps {
  mode: 'deals';
  onSelectTrial: (t: Trial) => void;
  onAddDeal: () => void;
}

function PipelineTabContentPlaceholder(_props: PipelineTabContentProps) {
  return (
    <div
      className="rounded-lg border p-6"
      style={{ borderColor: 'var(--theme-stone-200)', color: 'var(--theme-stone-500)' }}
    >
      Coming soon: Pipeline Tab Content
    </div>
  );
}

interface DealWizardProps {
  trial: Trial | null;
  onSubmit: (
    trialData: unknown,
    services: unknown,
    secondaryContacts: unknown,
    returnToDetails?: boolean,
  ) => void;
  onCancel: () => void;
  isLoading: boolean;
  mode: 'deal';
}

function DealWizardPlaceholder({ onCancel }: DealWizardProps) {
  return (
    <div
      className="rounded-lg border p-6"
      style={{ borderColor: 'var(--theme-stone-200)', color: 'var(--theme-stone-500)' }}
    >
      <p>Coming soon: Deal Wizard</p>
      <button
        onClick={onCancel}
        style={{ marginTop: '1rem', color: 'var(--theme-stone-700)' }}
      >
        Cancel
      </button>
    </div>
  );
}

interface TrialDetailsProps {
  trial: Trial;
  client: unknown;
  onClose: () => void;
  onEdit?: (() => void) | undefined;
  isDeal: boolean;
  isTrial: boolean;
  isLostDeal: boolean;
  onMarkAsWon?: (() => void) | undefined;
  onMarkAsLost?: (() => void) | undefined;
  onMarkAsSettled?: (() => void) | undefined;
  onMarkAsCompleted?: ((completionType: string) => void) | undefined;
  onRestore?: (() => void) | undefined;
  isProcessing: boolean;
  onDelete?: (() => void) | undefined;
}

function TrialDetailsPlaceholder({ onClose }: TrialDetailsProps) {
  return (
    <div
      className="rounded-lg border p-6"
      style={{ borderColor: 'var(--theme-stone-200)', color: 'var(--theme-stone-500)' }}
    >
      <p>Coming soon: Trial Details</p>
      <button
        onClick={onClose}
        style={{ marginTop: '1rem', color: 'var(--theme-stone-700)' }}
      >
        Close
      </button>
    </div>
  );
}

interface HSHTrialDetailsProps {
  trial: Trial;
  hiringCompany: unknown;
  onClose: () => void;
}

function HSHTrialDetailsPlaceholder({ onClose }: HSHTrialDetailsProps) {
  return (
    <div
      className="rounded-lg border p-6"
      style={{ borderColor: 'var(--theme-stone-200)', color: 'var(--theme-stone-500)' }}
    >
      <p>Coming soon: HSH Trial Details</p>
      <button
        onClick={onClose}
        style={{ marginTop: '1rem', color: 'var(--theme-stone-700)' }}
      >
        Close
      </button>
    </div>
  );
}

// ─── Inline page loader (no shared PageLoader yet) ───────────────────────────

function PageLoader({ message }: { message: string }) {
  return (
    <div
      className="flex items-center justify-center py-16 lg:px-8"
      style={{ color: 'var(--theme-stone-500)', fontFamily: 'var(--theme-font-body)' }}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{
            borderColor: 'var(--theme-stone-200)',
            borderTopColor: 'var(--theme-primary)',
          }}
        />
        <span style={{ fontSize: 'var(--theme-text-body)' }}>{message}</span>
      </div>
    </div>
  );
}

// ─── Extended Trial type for deals that have daysUntilTrial derived ──────────

interface TrialWithDays extends Trial {
  daysUntilTrial: number;
}

// ─── Bible's isHSH field is not in the port's Trial schema — access safely ───

function trialIsHSH(trial: Trial): boolean {
  return !!(trial as unknown as Record<string, unknown>).isHSH;
}

// ─── Main page component ──────────────────────────────────────────────────────

export function DealTrackerPage() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const initialTab = urlParams.get('tab') === 'pipeline' ? 'pipeline' : 'tracker';

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [showMyDeals, setShowMyDeals] = useState<boolean | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Page-level overlays (lifted above the Tabs container so the active tab
  // stays mounted underneath — ported from the bible's Phase 4 refactor)
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null);
  const [editingTrial, setEditingTrial] = useState<Trial | null>(null);
  const [showForm, setShowForm] = useState(false);

  // ── Data sources ────────────────────────────────────────────────────────────
  const { userInfo, pipelineStages, isLoading: tier1Loading } = useTier1();
  const { clients } = useClientsList();
  const { items: trials, isLoading: trialsLoading } = useTrialsList({
    companyId: userInfo?.company_id ?? null,
  });

  const isLoading = tier1Loading || trialsLoading;

  // Load show-my-deals preference from userInfo once available.
  // userInfo.preferences is not in the Tier1UserInfo type — access via unknown.
  useEffect(() => {
    if (userInfo && !prefsLoaded) {
      const raw = userInfo as unknown as Record<string, unknown>;
      const prefs = raw.preferences as Record<string, unknown> | undefined;
      setShowMyDeals((prefs?.salesHubShowMyDeals as boolean | undefined) ?? false);
      setPrefsLoaded(true);
    }
  }, [userInfo, prefsLoaded]);

  // Sync selectedTrial when RTS patches arrive (keeps the details panel live)
  useEffect(() => {
    if (selectedTrial && trials.length > 0) {
      const updated = trials.find((t) => t.id === selectedTrial.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedTrial)) {
        setSelectedTrial(updated);
      }
    }
  }, [trials, selectedTrial]);

  // Scroll to top when Details opens (prevents mid-scroll appearance on mobile)
  useEffect(() => {
    if (selectedTrial) {
      const mainEl =
        document.querySelector<HTMLElement>('.main-content-with-tabs') ??
        document.querySelector<HTMLElement>('main');
      if (mainEl) mainEl.scrollTop = 0;
      window.scrollTo(0, 0);
    }
  }, [selectedTrial?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Honor "?trialId=…" and "?edit=…" deep-links — consumed once then cleared
  useEffect(() => {
    if (trials.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const trialId = params.get('trialId');
    const editId = params.get('edit');

    if (editId) {
      const trialToEdit = trials.find((t) => t.id === editId);
      if (trialToEdit && !trialIsHSH(trialToEdit)) {
        setEditingTrial(trialToEdit);
        setShowForm(true);
      }
      window.history.replaceState({}, '', window.location.pathname);
    } else if (trialId) {
      const trialToView = trials.find((t) => t.id === trialId);
      if (trialToView) setSelectedTrial(trialToView);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [trials]);

  // ── Preference persistence (Supabase via user_info row) ────────────────────
  const savePreference = useCallback(
    async (_key: string, _value: unknown): Promise<void> => {
      // TODO: wire to Supabase user_info update when that mutation hook lands.
      // The bible used base44.entities.UserInfo.update(userInfo.id, { preferences }).
      // Stub here to keep the page functional; state is already set locally.
    },
    [],
  );

  const handleShowMyDealsChange = useCallback(
    (value: boolean) => {
      setShowMyDeals(value);
      void savePreference('salesHubShowMyDeals', value);
    },
    [savePreference],
  );

  // ── Wizard / CRUD handlers (stubs until mutations land) ────────────────────
  const handleSubmit = useCallback(
    (
      _trialData: unknown,
      _services: unknown,
      _secondaryContacts: unknown,
      _returnToDetails = false,
    ) => {
      // TODO: wire createDealMutation / updateDealMutation
      setShowForm(false);
      setEditingTrial(null);
    },
    [],
  );

  const handleEdit = useCallback((trial: Trial) => {
    setEditingTrial(trial);
    setShowForm(true);
    setSelectedTrial(null);
  }, []);

  const handleAddDeal = useCallback(() => {
    setShowForm(true);
    setEditingTrial(null);
    setSelectedTrial(null);
  }, []);

  // Status-change handlers (stubs — mutations land with DealTrackerTab port)
  const handleMarkAsWon = useCallback((_id: string) => {}, []);
  const handleMarkAsLost = useCallback((_id: string) => {}, []);
  const handleMarkAsSettled = useCallback((_id: string) => {}, []);
  const handleMarkAsCompleted = useCallback((_id: string, _completionType: string) => {}, []);
  const handleRestoreDeal = useCallback((_id: string) => {}, []);
  const handleDelete = useCallback(
    (id: string) => {
      // TODO: wire deleteDealMutation
      void id;
      setSelectedTrial(null);
    },
    [],
  );

  // ── Loading gate ─────────────────────────────────────────────────────────────
  if (isLoading || showMyDeals === null) {
    return <PageLoader message="Loading deals…" />;
  }

  // ── Business logic — filter deals (bible lines 186–208) ─────────────────────
  let deals: Trial[] = trials.filter((t) => {
    const stage = pipelineStages.find((s) => s.id === t.pipeline_stage_id);
    if (
      t.completion_type === 'deal_lost' ||
      t.completion_type === 'deal_settled'
    ) {
      return false;
    }
    return stage && stage.type === 'sales';
  });
  if (showMyDeals) {
    deals = deals.filter((d) => d.consultant_id === userInfo?.id);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dealsWithoutSignedLOE: TrialWithDays[] = deals
    .filter((deal) => {
      // documents not yet wired; treat as unsigned until DealTrackerTab lands
      return !!deal.start_date;
    })
    .map((deal) => ({
      ...deal,
      daysUntilTrial: differenceInDays(
        new Date(`${deal.start_date!}T00:00:00`),
        today,
      ),
    }))
    .filter((deal) => deal.daysUntilTrial >= 0)
    .sort((a, b) => a.daysUntilTrial - b.daysUntilTrial);

  const urgentDeals = dealsWithoutSignedLOE.filter((d) => d.daysUntilTrial < 10);
  const warningDeals = dealsWithoutSignedLOE.filter(
    (d) => d.daysUntilTrial >= 10 && d.daysUntilTrial <= 30,
  );
  const upcomingDeals = dealsWithoutSignedLOE.filter(
    (d) => d.daysUntilTrial > 30 && d.daysUntilTrial <= 90,
  );
  const futureDeals = dealsWithoutSignedLOE.filter((d) => d.daysUntilTrial > 90);

  // ── Permission flags (bible lines 210–215) ────────────────────────────────
  const isOwnerOrAdmin =
    userInfo?.company_role === 'owner' || userInfo?.company_role === 'admin';
  const isSales = userInfo?.company_role === 'sales';

  const canEdit = (trial: Trial) =>
    isOwnerOrAdmin || (isSales && trial.consultant_id === userInfo?.id);
  const canComplete = (trial: Trial) =>
    isOwnerOrAdmin || (isSales && trial.consultant_id === userInfo?.id);

  // ── Overlay / processing flags ────────────────────────────────────────────
  const overlayActive = !!selectedTrial || showForm;

  // isProcessing stub — set to false until mutation hooks land
  const isProcessing = false;

  // ── Stage + type derivation for TrialDetails (bible lines 269–273) ─────────
  const deriveTrialFlags = (trial: Trial) => {
    const stage = pipelineStages.find((s) => s.id === trial.pipeline_stage_id);
    const isDeal =
      stage?.type === 'sales' &&
      trial.completion_type !== 'deal_lost' &&
      trial.completion_type !== 'deal_settled';
    const isLostDeal =
      trial.completion_type === 'deal_lost' ||
      trial.completion_type === 'deal_settled';
    const isTrial = !isDeal && !isLostDeal;
    return { isDeal, isLostDeal, isTrial };
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="w-full lg:px-8"
      style={{
        padding: 'var(--theme-page-padding)',
        fontFamily: 'var(--theme-font-body)',
        fontSize: 'var(--theme-text-body)',
      }}
    >
      <div
        className="mx-auto"
        style={{ maxWidth: 'var(--theme-max-content-width)' }}
      >
        {/* Page header — hidden on mobile (matches bible) */}
        <div
          className="hidden lg:flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
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
              Deal Tracker
            </h1>
            <p
              style={{
                fontSize: 'var(--theme-text-body)',
                color: 'var(--theme-stone-600)',
              }}
            >
              Track active deals and manage the sales pipeline
            </p>
          </div>
        </div>

        {/* Page-level overlays — rendered ABOVE the Tabs container so the active
            tab stays mounted underneath, preserving its scroll/state on close. */}
        {showForm && (
          <DealWizardPlaceholder
            trial={editingTrial}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              if (editingTrial) setSelectedTrial(editingTrial);
              setEditingTrial(null);
            }}
            isLoading={false}
            mode="deal"
          />
        )}

        {selectedTrial && !showForm && trialIsHSH(selectedTrial) && (
          <HSHTrialDetailsPlaceholder
            trial={selectedTrial}
            hiringCompany={null}
            onClose={() => setSelectedTrial(null)}
          />
        )}

        {selectedTrial && !showForm && !trialIsHSH(selectedTrial) && (
          <TrialDetailsRenderer
            trial={selectedTrial}
            clients={clients}
            onClose={() => setSelectedTrial(null)}
            onEdit={canEdit(selectedTrial) ? () => handleEdit(selectedTrial) : undefined}
            onMarkAsWon={
              canComplete(selectedTrial)
                ? () => handleMarkAsWon(selectedTrial.id)
                : undefined
            }
            onMarkAsLost={
              canComplete(selectedTrial)
                ? () => handleMarkAsLost(selectedTrial.id)
                : undefined
            }
            onMarkAsSettled={
              canComplete(selectedTrial)
                ? () => handleMarkAsSettled(selectedTrial.id)
                : undefined
            }
            onMarkAsCompleted={
              canComplete(selectedTrial)
                ? (ct) => handleMarkAsCompleted(selectedTrial.id, ct)
                : undefined
            }
            onRestore={
              canComplete(selectedTrial)
                ? () => handleRestoreDeal(selectedTrial.id)
                : undefined
            }
            onDelete={
              isOwnerOrAdmin ? () => handleDelete(selectedTrial.id) : undefined
            }
            isProcessing={isProcessing}
            deriveTrialFlags={deriveTrialFlags}
            pipelineStages={pipelineStages}
          />
        )}

        {/* Tabs — hidden (but still mounted) when an overlay is active.
            Base UI Tabs does not have a forceMount equivalent; we keep both
            panels visible by toggling the container display — same preservation
            semantics as the bible's forceMount pattern. */}
        <div style={overlayActive ? { display: 'none' } : undefined}>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="mb-8"
          >
            <div style={{ marginBottom: 'var(--theme-section-gap)' }}>
              <TabsList className="w-full sm:w-fit justify-start h-auto">
                <TabsTrigger
                  value="tracker"
                  className="flex items-center gap-1.5 text-xs sm:text-sm sm:gap-2 flex-1 sm:flex-initial whitespace-normal text-center"
                >
                  <Telescope className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  Tracker
                </TabsTrigger>
                <TabsTrigger
                  value="pipeline"
                  className="flex items-center gap-1.5 text-xs sm:text-sm sm:gap-2 flex-1 sm:flex-initial whitespace-normal text-center"
                >
                  <KanbanSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  Pipeline
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="tracker" className="m-0">
              <DealTrackerTabPlaceholder
                urgentDeals={urgentDeals}
                warningDeals={warningDeals}
                upcomingDeals={upcomingDeals}
                futureDeals={futureDeals}
                clients={clients}
                pipelineStages={pipelineStages}
                attorneys={[]}
                documents={[]}
                documentSigners={[]}
                trials={trials}
                templates={[]}
                trialContacts={[]}
                userInfo={userInfo}
                consultants={[]}
                salesActivities={[]}
                showMyDeals={showMyDeals ?? false}
                setShowMyDeals={setShowMyDeals}
                savePreference={savePreference}
                onShowMyDealsChange={handleShowMyDealsChange}
                onSelectTrial={setSelectedTrial}
                onAddDeal={handleAddDeal}
              />
            </TabsContent>

            <TabsContent value="pipeline" className="m-0">
              <PipelineTabContentPlaceholder
                mode="deals"
                onSelectTrial={setSelectedTrial}
                onAddDeal={handleAddDeal}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ─── Helper sub-component: TrialDetails renderer ──────────────────────────────
// Extracted to avoid the IIFE pattern from the bible which doesn't play nicely
// with TypeScript's strict JSX return typing.

interface TrialDetailsRendererProps {
  trial: Trial;
  clients: unknown[];
  onClose: () => void;
  onEdit?: (() => void) | undefined;
  onMarkAsWon?: (() => void) | undefined;
  onMarkAsLost?: (() => void) | undefined;
  onMarkAsSettled?: (() => void) | undefined;
  onMarkAsCompleted?: ((completionType: string) => void) | undefined;
  onRestore?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  isProcessing: boolean;
  pipelineStages: unknown[];
  deriveTrialFlags: (trial: Trial) => {
    isDeal: boolean;
    isLostDeal: boolean;
    isTrial: boolean;
  };
}

function TrialDetailsRenderer({
  trial,
  clients,
  onClose,
  onEdit,
  onMarkAsWon,
  onMarkAsLost,
  onMarkAsSettled,
  onMarkAsCompleted,
  onRestore,
  onDelete,
  isProcessing,
  deriveTrialFlags,
}: TrialDetailsRendererProps) {
  const { isDeal, isLostDeal, isTrial } = deriveTrialFlags(trial);
  const client = clients.find(
    (c) => (c as Record<string, unknown>).id === trial.client_id,
  );

  return (
    <TrialDetailsPlaceholder
      trial={trial}
      client={client}
      onClose={onClose}
      isDeal={isDeal}
      isTrial={isTrial}
      isLostDeal={isLostDeal}
      isProcessing={isProcessing}
      {...(onEdit !== undefined ? { onEdit } : {})}
      {...(onMarkAsWon !== undefined ? { onMarkAsWon } : {})}
      {...(onMarkAsLost !== undefined ? { onMarkAsLost } : {})}
      {...(onMarkAsSettled !== undefined ? { onMarkAsSettled } : {})}
      {...(onMarkAsCompleted !== undefined ? { onMarkAsCompleted } : {})}
      {...(onRestore !== undefined ? { onRestore } : {})}
      {...(onDelete !== undefined ? { onDelete } : {})}
    />
  );
}
