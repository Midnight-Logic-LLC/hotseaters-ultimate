/**
 * deal-urgency-banner.tsx — port of
 * HotSeatersMVP/src/components/sales/DealUrgencyBanner.jsx.
 *
 * Aggregates urgent deals + contact-only prospects into three banner cards:
 *   • Needs Attention — no scheduled next step
 *   • Overdue Follow-Ups — pending activity scheduled in the past
 *   • Due Today — pending activity scheduled for today
 *
 * Each entry is a clickable chip: clicking flips the view to Next Step (when
 * the item only exists there — contact-only prospects), scrolls to the card's
 * stable DOM id (`flash-target-…`), and flashes a red outline overlay.
 *
 * HotSeatersMVP is the bible.
 */

import { AlertTriangle, Clock, ChevronRight, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { DealViewMode } from '@/features/deals/business-rules/deal-kanban-buckets';
import type { ClientRow } from '@/features/clients/hooks/use-clients-list';
import type { AttorneyRow, DealRow, SalesActivityRow } from './deal-card-types';

const FLASH_STYLE_ID = '__deal-tracker-flash-style';

function ensureFlashStyle(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(FLASH_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = FLASH_STYLE_ID;
  el.textContent = `
  @keyframes dealTrackerFlashOverlay {
    0%, 100% { opacity: 0; }
    50%      { opacity: 1; }
  }
  :where(.deal-tracker-flash) { position: relative; }
  .deal-tracker-flash::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 50;
    border: 4px solid #dc2626;
    background-color: rgba(220, 38, 38, 0.18);
    border-radius: var(--theme-list-item-radius, 0.5rem);
    opacity: 0;
    animation: dealTrackerFlashOverlay 0.75s ease-in-out 3;
  }
  `;
  document.head.appendChild(el);
}

function scrollToOpportunity(
  domId: string,
  viewMode: DealViewMode,
  onViewModeChange: ((m: DealViewMode) => void) | undefined,
  requiresViewSwitch: boolean,
): void {
  ensureFlashStyle();

  const flash = (el: HTMLElement) => {
    el.classList.remove('deal-tracker-flash');
    void el.offsetWidth; // force reflow so consecutive clicks restart the anim
    el.classList.add('deal-tracker-flash');
    setTimeout(() => el.classList.remove('deal-tracker-flash'), 2400);
  };

  const isInView = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return r.top >= 0 && r.bottom <= vh && r.height > 0;
  };

  const doScrollAndFlash = (attempts = 0) => {
    const el = document.getElementById(domId);
    if (!el) {
      if (attempts < 10) setTimeout(() => doScrollAndFlash(attempts + 1), 80);
      return;
    }
    if (isInView(el)) {
      flash(el);
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => flash(el), 600);
  };

  if (requiresViewSwitch && viewMode !== 'next_step') {
    onViewModeChange?.('next_step');
    setTimeout(() => doScrollAndFlash(), 200);
  } else {
    doScrollAndFlash();
  }
}

interface BannerItem {
  id: string;
  domId: string;
  label: string;
  date: string | null;
  isProspect: boolean;
}

function ItemChip({
  item,
  withDate,
  viewMode,
  onViewModeChange,
}: {
  item: BannerItem;
  withDate?: boolean | undefined;
  viewMode: DealViewMode;
  onViewModeChange?: ((m: DealViewMode) => void) | undefined;
}) {
  return (
    <button
      type="button"
      onClick={() => scrollToOpportunity(item.domId, viewMode, onViewModeChange, item.isProspect)}
      title="Scrolls to card"
      className="text-xs text-red-600 hover:text-red-800 hover:underline flex items-center gap-1"
    >
      <ChevronRight className="w-3 h-3" />
      {item.label}
      {withDate && item.date && (
        <span className="text-red-400 ml-0.5">({format(parseISO(`${item.date}T00:00:00`), 'MMM d')})</span>
      )}
    </button>
  );
}

function ItemLinks({
  items,
  withDate = false,
  viewMode,
  onViewModeChange,
}: {
  items: BannerItem[];
  withDate?: boolean | undefined;
  viewMode: DealViewMode;
  onViewModeChange?: ((m: DealViewMode) => void) | undefined;
}) {
  const MAX = 5;
  const visible = items.slice(0, MAX);
  const overflow = items.length - visible.length;

  const normal = visible.filter((i) => !(i.isProspect && viewMode !== 'next_step'));
  const switching = visible.filter((i) => i.isProspect && viewMode !== 'next_step');

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
      {normal.map((item) => (
        <ItemChip key={item.id} item={item} withDate={withDate} viewMode={viewMode} onViewModeChange={onViewModeChange} />
      ))}

      {switching.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md border border-dashed border-red-300 px-2 py-0.5"
          style={{ backgroundColor: 'rgba(120, 113, 108, 0.18)' }}
          title="These open in Next Step view"
        >
          {switching.map((item) => (
            <ItemChip key={item.id} item={item} withDate={withDate} viewMode={viewMode} onViewModeChange={onViewModeChange} />
          ))}
          <ArrowLeftRight className="w-3.5 h-3.5 text-red-500 ml-0.5" aria-label="Switches view" />
        </div>
      )}

      {overflow > 0 && <span className="text-xs text-red-400">+{overflow} more</span>}
    </div>
  );
}

