/**
 * deal-tracker-lost-list.tsx — port of
 * HotSeatersMVP/src/components/sales/DealTrackerLostList.jsx.
 *
 * Flat sortable table for lost/settled deals (Sales Stage view + Lost filter).
 * Lost/settled deals don't move through stages, so a Kanban isn't useful — the
 * bible shows a sortable list with a desktop grid + a mobile card stack.
 *
 * Adaptation (RULE 0): the bible imports a shared `SortableColumnHeader` +
 * `useSortState` + `applySortToArray`. Those shared helpers aren't ported, so
 * the sort state + clickable header + sort application are reproduced inline
 * (the same pattern other ported list pages use — bills/collections). Rendered
 * output, columns, labels and totals match the bible.
 *
 * HotSeatersMVP is the bible.
 */

import { useState } from 'react';
import { Building2, Calendar, MapPin, ArrowUp, ArrowDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import type { Trial } from '@/features/trials/entities';
import type { ClientRow } from '@/features/clients/hooks/use-clients-list';
import type { ConsultantRow, DealRow } from './deal-card-types';

const fmtK = (v: number): string => `${Math.round(v / 1000).toLocaleString()}k`;

const COMPLETION_LABELS: Record<string, string> = {
  deal_lost: 'Lost',
  deal_settled: 'Settled',
};
const COMPLETION_COLORS: Record<string, string> = {
  deal_lost: '#dc2626',
  deal_settled: '#d97706',
};

type SortKey =
  | 'case_name' | 'client' | 'start_date' | 'sales_lead'
  | 'location' | 'outcome' | 'completion_date' | 'value';
type SortDir = 'asc' | 'desc';
interface SortState { key: SortKey | null; dir: SortDir }

interface DealTrackerLostListProps {
  deals: DealRow[];
  clients: ClientRow[];
  consultants?: ConsultantRow[];
  onSelectTrial: (trial: Trial) => void;
}

export function DealTrackerLostList({
  deals,
  clients,
  consultants = [],
  onSelectTrial,
}: DealTrackerLostListProps) {
  const [sort, setSort] = useState<SortState>({ key: null, dir: 'asc' });

  const handleSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    );

  const getters: Record<SortKey, (t: DealRow) => string | number> = {
    case_name: (t) => t.case_name ?? '',
    client: (t) => clients.find((c) => c.id === t.client_id)?.firm_name ?? '',
    start_date: (t) => t.start_date ?? '',
    sales_lead: (t) => {
      const c = consultants.find((c) => c.id === t.consultant_id);
      return c ? `${c.first_name} ${c.last_name}` : '';
    },
    location: (t) => (t.city && t.state ? `${t.city}, ${t.state}` : t.city || t.state || ''),
    outcome: (t) => COMPLETION_LABELS[t.completion_type ?? ''] ?? '',
    completion_date: (t) => t.completion_date ?? t.lost_date ?? '',
    value: (t) => t.estimated_value ?? 0,
  };

  const sorted = [...deals].sort((a, b) => {
    if (!sort.key) return 0;
    const getter = getters[sort.key];
    const av = getter(a);
    const bv = getter(b);
    let cmp: number;
    if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
    else cmp = String(av).localeCompare(String(bv));
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  const totalValue = sorted.reduce((sum, t) => sum + (t.estimated_value ?? 0), 0);
  const gridCols = '5fr 3.5fr 2fr 2.5fr 2.5fr 1.5fr 2fr 1fr';
  const headerStyle = 'text-xs uppercase tracking-wider text-stone-500 font-medium';

  const SortHeader = ({ label, sortKey, align }: { label: string; sortKey: SortKey; align?: 'right' }) => (
    <button
      type="button"
      onClick={() => handleSort(sortKey)}
      className={`flex items-center gap-1 hover:text-stone-700 ${align === 'right' ? 'justify-end' : ''} ${headerStyle}`}
    >
      {label}
      {sort.key === sortKey && (sort.dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div
        className="hidden lg:grid items-center bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 overflow-hidden"
        style={{ gridTemplateColumns: gridCols, gap: '0 0.75rem', paddingLeft: '1rem' }}
      >
        <SortHeader label="Case" sortKey="case_name" />
        <SortHeader label="Client" sortKey="client" />
        <SortHeader label="Start Date" sortKey="start_date" />
        <SortHeader label="Sales Lead" sortKey="sales_lead" />
        <SortHeader label="Location" sortKey="location" />
        <SortHeader label="Outcome" sortKey="outcome" />
        <SortHeader label="Completed" sortKey="completion_date" />
        <SortHeader label="Value" sortKey="value" align="right" />
      </div>

      <div
        className="border bg-white border-stone-200"
        style={{
          borderRadius: 'var(--theme-card-radius)',
          boxShadow: 'var(--theme-card-shadow)',
          borderWidth: 'var(--theme-card-border)',
          backgroundColor: 'var(--theme-card-bg)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-stone-50">{sorted.length}</Badge>
            <span className="text-sm text-stone-500">Lost / Settled deals</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-stone-400 block leading-tight">Total Value</span>
            <span className="text-sm font-semibold text-stone-700">
              ${totalValue > 0 ? fmtK(totalValue) : '0'}
            </span>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-stone-400 italic">
            No lost or settled deals in this range.
          </div>
        ) : (
          <div>
            {sorted.map((trial) => {
              const client = clients.find((c) => c.id === trial.client_id);
              const salesLead = consultants.find((c) => c.id === trial.consultant_id);
              const outcomeColor = COMPLETION_COLORS[trial.completion_type ?? ''] ?? '#78716c';
              const outcomeLabel = COMPLETION_LABELS[trial.completion_type ?? ''] ?? '-';
              const completedDate = trial.completion_date ?? trial.lost_date;
              const value = trial.estimated_value ?? 0;

              return (
                <div
                  key={trial.id}
                  className="hidden lg:grid border-b border-stone-200 cursor-pointer transition-colors items-center hover:bg-stone-50"
                  style={{ gridTemplateColumns: gridCols, gap: '0 0.75rem', padding: 'var(--theme-list-item-padding)', paddingLeft: '1rem' }}
                  onClick={() => onSelectTrial(trial as unknown as Trial)}
                >
                  <div className="font-semibold text-sm truncate text-stone-900">{trial.case_name || '-'}</div>
                  <div className="flex items-center gap-1 text-sm truncate text-stone-600">
                    <Building2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{client?.firm_name || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm whitespace-nowrap text-stone-600">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>{trial.start_date ? format(parseISO(trial.start_date), 'MMM d, yyyy') : '-'}</span>
                  </div>
                  <div className="text-sm truncate text-stone-600">
                    {salesLead ? `${salesLead.first_name} ${salesLead.last_name}` : '-'}
                  </div>
                  <div className="flex items-center gap-1 text-sm truncate text-stone-600">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {trial.city && trial.state ? `${trial.city}, ${trial.state}` : trial.city || trial.state || '-'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: outcomeColor }} />
                      <span>{outcomeLabel}</span>
                    </span>
                  </div>
                  <div className="text-sm text-stone-500 whitespace-nowrap">
                    {completedDate ? format(parseISO(completedDate), 'MMM d, yyyy') : '-'}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-stone-700">${value > 0 ? fmtK(value) : '-'}</div>
                  </div>
                </div>
              );
            })}

            {/* Mobile card list */}
            {sorted.map((trial) => {
              const client = clients.find((c) => c.id === trial.client_id);
              const salesLead = consultants.find((c) => c.id === trial.consultant_id);
              const outcomeColor = COMPLETION_COLORS[trial.completion_type ?? ''] ?? '#78716c';
              const outcomeLabel = COMPLETION_LABELS[trial.completion_type ?? ''] ?? '-';
              const completedDate = trial.completion_date ?? trial.lost_date;
              const value = trial.estimated_value ?? 0;

              return (
                <div
                  key={`m-${trial.id}`}
                  className="lg:hidden border-b border-stone-200 cursor-pointer hover:bg-stone-50 px-4 py-3"
                  onClick={() => onSelectTrial(trial as unknown as Trial)}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-semibold text-sm text-stone-900 truncate">{trial.case_name || '-'}</div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium flex-shrink-0">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: outcomeColor }} />
                      <span>{outcomeLabel}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-stone-600 truncate">
                    <Building2 className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{client?.firm_name || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-stone-500">
                    <span>
                      {salesLead ? `${salesLead.first_name} ${salesLead.last_name}` : '—'}
                      {completedDate && ` · ${format(parseISO(completedDate), 'MMM d, yyyy')}`}
                    </span>
                    <span className="font-semibold text-stone-700">${value > 0 ? fmtK(value) : '-'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
