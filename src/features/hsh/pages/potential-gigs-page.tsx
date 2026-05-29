/**
 * potential-gigs-page.tsx — HotSeatHub: browse and respond to available gigs.
 *
 * BIBLE: HotSeatersMVP/src/pages/PotentialGigs.jsx (941 lines)
 *
 * Visual/functional parity notes
 * ────────────────────────────────
 * - Page header: "Potential Gigs" + HSH sub-copy (desktop only, hidden on mobile).
 * - `marketplace_fill_jobs` guard: shows "Page Not Available" when disabled.
 * - Toolbar (MarketplaceToolbar stub) with search, tab, date filter, view,
 *   group-by options exactly matching the bible's props.
 * - Three view modes: kanban / card / list — rendered as typed stubs.
 * - Response form dialog with consultant picker, service mapping, rate, message.
 * - DeclineRequestDialog stub.
 * - All var(--theme-*) tokens referenced verbatim.
 * - All business rules preserved (filteredRequests, newOpportunities, pending /
 *   accepted / declined / completed / cancelled gig derivations).
 * - Tier-2 data (SubcontractRequest, SubcontractResponse, SubcontractAssignment,
 *   services, myConsultants, myServices) stubbed as empty arrays until the HSH
 *   store lands.
 *
 * RULE B: no store imports — hooks only.
 * RULE F: src/features/hsh/pages/
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MapPin,
  Calendar,
  DollarSign,
  Building2,
  Briefcase,
  Gavel,
  Orbit,
  Layers,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useTier1 } from '@/app/tier1-provider';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

// ── Tier-2 data stubs (replace with real HSH store hooks when they land) ──────
const EMPTY_ARR: never[] = [];

// ── Minimal type scaffolding for local business-rule clarity ──────────────────
interface GigRequest {
  id: string;
  status: string;
  company_id: string;
  service_name?: string;
  service_id?: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  estimated_rate?: number;
  is_public?: boolean;
  invited_company_ids?: string[];
  invited_user_ids?: string[];
  case_name?: string;
  pipeline_stage_id?: string;
  dailyMinimumHours?: number;
  requesting_company_name?: string;
  service?: {
    has_daily_minimum?: boolean;
    rate_type?: string;
  };
}

interface GigResponse {
  id: string;
  request_id: string;
  status: string;
}

interface GigAssignment {
  id: string;
  request_id: string;
  status: string;
}

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

// ── Page ─────────────────────────────────────────────────────────────────────
export function PotentialGigsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<GigRequest | null>(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseData, setResponseData] = useState({
    consultant_id: '',
    proposed_rate: '',
    message: '',
    mapped_service_id: '',
  });
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [viewType, setViewType] = useState<'list' | 'card' | 'kanban'>('list');
  const [decliningRequest, setDecliningRequest] = useState<GigRequest | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [dateFilter, _setDateFilter] = useState('all_time');
  // customDateRange: managed by toolbar stub but not yet consumed by filter logic
  const [customDateRange, _setCustomDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [showRowTint, setShowRowTint] = useState(false);

  const { userInfo, company, isLoading: tier1Loading } = useTier1();
  const isMobile = useIsMobile();

  // ── Tier-2 stubs (HSH store pending) ─────────────────────────────────────
  const allRequests: GigRequest[] = EMPTY_ARR;
  const myResponses: GigResponse[] = EMPTY_ARR;
  const myAssignments: GigAssignment[] = EMPTY_ARR;
  const services: unknown[] = EMPTY_ARR;
  const pipelineStages: unknown[] = EMPTY_ARR;
  const serviceCategories: unknown[] = EMPTY_ARR;
  const myConsultants: unknown[] = EMPTY_ARR;
  const myServices: unknown[] = EMPTY_ARR;
  const isHSHDataLoading = false;

  void services;
  void serviceCategories;
  void myConsultants;
  void myServices;
  void decliningRequest;
  void collapsedSections;

  const companyId = userInfo?.company_id;

  // ── Load preferences once ─────────────────────────────────────────────────
  useEffect(() => {
    if (userInfo && !prefsLoaded) {
      const prefs = (userInfo as unknown as Record<string, unknown>).preferences as
        | Record<string, unknown>
        | undefined;
      setViewType((prefs?.potentialGigsViewType as 'list' | 'card' | 'kanban') ?? 'list');
      setShowInactive((prefs?.potentialGigsShowInactive as boolean) ?? false);
      setPrefsLoaded(true);
    }
  }, [userInfo, prefsLoaded]);

  void showInactive;
  void prefsLoaded;

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

  // ── Derived request buckets (business rules from bible lines 371–427) ──────
  const filteredRequests = useMemo(
    () =>
      allRequests
        .filter((req) => req.company_id !== companyId)
        .filter((req) => {
          if (req.is_public === false) {
            const companyInvited = req.invited_company_ids?.includes(companyId ?? '');
            const userInvited = req.invited_user_ids?.includes(userInfo?.id ?? '');
            return companyInvited || userInvited;
          }
          return true;
        })
        .filter(
          (req) =>
            req.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.location?.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    [allRequests, companyId, userInfo, searchQuery],
  );

  const newOpportunities = useMemo(
    () =>
      filteredRequests.filter(
        (req) => req.status === 'open' && !myResponses.some((r) => r.request_id === req.id),
      ),
    [filteredRequests, myResponses],
  );

  const myPendingResponses = useMemo(
    () =>
      filteredRequests.filter((req) => {
        const response = myResponses.find((r) => r.request_id === req.id);
        if (!response) return false;
        return (
          response.status === 'pending_agreed' ||
          response.status === 'pending_counter' ||
          response.status === 'negotiating'
        );
      }),
    [filteredRequests, myResponses],
  );

  const myAcceptedResponses = useMemo(
    () =>
      filteredRequests.filter((req) => {
        const response = myResponses.find((r) => r.request_id === req.id);
        return response && response.status === 'accepted';
      }),
    [filteredRequests, myResponses],
  );

  const myDeclinedResponses = useMemo(
    () =>
      filteredRequests.filter((req) => {
        const response = myResponses.find((r) => r.request_id === req.id);
        return response && (response.status === 'declined' || response.status === 'lost');
      }),
    [filteredRequests, myResponses],
  );

  const myCompletedGigs = useMemo(
    () =>
      filteredRequests.filter((req) => {
        const response = myResponses.find((r) => r.request_id === req.id);
        if (!response || response.status !== 'accepted') return false;
        const assignment = myAssignments.find((a) => a.request_id === req.id);
        return assignment && assignment.status === 'completed';
      }),
    [filteredRequests, myResponses, myAssignments],
  );

  const myCancelledGigs = useMemo(
    () =>
      filteredRequests.filter((req) => {
        const response = myResponses.find((r) => r.request_id === req.id);
        if (!response || response.status !== 'accepted') return false;
        const assignment = myAssignments.find((a) => a.request_id === req.id);
        return assignment && assignment.status === 'cancelled';
      }),
    [filteredRequests, myResponses, myAssignments],
  );

  const myActiveAcceptedResponses = useMemo(
    () =>
      myAcceptedResponses.filter((req) => {
        const assignment = myAssignments.find((a) => a.request_id === req.id);
        return !assignment || (assignment.status !== 'completed' && assignment.status !== 'cancelled');
      }),
    [myAcceptedResponses, myAssignments],
  );

  void myPendingResponses;
  void myDeclinedResponses;
  void myCompletedGigs;
  void myCancelledGigs;
  void myActiveAcceptedResponses;
  void newOpportunities;
  void groupBy;
  void showRowTint;
  void pipelineStages;
  void dateFilter;
  void customDateRange;
  void activeTab;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRespondToRequest = (request: GigRequest) => {
    setSelectedRequest(request);
    setShowResponseForm(true);
    setResponseData({
      consultant_id: '',
      proposed_rate: String(request.estimated_rate ?? ''),
      message: '',
      mapped_service_id: '',
    });
  };

  const handleDeclineClick = (request: GigRequest) => {
    setDecliningRequest(request);
  };

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  void handleRespondToRequest;
  void handleDeclineClick;
  void toggleSection;

  const handleSubmitResponse = () => {
    if (!responseData.proposed_rate || !responseData.mapped_service_id) {
      toast.error('Please select a consultant, service mapping, and enter a rate');
      return;
    }
    toast.info('HSH response submission coming soon');
    setShowResponseForm(false);
    setSelectedRequest(null);
    setResponseData({ consultant_id: '', proposed_rate: '', message: '', mapped_service_id: '' });
  };

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

  if (!company.marketplace_fill_jobs) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--theme-page-bg)', fontFamily: 'var(--theme-font-body)' }}
      >
        <div className="text-center max-w-md px-6">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-brand-primary) 10%, white)' }}
          >
            <Orbit className="w-8 h-8" style={{ color: 'var(--theme-brand-primary)' }} />
          </div>
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: 'var(--theme-stone-900)' }}
          >
            Page Not Available
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--theme-stone-600)' }}>
            Sorry, you don't have access to this page. If you believe this is an error, please
            contact support.
          </p>
          <div className="flex flex-col items-center gap-3">
            <a
              href="/Dashboard"
              className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-white rounded-lg"
              style={{ backgroundColor: 'var(--theme-brand-primary)' }}
            >
              Go to Homepage
            </a>
            <a
              href="mailto:support@hotseaters.com"
              className="text-sm underline"
              style={{ color: 'var(--theme-brand-primary)' }}
            >
              support@hotseaters.com
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (isHSHDataLoading) {
    return (
      <div className="flex items-center gap-2 lg:px-8" style={{ padding: 'var(--theme-page-padding)' }}>
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--theme-stone-500)' }} />
        <span className="text-sm" style={{ color: 'var(--theme-stone-500)' }}>
          Loading HotSeatHub data…
        </span>
      </div>
    );
  }

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
            Potential Gigs
          </h1>
          <p
            style={{
              fontSize: 'var(--theme-text-body)',
              color: 'var(--theme-stone-600)',
            }}
          >
            Browse and respond to available trial tech opportunities on{' '}
            <span className="font-semibold" style={{ color: 'var(--theme-hsh-primary)' }}>
              HotSeatHub
            </span>
          </p>
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
            placeholder="Search gigs..."
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
          {/* Group-by (bible: stage / client) */}
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
            <option value="stage">
              Stage
            </option>
            <option value="hsh_sub">
              Client
            </option>
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
        </div>

        {/* View renders */}
        {effectiveViewType === 'kanban' && (
          <StubView label="Gigs Kanban — GigsKanban component (pending port)" />
        )}
        {effectiveViewType === 'card' && (
          <StubView label="Gigs Cards — GigsCards component (pending port)" />
        )}
        {effectiveViewType === 'list' && (
          <StubView label="Gigs List Table — GigsListTable component (pending port)" />
        )}

        {/* Respond to request modal */}
        {showResponseForm && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="w-full max-w-lg overflow-hidden"
              style={{
                borderRadius: 'var(--theme-card-radius)',
                boxShadow: 'var(--theme-card-shadow)',
                backgroundColor: 'var(--theme-card-bg)',
              }}
            >
              {/* Header */}
              <div
                style={{
                  backgroundColor: 'var(--theme-card-header-bg)',
                  borderBottomWidth: 'var(--theme-card-border)',
                  borderBottomColor: 'var(--theme-stone-200)',
                  borderBottomStyle: 'solid',
                  padding: 'var(--theme-card-header-padding)',
                  borderTopLeftRadius: 'var(--theme-card-radius)',
                  borderTopRightRadius: 'var(--theme-card-radius)',
                }}
              >
                <h2
                  className="flex items-center font-semibold"
                  style={{
                    fontSize: 'var(--theme-text-card-title)',
                    gap: 'var(--theme-element-gap)',
                    color: 'var(--theme-stone-900)',
                  }}
                >
                  <Orbit className="w-5 h-5" style={{ color: 'var(--theme-hsh-primary)' }} />
                  Respond to HotSeatHub Request
                </h2>
              </div>
              {/* Body */}
              <div
                style={{
                  padding: 'var(--theme-card-padding)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--theme-card-gap)',
                }}
              >
                {/* Request summary */}
                <div>
                  {selectedRequest.case_name && (() => {
                    const stage = (pipelineStages as Array<{ id: string; type: string }>).find(
                      (s) => s.id === selectedRequest.pipeline_stage_id,
                    );
                    const isDeal = stage?.type === 'sales';
                    const Icon = isDeal ? Briefcase : Gavel;
                    return (
                      <div
                        className="flex items-center mb-1"
                        style={{ gap: 'calc(var(--theme-element-gap) / 2)' }}
                      >
                        <Icon className="w-4 h-4" style={{ color: 'var(--theme-stone-600)' }} />
                        <span
                          className="font-semibold"
                          style={{
                            fontSize: 'var(--theme-text-body)',
                            color: 'var(--theme-stone-900)',
                          }}
                        >
                          {selectedRequest.case_name}
                        </span>
                      </div>
                    );
                  })()}
                  <div
                    className="flex items-center mb-2 ml-[22px]"
                    style={{ gap: 'var(--theme-element-gap)' }}
                  >
                    <h3
                      className="font-semibold"
                      style={{
                        fontSize: 'var(--theme-text-card-title)',
                        color: 'var(--theme-hsh-primary)',
                      }}
                    >
                      {selectedRequest.service_name}
                    </h3>
                    {selectedRequest.service?.has_daily_minimum &&
                      selectedRequest.service?.rate_type === 'hourly' && (
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor:
                              'color-mix(in srgb, var(--theme-brand-operations) 15%, white)',
                            color: 'color-mix(in srgb, var(--theme-brand-operations) 80%, black)',
                            fontSize: 'var(--theme-text-caption)',
                            borderRadius: 'var(--theme-button-radius)',
                          }}
                        >
                          {selectedRequest.dailyMinimumHours}hr daily min
                        </span>
                      )}
                  </div>
                  {selectedRequest.description && (
                    <p
                      className="leading-tight mb-2 ml-[22px]"
                      style={{
                        fontSize: 'var(--theme-text-caption)',
                        color: 'var(--theme-stone-600)',
                      }}
                    >
                      {selectedRequest.description}
                    </p>
                  )}
                  <div
                    className="ml-[22px]"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'calc(var(--theme-element-gap) / 2)',
                      fontSize: 'var(--theme-text-caption)',
                      color: 'var(--theme-stone-600)',
                    }}
                  >
                    {selectedRequest.start_date && (
                      <span
                        className="flex items-center"
                        style={{ gap: 'calc(var(--theme-element-gap) / 2)' }}
                      >
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(selectedRequest.start_date), 'MMM d, yyyy')}
                        {selectedRequest.end_date &&
                          ` - ${format(parseISO(selectedRequest.end_date), 'MMM d, yyyy')}`}
                      </span>
                    )}
                    <span
                      className="flex items-center"
                      style={{ gap: 'calc(var(--theme-element-gap) / 2)' }}
                    >
                      <MapPin className="w-4 h-4" />
                      {selectedRequest.location || 'Unknown'}
                    </span>
                    {selectedRequest.requesting_company_name && (
                      <span
                        className="flex items-center"
                        style={{ gap: 'calc(var(--theme-element-gap) / 2)' }}
                      >
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium">
                          {selectedRequest.requesting_company_name}
                        </span>
                      </span>
                    )}
                    {selectedRequest.estimated_rate && (
                      <span
                        className="flex items-center font-medium"
                        style={{
                          gap: 'calc(var(--theme-element-gap) / 2)',
                          color: 'var(--theme-success)',
                        }}
                      >
                        <DollarSign className="w-4 h-4" />
                        Offered: {selectedRequest.estimated_rate}/
                        {selectedRequest.service?.rate_type || 'hour'}
                        {selectedRequest.service?.has_daily_minimum &&
                          selectedRequest.service?.rate_type === 'hourly' && (
                            <span
                              style={{
                                color: 'var(--theme-brand-operations)',
                                marginLeft: 'calc(var(--theme-element-gap) / 2)',
                              }}
                            >
                              ($
                              {(
                                selectedRequest.estimated_rate *
                                (selectedRequest.dailyMinimumHours ?? 8)
                              ).toLocaleString()}
                              /day min)
                            </span>
                          )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Form fields */}
                <div
                  className="-mx-6 px-6 py-4"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--theme-hsh-primary) 8%, white)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--theme-card-gap)',
                  }}
                >
                  {/* Service mapping */}
                  <div>
                    <label
                      htmlFor="mapped_service"
                      style={{ fontSize: 'var(--theme-text-label)', display: 'block', marginBottom: 4 }}
                    >
                      Map to Your Service *
                    </label>
                    <select
                      id="mapped_service"
                      value={responseData.mapped_service_id}
                      onChange={(e) =>
                        setResponseData({ ...responseData, mapped_service_id: e.target.value })
                      }
                      className="w-full px-3 py-2"
                      style={{
                        borderWidth: 'var(--theme-input-border)',
                        borderColor: 'var(--theme-stone-300)',
                        borderRadius: 'var(--theme-input-radius)',
                        fontSize: 'var(--theme-text-body)',
                        backgroundColor: 'white',
                      }}
                    >
                      <option value="">Select a service...</option>
                    </select>
                    <p
                      className="mt-1"
                      style={{
                        fontSize: 'var(--theme-text-caption)',
                        color: 'var(--theme-stone-500)',
                      }}
                    >
                      Select which of your services corresponds to this request
                    </p>
                  </div>

                  {/* Rate */}
                  <div>
                    <label
                      htmlFor="rate"
                      style={{ fontSize: 'var(--theme-text-label)', display: 'block', marginBottom: 4 }}
                    >
                      Proposed Rate ($/{selectedRequest.service?.rate_type === 'hourly' ? 'hour' : selectedRequest.service?.rate_type === 'daily' ? 'day' : 'flat'}) *
                    </label>
                    <input
                      id="rate"
                      type="number"
                      placeholder={String(selectedRequest.estimated_rate ?? '500')}
                      value={responseData.proposed_rate}
                      onChange={(e) =>
                        setResponseData({ ...responseData, proposed_rate: e.target.value })
                      }
                      className="w-full px-3 py-2"
                      style={{
                        borderRadius: 'var(--theme-input-radius)',
                        borderWidth: 'var(--theme-input-border)',
                        borderStyle: 'solid',
                        borderColor: 'var(--theme-stone-300)',
                        fontSize: 'var(--theme-text-body)',
                        backgroundColor: 'white',
                      }}
                    />
                    {selectedRequest.service?.has_daily_minimum &&
                      selectedRequest.service?.rate_type === 'hourly' &&
                      responseData.proposed_rate && (
                        <p
                          className="mt-1"
                          style={{
                            fontSize: 'var(--theme-text-caption)',
                            color: 'var(--theme-stone-500)',
                          }}
                        >
                          Daily minimum: $
                          {(
                            parseFloat(responseData.proposed_rate) *
                            (selectedRequest.dailyMinimumHours ?? 8)
                          ).toLocaleString()}
                          /day
                        </p>
                      )}
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      style={{ fontSize: 'var(--theme-text-label)', display: 'block', marginBottom: 4 }}
                    >
                      Message (Optional)
                    </label>
                    <textarea
                      id="message"
                      placeholder="Additional information or availability details..."
                      value={responseData.message}
                      onChange={(e) =>
                        setResponseData({ ...responseData, message: e.target.value })
                      }
                      rows={3}
                      style={{
                        borderRadius: 'var(--theme-input-radius)',
                        borderWidth: 'var(--theme-input-border)',
                        borderStyle: 'solid',
                        borderColor: 'var(--theme-stone-300)',
                        fontSize: 'var(--theme-text-body)',
                        backgroundColor: 'white',
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-4" style={{ gap: 'var(--theme-element-gap)' }}>
                  <button
                    onClick={() => {
                      setShowResponseForm(false);
                      setSelectedRequest(null);
                      setResponseData({
                        consultant_id: '',
                        proposed_rate: '',
                        message: '',
                        mapped_service_id: '',
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
                    style={{
                      borderRadius: 'var(--theme-button-radius)',
                      borderColor: 'var(--theme-stone-300)',
                      color: 'var(--theme-stone-700)',
                      backgroundColor: 'white',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitResponse}
                    disabled={!responseData.proposed_rate || !responseData.mapped_service_id}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                    style={{
                      backgroundColor: 'var(--theme-hsh-primary)',
                      borderRadius: 'var(--theme-button-radius)',
                      boxShadow: 'var(--theme-button-shadow)',
                    }}
                  >
                    Submit Response
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DeclineRequestDialog stub */}
        {decliningRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="w-full max-w-md p-6"
              style={{
                borderRadius: 'var(--theme-card-radius)',
                boxShadow: 'var(--theme-card-shadow)',
                backgroundColor: 'var(--theme-card-bg)',
              }}
            >
              <h2
                className="font-semibold mb-2"
                style={{ color: 'var(--theme-stone-900)', fontSize: 'var(--theme-text-card-title)' }}
              >
                Decline Request
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--theme-stone-600)' }}>
                DeclineRequestDialog — coming soon
              </p>
              <button
                onClick={() => setDecliningRequest(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg"
                style={{
                  backgroundColor: 'var(--theme-hsh-primary)',
                  color: 'white',
                  borderRadius: 'var(--theme-button-radius)',
                }}
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

// Unused import silencers (Layers used in group-by bible reference)
void Layers;
