/**
 * deal-tracker-tab.tsx — port of
 * HotSeatersMVP/src/components/sales/DealTrackerTab.jsx.
 *
 * The Kanban tab: a toolbar (search · view-mode toggle · My/All deals ·
 * salesperson filter · sales-stage filters · Add Contact · Add Deal) above the
 * Kanban grid, with the Lost view swapping in the flat lost-list.
 *
 * Adaptation (RULE 0):
 *   • Mobile/tablet force `next_step` view (bible: `useDeviceType` →
 *     `effectiveViewMode`). The port has `useIsMobile()`; we force next_step on
 *     mobile, the same rendered result.
 *   • `DealFilterSheet` (mobile My/All sheet), `SalesPersonFilter` (custom
 *     dropdown) → a native `<select>` for salesperson, same filter semantics.
 *   • `DocumentSendDialog` (LOE reminder email) is out of scope until the
 *     documents change lands — the send-reminder path is omitted; `onSelectTrial`
 *     opens details.
 *   • Search + salesperson + showMyDeals filtering reproduced verbatim.
 *
 * HotSeatersMVP is the bible.
 */

import { useState } from 'react';
import { Search, Plus, User as UserIcon, Users, UserPlus, Briefcase } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import type { Trial } from '@/features/trials/entities';
import type { ClientRow } from '@/features/clients/hooks/use-clients-list';
import type { PipelineStage } from '@/shared/db/lookups-selectors';
import type { DealViewMode } from '@/features/deals/business-rules/deal-kanban-buckets';

import { DealTrackerViewModeToggle } from './deal-tracker-view-mode-toggle';
import {
  DealTrackerSalesStageFilters,
  type DealDateFilter,
  type DealStatusFilter,
} from './deal-tracker-sales-stage-filters';
import { DealTrackerKanbanGrid } from './deal-tracker-kanban-grid';
import { DealTrackerLostList } from './deal-tracker-lost-list';
import type {
  AttorneyRow,
  ConsultantRow,
  DealRow,
  DocumentRow,
  DocumentSignerRow,
  SalesActivityRow,
  SharedCardProps,
} from './deal-card-types';

interface DealTrackerTabProps {
  allDeals: DealRow[];
  prospectAttorneys?: AttorneyRow[];
  clients: ClientRow[];
  pipelineStages: PipelineStage[];
  attorneys: AttorneyRow[];
  documents: DocumentRow[];
  documentSigners: DocumentSignerRow[];
  consultants?: ConsultantRow[];
  salesActivities?: SalesActivityRow[];
  userInfo: { id?: string; company_role?: string } | null;
  showMyDeals?: boolean;
  onShowMyDealsChange?: (v: boolean) => void;
  onSelectTrial: (trial: Trial) => void;
  onAddDeal?: () => void;
  onAddContact?: () => void;
  onAddDealForContact?: (attorney: AttorneyRow) => void;
  viewMode: DealViewMode;
  onViewModeChange: (m: DealViewMode) => void;
  dateFilter: DealDateFilter;
  onDateFilterChange: (v: DealDateFilter) => void;
  statusFilter: DealStatusFilter;
  onStatusFilterChange: (v: DealStatusFilter) => void;
  /** sales_stage drag-and-drop: move a deal to a new stage. */
  onDragEnd?: (dealId: string, destStageId: string) => void;
}

