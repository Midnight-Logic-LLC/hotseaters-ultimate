/**
 * time-table-tab.tsx — filtered time entries table.
 *
 * RULE B: no store imports.
 * RULE G: uses @/components/ui/* primitives.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TimeEntryRow = Record<string, unknown> & {
  id: string;
  trial_id?: string;
  service_id?: string;
  start_time: string;
  end_time?: string;
  duration_hours?: number;
  status?: string;
  description?: string;
  consultant_id?: string;
};
type TrialRow = Record<string, unknown> & { id: string; name: string; client_id: string };
type ClientRow = Record<string, unknown> & { id: string; name: string };
type ServiceRow = Record<string, unknown> & { id: string; name: string };
type ConsultantRow = Record<string, unknown> & { id: string; first_name?: string; last_name?: string };

interface TimeTableTabProps {
  timeEntries: TimeEntryRow[];
  allTimeEntries: TimeEntryRow[];
  isOwnerOrAdmin: boolean;
  showMyTime: boolean;
  onToggleMyTime: () => void;
  timeStatusFilter: string;
  onStatusFilterChange: (status: string) => void;
  personFilter: string;
  onPersonFilterChange: (id: string | null) => void;
  consultants: ConsultantRow[];
  trials: TrialRow[];
  clients: ClientRow[];
  services: ServiceRow[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isMutating: boolean;
}

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'In Progress'];
const STATUS_MAP: Record<string, string> = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  in_progress: 'In Progress',
};

function statusBadgeVariant(status: string | undefined): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'approved': return 'default';
    case 'rejected': return 'destructive';
    case 'pending': return 'secondary';
    default: return 'outline';
  }
}

function statusLabel(status: string | undefined): string {
  if (!status) return 'Unknown';
  return STATUS_MAP[status] ?? status;
}

function consultantName(c: ConsultantRow): string {
  return [c.first_name, c.last_name].filter(Boolean).join(' ') || c.id;
}

export function TimeTableTab({
  timeEntries,
  allTimeEntries,
  isOwnerOrAdmin,
  showMyTime,
  onToggleMyTime,
  timeStatusFilter,
  onStatusFilterChange,
  personFilter,
  onPersonFilterChange,
  consultants,
  trials,
  clients,
  services,
  onApprove,
  onReject,
  onDelete,
  isMutating,
}: TimeTableTabProps) {
  const sourceEntries = showMyTime ? timeEntries : allTimeEntries;

  const filtered = sourceEntries.filter((e) => {
    if (timeStatusFilter && timeStatusFilter !== 'All') {
      const normFilter = timeStatusFilter.toLowerCase().replace(' ', '_');
      if (e.status !== normFilter) return false;
    }
    if (personFilter && personFilter !== 'all') {
      if (e.consultant_id !== personFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status chips */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => onStatusFilterChange(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                timeStatusFilter === s
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* My/All toggle */}
        <Button
          size="sm"
          variant={showMyTime ? 'default' : 'outline'}
          onClick={onToggleMyTime}
          className="ml-auto"
        >
          {showMyTime ? 'My Time' : 'All Time'}
        </Button>

        {/* Person filter (admin only) */}
        {isOwnerOrAdmin && !showMyTime && (
          <Select value={personFilter || 'all'} onValueChange={onPersonFilterChange}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Filter by person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All People</SelectItem>
              {consultants.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {consultantName(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ background: 'var(--theme-stone-50)', color: 'var(--theme-stone-500)' }}
        >
          <p className="text-sm">No time entries found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--theme-stone-200)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--theme-stone-50)' }}>
              <tr>
                <th className="text-left p-3 font-medium text-xs" style={{ color: 'var(--theme-stone-600)' }}>Date</th>
                <th className="text-left p-3 font-medium text-xs" style={{ color: 'var(--theme-stone-600)' }}>Trial / Client</th>
                <th className="text-left p-3 font-medium text-xs" style={{ color: 'var(--theme-stone-600)' }}>Service</th>
                {isOwnerOrAdmin && (
                  <th className="text-left p-3 font-medium text-xs" style={{ color: 'var(--theme-stone-600)' }}>Consultant</th>
                )}
                <th className="text-right p-3 font-medium text-xs" style={{ color: 'var(--theme-stone-600)' }}>Hours</th>
                <th className="text-left p-3 font-medium text-xs" style={{ color: 'var(--theme-stone-600)' }}>Status</th>
                <th className="text-right p-3 font-medium text-xs" style={{ color: 'var(--theme-stone-600)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => {
                const trial = trials.find((t) => t.id === entry.trial_id);
                const client = trial ? clients.find((c) => c.id === trial.client_id) : undefined;
                const service = services.find((s) => s.id === entry.service_id);
                const consultant = consultants.find((c) => c.id === entry.consultant_id);
                const date = entry.start_time
                  ? new Date(entry.start_time).toLocaleDateString()
                  : '—';
                const hours = entry.duration_hours != null
                  ? `${(entry.duration_hours as number).toFixed(2)}h`
                  : '—';

                return (
                  <tr
                    key={entry.id}
                    className="border-t"
                    style={{
                      borderColor: 'var(--theme-stone-100)',
                      background: i % 2 === 0 ? 'white' : 'var(--theme-stone-50)',
                    }}
                  >
                    <td className="p-3 whitespace-nowrap" style={{ color: 'var(--theme-stone-700)' }}>{date}</td>
                    <td className="p-3">
                      <p className="font-medium" style={{ color: 'var(--theme-stone-900)' }}>{trial?.name ?? '—'}</p>
                      {client && <p className="text-xs" style={{ color: 'var(--theme-stone-500)' }}>{client.name}</p>}
                    </td>
                    <td className="p-3" style={{ color: 'var(--theme-stone-700)' }}>{service?.name ?? '—'}</td>
                    {isOwnerOrAdmin && (
                      <td className="p-3" style={{ color: 'var(--theme-stone-700)' }}>
                        {consultant ? consultantName(consultant) : '—'}
                      </td>
                    )}
                    <td className="p-3 text-right font-mono" style={{ color: 'var(--theme-stone-700)' }}>{hours}</td>
                    <td className="p-3">
                      <Badge variant={statusBadgeVariant(entry.status as string | undefined)}>
                        {statusLabel(entry.status as string | undefined)}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        {isOwnerOrAdmin && entry.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isMutating}
                              onClick={() => void onApprove(entry.id)}
                              className="h-7 text-xs"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isMutating}
                              onClick={() => void onReject(entry.id)}
                              className="h-7 text-xs"
                              style={{ color: 'var(--theme-red-600)' }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isMutating}
                          onClick={() => void onDelete(entry.id)}
                          className="h-7 text-xs"
                          style={{ color: 'var(--theme-red-500)' }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TimeTableTab;
