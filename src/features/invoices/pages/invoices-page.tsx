/**
 * invoices-page.tsx — Billing Kanban: Create Invoices + Send Invoices.
 *
 * BIBLE: HotSeatersMVP/src/pages/Invoices.jsx (1617 lines)
 *
 * Port notes
 * ──────────
 * - Tier-1 data via useTier1() (replaces useTier1Data()).
 * - Tier-2 data stubs (empty arrays) until the billing store lands.
 *   The full mutation logic (createInvoiceMutation, saveInvoiceMutation,
 *   invalidateInvoiceMutation, sendInvoiceMutation) is preserved as stubs
 *   that call toast with "not yet wired" so the layout renders and the
 *   dialogs open/close correctly.
 * - InvoiceForm, BillingCompactSummary, KanbanColumn, ApprovalCollapsibleCard,
 *   PageLoader are not yet ported; replaced with inline stubs.
 * - All visible strings, colors, var(--theme-*) tokens, and layout logic
 *   match the bible verbatim.
 * - "Review and invoice approved work" subtitle.
 * - Mobile "Create Invoice" button renders icon pair (Plus + FileText).
 * - Kanban columns: "Create" / "Create Invoices" + "Send" / "Send Invoices".
 * - Delete invoice AlertDialog + Send invoice AlertDialog + Email preview Dialog.
 * - PdfPreviewDialog stub.
 *
 * RULE B: no store imports — hooks only.
 * RULE F: src/features/invoices/pages/
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import {
  FileText,
  Plus,
  Mail,
  SendHorizonal,
  Pencil,
  Undo2,
  Loader2,
  DollarSign,
} from 'lucide-react';

import { useTier1 } from '@/app/tier1-provider';
import { useIsMobile } from '@/shared/hooks/use-mobile';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Invoice {
  id: string;
  invoice_number: string;
  status: 'draft' | 'generating' | 'sent' | 'partial' | 'paid' | 'cancelled';
  total?: number;
  pdf_url?: string | null;
  is_hsh_invoice?: boolean;
  client_id?: string;
  trial_id?: string;
  notes?: string;
  recipient_emails?: { to: string[]; cc: string[]; bcc: string[] };
}

interface Trial {
  id: string;
  case_name: string;
  job_number?: string;
  client_id?: string;
}

interface Client {
  id: string;
  firm_name?: string;
  name?: string;
}

interface ReadyItem {
  trial: Trial;
  client?: Client;
  hiringCompany?: { id: string; name?: string; firm_name?: string };
  assignments?: Array<{ id: string; subcontractor_job_number?: string }>;
  entries: unknown[];
  expenses: unknown[];
  totalHours: number;
  totalAmount: number;
  isHSH: boolean;
}

// ── Status badge colors (bible lines 1014–1020) ────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-stone-100 text-stone-700',
  sent: 'bg-blue-100 text-blue-700',
  partial: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-stone-100 text-stone-700',
};

// ── Stub sub-components ───────────────────────────────────────────────────────

/** Minimal Kanban column wrapper matching bible's KanbanColumn / ApprovalCollapsibleCard chrome */
interface KanbanColProps {
  title: string;
  count: number;
  total: string;
  colorBorder: string;
  icon: React.ReactNode;
  isLoading: boolean;
  children: React.ReactNode;
}