function BannerCard({ icon: Icon, children }: { icon: typeof AlertCircle; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg border flex-1 min-w-[250px]"
      style={{ backgroundColor: 'color-mix(in srgb, #dc2626 8%, white)', borderColor: '#fca5a5' }}
    >
      <Icon className="w-5 h-5 text-red-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

interface DealUrgencyBannerProps {
  deals?: DealRow[];
  prospects?: AttorneyRow[];
  attorneys?: AttorneyRow[];
  clients?: ClientRow[];
  salesActivities?: SalesActivityRow[];
  viewMode: DealViewMode;
  onViewModeChange?: ((m: DealViewMode) => void) | undefined;
}

export function DealUrgencyBanner({
  deals = [],
  prospects = [],
  attorneys = [],
  clients = [],
  salesActivities = [],
  viewMode,
  onViewModeChange,
}: DealUrgencyBannerProps) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const earliestByTrial = new Map<string, string>();
  const earliestByAttorney = new Map<string, string>();
  salesActivities.forEach((a) => {
    if (a.status !== 'pending' || !a.scheduled_date) return;
    if (a.trial_id) {
      const prev = earliestByTrial.get(a.trial_id);
      if (!prev || a.scheduled_date < prev) earliestByTrial.set(a.trial_id, a.scheduled_date);
    } else if (a.attorney_id) {
      const prev = earliestByAttorney.get(a.attorney_id);
      if (!prev || a.scheduled_date < prev) earliestByAttorney.set(a.attorney_id, a.scheduled_date);
    }
  });

  const attorneyById = new Map(attorneys.map((a) => [a.id, a]));
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const dealLabel = (deal: DealRow): string => {
    const contact = deal.primary_contact_id ? attorneyById.get(deal.primary_contact_id) : undefined;
    if (contact) return `${contact.first_name} ${contact.last_name}`;
    const firm = deal.client_id ? clientById.get(deal.client_id) : undefined;
    return firm?.firm_name || deal.case_name || 'Deal';
  };
  const prospectLabel = (att: AttorneyRow): string =>
    `${att.first_name || ''} ${att.last_name || ''}`.trim() || 'Contact';

  const overdue: BannerItem[] = [];
  const dueToday: BannerItem[] = [];
  const noNextStep: BannerItem[] = [];

  deals.forEach((deal) => {
    const sched = earliestByTrial.get(deal.id) ?? null;
    const item: BannerItem = {
      id: `deal-${deal.id}`,
      domId: `flash-target-${deal.id}`,
      label: dealLabel(deal),
      date: sched,
      isProspect: false,
    };
    if (!sched) noNextStep.push(item);
    else if (sched < todayStr) overdue.push(item);
    else if (sched === todayStr) dueToday.push(item);
  });

  prospects.forEach((att) => {
    const sched = earliestByAttorney.get(att.id) ?? null;
    const item: BannerItem = {
      id: `prospect-${att.id}`,
      domId: `flash-target-attorney-${att.id}`,
      label: prospectLabel(att),
      date: sched,
      isProspect: true,
    };
    if (!sched) noNextStep.push(item);
    else if (sched < todayStr) overdue.push(item);
    else if (sched === todayStr) dueToday.push(item);
  });

  if (overdue.length === 0 && dueToday.length === 0 && noNextStep.length === 0) return null;

  return (
    <div className="flex flex-wrap" style={{ gap: 'var(--theme-element-gap)', marginBottom: 'var(--theme-section-gap)' }}>
      {noNextStep.length > 0 && (
        <BannerCard icon={AlertCircle}>
          <span className="text-sm font-semibold text-red-700">
            Needs Attention: {noNextStep.length} with no next step
          </span>
          <ItemLinks items={noNextStep} viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </BannerCard>
      )}

      {overdue.length > 0 && (
        <BannerCard icon={AlertTriangle}>
          <span className="text-sm font-semibold text-red-700">
            {overdue.length} Overdue Follow-Up{overdue.length > 1 ? 's' : ''}
          </span>
          <ItemLinks items={overdue} withDate viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </BannerCard>
      )}

      {dueToday.length > 0 && (
        <BannerCard icon={Clock}>
          <span className="text-sm font-semibold text-red-700">{dueToday.length} Due Today</span>
          <ItemLinks items={dueToday} viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </BannerCard>
      )}
    </div>
  );
}
