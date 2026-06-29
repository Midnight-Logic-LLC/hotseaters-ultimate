/**
 * approve-hsh-invoices-column.tsx — Kanban column for approving HSH invoices.
 *
 * BIBLE: HotSeatersMVP/src/components/approvals/ApproveHSHInvoicesColumn.jsx
 *
 * Features:
 * - Trial / Company view tabs
 * - Group collapsing with indeterminate checkbox
 * - Per-invoice checkbox + row click to preview PDF (stub)
 * - Approve bulk action → AlertDialog confirmation
 * - Purple HSH color scheme
 *
 * RULE B: no store imports.
 */
import { useState, useMemo } from 'react';
import { CheckCircle, Orbit, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { KanbanColumn } from '@/shared/ui/kanban-column';

// ── Types ──────────────────────────────────────────────────────────────────────

interface HshInvoice {
  id: string;
  trial_id?: string | null;
  trial_name?: string | null;
  company_id?: string | null;
  invoice_number?: string | number | null;
  invoice_date?: string | null;
  total?: number | null;
  pdf_url?: string | null;
}

interface SubcontractorCompany {
  id: string;
  name?: string | null;
}

interface Trial {
  id: string;
  case_name?: string | null;
  job_number?: string | null;
}

interface SubcontractAssignment {
  id: string;
}

interface ApproveHSHInvoicesColumnProps {
  hshInvoices?: HshInvoice[];
  subcontractorCompanies?: SubcontractorCompany[];
  companyId?: string | null;
  isLoading?: boolean;
  trials?: Trial[];
  subcontractAssignments?: SubcontractAssignment[];
  onApprove: (ids: string[]) => void;
  isApproving?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────────

const HSH_ACCENT = 'var(--theme-hsh-accent, #9333ea)';

export function ApproveHSHInvoicesColumn({
  hshInvoices = [],
  subcontractorCompanies = [],
  trials = [],
  isLoading = false,
  onApprove,
  isApproving = false,
}: ApproveHSHInvoicesColumnProps) {
  const [viewMode, setViewMode] = useState<'trial' | 'company'>('trial');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [approveTargetIds, setApproveTargetIds] = useState<string[] | null>(null);

  const getCompanyName = (cId: string | null | undefined): string => {
    const co = subcontractorCompanies.find((c) => c.id === cId);
    return co?.name ?? 'Unknown';
  };

  const getHCJobNumber = (invoice: HshInvoice): string => {
    const trial = trials.find((t) => t.id === invoice.trial_id);
    return trial?.job_number ?? '';
  };

  const totalAmount = hshInvoices.reduce((sum, inv) => sum + (inv.total ?? 0), 0);
  const selectedAmount = hshInvoices
    .filter((inv) => selectedIds.includes(inv.id))
    .reduce((sum, inv) => sum + (inv.total ?? 0), 0);

  const groupedInvoices = useMemo(() => {
    const groups: Record<string, HshInvoice[]> = {};
    hshInvoices.forEach((inv) => {
      let key: string;
      if (viewMode === 'trial') {
        const trial = trials.find((t) => t.id === inv.trial_id);
        const jobNum = trial?.job_number ?? '';
        const caseName = inv.trial_name ?? trial?.case_name ?? 'Unknown';
        key = jobNum ? `(${jobNum}) ${caseName}` : caseName;
      } else {
        key = getCompanyName(inv.company_id);
      }
      if (!groups[key]) groups[key] = [];
      groups[key]!.push(inv);
    });
    return groups;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hshInvoices, viewMode, trials, subcontractorCompanies]);

  const toggleInvoice = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleApproveSelected = () => {
    if (selectedIds.length > 0) setApproveTargetIds(selectedIds);
  };

  const handleConfirmApprove = () => {
    if (approveTargetIds) {
      onApprove(approveTargetIds);
      setSelectedIds((prev) => prev.filter((id) => !approveTargetIds.includes(id)));
      setApproveTargetIds(null);
    }
  };

  const innerContent = (
    <>
      {/* Tab + Approve */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div
          className="flex items-center rounded-lg border overflow-hidden"
          style={{ borderColor: 'var(--theme-stone-200)' }}
        >
          {(['trial', 'company'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors capitalize"
              style={
                viewMode === v
                  ? { backgroundColor: HSH_ACCENT, color: 'white' }
                  : { color: 'var(--theme-stone-600)' }
              }
            >
              {v === 'trial' ? 'Trial' : 'Company'}
            </button>
          ))}
        </div>
        <Button
          onClick={handleApproveSelected}
          disabled={selectedIds.length === 0 || isApproving}
          size="sm"
          style={{
            backgroundColor: selectedIds.length > 0 ? HSH_ACCENT : 'var(--theme-stone-200)',
            color: selectedIds.length > 0 ? 'white' : 'var(--theme-stone-600)',
            borderRadius: 'var(--theme-button-radius)',
          }}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {isApproving ? 'Approving…' : `Approve (${selectedIds.length})`}
        </Button>
      </div>

      <div className="space-y-2">
        {Object.entries(groupedInvoices).map(([groupKey, invoices]) => {
          const groupIds = invoices.map((i) => i.id);
          const allGroupSelected = groupIds.every((id) => selectedIds.includes(id));
          const someGroupSelected = groupIds.some((id) => selectedIds.includes(id));

          const handleGroupToggle = () => {
            if (allGroupSelected) {
              setSelectedIds((prev) => prev.filter((id) => !groupIds.includes(id)));
            } else {
              setSelectedIds((prev) => [...new Set([...prev, ...groupIds])]);
            }
          };

          return (
            <div key={groupKey} className="bg-purple-50/50 rounded-lg p-3 border border-purple-200">
              <div className="flex items-center gap-3 font-medium text-sm text-purple-900 mb-2">
                {viewMode === 'company' && <Orbit className="w-4 h-4 text-purple-600 flex-shrink-0" />}
                <span className="flex-1">{groupKey}</span>
                <input
                  type="checkbox"
                  checked={allGroupSelected}
                  ref={(el) => { if (el) el.indeterminate = someGroupSelected && !allGroupSelected; }}
                  onChange={handleGroupToggle}
                  className="w-5 h-5 lg:w-4 lg:h-4 flex-shrink-0"
                />
              </div>

              {invoices.map((invoice) => {
                const hcJobNumber = getHCJobNumber(invoice);
                const caseName = invoice.trial_name ?? 'Unknown';
                const companyName = getCompanyName(invoice.company_id);
                const primaryLabel =
                  viewMode === 'trial'
                    ? companyName
                    : hcJobNumber
                    ? `(${hcJobNumber}) ${caseName}`
                    : caseName;

                return (
                  <div
                    key={invoice.id}
                    className="p-2 rounded border border-purple-100 bg-white mb-1.5 last:mb-0 cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => toast.info('PDF preview coming soon')}
                  >
                    {/* Row 1 */}
                    <div className="flex items-center gap-2 mb-0.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(invoice.id)}
                        onChange={(e) => { e.stopPropagation(); toggleInvoice(invoice.id); }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-stone-900 truncate">{primaryLabel}</p>
                      </div>
                      <p className="text-xs font-bold whitespace-nowrap" style={{ color: '#7e22ce' }}>
                        ${invoice.total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    {/* Row 2-3 */}
                    <div className="ml-6">
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-purple-500 flex-shrink-0" />
                        Invoice #{invoice.invoice_number}
                      </p>
                      {invoice.invoice_date && (
                        <p className="text-xs text-stone-400 mt-0.5 ml-4">
                          {format(parseISO(invoice.invoice_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {hshInvoices.length === 0 && !isLoading && (
          <p className="text-xs text-stone-500 text-center py-8">No pending HSH invoices</p>
        )}
      </div>

      {/* Approve confirmation */}
      <AlertDialog open={!!approveTargetIds} onOpenChange={(open) => { if (!open) setApproveTargetIds(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Approve {approveTargetIds?.length === 1 ? 'HSH Invoice' : `${approveTargetIds?.length} HSH Invoices`}?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            The subcontractor&apos;s time and expenses will be added to your Approve Time and Approve Expenses
            columns — priced at your company&apos;s rates — so you can review them and bill your client.
            {approveTargetIds?.length === 1
              ? ' The HSH invoice will be marked as approved.'
              : ` All ${approveTargetIds?.length} HSH invoices will be marked as approved.`}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isApproving}
              onClick={handleConfirmApprove}
              style={{ backgroundColor: 'var(--theme-brand-primary)' }}
            >
              {isApproving
                ? 'Approving…'
                : `Approve ${approveTargetIds?.length === 1 ? 'Invoice' : `${approveTargetIds?.length} Invoices`}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return (
    <KanbanColumn
      title="HSH Invoices"
      count={hshInvoices.length}
      total={`$${(selectedIds.length > 0 ? selectedAmount : totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      colorBorder={HSH_ACCENT}
      icon={<Orbit className="w-10 h-10" />}
      isLoading={isLoading}
    >
      {innerContent}
    </KanbanColumn>
  );
}
