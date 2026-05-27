/**
 * TrialsListPage — TanStack-Table view of trials for the current tenant.
 *
 * Parity target: HotSeatersMVP/src/pages/Trials.jsx
 * The bible is a pipeline/overlay view; this v0.1 port uses a table per the
 * feature scope in CLAUDE.md. Page header copy, theme tokens, and permission
 * model are faithful to the bible.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useCurrentCompany } from '@/features/auth/hooks/use-current-company';
import { useTier1 } from '@/app/tier1-provider';
import { useTrialsList } from '@/features/trials/hooks/use-trials-list';
import { useTrialCRUD } from '@/features/trials/hooks/use-trial-crud';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Trial } from '@/features/trials/entities';
import { Plus } from 'lucide-react';

const fmtMoney = (n: number | null | undefined) =>
  n == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(n);

function statusOf(t: Trial): string {
  if (t.completion_type) return t.completion_type;
  if (t.won_date) return 'won';
  if (t.lost_date) return 'lost';
  return 'active';
}

export function TrialsListPage() {
  const { company } = useCurrentCompany();
  const { role } = useTier1();
  // Permission model from bible Trials.jsx — owner/admin/sales can edit.
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const isSales = role === 'sales';
  const canCreate = isOwnerOrAdmin || isSales;

  const { items: trials, isLoading } = useTrialsList({
    companyId: company?.id,
  });
  const { create } = useTrialCRUD();

  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'start_date', desc: true },
  ]);

  const filtered = useMemo(() => {
    if (!search) return trials;
    const q = search.toLowerCase();
    return trials.filter((t) =>
      (t.case_name ?? '').toLowerCase().includes(q) ||
      (t.case_number ?? '').toLowerCase().includes(q) ||
      (t.judge ?? '').toLowerCase().includes(q),
    );
  }, [trials, search]);

  const columns = useMemo<ColumnDef<Trial>[]>(
    () => [
      {
        id: 'case_name',
        accessorKey: 'case_name',
        header: 'Case',
        cell: ({ row }) => (
          <Link
            to={`/trials/${row.original.id}`}
            className="font-medium hover:underline"
            style={{ color: 'var(--theme-stone-900)' }}
          >
            {row.original.case_name ?? '(untitled)'}
          </Link>
        ),
      },
      {
        id: 'case_number',
        accessorKey: 'case_number',
        header: 'Case #',
      },
      {
        id: 'start_date',
        accessorKey: 'start_date',
        header: 'Start',
      },
      {
        id: 'end_date',
        accessorKey: 'end_date',
        header: 'End',
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <Badge>{statusOf(row.original)}</Badge>,
      },
      {
        id: 'estimated_value',
        header: 'Est. value',
        cell: ({ row }) => fmtMoney(row.original.estimated_value),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div
      className="lg:px-8 !pt-2 lg:!pt-[var(--theme-page-padding)]"
      style={{
        padding: 'var(--theme-page-padding)',
        fontFamily: 'var(--theme-font-body)',
        fontSize: 'var(--theme-text-body)',
      }}
    >
      <div style={{ maxWidth: 'var(--theme-max-content-width)' }} className="mx-auto">
        {/* Page header — hidden on mobile (matches bible Trials.jsx) */}
        <div className="hidden lg:block mb-2 lg:mb-[var(--theme-section-gap)]">
          <h1
            className="font-bold mb-2"
            style={{
              fontSize: 'var(--theme-text-page-title)',
              color: 'var(--theme-stone-900)',
            }}
          >
            Trials
          </h1>
          <p style={{ fontSize: 'var(--theme-text-body)', color: 'var(--theme-stone-600)' }}>
            Manage your trial pipeline and opportunities
          </p>
        </div>

        <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search case / number / judge"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            {canCreate && company ? (
              <Button
                onClick={() => {
                  create.mutate({
                    company_id: company.id,
                    case_name: 'New trial',
                  });
                }}
              >
                <Plus className="mr-1 size-4" /> New trial
              </Button>
            ) : null}
          </div>
        </header>

        {isLoading ? (
          <p className="text-sm" style={{ color: 'var(--theme-stone-500)' }}>
            Loading trials…
          </p>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead
                      key={h.id}
                      onClick={h.column.getToggleSortingHandler()}
                      className="cursor-pointer select-none"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getIsSorted() === 'asc' ? ' ▲' : ''}
                      {h.column.getIsSorted() === 'desc' ? ' ▼' : ''}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-8 text-center text-sm"
                    style={{ color: 'var(--theme-stone-500)' }}
                  >
                    No trials yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

export default TrialsListPage;
