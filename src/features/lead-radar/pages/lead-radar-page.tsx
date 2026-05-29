/**
 * lead-radar-page.tsx — Port of HotSeatersMVP/src/pages/LeadRadar.jsx
 *
 * Bible: LeadRadar.jsx uses useLeadRadarData() which is a Tier-2 hook that
 * fans out 5 paced queries. We adapt this to the port's architecture:
 *   - useTier1() for company / userInfo
 *   - lead-radar-store fetch functions for leads, activities, attorneys
 *   - LeadsRadarTab logic is inlined (sub-components don't exist in port yet)
 *
 * Sub-components that do not exist in the port yet are stubbed:
 *   - LeadsKanbanGrid → coming-soon stub
 *   - NewLeadWizard → coming-soon stub
 *   - LeadFollowUpBanner → inlined simple banner
 *   - LeadFilterSheet → coming-soon stub
 *   - SalesPersonFilter → coming-soon stub
 *
 * RULE F: lives in src/features/lead-radar/pages/
 * RULE 3: supabase import is in the store; page imports the hook only.
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Radar, Users, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useTier1 } from '@/app/tier1-provider';
import {
  fetchLeadsForCompany,
  fetchPendingActivitiesForCompany,
  fetchAttorneysForCompany,
  type LeadRow,
  type SalesActivityRow,
  type AttorneyRow,
} from '@/features/lead-radar/stores/lead-radar-store';
import type { PipelineStage } from '@/shared/db/lookups-selectors';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnrichedLead extends LeadRow {
  attorney: AttorneyRow | null;
  next_follow_up_date: string | null;
  activityCount: number;
  lastTouchDate: string | null;
}

// ─── Hook: useLeadRadarData ───────────────────────────────────────────────────

function useLeadRadarData(companyId: string | null) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [pendingActivities, setPendingActivities] = useState<SalesActivityRow[]>([]);
  const [attorneys, setAttorneys] = useState<AttorneyRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const [l, a, atty] = await Promise.all([
        fetchLeadsForCompany(companyId),
        fetchPendingActivitiesForCompany(companyId),
        fetchAttorneysForCompany(companyId),
      ]);
      setLeads(l);
      setPendingActivities(a);
      setAttorneys(atty);
    } catch {
      // silently degrade — data shows empty state rather than crashing
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { leads, pendingActivities, attorneys, isLoading, invalidate: load };
}

// ─── LeadFollowUpBanner ───────────────────────────────────────────────────────

interface BannerProps {
  overdueLeads: EnrichedLead[];
  dueTodayLeads: EnrichedLead[];
  noNextStepLeads: EnrichedLead[];
}

function LeadFollowUpBanner({ overdueLeads, dueTodayLeads, noNextStepLeads }: BannerProps) {
  if (overdueLeads.length === 0 && dueTodayLeads.length === 0 && noNextStepLeads.length === 0) {
    return null;
  }
  return (
    <div
      className="flex flex-wrap gap-3 rounded-lg px-4 py-3"
      style={{ backgroundColor: 'color-mix(in srgb, var(--theme-brand-primary) 8%, white)', border: '1px solid color-mix(in srgb, var(--theme-brand-primary) 20%, white)' }}
    >
      {overdueLeads.length > 0 && (
        <span style={{ fontSize: 'var(--theme-text-caption)', color: 'var(--theme-stone-700)' }}>
          <strong style={{ color: 'var(--theme-brand-primary)' }}>{overdueLeads.length}</strong> overdue
        </span>
      )}
      {dueTodayLeads.length > 0 && (
        <span style={{ fontSize: 'var(--theme-text-caption)', color: 'var(--theme-stone-700)' }}>
          <strong style={{ color: 'var(--theme-brand-primary)' }}>{dueTodayLeads.length}</strong> due today
        </span>
      )}
      {noNextStepLeads.length > 0 && (
        <span style={{ fontSize: 'var(--theme-text-caption)', color: 'var(--theme-stone-700)' }}>
          <strong style={{ color: 'var(--theme-stone-500)' }}>{noNextStepLeads.length}</strong> with no next step
        </span>
      )}
    </div>
  );
}

// ─── LeadsRadarTab (inlined port) ─────────────────────────────────────────────

interface LeadsRadarTabProps {
  userInfoId: string | undefined;
  companyRole: string | undefined;
  leads: LeadRow[];
  pendingActivities: SalesActivityRow[];
  attorneys: AttorneyRow[];
  pipelineStages: PipelineStage[];
  invalidate: () => Promise<void>;
}

function LeadsRadarTab({
  userInfoId,
  companyRole,
  leads,
  pendingActivities,
  attorneys,
  pipelineStages,
  invalidate,
}: LeadsRadarTabProps) {
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSalesPerson, setSelectedSalesPerson] = useState('all');
  const isOwnerOrAdmin = companyRole === 'owner' || companyRole === 'admin';
  const [showMyLeads, setShowMyLeads] = useState(true);

  // Suppress unused-variable until NewLeadWizard is ported
  void showNewLeadForm;
  void setShowNewLeadForm;
  void selectedSalesPerson;
  void setSelectedSalesPerson;
  void pipelineStages;
  void invalidate;

  // Enrich leads with attorney data (bible LeadsRadarTab.jsx lines 32–54)
  const enrichedLeads: EnrichedLead[] = leads
    .map((lead): EnrichedLead => {
      const attorney = attorneys.find((a) => a.id === lead.attorney_id) ?? null;
      const leadActivities = pendingActivities.filter((a) => a.lead_id === lead.id);
      const nextActivity = leadActivities[0] ?? null;
      const next_follow_up_date = nextActivity?.scheduled_date ?? null;
      const activityCount = leadActivities.length;
      let lastTouchDate: string | null = null;
      leadActivities.forEach((a) => {
        const candidate = a.scheduled_date ?? null;
        if (candidate && (!lastTouchDate || candidate > lastTouchDate)) {
          lastTouchDate = candidate;
        }
      });
      return { ...lead, attorney, next_follow_up_date, activityCount, lastTouchDate };
    })
    .filter((lead) => lead.attorney !== null);

  // Ownership filter (bible lines 56–60)
  const ownershipFiltered = showMyLeads
    ? enrichedLeads.filter((lead) => lead.attorney_id === userInfoId)
    : enrichedLeads;

  // Search filter (bible lines 62–68)
  const filteredLeads = ownershipFiltered.filter((lead) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name =
      `${lead.attorney?.first_name ?? ''} ${lead.attorney?.last_name ?? ''}`.toLowerCase();
    return name.includes(term);
  });

  const allKanbanItems = filteredLeads;

  // Follow-up bucketing (bible lines 72–76)
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const overdueLeads = allKanbanItems.filter(
    (l) => l.next_follow_up_date && l.next_follow_up_date < todayStr,
  );
  const dueTodayLeads = allKanbanItems.filter(
    (l) => l.next_follow_up_date === todayStr,
  );
  const noNextStepLeads = allKanbanItems.filter((l) => !l.next_follow_up_date);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--theme-section-gap)' }}>
      {/* Toolbar — search + ownership toggle + add lead */}
      <div className="flex items-center" style={{ gap: 'var(--theme-element-gap)' }}>
        {/* Search input */}
        <div className="relative flex-1 min-w-0 sm:max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--theme-stone-400)' }}
          />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            style={{
              borderRadius: 'var(--theme-input-radius)',
              borderWidth: 'var(--theme-input-border)',
              backgroundColor: 'var(--theme-input-bg)',
            }}
          />
        </div>

        {/* My Leads / All Leads toggle (owner/admin only, desktop) */}
        {isOwnerOrAdmin && (
          <div
            className="hidden lg:flex items-center rounded-lg border overflow-hidden flex-shrink-0"
            style={{ borderColor: 'var(--theme-stone-200)' }}
          >
            <button
              onClick={() => setShowMyLeads(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                showMyLeads
                  ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' }
                  : {
                      color: 'var(--theme-stone-600)',
                      backgroundColor:
                        'color-mix(in srgb, var(--theme-brand-primary) 10%, white)',
                    }
              }
            >
              <UserIcon className="w-3.5 h-3.5" />
              My Leads
            </button>
            <button
              onClick={() => setShowMyLeads(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                !showMyLeads
                  ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' }
                  : {
                      color: 'var(--theme-stone-600)',
                      backgroundColor:
                        'color-mix(in srgb, var(--theme-brand-primary) 10%, white)',
                    }
              }
            >
              <Users className="w-3.5 h-3.5" />
              All Leads
            </button>
          </div>
        )}

        {/* Add Lead button */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setShowNewLeadForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-90 flex-shrink-0"
            style={{
              backgroundColor: 'var(--theme-brand-primary)',
              color: 'white',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Lead</span>
          </button>
        </div>
      </div>

      {/* Follow-up banner */}
      <LeadFollowUpBanner
        overdueLeads={overdueLeads}
        dueTodayLeads={dueTodayLeads}
        noNextStepLeads={noNextStepLeads}
      />

      {/* Kanban / empty state */}
      {allKanbanItems.length === 0 ? (
        <div className="text-center py-12">
          <Radar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p
            style={{
              color: 'var(--theme-stone-500)',
              fontSize: 'var(--theme-text-body)',
            }}
          >
            {searchTerm
              ? 'No leads match your search.'
              : 'No leads yet. Click “Add Lead” to get started.'}
          </p>
        </div>
      ) : (
        /* Coming soon: LeadsKanbanGrid */
        <div
          style={{
            border: '1px dashed var(--theme-stone-200)',
            borderRadius: 'var(--theme-card-radius)',
            padding: 'var(--theme-card-padding)',
            textAlign: 'center',
            color: 'var(--theme-stone-400)',
            fontSize: 'var(--theme-text-caption)',
          }}
        >
          Coming soon: LeadsKanbanGrid ({allKanbanItems.length} lead
          {allKanbanItems.length !== 1 ? 's' : ''})
        </div>
      )}

      {/* Coming soon: NewLeadWizard */}
      {/* Will be wired once NewLeadWizard is ported */}

      {/* Bottom Radar section (bible LeadsRadarTab.jsx lines 186–194) */}
      <div
        className="mt-8 border-t"
        style={{
          borderColor: 'var(--theme-stone-200)',
          paddingTop: 'var(--theme-section-gap)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            textAlign: 'center',
          }}
        >
          <div>
            <Radar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p
              style={{
                fontSize: 'var(--theme-text-body)',
                color: 'var(--theme-stone-600)',
                marginBottom: '0.5rem',
              }}
            >
              Coming soon…
            </p>
            <p
              style={{
                fontSize: 'var(--theme-text-caption)',
                color: 'var(--theme-stone-500)',
              }}
            >
              Follow potential trials and opportunities from Law 360 and other sources.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LeadRadarPage ────────────────────────────────────────────────────────────

export function LeadRadarPage() {
  const { userInfo, company, pipelineStages, isLoading: tier1Loading } = useTier1();
  const companyId = company?.id ?? null;

  const { leads, pendingActivities, attorneys, isLoading, invalidate } =
    useLeadRadarData(companyId);

  if (tier1Loading || isLoading) {
    return (
      <div
        className="flex items-center justify-center lg:px-8"
        style={{ padding: 'var(--theme-page-padding)', minHeight: '200px' }}
      >
        <Spinner className="size-6" />
        <span
          className="ml-2"
          style={{ color: 'var(--theme-stone-500)', fontSize: 'var(--theme-text-body)' }}
        >
          Loading leads…
        </span>
      </div>
    );
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
      <div style={{ maxWidth: 'var(--theme-max-content-width)' }} className="mx-auto">
        {/* Page header — hidden on mobile (bible line 44: hidden lg:flex) */}
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
              Lead Radar
            </h1>
            <p
              style={{
                fontSize: 'var(--theme-text-body)',
                color: 'var(--theme-stone-600)',
              }}
            >
              Track potential leads and follow up before they go cold
            </p>
          </div>
        </div>

        <LeadsRadarTab
          userInfoId={userInfo?.id}
          companyRole={userInfo?.company_role}
          leads={leads}
          pendingActivities={pendingActivities}
          attorneys={attorneys}
          pipelineStages={pipelineStages}
          invalidate={invalidate}
        />
      </div>
    </div>
  );
}
