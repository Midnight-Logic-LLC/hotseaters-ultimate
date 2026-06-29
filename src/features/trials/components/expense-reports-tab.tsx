/**
 * expense-reports-tab.tsx — Expense Reports list tab.
 *
 * RULE B: no store imports.
 * RULE G: uses @/components/ui/* primitives.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

type ExpenseReportRow = Record<string, unknown> & {
  id: string;
  report_number?: string;
  period_start?: string;
  period_end?: string;
  status?: string;
  pdf_url?: string;
  total_amount?: number;
};

interface ExpenseReportsTabProps {
  expenseReports: ExpenseReportRow[];
  isLoading: boolean;
}

function statusVariant(status: string | undefined): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'generated': return 'default';
    case 'sent': return 'secondary';
    case 'acknowledged': return 'outline';
    default: return 'outline';
  }
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function ExpenseReportsTab({ expenseReports, isLoading }: ExpenseReportsTabProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--theme-stone-500)' }}>
        Loading reports...
      </div>
    );
  }

  if (expenseReports.length === 0) {
    return (
      <div
        className="rounded-lg p-8 text-center"
        style={{ background: 'var(--theme-stone-50)', color: 'var(--theme-stone-500)' }}
      >
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No expense reports yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {expenseReports.map((report) => {
        const periodStart = report.period_start
          ? new Date(report.period_start as string).toLocaleDateString()
          : null;
        const periodEnd = report.period_end
          ? new Date(report.period_end as string).toLocaleDateString()
          : null;

        return (
          <Card key={report.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium" style={{ color: 'var(--theme-stone-900)' }}>
                      {report.report_number ? `Report #${report.report_number as string}` : 'Expense Report'}
                    </span>
                    <Badge variant={statusVariant(report.status as string | undefined)}>
                      {report.status ?? 'generated'}
                    </Badge>
                  </div>
                  {(periodStart || periodEnd) && (
                    <p className="text-xs mt-1" style={{ color: 'var(--theme-stone-500)' }}>
                      {[periodStart, periodEnd].filter(Boolean).join(' – ')}
                    </p>
                  )}
                  {report.total_amount != null && (
                    <p className="text-sm font-semibold mt-1" style={{ color: 'var(--theme-stone-700)' }}>
                      {formatCurrency(report.total_amount as number)}
                    </p>
                  )}
                </div>
                {report.pdf_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(report.pdf_url as string, '_blank')}
                    className="gap-1 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default ExpenseReportsTab;
