/**
 * collections-page.tsx — port of HotSeatersMVP/src/pages/Collections.jsx (766 lines)
 *
 * Visual + functional parity with the bible.
 *
 * Sub-components not yet ported are rendered as stubs so this page mounts,
 * routes, and typechecks cleanly:
 *   - CollectionsCards      → <ComingSoonStub name="Collections Cards" />
 *   - CollectionsList       → <ComingSoonStub name="Collections List" />
 *   - InvoiceListTable      → <ComingSoonStub name="Invoice List Table" />
 *   - PaymentsFilterSheet   → no-op (null)
 *   - PdfPreviewDialog      → no-op (null)
 *   - RecordPaymentContent  → no-op (null)
 *   - GrandTotalBar         → <GrandTotalBarStub />
 *   - CollectionsSortHeader → no-op (null)
 *   - PageToolbar           → inline toolbar stub
 *
 * Adapter rules applied:
 *   - useTier1Data()            → useTier1() from @/app/tier1-provider
 *   - base44.entities.*         → stub empty arrays / no-ops
 *   - createPageUrl("X")        → "/X"
 *   - useSortState              → inline useState stub
 *   - useDeviceType().isMobile  → useIsMobile() from @/shared/hooks/use-mobile
 *   - useSidebar()              → no-op (always expanded)
 *   - runPacedQueriesClient     → stub returning empty results
 *   - base44.functions.invoke   → stub no-op
 *   - queryClient               → no-op stubs
 *   - toast                     → no-op stubs
 *
 * RULE B: only hooks imported — no stores, no PGlite, no Supabase.
 * RULE F: lives in src/features/collections/pages/.
 * RULE A: filename is kebab-case.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import {
  SlidersHorizontal,
  CheckCircle2,
  Mail,
  Search,
  Loader2,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTier1 } from '@/app/tier1-provider';
import { useIsMobile } from '@/shared/hooks/use-mobile';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Invoice {
  id: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  total?: number;
  status?: string;
  client_id?: string;
  trial_id?: string;
  pdf_url?: string;
  is_hsh_invoice?: boolean;
  recipient_emails?: { to?: string[]; cc?: string[]; bcc?: string[] };
}

interface Client {
  id: string;
  firm_name?: string;
  name?: string;
}

interface Trial {
  id: string;
  case_name?: string;
  job_number?: string;
}

interface Collection {
  id: string;
  invoice_id?: string;
  amount?: number;
  collection_date?: string;
  payment_date?: string;
}

interface InvoiceGroup {
  id: string;
  title: string;
  invoices: Invoice[];
  total: number;
  color: string;
  variant: 'open' | 'overdue' | 'paid';
  getClient: (inv: Invoice) => Client | undefined;
  getTrial: (inv: Invoice) => Trial | undefined;
  paymentsByInvoice: PaymentsByInvoice;
}

interface PaymentEntry {
  total: number;
  payments: Collection[];
}
type PaymentsByInvoice = Record<string, PaymentEntry>;

interface SortState {
  field: string | null;
  direction: 'asc' | 'desc';
}

interface PaymentForm {
  paid_date: string;
  payment_method: string;
  payment_reference: string;
  payment_amount: string;
  notes: string;
}

interface DateRange {
  from: Date | null;
  to: Date | null;
}

// ---------------------------------------------------------------------------
// Stubs for sub-components not yet ported
// ---------------------------------------------------------------------------

function ComingSoonStub({ name }: { name: string }) {
  return (
    <div
      style={{
        padding: '2rem 1rem',
        textAlign: 'center',
        border: '1px dashed var(--theme-stone-200)',
        borderRadius: 'var(--theme-card-radius)',
        color: 'var(--theme-stone-500)',
        fontSize: 'var(--theme-text-body)',
      }}
    >
      {name} — Coming soon
    </div>
  );
}

function PageLoaderInline({ message }: { message?: string }) {
  return (
    <div style={{ padding: 'var(--theme-page-padding)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--theme-stone-500)' }}>
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{message ?? 'Loading…'}</span>
    </div>
  );
}

interface GrandTotalBarProps {
  columns: InvoiceGroup[];
  label: string;
}

function GrandTotalBarStub({ columns, label }: GrandTotalBarProps) {
  const total = columns.reduce((sum, g) => sum + g.total, 0);
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total);
  return (
    <div
      style={{
        marginTop: '1.5rem',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--theme-card-radius)',
        backgroundColor: 'var(--theme-card-bg)',
        border: '1px solid var(--theme-stone-200)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: 'var(--theme-font-body)',
        fontSize: 'var(--theme-text-body)',
        color: 'var(--theme-stone-700)',
        fontWeight: 600,
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: 'var(--theme-text-lg)', color: 'var(--theme-stone-900)' }}>{formatted}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function CollectionsPage() {
  const isMobile = useIsMobile();

  // Tier-1: read user/company from the boot-cached provider
  const { company } = useTier1();
  void company; // companyId used when Tier-2 store lands
  const ownClients = useMemo<Client[]>(() => [], []); // Tier-2 store pending — stub empty array

  // View type: card on mobile, list on desktop
  const [viewType, setViewType] = useState<'card' | 'list' | null>(null);
  useEffect(() => {
    setViewType(isMobile ? 'card' : 'list');
  }, [isMobile]);

  // Collapsed sections state
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  // collapsedSections passed to sub-components once ported — suppress lint until then
  void collapsedSections;

  // Tabs and filters
  const [activeTab, setActiveTab] = useState<'active' | 'paid' | 'all'>('active');
  const [dateFilter, setDateFilter] = useState('this_year');
  // setDateFilter consumed by PaymentsFilterSheet and date toolbar once ported
  void (setDateFilter as unknown);
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ from: null, to: null });
  // setCustomDateRange consumed by PaymentsFilterSheet once ported
  void (setCustomDateRange as unknown);
  const [groupBy, setGroupBy] = useState<'stage' | 'none' | 'client' | 'trial'>('stage');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  void showFilterSheet; // consumed by PaymentsFilterSheet once ported
  const [showRowTint, setShowRowTint] = useState(false);
  void showRowTint; // consumed by CollectionsList/InvoiceListTable once ported
  // setShowRowTint consumed by PageToolbar once ported
  void (setShowRowTint as unknown);

  // Sort state (mirrors bible's useSortState hook)
  const [sort, setSort] = useState<SortState>({ field: null, direction: 'asc' });
  void sort; // passed to CollectionsSortHeader / InvoiceListTable once ported
  const handleSort = useCallback((field: string) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);
  void handleSort; // passed to CollectionsSortHeader once ported

  // Payment form state
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    paid_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: '',
    payment_reference: '',
    payment_amount: '',
    notes: '',
  });

  // Modal state
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  void previewInvoiceId; // consumed by PdfPreviewDialog once ported
  void setPreviewInvoiceId; // passed to CollectionsCards/CollectionsList once ported
  const [markPaidInvoice, setMarkPaidInvoice] = useState<Invoice | null>(null);
  const [resendInvoice, setResendInvoice] = useState<Invoice | null>(null);
  const [resendMessage, setResendMessage] = useState('');

  // Stub data — Tier-2 store pending
  const isLoading = false;
  const invoices = useMemo<Invoice[]>(() => [], []);
  const clients: Client[] = ownClients;
  const trials = useMemo<Trial[]>(() => [], []);
  const payments = useMemo<Collection[]>(() => [], []);
  const hiringCompanies = useMemo<Client[]>(() => [], []);

  // Build a map of total collections per invoice (bible lines 188–196)
  const paymentsByInvoice = useMemo<PaymentsByInvoice>(() => {
    const map: PaymentsByInvoice = {};
    payments.forEach(p => {
      if (!p.invoice_id) return;
      const existing = map[p.invoice_id];
      const entry = existing ?? { total: 0, payments: [] };
      if (!existing) map[p.invoice_id] = entry;
      entry.total += (p.amount ?? 0);
      entry.payments.push(p);
    });
    return map;
  }, [payments]);

  const resetPaymentForm = useCallback(() => {
    setPaymentForm({
      paid_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: '',
      payment_reference: '',
      payment_amount: '',
      notes: '',
    });
  }, []);

  // Business rules (bible lines 264–303)
  const isPaidFromPayments = useCallback((invoice: Invoice): boolean => {
    if (invoice.status === 'paid') return true;
    const invPayments = paymentsByInvoice[invoice.id];
    if (!invPayments) return false;
    return Math.round(invPayments.total * 100) >= Math.round((invoice.total ?? 0) * 100);
  }, [paymentsByInvoice]);

  const isOverdue = useCallback((invoice: Invoice): boolean => {
    if (!invoice.due_date) return false;
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueDate = parseISO(invoice.due_date);
    return dueDate < todayLocal;
  }, []);

  const isOpenStatus = useCallback((inv: Invoice): boolean =>
    inv.status === 'sent' || inv.status === 'partial' || inv.status === 'hsh_approved' || inv.status === 'hsh_paid',
  []);

  // Status label / color overrides for subcontractor perspective (bible lines 303–304)
  const collectionsStatusLabelOverrides: Record<string, string> = { hsh_paid: 'Payment Sent' };
  void collectionsStatusLabelOverrides; // passed to sub-components once ported
  const collectionsStatusColorOverrides: Record<string, string> = { hsh_paid: 'bg-blue-100 text-blue-700' };
  void collectionsStatusColorOverrides; // passed to sub-components once ported

  const matchesSearch = useCallback((inv: Invoice): boolean => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const c = inv.is_hsh_invoice
      ? hiringCompanies.find(co => co.id === inv.client_id)
      : clients.find(co => co.id === inv.client_id);
    const t = trials.find(tr => tr.id === inv.trial_id);
    const clientName = (c?.firm_name ?? c?.name ?? '').toLowerCase();
    const caseName = (t?.case_name ?? '').toLowerCase();
    const jobNum = (t?.job_number ?? '').toLowerCase();
    const invNum = (inv.invoice_number ?? '').toLowerCase();
    return clientName.includes(q) || caseName.includes(q) || jobNum.includes(q) || invNum.includes(q);
  }, [searchQuery, hiringCompanies, clients, trials]);

  // Filtered invoice buckets (bible lines 306–319)
  const overdueInvoices = useMemo(() =>
    invoices.filter(inv =>
      !isPaidFromPayments(inv) && isOpenStatus(inv) && isOverdue(inv) && matchesSearch(inv)
    ),
  [invoices, isPaidFromPayments, isOpenStatus, isOverdue, matchesSearch]);

  const openInvoices = useMemo(() =>
    invoices.filter(inv =>
      !isPaidFromPayments(inv) && isOpenStatus(inv) && !isOverdue(inv) && matchesSearch(inv)
    ),
  [invoices, isPaidFromPayments, isOpenStatus, isOverdue, matchesSearch]);

  const allPaidInvoices = useMemo(() =>
    invoices.filter(inv => isPaidFromPayments(inv)),
  [invoices, isPaidFromPayments]);

  // Date range computation (bible lines 322–337)
  const dateRange = useMemo<readonly [Date, Date] | null>(() => {
    const now = new Date();
    switch (dateFilter) {
      case 'all_time': return null;
      case 'today': return [now, now];
      case 'this_week': {
        const f = new Date(now); f.setDate(now.getDate() - now.getDay());
        const t = new Date(f); t.setDate(f.getDate() + 6);
        return [f, t];
      }
      case 'this_month':
        return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0)];
      case 'last_week': {
        const t2 = new Date(now); t2.setDate(now.getDate() - now.getDay() - 1);
        const f2 = new Date(t2); f2.setDate(t2.getDate() - 6);
        return [f2, t2];
      }
      case 'last_month':
        return [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0)];
      case 'this_year':
        return [new Date(now.getFullYear(), 0, 1), new Date(now.getFullYear(), 11, 31)];
      case 'last_year':
        return [new Date(now.getFullYear() - 1, 0, 1), new Date(now.getFullYear() - 1, 11, 31)];
      case 'custom':
        return customDateRange?.from
          ? [customDateRange.from, customDateRange.to ?? customDateRange.from]
          : null;
      default: return null;
    }
  }, [dateFilter, customDateRange]);

  const isInDateRange = useCallback((dateStr: string | undefined): boolean => {
    if (!dateRange || !dateStr) return true;
    const [drFrom, drTo] = dateRange;
    const d = new Date(dateStr);
    const from = new Date(drFrom.getFullYear(), drFrom.getMonth(), drFrom.getDate());
    const to = new Date(drTo.getFullYear(), drTo.getMonth(), drTo.getDate());
    const check = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return check >= from && check <= to;
  }, [dateRange]);

  // Paid invoices filtered by date + search (bible lines 349–359)
  const paidInvoices = useMemo(() =>
    allPaidInvoices.filter(inv => {
      const invPayments = paymentsByInvoice[inv.id]?.payments ?? [];
      if (invPayments.length === 0) {
        return isInDateRange(inv.invoice_date) && matchesSearch(inv);
      }
      const sorted = [...invPayments].sort((a, b) =>
        (b.collection_date ?? b.payment_date ?? '').localeCompare(a.collection_date ?? a.payment_date ?? '')
      );
      const latest = sorted[0];
      return isInDateRange(latest?.collection_date ?? latest?.payment_date) && matchesSearch(inv);
    }),
  [allPaidInvoices, paymentsByInvoice, isInDateRange, matchesSearch]);

  // Helpers
  const getClient = useCallback((invoice: Invoice): Client | undefined =>
    invoice.is_hsh_invoice
      ? hiringCompanies.find(c => c.id === invoice.client_id)
      : clients.find(c => c.id === invoice.client_id),
  [hiringCompanies, clients]);

  const getTrial = useCallback((invoice: Invoice): Trial | undefined =>
    trials.find(t => t.id === invoice.trial_id),
  [trials]);

  const handleMarkPaid = useCallback((invoice: Invoice) => {
    setMarkPaidInvoice(invoice);
    resetPaymentForm();
    const alreadyPaid = paymentsByInvoice[invoice.id]?.total ?? 0;
    const remaining = Math.round(Math.max(0, (invoice.total ?? 0) - alreadyPaid) * 100) / 100;
    setPaymentForm(f => ({ ...f, payment_amount: remaining.toFixed(2) }));
  }, [paymentsByInvoice, resetPaymentForm]);
  void handleMarkPaid; // passed to CollectionsCards/CollectionsList once ported

  const toggleCollapse = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);
  void toggleCollapse; // passed to CollectionsCards/CollectionsList once ported

  // Group invoices helper (bible lines 414–443)
  const groupInvoices = useCallback((
    invList: Invoice[],
    variant: 'open' | 'overdue' | 'paid',
    color: string,
  ): InvoiceGroup[] => {
    const groups: Record<string, { key: string; label: string; invoices: Invoice[] }> = {};
    invList.forEach(inv => {
      let key: string;
      let label: string;
      if (groupBy === 'client') {
        const c = getClient(inv);
        key = inv.client_id ?? 'unknown';
        label = c?.firm_name ?? c?.name ?? 'Unknown Client';
      } else {
        const t = getTrial(inv);
        key = inv.trial_id ?? 'unknown';
        label = t ? `${t.job_number ? `(${t.job_number}) ` : ''}${t.case_name ?? ''}` : 'Unknown Trial';
      }
      const existingGroup = groups[key];
      const group = existingGroup ?? { key, label, invoices: [] };
      if (!existingGroup) groups[key] = group;
      group.invoices.push(inv);
    });
    const isPaidVariant = variant === 'paid';
    return Object.values(groups)
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(g => ({
        id: g.key,
        title: g.label,
        invoices: g.invoices,
        total: g.invoices.reduce((sum, inv) =>
          sum + (isPaidVariant ? (inv.total ?? 0) : ((inv.total ?? 0) - (paymentsByInvoice[inv.id]?.total ?? 0))), 0),
        color,
        variant,
        getClient,
        getTrial,
        paymentsByInvoice,
      }));
  }, [groupBy, getClient, getTrial, paymentsByInvoice]);

  // Build columns (bible lines 446–497)
  const collectionsColumns = useMemo<InvoiceGroup[]>(() => {
    let pool: Invoice[];
    if (activeTab === 'paid') pool = paidInvoices;
    else if (activeTab === 'all') pool = [...openInvoices, ...overdueInvoices, ...paidInvoices];
    else pool = [...openInvoices, ...overdueInvoices];

    const isPaidTab = activeTab === 'paid';
    const calcTotal = (inv: Invoice) =>
      isPaidTab ? (inv.total ?? 0) : ((inv.total ?? 0) - (paymentsByInvoice[inv.id]?.total ?? 0));

    if (groupBy === 'stage') {
      const groups: InvoiceGroup[] = [];
      const openPool = pool.filter(inv => !isPaidFromPayments(inv) && isOpenStatus(inv) && !isOverdue(inv));
      const overduePool = pool.filter(inv => !isPaidFromPayments(inv) && isOpenStatus(inv) && isOverdue(inv));
      const paidPool = pool.filter(inv => isPaidFromPayments(inv));

      if (openPool.length > 0) groups.push({
        id: 'open', title: 'Open', invoices: openPool,
        total: openPool.reduce((sum, inv) => sum + calcTotal(inv), 0),
        color: 'var(--theme-success)', variant: 'open', getClient, getTrial, paymentsByInvoice,
      });
      if (overduePool.length > 0) groups.push({
        id: 'overdue', title: 'Overdue', invoices: overduePool,
        total: overduePool.reduce((sum, inv) => sum + calcTotal(inv), 0),
        color: 'var(--theme-danger)', variant: 'overdue', getClient, getTrial, paymentsByInvoice,
      });
      if (paidPool.length > 0) groups.push({
        id: 'paid', title: 'Paid', invoices: paidPool,
        total: paidPool.reduce((sum, inv) => sum + (inv.total ?? 0), 0),
        color: 'var(--theme-success)', variant: 'paid', getClient, getTrial, paymentsByInvoice,
      });
      return groups;
    }

    if (groupBy === 'none') {
      return [{
        id: 'all',
        title: activeTab === 'paid' ? 'Paid Invoices' : activeTab === 'all' ? 'All Invoices' : 'Open Invoices',
        invoices: pool,
        total: pool.reduce((sum, inv) => sum + calcTotal(inv), 0),
        color: 'var(--theme-success)',
        variant: isPaidTab ? 'paid' : 'open',
        getClient, getTrial, paymentsByInvoice,
      }];
    }

    // client or trial grouping
    return groupInvoices(pool, isPaidTab ? 'paid' : 'open', 'var(--theme-success)');
  }, [
    activeTab, paidInvoices, openInvoices, overdueInvoices, groupBy,
    paymentsByInvoice, isPaidFromPayments, isOpenStatus, isOverdue,
    getClient, getTrial, groupInvoices,
  ]);

  // Grand total label (bible line 641)
  const grandTotalLabel =
    activeTab === 'paid' ? 'Total Paid' :
    activeTab === 'all' ? 'Grand Total' :
    'Total Outstanding';

  if (isLoading) {
    return <PageLoaderInline message="Loading collections data..." />;
  }

  return (
    <div
      style={{
        padding: 'var(--theme-page-padding)',
        fontFamily: 'var(--theme-font-body)',
      }}
      className="lg:px-8"
    >
      <div style={{ maxWidth: 'var(--theme-max-content-width)' }} className="mx-auto">
        {/* Page header — hidden on mobile (bible line 511) */}
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
              Collections
            </h1>
            <p
              style={{
                fontSize: 'var(--theme-text-body)',
                color: 'var(--theme-stone-600)',
              }}
            >
              Track outstanding and paid invoices
            </p>
          </div>
        </div>

        {/*
          PaymentsFilterSheet stub — mobile filter drawer (bible line 527)
          Not yet ported; renders null.
        */}

        {/* Inline toolbar (mirrors bible's PageToolbar at lines 540–580) */}
        {viewType && (
          <div
            className="flex items-center gap-2 mb-4 flex-wrap"
            style={{ fontFamily: 'var(--theme-font-body)' }}
          >
            {/* Search */}
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: 'var(--theme-stone-400)' }} />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search invoices..."
                className="w-full h-9 pl-8 pr-3 text-xs rounded-lg border outline-none"
                style={{
                  borderColor: 'var(--theme-stone-200)',
                  color: 'var(--theme-stone-700)',
                  backgroundColor: 'white',
                  fontFamily: 'var(--theme-font-body)',
                }}
              />
            </div>

            {/* Status tabs */}
            <div className="flex items-center rounded-lg overflow-hidden border" style={{ borderColor: 'var(--theme-stone-200)' }}>
              {([
                { key: 'active', label: 'Open' },
                { key: 'paid', label: 'Paid' },
                { key: 'all', label: 'All' },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="h-9 px-3 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: activeTab === tab.key ? 'var(--theme-brand-primary)' : 'white',
                    color: activeTab === tab.key ? 'white' : 'var(--theme-stone-600)',
                    fontFamily: 'var(--theme-font-body)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Group-by select */}
            <Select value={groupBy} onValueChange={v => setGroupBy(v as typeof groupBy)}>
              <SelectTrigger className="h-9 text-xs w-[120px]">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="stage">Stage</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile filter button */}
            <button
              onClick={() => setShowFilterSheet(true)}
              className="flex lg:hidden items-center gap-1 h-9 px-2.5 text-xs font-medium rounded-lg border transition-colors"
              style={{
                borderColor: 'var(--theme-stone-200)',
                color: 'var(--theme-stone-600)',
                backgroundColor: 'white',
              }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Collections content stubs (sub-components not yet ported) */}
        {viewType === 'card' && (
          <ComingSoonStub name="Collections Cards" />
        )}

        {viewType === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <ComingSoonStub name="Collections List / Invoice Table" />
          </div>
        )}

        {/* Grand total bar */}
        {viewType && (
          <GrandTotalBarStub columns={collectionsColumns} label={grandTotalLabel} />
        )}

        {/*
          Invoice Preview Dialog — PdfPreviewDialog stub (bible lines 644–652)
          Not yet ported; renders null.
        */}

        {/* Resend Invoice modal (bible lines 654–708) */}
        {(() => {
          const recipients = resendInvoice?.recipient_emails ?? { to: [], cc: [], bcc: [] };
          const hasRecipients = (recipients.to?.length ?? 0) > 0 || (recipients.cc?.length ?? 0) > 0 || (recipients.bcc?.length ?? 0) > 0;
          return (
            <AlertDialog
              open={!!resendInvoice}
              onOpenChange={open => {
                if (!open) { setResendInvoice(null); setResendMessage(''); }
              }}
            >
              <AlertDialogContent style={{ fontFamily: 'var(--theme-font-body)' }}>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {resendInvoice ? `Resend Invoice #${resendInvoice.invoice_number}?` : ''}
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <div className="space-y-3 text-sm">
                  {!hasRecipients ? (
                    <p className="text-amber-600 font-medium">No email recipients configured for this invoice.</p>
                  ) : (
                    <>
                      <p style={{ color: 'var(--theme-stone-600)' }}>
                        The invoice email will be re-sent. The invoice status will{' '}
                        <strong>not</strong> change.
                      </p>
                      <div className="space-y-1">
                        {(recipients.to?.length ?? 0) > 0 && <div><span className="font-semibold">To:</span> {recipients.to!.join(', ')}</div>}
                        {(recipients.cc?.length ?? 0) > 0 && <div><span className="font-semibold">CC:</span> {recipients.cc!.join(', ')}</div>}
                        {(recipients.bcc?.length ?? 0) > 0 && <div><span className="font-semibold">BCC:</span> {recipients.bcc!.join(', ')}</div>}
                      </div>
                      <div className="pt-1">
                        <Label htmlFor="resend-message" className="text-sm font-semibold">
                          Message <span className="font-normal text-stone-500">(optional)</span>
                        </Label>
                        <Textarea
                          id="resend-message"
                          value={resendMessage}
                          onChange={e => setResendMessage(e.target.value)}
                          placeholder="Add an optional message to include in the email…"
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => { setResendInvoice(null); setResendMessage(''); }}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={!hasRecipients}
                    style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Resend Email
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          );
        })()}

        {/* Mark as Paid — Drawer on mobile, AlertDialog on desktop (bible lines 710–763) */}
        {isMobile ? (
          <Drawer
            open={!!markPaidInvoice}
            onOpenChange={open => { if (!open) setMarkPaidInvoice(null); }}
          >
            <DrawerContent style={{ fontFamily: 'var(--theme-font-body)' }}>
              <DrawerHeader className="sr-only">
                <DrawerTitle>Record Collection</DrawerTitle>
                <DrawerDescription>Record a collection for an invoice</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pt-2 pb-8 max-h-[85vh] overflow-auto">
                <h3
                  className="text-base font-semibold mb-3"
                  style={{ color: 'var(--theme-stone-900)' }}
                >
                  Record Collection
                </h3>
                {/* RecordPaymentContent stub */}
                <ComingSoonStub name="Record Payment Form" />
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <AlertDialog
            open={!!markPaidInvoice}
            onOpenChange={open => { if (!open) setMarkPaidInvoice(null); }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Record Collection</AlertDialogTitle>
                <AlertDialogDescription className="sr-only">
                  Record a payment collection for the selected invoice.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {/* RecordPaymentContent stub */}
              <ComingSoonStub name="Record Payment Form" />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={!paymentForm.paid_date}
                  style={{ backgroundColor: 'var(--theme-success)', color: 'white' }}
                  className="hover:opacity-90"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Record Collection
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