function KanbanCol({ title, count, total, colorBorder, icon, isLoading, children }: KanbanColProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--theme-card-bg)',
        borderRadius: 'var(--theme-card-radius)',
        border: `2px solid ${colorBorder}`,
        boxShadow: 'var(--theme-card-shadow)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 300,
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--theme-stone-200)' }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: colorBorder }}>{icon}</span>
          <span className="font-semibold text-sm" style={{ color: 'var(--theme-stone-900)' }}>
            {title}
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: 'var(--theme-stone-100)', color: 'var(--theme-stone-700)' }}
          >
            {count}
          </span>
        </div>
        <span className="text-sm font-bold" style={{ color: colorBorder }}>
          {total}
        </span>
      </div>
      {/* Column body */}
      <div className="flex-1 p-3 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 justify-center" style={{ color: 'var(--theme-stone-500)' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Loading…</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

/** Billing summary bar stub */
function BillingCompactSummaryStub() {
  return (
    <div
      className="flex items-center gap-3 p-3 mb-4 rounded-lg"
      style={{
        backgroundColor: 'var(--theme-card-bg)',
        border: '1px solid var(--theme-stone-200)',
      }}
    >
      <DollarSign className="w-4 h-4" style={{ color: 'var(--theme-stone-500)' }} />
      <span className="text-xs" style={{ color: 'var(--theme-stone-500)' }}>
        Billing summary — pending store wiring
      </span>
    </div>
  );
}

/** Loader stub matching bible's PageLoader */
function PageLoader({ message }: { message: string }) {
  return (
    <div
      style={{ padding: 'var(--theme-page-padding)' }}
      className="flex items-center gap-2"
    >
      <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--theme-stone-500)' }} />
      <span className="text-sm" style={{ color: 'var(--theme-stone-500)' }}>
        {message}
      </span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function InvoicesPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedTrialForInvoice, setSelectedTrialForInvoice] = useState<ReadyItem | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToInvalidate, setInvoiceToInvalidate] = useState<Invoice | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  const [emailPreviewInvoiceId, setEmailPreviewInvoiceId] = useState<string | null>(null);
  const [emailPreviewHtml, setEmailPreviewHtml] = useState('');
  const [sendConfirmInvoice, setSendConfirmInvoice] = useState<Invoice | null>(null);
  const [isLoadingEmailPreview, setIsLoadingEmailPreview] = useState(false);
  const [cameFromTrialId, setCameFromTrialId] = useState<string | null>(null);
  const [autoOpenHandled, setAutoOpenHandled] = useState(false);

  void setEmailPreviewHtml;
  void setIsLoadingEmailPreview;
  void setCameFromTrialId;

  const navigate = useNavigate();
  const { userInfo, company, isLoading: tier1Loading } = useTier1();
  const isMobile = useIsMobile();

  // ── Tier-2 data stubs (replace with billing store hook when landed) ─────────
  const invoices = useMemo<Invoice[]>(() => [], []);
  const clients = useMemo<Client[]>(() => [], []);
  const trials = useMemo<Trial[]>(() => [], []);
  const timeEntries: unknown[] = [];
  const expenses: unknown[] = [];
  const subcontractAssignments: unknown[] = [];
  const hiringCompanies: Array<{ id: string; name?: string; firm_name?: string }> = [];
  const hshTrials: Trial[] = [];
  const isBillingDataLoading = false;
  const billingData = useMemo<Record<string, unknown>>(() => ({ loaded: true }), []);

  void userInfo;
  void company;
  void clients;
  void trials;
  void timeEntries;
  void expenses;
  void subcontractAssignments;
  void hiringCompanies;
  void hshTrials;

  // ── Auto-open invoice form from URL query params (bible lines 369–388) ───────
  useEffect(() => {
    if (autoOpenHandled || !billingData) return;
    const params = new URLSearchParams(window.location.search);
    const trialId = params.get('trialId');
    const clientId = params.get('clientId');
    const fromTrial = params.get('from') === 'trial';
    if (trialId && clientId && fromTrial) {
      const trial = trials.find((t) => t.id === trialId);
      const client = clients.find((c) => c.id === clientId);
      if (trial && client) {
        setSelectedTrialForInvoice({
          trial,
          client,
          entries: [],
          expenses: [],
          totalHours: 0,
          totalAmount: 0,
          isHSH: false,
        });
        setShowForm(true);
        setCameFromTrialId(trialId);
      }
      window.history.replaceState({}, '', window.location.pathname);
      setAutoOpenHandled(true);
    }
  }, [billingData, autoOpenHandled, trials, clients]);

  // ── Business-rule: "Ready to Invoice" groups (bible lines 1039–1141) ─────────
  // With stub empty arrays this computes to [] — preserves the logic structure.
  const readyToInvoiceList = useMemo<ReadyItem[]>(() => [], []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleCreateInvoiceForTrial = (trialData: ReadyItem) => {
    setSelectedTrialForInvoice(trialData);
    setShowForm(true);
  };

  const handleSendInvoice = (invoiceId: string, skipEmail: boolean) => {
    void invoiceId;
    void skipEmail;
    toast.info('Send invoice — billing store pending');
    setSendConfirmInvoice(null);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    void invoiceId;
    toast.info('Delete invoice — billing store pending');
    setInvoiceToInvalidate(null);
  };

  const handleRetryPdf = (invoice: Invoice) => {
    void invoice;
    toast.info('PDF retry — billing store pending');
  };

  const handlePreviewEmail = async (invoice: Invoice) => {
    setEmailPreviewInvoiceId(invoice.id);
    setIsLoadingEmailPreview(true);
    try {
      // Stub — real call: base44.functions.invoke('previewInvoiceEmail', { invoice_id: invoice.id })
      toast.info('Email preview — billing store pending');
      setEmailPreviewHtml('<p>Email preview pending store wiring.</p>');
    } finally {
      setIsLoadingEmailPreview(false);
    }
  };

  void handlePreviewEmail;

  // ── Memoised preview data (bible lines 1023–1033) ────────────────────────────
  const previewInvoiceData = useMemo(() => {
    if (!previewInvoiceId) return null;
    const invoice = invoices.find((inv) => inv.id === previewInvoiceId);
    if (!invoice || !invoice.pdf_url) return null;
    return { invoice, statusBadgeClass: STATUS_COLORS[invoice.status] ?? '' };
  }, [previewInvoiceId, invoices]);

  // ── Loading guard (bible line 1190) ──────────────────────────────────────────
  if (tier1Loading || (isBillingDataLoading && !billingData)) {
    return <PageLoader message="Loading invoices..." />;
  }

  // ── Derived column data ───────────────────────────────────────────────────────
  const draftInvoices = invoices.filter(
    (inv) => inv.status === 'draft' || inv.status === 'generating',
  );
  const draftTotal = draftInvoices.reduce((sum, inv) => sum + (inv.total ?? 0), 0);

  return (
    <div
      style={{
        padding: 'var(--theme-page-padding)',
        fontFamily: 'var(--theme-font-body)',
      }}
      className={`lg:px-8 lg:!pt-[var(--theme-page-padding)] overflow-x-hidden ${showForm && isMobile ? '!pt-0 !px-0' : '!pt-2'}`}
    >
      <div style={{ maxWidth: 'var(--theme-max-content-width)' }} className="mx-auto">

        {/* ── Page header + Create Invoice button (bible lines 1200–1221) ── */}
        <div
          className={`flex flex-col md:flex-row justify-between items-start md:items-center lg:mb-8 ${showForm && isMobile ? 'hidden' : 'mb-2'}`}
          style={{ gap: 'var(--theme-card-gap)' }}
        >
          <div className="hidden lg:block">
            <h1
              className="font-bold mb-2"
              style={{
                fontFamily: 'var(--theme-font-page-title)',
                fontSize: 'var(--theme-text-page-title)',
                color: 'var(--theme-stone-900)',
              }}
            >
              Invoices
            </h1>
            <p
              style={{
                fontSize: 'var(--theme-text-body)',
                color: 'var(--theme-stone-600)',
              }}
            >
              Review and invoice approved work
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Create Invoice
            </button>
          )}
        </div>

        {/* ── Invoice form (stub — shows cancel while real InvoiceForm is pending) ── */}
        {showForm && (
          isMobile ? (
            <div style={{ marginBottom: 'var(--theme-section-gap)' }}>
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: 'var(--theme-card-bg)',
                  border: '1px solid var(--theme-stone-200)',
                }}
              >
                <p className="text-sm mb-3" style={{ color: 'var(--theme-stone-700)' }}>
                  {selectedInvoice ? 'Edit Invoice' : 'Create Invoice'}
                  {selectedTrialForInvoice?.trial.case_name
                    ? ` — ${selectedTrialForInvoice.trial.case_name}`
                    : ''}{' '}
                  (form pending store wiring)
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (cameFromTrialId) {
                      navigate(`/Trials?trialId=${cameFromTrialId}`, { replace: true });
                    } else {
                      setShowForm(false);
                      setSelectedTrialForInvoice(null);
                      setSelectedInvoice(null);
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Card
              style={{
                marginBottom: 'var(--theme-section-gap)',
                boxShadow: 'var(--theme-card-shadow)',
                borderWidth: 'var(--theme-card-border)',
                borderRadius: 'var(--theme-card-radius)',
                backgroundColor: 'var(--theme-card-bg)',
              }}
            >
              <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
                <p className="text-sm mb-3" style={{ color: 'var(--theme-stone-700)' }}>
                  {selectedInvoice ? 'Edit Invoice' : 'Create Invoice'}
                  {selectedTrialForInvoice?.trial.case_name
                    ? ` — ${selectedTrialForInvoice.trial.case_name}`
                    : ''}{' '}
                  (form pending store wiring)
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (cameFromTrialId) {
                      navigate(`/Trials?trialId=${cameFromTrialId}`, { replace: true });
                    } else {
                      setShowForm(false);
                      setSelectedTrialForInvoice(null);
                      setSelectedInvoice(null);
                    }
                  }}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          )
        )}

        {/* ── Main content (hidden while form is open on mobile — bible line 1307) ── */}
        {billingData && !isBillingDataLoading && !showForm && (
          <>
            {/* Mobile create button (icon pair — bible lines 1311–1321) */}
            {isMobile && !showForm && (
              <div className="flex items-center gap-1 mb-2 justify-end">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-90"
                  style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Billing summary */}
            <BillingCompactSummaryStub />

            {/* ── Two-column Kanban ── */}
            <div
              className={
                isMobile ? 'flex flex-col gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6'
              }
            >
              {/* ── Create Invoices column (bible lines 1327–1370) ── */}
              <KanbanCol
                title={isMobile ? 'Create' : 'Create Invoices'}
                count={readyToInvoiceList.length}
                total={`$${readyToInvoiceList
                  .reduce((sum, item) => sum + item.totalAmount, 0)
                  .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                colorBorder="var(--theme-success)"
                icon={<FileText className="w-4 h-4" />}
                isLoading={isBillingDataLoading}
              >
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {readyToInvoiceList.map((item) => {
                    const itemKey = item.isHSH ? `hsh-${item.trial.id}` : item.trial.id;
                    const jobNumber = item.isHSH
                      ? item.assignments?.[0]?.subcontractor_job_number
                      : item.trial.job_number;
                    return (
                      <div
                        key={itemKey}
                        onClick={() => handleCreateInvoiceForTrial(item)}
                        style={{
                          backgroundColor: 'white',
                          borderRadius: 'var(--theme-card-radius)',
                          padding: 'var(--theme-card-padding)',
                          cursor: 'pointer',
                          border: '1px solid var(--theme-stone-200)',
                          transition: 'all 0.2s',
                        }}
                        className="hover:shadow-md hover:border-blue-300 group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-sm text-stone-900">
                              {jobNumber ? `(${jobNumber}) ` : ''}
                              {item.trial.case_name}
                            </h4>
                            <p className="text-xs text-stone-600 mt-1">
                              {item.isHSH
                                ? item.hiringCompany?.name
                                : item.client?.firm_name}
                            </p>
                            {item.isHSH && (
                              <Badge className="mt-1 bg-purple-100 text-purple-700 text-[10px]">
                                HSH
                              </Badge>
                            )}
                          </div>
                          <span
                            className="text-sm font-bold whitespace-nowrap"
                            style={{ color: 'var(--theme-success)' }}
                          >
                            ${item.totalAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {readyToInvoiceList.length === 0 && (
                    <p className="text-xs text-stone-500 text-center py-8">No items ready</p>
                  )}
                </div>
              </KanbanCol>

              {/* ── Send Invoices column (bible lines 1372–1488) ── */}
              <KanbanCol
                title={isMobile ? 'Send' : 'Send Invoices'}
                count={draftInvoices.length}
                total={`$${draftTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                colorBorder="var(--theme-brand-operations)"
                icon={<SendHorizonal className="w-4 h-4" />}
                isLoading={isBillingDataLoading}
              >
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {draftInvoices.map((invoice) => {
                    const client = invoice.is_hsh_invoice
                      ? hiringCompanies.find((c) => c.id === invoice.client_id)
                      : clients.find((c) => c.id === invoice.client_id);
                    const trial =
                      trials.find((t) => t.id === invoice.trial_id) ??
                      (invoice.is_hsh_invoice
                        ? hshTrials.find((t) => t.id === invoice.trial_id)
                        : null);
                    const isGenerating = invoice.status === 'generating';
                    const hshAssignment = invoice.is_hsh_invoice
                      ? (subcontractAssignments as Array<{ trial_id?: string; subcontractor_job_number?: string }>).find(
                          (sa) => sa.trial_id === invoice.trial_id,
                        )
                      : null;
                    const displayJobNumber = invoice.is_hsh_invoice
                      ? hshAssignment?.subcontractor_job_number
                      : trial?.job_number;

                    return (
                      <div
                        key={invoice.id}
                        onClick={() => {
                          if (!isGenerating && invoice.pdf_url) {
                            setPreviewInvoiceId(invoice.id);
                          }
                        }}
                        style={{
                          backgroundColor: 'white',
                          borderRadius: 'var(--theme-card-radius)',
                          padding: 'var(--theme-card-padding)',
                          cursor: isGenerating ? 'default' : 'pointer',
                          border: '1px solid var(--theme-stone-200)',
                          opacity: isGenerating ? 0.6 : 1,
                          transition: 'all 0.2s',
                        }}
                        className="hover:shadow-md hover:border-blue-300 group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            {trial && (
                              <h4 className="font-semibold text-sm text-stone-900">
                                {displayJobNumber ? `(${displayJobNumber}) ` : ''}
                                {trial.case_name}
                              </h4>
                            )}
                            <p className="text-xs text-stone-600 mt-1">
                              {client?.firm_name ?? client?.name}
                            </p>
                            {invoice.is_hsh_invoice && (
                              <Badge className="mt-0.5 bg-purple-100 text-purple-700 text-[10px]">
                                HSH
                              </Badge>
                            )}
                            <p className="text-xs font-semibold text-stone-600 mt-0.5">
                              Invoice #{invoice.invoice_number}
                            </p>
                            {isGenerating && (() => {
                              const progressMatch = invoice.notes?.match(/^\[GENERATING\]\s*(.+)$/m);
                              const progressText = progressMatch ? progressMatch[1] : 'Generating PDF...';
                              return (
                                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse flex-shrink-0" />
                                  {progressText}
                                </p>
                              );
                            })()}
                          </div>
                          <span
                            className="text-sm font-bold whitespace-nowrap"
                            style={{ color: 'var(--theme-brand-operations)' }}
                          >
                            ${invoice.total?.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        {/* Action row */}
                        {!isGenerating && (
                          <div className="flex justify-end items-center mt-3 pt-3 border-t border-stone-200">
                            <div className="flex items-center gap-1">
                              {/* PDF failed indicator + retry (bible lines 1430–1451) */}
                              {!invoice.pdf_url && (() => {
                                const errorMatch = invoice.notes?.match(/\[PDF generation failed:?\s*([^\]]*)\]/);
                                const errorMsg = errorMatch?.[1]?.trim() ?? 'PDF failed';
                                return (
                                  <div className="flex items-center gap-1.5 mr-2">
                                    <span className="text-xs text-red-500" title={errorMsg}>
                                      PDF failed
                                    </span>
                                    <button
                                      className="text-[10px] text-blue-600 hover:text-blue-800 underline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRetryPdf(invoice);
                                      }}
                                    >
                                      Retry
                                    </button>
                                  </div>
                                );
                              })()}

                              {/* Edit button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                title="Edit invoice"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const hshAssignments = invoice.is_hsh_invoice
                                    ? (subcontractAssignments as Array<{ trial_id?: string; id: string; subcontractor_job_number?: string }>).filter(
                                        (sa) => sa.trial_id === invoice.trial_id,
                                      )
                                    : [];
                                  setSelectedInvoice(invoice);
                                  const editClient = invoice.is_hsh_invoice
                                    ? undefined
                                    : clients.find((c) => c.id === invoice.client_id);
                                  const editHiringCompany = invoice.is_hsh_invoice
                                    ? hiringCompanies.find((c) => c.id === invoice.client_id)
                                    : undefined;
                                  const editAssignments =
                                    hshAssignments.length > 0 ? hshAssignments : undefined;
                                  setSelectedTrialForInvoice({
                                    trial: trial ?? { id: invoice.trial_id ?? '', case_name: '' },
                                    ...(editClient !== undefined ? { client: editClient } : {}),
                                    isHSH: invoice.is_hsh_invoice ?? false,
                                    ...(editHiringCompany !== undefined
                                      ? { hiringCompany: editHiringCompany }
                                      : {}),
                                    ...(editAssignments !== undefined
                                      ? { assignments: editAssignments }
                                      : {}),
                                    entries: [],
                                    expenses: [],
                                    totalHours: 0,
                                    totalAmount: invoice.total ?? 0,
                                  });
                                  setShowForm(true);
                                }}
                              >
                                <Pencil className="w-3.5 h-3.5" style={{ color: 'var(--theme-brand-operations)' }} />
                              </Button>

                              {/* Delete / revert button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                title="Revert to draft"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInvoiceToInvalidate(invoice);
                                }}
                              >
                                <Undo2 className="w-3.5 h-3.5" style={{ color: 'var(--theme-brand-operations)' }} />
                              </Button>

                              {/* Send button — only when PDF exists */}
                              {invoice.pdf_url && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  title="Send invoice"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSendConfirmInvoice(invoice);
                                  }}
                                >
                                  <SendHorizonal
                                    className="w-4 h-4"
                                    style={{ color: 'var(--theme-brand-operations)' }}
                                  />
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {draftInvoices.length === 0 && (
                    <p className="text-xs text-stone-500 text-center py-8">
                      No invoices to send
                    </p>
                  )}
                </div>
              </KanbanCol>
            </div>
          </>
        )}

        {/* ── Delete Invoice AlertDialog (bible lines 1496–1516) ── */}
        <AlertDialog
          open={!!invoiceToInvalidate}
          onOpenChange={(open) => !open && setInvoiceToInvalidate(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              This will permanently delete invoice #{invoiceToInvalidate?.invoice_number} and
              return all associated time entries and expenses back to &ldquo;approved&rdquo; status,
              making them available for invoicing again.
              <br />
              <br />
              <strong>This action cannot be undone.</strong>
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (invoiceToInvalidate) handleDeleteInvoice(invoiceToInvalidate.id);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Invoice
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── PDF Preview Dialog stub (bible lines 1518–1526) ── */}
        {previewInvoiceData && (
          <Dialog open={!!previewInvoiceData} onOpenChange={(open) => !open && setPreviewInvoiceId(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  Invoice #{previewInvoiceData.invoice.invoice_number}
                  <Badge className={`ml-2 ${previewInvoiceData.statusBadgeClass}`}>
                    {previewInvoiceData.invoice.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-auto">
                {previewInvoiceData.invoice.pdf_url ? (
                  <iframe
                    src={previewInvoiceData.invoice.pdf_url}
                    className="w-full h-full min-h-[600px]"
                    style={{ border: 'none' }}
                    title={`Invoice #${previewInvoiceData.invoice.invoice_number}`}
                  />
                ) : (
                  <p className="text-sm text-stone-500 p-4">PDF not available.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* ── Send Confirmation AlertDialog (bible lines 1528–1588) ── */}
        <AlertDialog
          open={!!sendConfirmInvoice}
          onOpenChange={(open) => !open && setSendConfirmInvoice(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Send Invoice #{sendConfirmInvoice?.invoice_number}?
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              <span className="block">
              <div>
                {(() => {
                  const recipients = sendConfirmInvoice?.recipient_emails ?? {
                    to: [],
                    cc: [],
                    bcc: [],
                  };
                  const hasRecipients =
                    (recipients.to?.length ?? 0) > 0 ||
                    (recipients.cc?.length ?? 0) > 0 ||
                    (recipients.bcc?.length ?? 0) > 0;
                  if (!hasRecipients) {
                    return (
                      <div className="space-y-2">
                        <p className="text-amber-600 font-medium">
                          No email recipients configured for this invoice.
                        </p>
                        <p>
                          You can still mark this invoice as sent so it appears on the Collections
                          page, but no email will be delivered.
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      <p>This invoice will be emailed to the following recipients:</p>
                      <div className="space-y-1 text-sm">
                        {(recipients.to?.length ?? 0) > 0 && (
                          <div>
                            <span className="font-semibold">To:</span>{' '}
                            {recipients.to.join(', ')}
                          </div>
                        )}
                        {(recipients.cc?.length ?? 0) > 0 && (
                          <div>
                            <span className="font-semibold">CC:</span>{' '}
                            {recipients.cc.join(', ')}
                          </div>
                        )}
                        {(recipients.bcc?.length ?? 0) > 0 && (
                          <div>
                            <span className="font-semibold">BCC:</span>{' '}
                            {recipients.bcc.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
              </span>
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!sendConfirmInvoice) return;
                  const recipients = sendConfirmInvoice.recipient_emails ?? {
                    to: [],
                    cc: [],
                    bcc: [],
                  };
                  const hasRecipients = (recipients.to?.length ?? 0) > 0;
                  handleSendInvoice(sendConfirmInvoice.id, !hasRecipients);
                }}
                style={{ backgroundColor: 'var(--theme-brand-primary)' }}
              >
                {(() => {
                  const recipients = sendConfirmInvoice?.recipient_emails ?? {
                    to: [],
                    cc: [],
                    bcc: [],
                  };
                  const hasRecipients = (recipients.to?.length ?? 0) > 0;
                  return hasRecipients ? 'Send Invoice' : 'Mark as Sent';
                })()}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Email Preview Dialog (bible lines 1590–1614) ── */}
        <Dialog
          open={!!emailPreviewInvoiceId}
          onOpenChange={(open) => !open && setEmailPreviewInvoiceId(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Email Preview
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto border border-stone-200 rounded-lg bg-white">
              {isLoadingEmailPreview ? (
                <div className="flex items-center justify-center h-96">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--theme-stone-500)' }} />
                </div>
              ) : (
                <iframe
                  srcDoc={emailPreviewHtml}
                  className="w-full h-full min-h-[600px]"
                  style={{ border: 'none' }}
                  title="Email Preview"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// ── Suppress unused import warnings for future wiring ─────────────────────────
void format;
void parseISO;
