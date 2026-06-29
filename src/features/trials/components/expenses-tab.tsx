/**
 * expenses-tab.tsx — Expenses tab for the Time & Expenses page.
 *
 * RULE B: no store imports.
 * RULE G: uses @/components/ui/* primitives.
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, DollarSign } from 'lucide-react';

type ExpenseRow = Record<string, unknown> & {
  id: string;
  trial_id?: string;
  amount: number;
  description?: string;
  category?: string;
  expense_date?: string;
  status?: string;
  consultant_id?: string;
  is_billable?: boolean;
  is_reimbursable?: boolean;
};
type TrialRow = Record<string, unknown> & { id: string; name: string; client_id: string };
type ConsultantRow = Record<string, unknown> & { id: string; first_name?: string; last_name?: string };

interface ExpensesTabProps {
  userExpenses: ExpenseRow[];
  allCompanyExpenses: ExpenseRow[];
  isOwnerOrAdmin: boolean;
  showMyExpenses: boolean;
  onToggleMyExpenses: () => void;
  trials: TrialRow[];
  consultants: ConsultantRow[];
  onCreateExpense: (data: Record<string, unknown>) => Promise<void>;
  onApproveExpense: (id: string) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  isMutating: boolean;
  companyId: string;
  consultantId: string;
}

const EXPENSE_CATEGORIES = ['Meals', 'Travel', 'Lodging', 'Equipment', 'Other'];

function statusVariant(status: string | undefined): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'approved': return 'default';
    case 'rejected': return 'destructive';
    case 'pending': return 'secondary';
    default: return 'outline';
  }
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

interface ExpenseFormState {
  expense_date: string;
  amount: string;
  description: string;
  category: string;
  trial_id: string;
  is_billable: boolean;
  is_reimbursable: boolean;
}

const EMPTY_FORM: ExpenseFormState = {
  expense_date: new Date().toISOString().split('T')[0] ?? '',
  amount: '',
  description: '',
  category: 'Other',
  trial_id: '',
  is_billable: false,
  is_reimbursable: true,
};

export function ExpensesTab({
  userExpenses,
  allCompanyExpenses,
  isOwnerOrAdmin,
  showMyExpenses,
  onToggleMyExpenses,
  trials,
  onCreateExpense,
  onApproveExpense,
  onDeleteExpense,
  isMutating,
  consultantId,
}: ExpensesTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ExpenseFormState>(EMPTY_FORM);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const source = showMyExpenses ? userExpenses : allCompanyExpenses;
  const now = new Date();

  const thisMonthTotal = source
    .filter((e) => {
      if (!e.expense_date) return false;
      const d = new Date(e.expense_date as string);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + (e.amount as number), 0);

  const pendingReimbursable = source
    .filter((e) => e.status === 'pending' && e.is_reimbursable)
    .reduce((sum, e) => sum + (e.amount as number), 0);

  const unbilled = source
    .filter((e) => e.is_billable && e.status !== 'billed')
    .reduce((sum, e) => sum + (e.amount as number), 0);

  const filtered = source.filter((e) => {
    if (statusFilter !== 'All' && e.status !== statusFilter.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      const desc = ((e.description as string) || '').toLowerCase();
      const cat = ((e.category as string) || '').toLowerCase();
      if (!desc.includes(q) && !cat.includes(q)) return false;
    }
    return true;
  });

  const handleSubmit = async () => {
    if (!form.amount || isNaN(parseFloat(form.amount))) return;
    await onCreateExpense({
      expense_date: form.expense_date,
      amount: parseFloat(form.amount),
      description: form.description,
      category: form.category,
      trial_id: form.trial_id || null,
      is_billable: form.is_billable,
      is_reimbursable: form.is_reimbursable,
      consultant_id: consultantId,
    });
    setDialogOpen(false);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'This Month', value: formatCurrency(thisMonthTotal) },
          { label: 'Pending Reimbursement', value: formatCurrency(pendingReimbursable) },
          { label: 'Unbilled', value: formatCurrency(unbilled) },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4" style={{ color: 'var(--theme-stone-400)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--theme-stone-500)' }}>
                  {card.label}
                </span>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--theme-stone-900)' }}>
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {['All', 'Pending', 'Approved', 'Rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500'
            }`}
          >
            {s}
          </button>
        ))}
        <Input
          className="h-8 w-40 text-xs"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button size="sm" variant={showMyExpenses ? 'default' : 'outline'} onClick={onToggleMyExpenses} className="ml-auto">
          {showMyExpenses ? 'My Expenses' : 'All Expenses'}
        </Button>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1">
          <Plus className="w-3.5 h-3.5" />
          Add Expense
        </Button>
      </div>

      {/* Expense list */}
      {filtered.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ background: 'var(--theme-stone-50)', color: 'var(--theme-stone-500)' }}
        >
          <p className="text-sm">No expenses found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((expense) => {
            const trial = trials.find((t) => t.id === expense.trial_id);
            return (
              <Card key={expense.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold" style={{ color: 'var(--theme-stone-900)' }}>
                          {formatCurrency(expense.amount)}
                        </span>
                        <Badge variant={statusVariant(expense.status as string | undefined)}>
                          {expense.status ?? 'pending'}
                        </Badge>
                        {expense.category && (
                          <Badge variant="outline">{expense.category as string}</Badge>
                        )}
                      </div>
                      {expense.description && (
                        <p className="text-sm mt-1" style={{ color: 'var(--theme-stone-600)' }}>
                          {expense.description as string}
                        </p>
                      )}
                      <div className="flex gap-3 mt-1">
                        {trial && (
                          <span className="text-xs" style={{ color: 'var(--theme-stone-500)' }}>
                            {trial.name}
                          </span>
                        )}
                        {expense.expense_date && (
                          <span className="text-xs" style={{ color: 'var(--theme-stone-400)' }}>
                            {new Date(expense.expense_date as string).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {isOwnerOrAdmin && expense.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isMutating}
                          onClick={() => void onApproveExpense(expense.id)}
                          className="h-7 text-xs"
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isMutating}
                        onClick={() => void onDeleteExpense(expense.id)}
                        className="h-7 text-xs"
                        style={{ color: 'var(--theme-red-500)' }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Expense Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="exp-date">Date</Label>
              <Input
                id="exp-date"
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="exp-amount">Amount ($)</Label>
              <Input
                id="exp-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="exp-desc">Description</Label>
              <Textarea
                id="exp-desc"
                rows={2}
                placeholder="What was this expense for?"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v ?? f.category }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Trial (optional)</Label>
              <Select value={form.trial_id || 'none'} onValueChange={(v) => setForm((f) => ({ ...f, trial_id: v === 'none' || v === null ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trial..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {trials.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="exp-billable"
                  checked={form.is_billable}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_billable: !!v }))}
                />
                <Label htmlFor="exp-billable">Billable</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="exp-reimbursable"
                  checked={form.is_reimbursable}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_reimbursable: !!v }))}
                />
                <Label htmlFor="exp-reimbursable">Reimbursable</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleSubmit()} disabled={isMutating || !form.amount}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExpensesTab;
