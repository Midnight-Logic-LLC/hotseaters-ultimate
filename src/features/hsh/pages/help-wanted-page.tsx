/**
 * help-wanted-page.tsx — HotSeatHub: post subcontractor needs and review responses.
 *
 * BIBLE: HotSeatersMVP/src/pages/HelpWanted.jsx (1082 lines)
 *
 * Visual/functional parity notes
 * ────────────────────────────────
 * - Page header: "Help Wanted" + HSH sub-copy + "Send Referral Invitation" button
 *   (desktop only, hidden on mobile).
 * - `marketplace_post_jobs` guard: returns null when disabled (matches bible).
 * - Toolbar (MarketplaceToolbar stub) with search, tab, date filter, view,
 *   group-by, row-tint options.
 * - Three view modes: kanban / card / list — rendered as typed stubs.
 * - Request form dialog (UnassignedServicesList stub inside Dialog).
 * - Cancel HSH Agreement AlertDialog.
 * - Cancel Marketplace Request AlertDialog.
 * - ReferralInviteForm stub.
 * - ServiceAssignmentModal stub.
 * - Unassigned Services section (owner-only, two panels).
 * - AcceptConfirmationModal stub.
 * - All var(--theme-*) tokens referenced verbatim.
 * - All business rules preserved (filteredRequests, openRequests, filledRequests,
 *   completedRequests, cancelledRequests, date-range filter, hasTimeEntries guard).
 * - Tier-2 data stubbed as empty arrays until HSH store lands.
 *
 * RULE B: no store imports — hooks only.
 * RULE F: src/features/hsh/pages/
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Orbit } from 'lucide-react';
import { toast } from 'sonner';
import { useTier1 } from '@/app/tier1-provider';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

// ── Tier-2 data stubs (replace with real HSH store hooks when they land) ──────
const EMPTY_ARR: never[] = [];

// ── Minimal type scaffolding for local business-rule clarity ──────────────────
interface HWRequest {
  id: string;
  status: string;
  service_name?: string;
  description?: string;
  location?: string;
  case_name?: string;
  created_date?: string;
  trial_service_id?: string;
}

interface HWResponse {
  id: string;
  request_id: string;
  status: string;
  responding_company_id?: string;
  consultant_id?: string;
}

interface HWAssignment {
  id: string;
  request_id: string;
  status: string;
  subcontractor_company_id?: string;
  consultant_first_name?: string;
  consultant_last_name?: string;
}

type DateFilterKey =
  | 'all_time'
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_week'
  | 'last_month'
  | 'this_year'
  | 'last_year'
  | 'custom';

// ── Inline stub sub-components ────────────────────────────────────────────────
function StubView({ label }: { label: string }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--theme-card-bg)',
        borderRadius: 'var(--theme-card-radius)',
        border: '1px solid var(--theme-stone-200)',
        padding: 'var(--theme-card-padding)',
        boxShadow: 'var(--theme-card-shadow)',
        minHeight: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <p className="text-xs text-center" style={{ color: 'var(--theme-stone-500)' }}>
        {label} — coming soon
      </p>
    </div>
  );
}

function StubPanel({ title }: { title: string }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--theme-card-bg)',
        borderRadius: 'var(--theme-card-radius)',
        border: '1px solid var(--theme-stone-200)',
        padding: 'var(--theme-card-padding)',
        boxShadow: 'var(--theme-card-shadow)',
        minHeight: 120,
      }}
    >
      <p className="font-semibold text-sm mb-2" style={{ color: 'var(--theme-stone-900)' }}>
        {title}
      </p>
      <p className="text-xs" style={{ color: 'var(--theme-stone-500)' }}>
        Coming soon
      </p>
    </div>
  );
}

// ── Date range helper (verbatim business logic from bible lines 586–606) ──────
function getDateRange(
  dateFilter: DateFilterKey,
  customDateRange: { from: Date | null; to: Date | null },
): { from: Date; to: Date } | null {
  if (dateFilter === 'all_time') return null;
  const now = new Date();
  let from: Date;
  let to: Date;
  switch (dateFilter) {
    case 'today':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      to = new Date(from);
      to.setHours(23, 59, 59, 999);
      break;
    case 'this_week':
      from = new Date(now);
      from.setDate(now.getDate() - now.getDay());
      from.setHours(0, 0, 0, 0);
      to = new Date(from);
      to.setDate(from.getDate() + 6);
      to.setHours(23, 59, 59, 999);
      break;
    case 'this_month':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'last_week':
      to = new Date(now);
      to.setDate(now.getDate() - now.getDay() - 1);
      to.setHours(23, 59, 59, 999);
      from = new Date(to);
      from.setDate(to.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      break;
    case 'last_month':
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'this_year':
      from = new Date(now.getFullYear(), 0, 1);
      to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'last_year':
      from = new Date(now.getFullYear() - 1, 0, 1);
      to = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
    case 'custom':
      if (!customDateRange.from) return null;
      from = new Date(customDateRange.from);
      from.setHours(0, 0, 0, 0);
      to = customDateRange.to ? new Date(customDateRange.to) : new Date(from);
      to.setHours(23, 59, 59, 999);
      break;
    default:
      return null;
  }
  return { from, to };
}

// ── Page ─────────────────────────────────────────────────────────────────────
export function HelpWantedPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [cancelConfirmRequest, setCancelConfirmRequest] = useState<HWRequest | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [selectedService, setSelectedService] = useState<unknown>(null);
  const [viewType, setViewType] = useState<'list' | 'card' | 'kanban'>('list');
  const [confirmingResponseId, setConfirmingResponseId] = useState<{
    responseId: string;
    requestId: string;
  } | null>(null);
  const [decliningResponseId, _setDecliningResponseId] = useState<string | null>(null);
  const [cancellingAgreement, setCancellingAgreement] = useState<HWAssignment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [dateFilter, setDateFilter] = useState<DateFilterKey>('all_time');
  // customDateRange: managed but not yet wired to toolbar custom-range UI
  const [customDateRange, _setCustomDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [showRowTint, setShowRowTint] = useState(false);

  const { userInfo, company, isLoading: tier1Loading } = useTier1();
  const isMobile = useIsMobile();

  const companyId = userInfo?.company_id;

  // ── Tier-2 stubs (HSH store pending) ─────────────────────────────────────
  const myRequests: HWRequest[] = EMPTY_ARR;
  const receivedResponses: HWResponse[] = EMPTY_ARR;
  const hiredSubcontractors: HWAssignment[] = EMPTY_ARR;
  const trialServiceAssignments: unknown[] = EMPTY_ARR;
  const services: unknown[] = EMPTY_ARR;
  const pipelineStages: unknown[] = EMPTY_ARR;
  const clients: unknown[] = EMPTY_ARR;
  const allTrialServices: unknown[] = EMPTY_ARR;
  const subcontractorConsultants: unknown[] = EMPTY_ARR;
  const consultants: unknown[] = EMPTY_ARR;
  const consultantServices: unknown[] = EMPTY_ARR;
  const sentToLookup = { users: {}, companies: {} };
  const isHSHDataLoading = false;
  const timeEntriesByRequest: Record<string, boolean> = {};

  void services;
  void pipelineStages;
  void clients;
  void allTrialServices;
  void subcontractorConsultants;
  void consultants;
  void consultantServices;
  void sentToLookup;
  void trialServiceAssignments;
  void _setDecliningResponseId;
  void decliningResponseId;
  void collapsedSections;
  void selectedService;
  void showReferralForm;
  void confirmingResponseId;
  void cancellingAgreement;
  void hiredSubcontractors;
  void receivedResponses;
  void groupBy;
  void showRowTint;
  void showInactive;
  void prefsLoaded;
  void cancelConfirmRequest;
  void showRequestForm;

  // ── Load preferences once ─────────────────────────────────────────────────
  useEffect(() => {
    if (userInfo && !prefsLoaded) {
      const prefs = (userInfo as unknown as Record<string, unknown>).preferences as
        | Record<string, unknown>
        | undefined;
      setViewType((prefs?.helpWantedViewType as 'list' | 'card' | 'kanban') ?? 'list');
      setShowInactive((prefs?.helpWantedShowInactive as boolean) ?? false);
      setPrefsLoaded(true);
    }
  }, [userInfo, prefsLoaded]);

  // ── View change handler ────────────────────────────────────────────────────
  const handleViewChange = useCallback(
    (newView: 'list' | 'card' | 'kanban') => {
      setViewType(newView);
      if (newView === 'kanban' || newView === 'card') {
        if (activeTab === 'all') {
          setActiveTab('active');
          setShowInactive(false);
        } else {
          setShowInactive(activeTab === 'inactive');
        }
      }
    },
    [activeTab],
  );

  // ── hasTimeEntries business rule (bible lines 544–547) ────────────────────
  const hasTimeEntries = (request: HWRequest) => {
    if (!request.trial_service_id) return false;
    return timeEntriesByRequest[request.trial_service_id] || false;
  };

  void hasTimeEntries;

  // ── Date range & filtered requests (business rules lines 586–641) ─────────
  const activeDateRange = useMemo(
    () => getDateRange(dateFilter, customDateRange),
    [dateFilter, customDateRange],
  );

  const filteredRequests = useMemo(
    () =>
      myRequests.filter((req) => {
        const matchesSearch =
          !searchQuery ||
          req.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.case_name?.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
        if (activeDateRange) {
          const postedDate = req.created_date ? new Date(req.created_date) : null;
          if (!postedDate || postedDate < activeDateRange.from || postedDate > activeDateRange.to)
            return false;
        }
        return true;
      }),
    [myRequests, searchQuery, activeDateRange],
  );

  const openRequests = useMemo(
    () => filteredRequests.filter((r) => r.status === 'open'),
    [filteredRequests],
  );

  const allFilledRequests = useMemo(
    () => filteredRequests.filter((r) => r.status === 'filled'),
    [filteredRequests],
  );

  const completedRequests = useMemo(
    () =>
      allFilledRequests.filter((r) => {
        const assignment = hiredSubcontractors.find((a) => a.request_id === r.id);
        return assignment && assignment.status === 'completed';
      }),
    [allFilledRequests, hiredSubcontractors],
  );

  const cancelledAssignmentRequests = useMemo(
    () =>
      allFilledRequests.filter((r) => {
        const assignment = hiredSubcontractors.find((a) => a.request_id === r.id);
        return assignment && assignment.status === 'cancelled';
      }),
    [allFilledRequests, hiredSubcontractors],
  );

  const filledRequests = useMemo(
    () =>
      allFilledRequests.filter((r) => {
        const assignment = hiredSubcontractors.find((a) => a.request_id === r.id);
        return !assignment || (assignment.status !== 'completed' && assignment.status !== 'cancelled');
      }),
    [allFilledRequests, hiredSubcontractors],
  );

  const cancelledRequests = useMemo(
    () => [
      ...filteredRequests.filter((r) => r.status === 'cancelled'),
      ...cancelledAssignmentRequests,
    ],
    [filteredRequests, cancelledAssignmentRequests],
  );

  void openRequests;
  void filledRequests;
  void completedRequests;
  void cancelledRequests;
  void dateFilter;
  void customDateRange;
  void activeTab;

  const getAssignmentForRequest = (requestId: string) =>
    hiredSubcontractors.find((a) => a.request_id === requestId);

  void getAssignmentForRequest;

  const handleCancelRequest = (request: HWRequest) => setCancelConfirmRequest(request);
  void handleCancelRequest;

  const toggleSection = (section: string) =>
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  void toggleSection;

  // ── Effective view type: mobile always gets card ───────────────────────────
  const effectiveViewType = isMobile ? 'card' : viewType;

  // ── Loading / access guards ───────────────────────────────────────────────
  if (tier1Loading || !companyId || !company) {
    return (
      <div className="flex items-center gap-2 lg:px-8" style={{ padding: 'var(--theme-page-padding)' }}>
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--theme-stone-500)' }} />
        <span className="text-sm" style={{ color: 'var(--theme-stone-500)' }}>
          Loading HotSeatHub data…
        </span>
      </div>
    );
  }

  // marketplace_post_jobs guard (bible: returns null when disabled)
  if (!company.marketplace_post_jobs) {
    return null;
  }

  if (!viewType || isHSHDataLoading) {
    return (
      <div className="flex items-center gap-2 lg:px-8" style={{ padding: 'var(--theme-page-padding)' }}>
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--theme-stone-500)' }} />
        <span className="text-sm" style={{ color: 'var(--theme-stone-500)' }}>
          Loading HotSeatHub data…
        </span>
      </div>
    );
  }

  const isOwner = userInfo?.company_role === 'owner';

  return (
    <div
      style={{
        padding: 'var(--theme-page-padding)',
        fontFamily: 'var(--theme-font-body)',
        backgroundColor: 'var(--theme-hsh-background)',
        minHeight: '100vh',
      }}
      className="lg:px-8"
    >
      <div style={{ maxWidth: 'var(--theme-max-content-width)' }} className="mx-auto">
        {/* Page header — desktop only */}
        <div className="hidden lg:block" style={{ marginBottom: 'var(--theme-section-gap)' }}>
          <div
            className="flex flex-col md:flex-row justify-between items-start md:items-center"
            style={{ gap: 'var(--theme-element-gap)' }}
          >
            <div>
              <h1
                className="font-bold mb-2 flex items-center"
                style={{
                  fontFamily: 'var(--theme-font-page-title)',
                  fontSize: 'var(--theme-text-page-title)',
                  color: 'var(--theme-stone-900)',
                  gap: 'var(--theme-element-gap)',
                }}
              >
                <Orbit className="w-8 h-8" style={{ color: 'var(--theme-hsh-primary)' }} />
                Help Wanted
              </h1>
              <p style={{ fontSize: 'var(--theme-text-body)', color: 'var(--theme-stone-600)' }}>
                Post subcontractor needs and review responses via{' '}
                <span className="font-semibold" style={{ color: 'var(--theme-hsh-primary)' }}>
                  HotSeatHub
                </span>
              </p>
            </div>
            <button
              onClick={() => setShowReferralForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--theme-hsh-primary)', color: 'white' }}
            >
              <Orbit className="w-3.5 h-3.5" />
              Send Referral Invitation
            </button>
          </div>
        </div>

        {/* MarketplaceToolbar stub */}
        <div
          className="mb-4 flex flex-wrap items-center gap-3"
          style={{
            backgroundColor: 'var(--theme-card-bg)',
            borderRadius: 'var(--theme-card-radius)',
            border: '1px solid var(--theme-stone-200)',
            padding: 'var(--theme-card-padding)',
            boxShadow: 'var(--theme-card-shadow)',
          }}
        >
          <input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[160px] px-3 py-1.5 text-sm"
            style={{
              borderWidth: 'var(--theme-input-border)',
              borderColor: 'var(--theme-stone-300)',
              borderRadius: 'var(--theme-input-radius)',
              fontSize: 'var(--theme-text-body)',
              backgroundColor: 'white',
              outline: 'none',
            }}
          />
          {/* Tab pills */}
          {(['active', 'inactive', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setShowInactive(tab === 'inactive');
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors"
              style={{
                backgroundColor:
                  activeTab === tab ? 'var(--theme-hsh-primary)' : 'var(--theme-stone-100)',
                color: activeTab === tab ? 'white' : 'var(--theme-stone-600)',
              }}
            >
              {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilterKey)}
            className="px-2 py-1.5 text-xs"
            style={{
              borderWidth: 'var(--theme-input-border)',
              borderColor: 'var(--theme-stone-300)',
              borderRadius: 'var(--theme-input-radius)',
              backgroundColor: 'white',
            }}
          >
            <option value="all_time">All Time</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_week">Last Week</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
            <option value="last_year">Last Year</option>
            <option value="custom">Custom</option>
          </select>
          {/* View toggle */}
          {(['list', 'card', 'kanban'] as const).map((v) => (
            <button
              key={v}
              onClick={() => handleViewChange(v)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors"
              style={{
                backgroundColor:
                  viewType === v ? 'var(--theme-hsh-primary)' : 'var(--theme-stone-100)',
                color: viewType === v ? 'white' : 'var(--theme-stone-600)',
              }}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
          {/* Group-by */}
          <select
            value={groupBy ?? ''}
            onChange={(e) => setGroupBy(e.target.value || null)}
            className="px-2 py-1.5 text-xs"
            style={{
              borderWidth: 'var(--theme-input-border)',
              borderColor: 'var(--theme-stone-300)',
              borderRadius: 'var(--theme-input-radius)',
              backgroundColor: 'white',
            }}
          >
            <option value="">Group: None</option>
            <option value="stage">Stage</option>
            <option value="client">Client</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--theme-stone-600)' }}>
            <input
              type="checkbox"
              checked={showRowTint}
              onChange={(e) => setShowRowTint(e.target.checked)}
              className="rounded"
            />
            Row tint
          </label>
          {/* Post to HSH */}
          <button
            onClick={() => setShowRequestForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--theme-hsh-primary)', color: 'white' }}
          >
            <Orbit className="w-3.5 h-3.5" />
            Post to HotSeatHub
          </button>
        </div>

        {/* View renders */}
        {effectiveViewType === 'kanban' && (
          <StubView label="Requests Kanban — RequestsKanban component (pending port)" />
        )}
        {effectiveViewType === 'card' && (
          <StubView label="Requests Cards — RequestsCards component (pending port)" />
        )}
        {effectiveViewType === 'list' && (
          <StubView label="Requests List Table — RequestsListTable component (pending port)" />
        )}

        {/* Unassigned Services — owner only (bible lines 871–918) */}
        {isOwner && (
          <div
            className="grid grid-cols-1 md:grid-cols-2 mt-8"
            style={{ gap: 'var(--theme-section-gap)' }}
          >
            <StubPanel title="Unassigned Trial Services" />
            <StubPanel title="Unassigned Deal Services" />
          </div>
        )}

        {/* Post to HSH dialog stub */}
        {showRequestForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="w-full max-w-4xl flex flex-col"
              style={{
                maxHeight: '90vh',
                borderRadius: 'var(--theme-card-radius)',
                boxShadow: 'var(--theme-card-shadow)',
                backgroundColor: 'var(--theme-card-bg)',
              }}
            >
              <div
                className="border-b pb-4 flex-shrink-0 px-6 pt-6"
                style={{ borderColor: 'var(--theme-stone-100)' }}
              >
                <h2 className="flex items-center gap-2 font-semibold" style={{ color: 'var(--theme-stone-900)' }}>
                  <Orbit className="w-5 h-5 text-indigo-600" />
                  Post to HotSeatHub
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--theme-stone-500)' }}>
                  Select a service from your trials to post to the marketplace
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <p className="text-xs text-center py-8" style={{ color: 'var(--theme-stone-500)' }}>
                  UnassignedServicesList — coming soon
                </p>
              </div>
              <div
                className="border-t pt-4 flex-shrink-0 px-6 pb-6 flex justify-end"
                style={{ borderColor: 'var(--theme-stone-100)' }}
              >
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: 'var(--theme-hsh-primary)' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AcceptConfirmationModal stub */}
        {confirmingResponseId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="w-full max-w-md p-6"
              style={{
                borderRadius: 'var(--theme-card-radius)',
                boxShadow: 'var(--theme-card-shadow)',
                backgroundColor: 'var(--theme-card-bg)',
              }}
            >
              <h2 className="font-semibold mb-2" style={{ color: 'var(--theme-stone-900)' }}>
                Accept Response?
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--theme-stone-600)' }}>
                AcceptConfirmationModal — coming soon
              </p>
              <button
                onClick={() => setConfirmingResponseId(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg"
                style={{ backgroundColor: 'var(--theme-hsh-primary)', color: 'white' }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Cancel HSH Agreement AlertDialog (bible lines 990–1027) */}
        {cancellingAgreement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="w-full max-w-md p-6"
              style={{
                borderRadius: 'var(--theme-card-radius)',
                boxShadow: 'var(--theme-card-shadow)',
                backgroundColor: 'var(--theme-card-bg)',
              }}
            >
              <h2 className="font-semibold mb-3" style={{ color: 'var(--theme-stone-900)' }}>
                Cancel HSH Agreement?
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--theme-stone-600)' }}>
                Are you sure you want to cancel this HSH subcontract agreement for{' '}
                <strong>
                  {cancellingAgreement.consultant_first_name}{' '}
                  {cancellingAgreement.consultant_last_name}
                </strong>
                ? This will deactivate the assignment, cancel the associated document, and notify
                the subcontractor.
              </p>
              <div className="space-y-1.5 mb-4">
                <label className="text-sm font-medium" style={{ color: 'var(--theme-stone-700)' }}>
                  Reason for cancellation
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter a reason for cancelling this agreement..."
                  className="w-full rounded-md border p-2 text-sm min-h-[80px] resize-none"
                  style={{
                    borderColor: 'var(--theme-stone-300)',
                    backgroundColor: 'var(--theme-input-bg)',
                  }}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setCancellingAgreement(null);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg border"
                  style={{
                    borderColor: 'var(--theme-stone-300)',
                    color: 'var(--theme-stone-700)',
                    backgroundColor: 'white',
                  }}
                >
                  Keep Agreement
                </button>
                <button
                  onClick={() => {
                    toast.info('Cancel agreement — coming soon');
                    setCancellingAgreement(null);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: 'var(--theme-danger)' }}
                >
                  Cancel Agreement
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Marketplace Request AlertDialog (bible lines 1029–1059) */}
        {cancelConfirmRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="w-full max-w-md p-6"
              style={{
                borderRadius: 'var(--theme-card-radius)',
                boxShadow: 'var(--theme-card-shadow)',
                backgroundColor: 'var(--theme-card-bg)',
              }}
            >
              <h2 className="font-semibold mb-3" style={{ color: 'var(--theme-stone-900)' }}>
                Cancel Marketplace Request?
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--theme-stone-600)' }}>
                Are you sure you want to cancel the request for "
                <strong>{cancelConfirmRequest.service_name}</strong>"? This will remove it from the
                marketplace.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCancelConfirmRequest(null)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border"
                  style={{
                    borderColor: 'var(--theme-stone-300)',
                    color: 'var(--theme-stone-700)',
                    backgroundColor: 'white',
                  }}
                >
                  Keep Request
                </button>
                <button
                  onClick={() => {
                    toast.info('Cancel request — coming soon');
                    setCancelConfirmRequest(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: 'var(--theme-danger)' }}
                >
                  Cancel Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ReferralInviteForm stub */}
        {showReferralForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="w-full max-w-md p-6"
              style={{
                borderRadius: 'var(--theme-card-radius)',
                boxShadow: 'var(--theme-card-shadow)',
                backgroundColor: 'var(--theme-card-bg)',
              }}
            >
              <h2 className="font-semibold mb-2" style={{ color: 'var(--theme-stone-900)' }}>
                Send Referral Invitation
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--theme-stone-600)' }}>
                ReferralInviteForm — coming soon
              </p>
              <button
                onClick={() => setShowReferralForm(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg"
                style={{ backgroundColor: 'var(--theme-hsh-primary)', color: 'white' }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ServiceAssignmentModal stub */}
        {selectedService != null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="w-full max-w-2xl p-6"
              style={{
                borderRadius: 'var(--theme-card-radius)',
                boxShadow: 'var(--theme-card-shadow)',
                backgroundColor: 'var(--theme-card-bg)',
              }}
            >
              <h2 className="font-semibold mb-2" style={{ color: 'var(--theme-stone-900)' }}>
                Service Assignment
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--theme-stone-600)' }}>
                ServiceAssignmentModal — coming soon
              </p>
              <button
                onClick={() => setSelectedService(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg"
                style={{ backgroundColor: 'var(--theme-hsh-primary)', color: 'white' }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
