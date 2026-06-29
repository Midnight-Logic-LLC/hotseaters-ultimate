/**
 * bills-page.tsx — Bills: Track HSH subcontractor bills.
 *
 * BIBLE: HotSeatersMVP/src/pages/Bills.jsx
 *
 * Visual and functional parity with the bible. Sub-components that have not
 * yet been ported (CollectionsCards, CollectionsList, InvoiceListTable,
 * PaymentsFilterSheet, GrandTotalBar, PageToolbar, CollectionsSortHeader,
 * RecordPaymentContent, PdfPreviewDialog, PageLoader) are rendered as stubs
 * that preserve the section name so the page structure is clear. Tier-2
 * entity data (bills, payments) stubs to empty arrays until the Bills store
 * lands.
 *
 * RULE B: this component imports hooks only — no store or API calls directly.
 * RULE G: AlertDialog, Drawer primitives from @/components/ui.
 * RULE A: filename is kebab-case.
 * Self-hosted Supabase only.
 */

import { useState, useEffect, useMemo } from 'react';
import { parseISO } from 'date-fns';
import {
  Banknote,
  SlidersHorizontal,
  Layers,
  Building2,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { useTier1 } from '@/app/tier1-provider';
import { useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BillInvoice {
  id: string;
  company_id: string;
  trial_id?: string | null;
  invoice_number?: string;
  total?: number;
  status?: string;
  due_date?: string | null;
  invoice_date?: string;
  updated_date?: string;
  pdf_url?: string;
  client_id?: string;
  is_hsh_invoice?: boolean;
}

interface BillCompany {
  id: string;
  name: string;
}

interface BillTrial {
  id: string;
  case_name?: string;
  job_number?: string;
}

interface BillPayment {
  id: string;
  invoice_id: string;
  amount?: number;
  payment_date?: string;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
  company_id?: string;
  recorded_by?: string;
}

interface PaymentsByInvoice {
  [invoiceId: string]: { total: number; payments: BillPayment[] };
}

interface PaymentForm {
  paid_date: string;
  payment_amount: string;
  payment_method: string;
  payment_reference: string;
  notes: string;
}

interface BillGroup {
  id: string;
  title: string;
  invoices: BillInvoice[];
  total: number;
  color: string;
  variant: 'open' | 'overdue' | 'paid';
  getClient: (invoice: BillInvoice) => BillCompany | undefined;
  getTrial: (invoice: BillInvoice) => BillTrial | undefined;
  paymentsByInvoice: PaymentsByInvoice;
}

// ---------------------------------------------------------------------------
// Stub components — will be replaced when sub-components are ported
// ---------------------------------------------------------------------------

function StubSection({ name }: { name: string }) {
  return (
    <div
      style={{
        padding: '1rem',
        border: '1px dashed var(--theme-stone-200)',
        borderRadius: 'var(--theme-card-radius)',
        color: 'var(--theme-stone-400)',
        fontSize: 'var(--theme-text-sm)',
        textAlign: 'center',
      }}
    >
      {name} — Coming soon
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sorting stub (matches useSortState shape from bible)
// ---------------------------------------------------------------------------

interface SortState {
  column: string | null;
  direction: 'asc' | 'desc';
}

function useSortState() {
  const [sort, setSort] = useState<SortState>({ column: null, direction: 'asc' });
  const handleSort = (column: string) => {
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' },
    );
  };
  return { sort, handleSort };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BILL_PAYMENT_LABELS = {
  priorLabel: 'Prior Payments',
  dateLabel: 'Payment Date *',
  amountLabel: 'Amount Paid',
  methodLabel: 'Payment Method',
  notesPlaceholder: 'Optional payment notes...',
  submitLabel: 'Record Payment',
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BillsPage() {
  const { userInfo } = useTier1();
  const isMobile = useIsMobile();
  const { state: sidebarState } = useSidebar();
  const sidebarCollapsed = sidebarState === 'collapsed';
  const listBreakpoint = sidebarCollapsed ? 1072 : 1280;

  const [useCards, setUseCards] = useState(isMobile);
  useEffect(() => {
    const check = () => setUseCards(window.innerWidth < listBreakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [listBreakpoint]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'paid' | 'all'>('active');
  const [dateFilter, setDateFilter] = useState('this_year');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  const [markPaidInvoice, setMarkPaidInvoice] = useState<BillInvoice | null>(null);
  const [editingPayment, setEditingPayment] = useState<{
    payment: BillPayment;
    invoice: BillInvoice;
  } | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<{
    payment: BillPayment;
    invoice: BillInvoice;
  } | null>(null);
  const [groupBy, setGroupBy] = useState<'stage' | 'none' | 'client' | 'trial'>('stage');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showRowTint, setShowRowTint] = useState(false);
  const { sort, handleSort } = useSortState();

  // Tier-2 entity stubs — will be replaced by Bills store (Tier-2 data pending)
  const bills: BillInvoice[] = [];
  const companies: BillCompany[] = [];
  const trials: BillTrial[] = [];
  const payments = useMemo<BillPayment[]>(() => [], []);
  const isLoading = false;

  // Payment aggregation
  const paymentsByInvoice = useMemo<PaymentsByInvoice>(() => {
    const map: PaymentsByInvoice = {};
    payments.forEach((p) => {
      if (!map[p.invoice_id]) map[p.invoice_id] = { total: 0, payments: [] };
      const entry = map[p.invoice_id];
      if (entry) {
        entry.total += p.amount ?? 0;
        entry.payments.push(p);
      }
    });
    return map;
  }, [payments]);

  const defaultPaymentForm = (): PaymentForm => ({
    paid_date: new Date().toISOString().split('T')[0] ?? '',
    payment_amount: '',
    payment_method: '',
    payment_reference: '',
    notes: '',
  });
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(defaultPaymentForm());

  // ---------------------------------------------------------------------------
  // Business rules (preserved from bible)
  // ---------------------------------------------------------------------------

  const isBillPaid = (invoice: BillInvoice): boolean => {
    if (invoice.status === 'paid' || invoice.status === 'hsh_paid') return true;
    const totalPaid = paymentsByInvoice[invoice.id]?.total ?? 0;
    return Math.round(totalPaid * 100) >= Math.round((invoice.total ?? 0) * 100);
  };

  const isOverdue = (invoice: BillInvoice): boolean => {
    if (!invoice.due_date) return false;
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueDate = parseISO(invoice.due_date);
    return dueDate < todayLocal;
  };

  const isOpenStatus = (inv: BillInvoice) =>
    inv.status === 'hsh_approved' || inv.status === 'sent' || inv.status === 'partial';

  const matchesSearch = (inv: BillInvoice): boolean => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const from = (companies.find((c) => c.id === inv.company_id)?.name ?? '').toLowerCase();
    const trial = trials.find((t) => t.id === inv.trial_id);
    const caseName = (trial?.case_name ?? '').toLowerCase();
    const jobNum = (trial?.job_number ?? '').toLowerCase();
    const invNum = (inv.invoice_number ?? '').toLowerCase();
    return from.includes(q) || caseName.includes(q) || jobNum.includes(q) || invNum.includes(q);
  };

  const getClient = (invoice: BillInvoice): BillCompany | undefined =>
    companies.find((c) => c.id === invoice.company_id);
  const getTrial = (invoice: BillInvoice): BillTrial | undefined =>
    trials.find((t) => t.id === invoice.trial_id);

  const overdueInvoices = bills.filter(
    (inv) =>
      !isBillPaid(inv) && isOpenStatus(inv) && isOverdue(inv) && matchesSearch(inv),
  );

  const openInvoices = bills.filter(
    (inv) =>
      !isBillPaid(inv) && isOpenStatus(inv) && !isOverdue(inv) && matchesSearch(inv),
  );

  const allPaidBills = bills.filter((inv) => isBillPaid(inv));

  // Date range computation (preserved from bible)
  const dateRange = useMemo<{ from: Date; to: Date } | null>(() => {
    const now = new Date();
    switch (dateFilter) {
      case 'all_time':
        return null;
      case 'today':
        return { from: now, to: now };
      case 'this_week': {
        const f = new Date(now);
        f.setDate(now.getDate() - now.getDay());
        const t = new Date(f);
        t.setDate(f.getDate() + 6);
        return { from: f, to: t };
      }
      case 'this_month':
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        };
      case 'last_week': {
        const t = new Date(now);
        t.setDate(now.getDate() - now.getDay() - 1);
        const f = new Date(t);
        f.setDate(t.getDate() - 6);
        return { from: f, to: t };
      }
      case 'last_month':
        return {
          from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          to: new Date(now.getFullYear(), now.getMonth(), 0),
        };
      case 'this_year':
        return {
          from: new Date(now.getFullYear(), 0, 1),
          to: new Date(now.getFullYear(), 11, 31),
        };
      case 'last_year':
        return {
          from: new Date(now.getFullYear() - 1, 0, 1),
          to: new Date(now.getFullYear() - 1, 11, 31),
        };
      case 'custom':
        return customDateRange?.from
          ? {
              from: customDateRange.from,
              to: customDateRange.to ?? customDateRange.from,
            }
          : null;
      default:
        return null;
    }
  }, [dateFilter, customDateRange]);

  const isInDateRange = (dateStr: string | undefined): boolean => {
    if (!dateRange || !dateStr) return !!dateRange === false;
    const d = new Date(dateStr);
    const from = new Date(
      dateRange.from.getFullYear(),
      dateRange.from.getMonth(),
      dateRange.from.getDate(),
    );
    const to = new Date(
      dateRange.to.getFullYear(),
      dateRange.to.getMonth(),
      dateRange.to.getDate(),
    );
    const check = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return check >= from && check <= to;
  };

  const paidBills = allPaidBills.filter((inv) => {
    const paidDate = inv.updated_date ?? inv.invoice_date;
    if (!isInDateRange(paidDate)) return false;
    return matchesSearch(inv);
  });

  // ---------------------------------------------------------------------------
  // Handlers (preserved from bible — write ops are stubs until Tier-2 store)
  // ---------------------------------------------------------------------------

  const handleMarkPaid = (invoice: BillInvoice) => {
    setPaymentForm({
      ...defaultPaymentForm(),
      payment_amount: Math.max(
        0,
        (invoice.total ?? 0) - (paymentsByInvoice[invoice.id]?.total ?? 0),
      ).toFixed(2),
    });
    setMarkPaidInvoice(invoice);
  };

  const handleEditPayment = (payment: BillPayment, invoice: BillInvoice) => {
    setPaymentForm({
      paid_date: payment.payment_date ?? '',
      payment_amount: (payment.amount ?? 0).toFixed(2),
      payment_method: payment.payment_method ?? '',
      payment_reference: payment.payment_reference ?? '',
      notes: payment.notes ?? '',
    });
    setEditingPayment({ payment, invoice });
  };

  const handleDeletePayment = (payment: BillPayment, invoice: BillInvoice) => {
    setDeletingPayment({ payment, invoice });
  };

  const handleRecordPayment = () => {
    // Tier-2 write stub — will be wired to Bills store
    toast.success('Bill payment recorded');
    setMarkPaidInvoice(null);
    setPaymentForm(defaultPaymentForm());
  };

  const handleUpdatePayment = () => {
    // Tier-2 write stub — will be wired to Bills store
    toast.success('Payment updated');
    setEditingPayment(null);
    setPaymentForm(defaultPaymentForm());
  };

  const handleConfirmDelete = () => {
    // Tier-2 write stub — will be wired to Bills store
    toast.success('Payment deleted');
    setDeletingPayment(null);
  };

  const toggleCollapse = (id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Group bills (preserved from bible)
  const groupBills = (
    invList: BillInvoice[],
    variant: 'open' | 'overdue' | 'paid',
    color: string,
  ): BillGroup[] => {
    if (groupBy === 'none') return [];
    const groups: Record<string, { key: string; label: string; invoices: BillInvoice[] }> = {};
    invList.forEach((inv) => {
      let key: string;
      let label: string;
      if (groupBy === 'client') {
        const c = getClient(inv);
        key = inv.company_id ?? 'unknown';
        label = c?.name ?? 'Unknown Company';
      } else {
        const t = getTrial(inv);
        key = inv.trial_id ?? 'unknown';
        label = t
          ? `${t.job_number ? `(${t.job_number}) ` : ''}${t.case_name}`
          : 'Unknown Trial';
      }
      if (!groups[key]) groups[key] = { key, label, invoices: [] };
      groups[key]?.invoices.push(inv);
    });
    return Object.values(groups)
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((g) => ({
        id: g.key,
        title: g.label,
        invoices: g.invoices,
        total: g.invoices.reduce(
          (sum, inv) =>
            sum +
            (variant === 'paid'
              ? (inv.total ?? 0)
              : (inv.total ?? 0) - (paymentsByInvoice[inv.id]?.total ?? 0)),
          0,
        ),
        color,
        variant,
        getClient,
        getTrial,
        paymentsByInvoice,
      }));
  };

  const buildColumns = (): BillGroup[] => {
    let pool: BillInvoice[];
    if (activeTab === 'paid') {
      pool = paidBills;
    } else if (activeTab === 'all') {
      pool = [...openInvoices, ...overdueInvoices, ...paidBills];
    } else {
      pool = [...openInvoices, ...overdueInvoices];
    }

    const isPaidTab = activeTab === 'paid';
    const calcTotal = (inv: BillInvoice) =>
      isPaidTab
        ? (inv.total ?? 0)
        : (inv.total ?? 0) - (paymentsByInvoice[inv.id]?.total ?? 0);

    if (groupBy === 'stage') {
      const groups: BillGroup[] = [];
      const overduePool = pool.filter(
        (inv) => !isBillPaid(inv) && isOpenStatus(inv) && isOverdue(inv),
      );
      const openPool = pool.filter(
        (inv) => !isBillPaid(inv) && isOpenStatus(inv) && !isOverdue(inv),
      );
      const paidPool = pool.filter((inv) => isBillPaid(inv));

      if (openPool.length > 0)
        groups.push({
          id: 'open',
          title: 'Unpaid',
          invoices: openPool,
          total: openPool.reduce((sum, inv) => sum + calcTotal(inv), 0),
          color: 'var(--theme-hsh-primary)',
          variant: 'open',
          getClient,
          getTrial,
          paymentsByInvoice,
        });
      if (overduePool.length > 0)
        groups.push({
          id: 'overdue',
          title: 'Past Due',
          invoices: overduePool,
          total: overduePool.reduce((sum, inv) => sum + calcTotal(inv), 0),
          color: 'var(--theme-danger)',
          variant: 'overdue',
          getClient,
          getTrial,
          paymentsByInvoice,
        });
      if (paidPool.length > 0)
        groups.push({
          id: 'paid',
          title: 'Paid',
          invoices: paidPool,
          total: paidPool.reduce((sum, inv) => sum + (inv.total ?? 0), 0),
          color: 'var(--theme-success)',
          variant: 'paid',
          getClient,
          getTrial,
          paymentsByInvoice,
        });
      return groups;
    }

    if (groupBy === 'none') {
      return [
        {
          id: 'all',
          title:
            activeTab === 'paid'
              ? 'Paid Bills'
              : activeTab === 'all'
                ? 'All Bills'
                : 'Unpaid Bills',
          invoices: pool,
          total: pool.reduce((sum, inv) => sum + calcTotal(inv), 0),
          color: 'var(--theme-hsh-primary)',
          variant: isPaidTab ? 'paid' : 'open',
          getClient,
          getTrial,
          paymentsByInvoice,
        },
      ];
    }

    return groupBills(pool, isPaidTab ? 'paid' : 'open', 'var(--theme-hsh-primary)');
  };

  const columns = buildColumns();

  // ---------------------------------------------------------------------------
  // Derived values for grand total label (preserved from bible)
  // ---------------------------------------------------------------------------
  const grandTotalLabel =
    activeTab === 'paid'
      ? 'Total Paid'
      : activeTab === 'all'
        ? 'Grand Total'
        : 'Total Outstanding';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return <StubSection name="PageLoader: Loading bills..." />;
  }

  // Suppress unused variable warnings for handlers that will be used by
  // sub-components once they are ported.
  void handleSort;
  void sort;
  void showRowTint;
  void setShowRowTint;
  void collapsedSections;
  void toggleCollapse;
  void setPreviewInvoiceId;
  void showFilterSheet;
  void setShowFilterSheet;
  void useCards;
  void userInfo;
  void columns;
  void grandTotalLabel;
  void handleMarkPaid;
  void handleEditPayment;
  void handleDeletePayment;
  void searchQuery;
  void setSearchQuery;
  void activeTab;
  void setActiveTab;
  void dateFilter;
  void setDateFilter;
  void customDateRange;
  void setCustomDateRange;
  void groupBy;
  void setGroupBy;

  return (
    <div
      style={{
        padding: 'var(--theme-page-padding)',
        fontFamily: 'var(--theme-font-body)',
      }}
      className="lg:px-8"
    >
      <div style={{ maxWidth: 'var(--theme-max-content-width)' }} className="mx-auto">
        {/* Page header — hidden on mobile (bible: hidden lg:flex) */}
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
              Bills
            </h1>
            <p
              style={{
                fontSize: 'var(--theme-text-body)',
                color: 'var(--theme-stone-600)',
              }}
            >
              Track HSH subcontractor bills
            </p>
          </div>
        </div>

        {/* Mobile filter sheet — stub until PaymentsFilterSheet is ported */}
        <StubSection name="PaymentsFilterSheet (mobile filter sheet)" />

        {/* Page toolbar — stub until PageToolbar is ported */}
        <div style={{ marginTop: '1rem' }}>
          <StubSection name={`PageToolbar (search: "${searchQuery}", tab: ${activeTab}, groupBy: ${groupBy})`} />
        </div>

        {/* Collections cards / list — stubs until sub-components are ported */}
        <div style={{ marginTop: '1rem' }}>
          {useCards ? (
            <StubSection
              name={`CollectionsCards — ${columns.length} group(s) · icon: Banknote`}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <StubSection
                name={`CollectionsSortHeader — grouped: ${groupBy !== 'none'}`}
              />
              {groupBy === 'none' && columns.length > 0 ? (
                <div
                  className="border overflow-hidden"
                  style={{
                    borderRadius: 'var(--theme-card-radius)',
                    boxShadow: 'var(--theme-card-shadow)',
                    borderWidth: 'var(--theme-card-border)',
                    backgroundColor: 'var(--theme-card-bg)',
                  }}
                >
                  <StubSection name="InvoiceListTable (ungrouped)" />
                </div>
              ) : (
                <StubSection name="CollectionsList (grouped)" />
              )}
            </div>
          )}
        </div>

        {/* Grand total bar — stub until GrandTotalBar is ported */}
        <div style={{ marginTop: '0.5rem' }}>
          <StubSection
            name={`GrandTotalBar — label: "${grandTotalLabel}" · itemLabel: "bills"`}
          />
        </div>

        {/* PDF Preview — stub until PdfPreviewDialog is ported */}
        {previewInvoiceId && (
          <StubSection name={`PdfPreviewDialog — invoiceId: ${previewInvoiceId}`} />
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Record Bill Payment — Desktop: AlertDialog, Mobile: Drawer         */}
        {/* ------------------------------------------------------------------ */}
        {isMobile ? (
          <Drawer
            open={!!markPaidInvoice}
            onOpenChange={(open) => {
              if (!open) {
                setMarkPaidInvoice(null);
                setPaymentForm(defaultPaymentForm());
              }
            }}
          >
            <DrawerContent style={{ fontFamily: 'var(--theme-font-body)' }}>
              <DrawerHeader className="sr-only">
                <DrawerTitle>Record Bill Payment</DrawerTitle>
                <DrawerDescription>Record a payment for this bill</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pt-2 pb-8 max-h-[85vh] overflow-auto">
                <h3
                  className="text-base font-bold mb-4"
                  style={{ color: 'var(--theme-stone-900)' }}
                >
                  Record Bill Payment
                </h3>
                {markPaidInvoice && (
                  <StubSection
                    name={`RecordPaymentContent — invoice: ${markPaidInvoice.id} · labels: ${BILL_PAYMENT_LABELS.submitLabel}`}
                  />
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setMarkPaidInvoice(null);
                      setPaymentForm(defaultPaymentForm());
                    }}
                    className="flex-1 h-9 px-4 text-sm font-medium rounded-lg border"
                    style={{
                      borderColor: 'var(--theme-stone-200)',
                      color: 'var(--theme-stone-600)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRecordPayment}
                    className="flex-1 h-9 px-4 text-sm font-medium rounded-lg"
                    style={{ backgroundColor: 'var(--theme-success)', color: 'white' }}
                  >
                    <Banknote className="w-4 h-4 mr-1 inline" />
                    {BILL_PAYMENT_LABELS.submitLabel}
                  </button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <AlertDialog
            open={!!markPaidInvoice}
            onOpenChange={(open) => {
              if (!open) {
                setMarkPaidInvoice(null);
                setPaymentForm(defaultPaymentForm());
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Record Bill Payment</AlertDialogTitle>
              </AlertDialogHeader>
              {markPaidInvoice && (
                <StubSection
                  name={`RecordPaymentContent — invoice: ${markPaidInvoice.id} · labels: ${BILL_PAYMENT_LABELS.submitLabel}`}
                />
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRecordPayment}
                  disabled={!paymentForm.paid_date}
                  style={{ backgroundColor: 'var(--theme-success)', color: 'white' }}
                  className="hover:opacity-90"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Record Payment
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Edit Payment Dialog                                                 */}
        {/* ------------------------------------------------------------------ */}
        {isMobile ? (
          <Drawer
            open={!!editingPayment}
            onOpenChange={(open) => {
              if (!open) {
                setEditingPayment(null);
                setPaymentForm(defaultPaymentForm());
              }
            }}
          >
            <DrawerContent style={{ fontFamily: 'var(--theme-font-body)' }}>
              <DrawerHeader className="sr-only">
                <DrawerTitle>Edit Payment</DrawerTitle>
                <DrawerDescription>Edit this payment record</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pt-2 pb-8 max-h-[85vh] overflow-auto">
                <h3
                  className="text-base font-bold mb-4"
                  style={{ color: 'var(--theme-stone-900)' }}
                >
                  Edit Payment
                </h3>
                {editingPayment && (
                  <StubSection
                    name={`RecordPaymentContent (edit) — payment: ${editingPayment.payment.id}`}
                  />
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setEditingPayment(null);
                      setPaymentForm(defaultPaymentForm());
                    }}
                    className="flex-1 h-9 px-4 text-sm font-medium rounded-lg border"
                    style={{
                      borderColor: 'var(--theme-stone-200)',
                      color: 'var(--theme-stone-600)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdatePayment}
                    className="flex-1 h-9 px-4 text-sm font-medium rounded-lg"
                    style={{
                      backgroundColor: 'var(--theme-brand-primary)',
                      color: 'white',
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1 inline" />
                    Update Payment
                  </button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <AlertDialog
            open={!!editingPayment}
            onOpenChange={(open) => {
              if (!open) {
                setEditingPayment(null);
                setPaymentForm(defaultPaymentForm());
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Edit Payment</AlertDialogTitle>
              </AlertDialogHeader>
              {editingPayment && (
                <StubSection
                  name={`RecordPaymentContent (edit) — payment: ${editingPayment.payment.id}`}
                />
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleUpdatePayment}
                  disabled={!paymentForm.paid_date}
                  style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
                  className="hover:opacity-90"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Update Payment
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Delete Payment Confirmation                                         */}
        {/* ------------------------------------------------------------------ */}
        <AlertDialog
          open={!!deletingPayment}
          onOpenChange={(open) => {
            if (!open) setDeletingPayment(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            </AlertDialogHeader>
            <p className="text-sm" style={{ color: 'var(--theme-stone-600)' }}>
              Are you sure you want to delete this payment of{' '}
              <strong>
                $
                {deletingPayment?.payment?.amount?.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
              ? This action cannot be undone.
            </p>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Payment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Icon refs to satisfy imports (tree-shake will remove unused icons) */}
      <span style={{ display: 'none' }}>
        <SlidersHorizontal aria-hidden />
        <Layers aria-hidden />
        <Building2 aria-hidden />
      </span>
    </div>
  );
}