export function DealTrackerTab({
  allDeals,
  prospectAttorneys = [],
  clients,
  pipelineStages,
  attorneys,
  documents,
  documentSigners,
  consultants = [],
  salesActivities = [],
  userInfo,
  showMyDeals = false,
  onShowMyDealsChange,
  onSelectTrial,
  onAddDeal,
  onAddContact,
  onAddDealForContact,
  viewMode,
  onViewModeChange,
  dateFilter,
  onDateFilterChange,
  statusFilter,
  onStatusFilterChange,
  onDragEnd,
}: DealTrackerTabProps) {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSalesPerson, setSelectedSalesPerson] = useState('all');
  const isOwnerOrAdmin = userInfo?.company_role === 'owner' || userInfo?.company_role === 'admin';

  // Force next_step on mobile; respect saved mode on desktop.
  const effectiveViewMode: DealViewMode = isMobile ? 'next_step' : viewMode;

  const sharedCardProps: SharedCardProps = {
    clients,
    pipelineStages,
    attorneys,
    documents,
    documentSigners,
    consultants,
    salesActivities,
    showMyDeals,
    onSelectTrial,
    ...(onAddDealForContact ? { onAddDealForContact } : {}),
  };

  const filterDeals = (input: DealRow[]): DealRow[] => {
    let result = input;
    if (!showMyDeals && selectedSalesPerson !== 'all') {
      result = result.filter((deal) => deal.consultant_id === selectedSalesPerson);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((deal) => {
        const client = clients.find((c) => c.id === deal.client_id);
        return (
          (deal.case_name || '').toLowerCase().includes(term) ||
          (client?.firm_name || '').toLowerCase().includes(term) ||
          (deal.case_number || '').toLowerCase().includes(term)
        );
      });
    }
    return result;
  };

  const filteredDeals = filterDeals(allDeals || []);

  const filteredProspects = (prospectAttorneys || []).filter((a) => {
    if (!showMyDeals && selectedSalesPerson !== 'all') {
      const firm = clients.find((c) => c.id === a.client_id);
      if ((firm as unknown as { sales_lead?: string } | undefined)?.sales_lead !== selectedSalesPerson) return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const firm = clients.find((c) => c.id === a.client_id);
      const name = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
      if (!name.includes(term) && !(firm?.firm_name || '').toLowerCase().includes(term)) return false;
    }
    return true;
  });

  const isLostView = effectiveViewMode === 'sales_stage' && statusFilter === 'lost';

  return (
    <>
      {/* Toolbar row */}
      <div className="flex items-center" style={{ gap: 'var(--theme-element-gap)', marginBottom: 'var(--theme-section-gap)' }}>
        <div className="relative flex-1 min-w-0 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--theme-stone-400)' }} />
          <Input
            placeholder="Search deals..."
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

        {/* Desktop: view-mode toggle */}
        <div className="hidden lg:flex">
          <DealTrackerViewModeToggle value={effectiveViewMode} onChange={onViewModeChange} />
        </div>

        {/* Desktop: My/All toggle + salesperson filter */}
        <div className="hidden lg:flex items-center" style={{ gap: 'var(--theme-element-gap)' }}>
          <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: 'var(--theme-stone-200)' }}>
            <button
              type="button"
              onClick={() => onShowMyDealsChange?.(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={showMyDeals ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' } : { color: 'var(--theme-stone-600)' }}
            >
              <UserIcon className="w-3.5 h-3.5" />
              My Deals
            </button>
            <button
              type="button"
              onClick={() => onShowMyDealsChange?.(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={!showMyDeals ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' } : { color: 'var(--theme-stone-600)' }}
            >
              <Users className="w-3.5 h-3.5" />
              All Deals
            </button>
          </div>
          {isOwnerOrAdmin && !showMyDeals && consultants.length > 0 && (
            <NativeSelect
              value={selectedSalesPerson}
              onChange={(e) => setSelectedSalesPerson(e.target.value)}
              className="h-8 text-xs"
              style={{ minWidth: '140px' }}
              aria-label="Salesperson"
            >
              <NativeSelectOption value="all">All Salespeople</NativeSelectOption>
              {consultants.map((c) => (
                <NativeSelectOption key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
        </div>

        {effectiveViewMode === 'sales_stage' && (
          <DealTrackerSalesStageFilters
            dateFilter={dateFilter}
            onDateFilterChange={onDateFilterChange}
            statusFilter={statusFilter}
            onStatusFilterChange={onStatusFilterChange}
            inline
          />
        )}

        {/* Add Contact — mobile icon-only, desktop labeled */}
        <button
          type="button"
          onClick={() => onAddContact?.()}
          className="ml-auto lg:hidden flex items-center gap-1 px-2 h-9 text-xs font-medium rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
          title="Add Contact"
        >
          <Plus className="w-3.5 h-3.5" />
          <UserPlus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onAddContact?.()}
          className="ml-auto hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Contact
        </button>
        <button
          type="button"
          onClick={() => onAddDeal?.()}
          className="lg:hidden flex items-center gap-1 px-2 h-9 text-xs font-medium rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
          title="Add Deal"
        >
          <Plus className="w-3.5 h-3.5" />
          <Briefcase className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onAddDeal?.()}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Deal
        </button>
      </div>

      {isLostView ? (
        <DealTrackerLostList
          deals={filteredDeals}
          clients={clients}
          consultants={consultants}
          onSelectTrial={onSelectTrial}
        />
      ) : (
        <DealTrackerKanbanGrid
          viewMode={effectiveViewMode}
          deals={filteredDeals}
          prospects={filteredProspects}
          pipelineStages={pipelineStages}
          salesActivities={salesActivities}
          sharedCardProps={sharedCardProps}
          {...(effectiveViewMode === 'sales_stage' && onDragEnd ? { onDragEnd } : {})}
        />
      )}
    </>
  );
}
