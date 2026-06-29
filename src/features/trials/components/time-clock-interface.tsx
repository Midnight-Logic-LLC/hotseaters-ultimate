/**
 * time-clock-interface.tsx — port of HotSeatersMVP TimeClockInterface.jsx
 *
 * RULE B: no store imports — only hook props passed in.
 * RULE G: uses @/components/ui/* primitives.
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Play, Square, Plus, Plane, ChevronDown, ChevronRight, Clock } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TrialRow = Record<string, unknown> & { id: string; name: string; client_id: string; pipeline_stage_id?: string; status?: string };
type ClientRow = Record<string, unknown> & { id: string; name: string };
type ServiceRow = Record<string, unknown> & { id: string; name: string };
type TrialServiceRow = Record<string, unknown> & { id: string; trial_id: string; service_id: string; is_active?: boolean; travel_eligible?: boolean; rate?: number };
type PipelineStageRow = Record<string, unknown> & { id: string; name: string; order_num?: number };
type TimeEntryRow = Record<string, unknown> & { id: string; trial_id?: string; service_id?: string; trial_service_id?: string; start_time: string; end_time?: string; duration_hours?: number; status?: string; description?: string; entry_type?: string };
type ExpenseRow = Record<string, unknown> & { id: string; trial_id?: string; amount: number };
type TrialSegmentRow = Record<string, unknown> & { id: string; trial_id: string };

export interface TimeClockInterfaceProps {
  trials: TrialRow[];
  clients: ClientRow[];
  services: ServiceRow[];
  trialServices: TrialServiceRow[];
  pipelineStages: PipelineStageRow[];
  onCreateEntry: (data: Record<string, unknown>, subcontractInfo?: unknown) => Promise<void>;
  onStartTracking: (data: Record<string, unknown>) => Promise<string | null>;
  onCancelTracking: (id: string) => Promise<void>;
  onUpdateDescription: (id: string, description: string) => Promise<void>;
  activeEntry: TimeEntryRow | null;
  isLoading: boolean;
  timeRoundingMinutes?: number;
  clockInRounding?: string;
  clockOutRounding?: string;
  companyId: string;
  consultantId: string;
  hideDeals?: boolean;
  timeEntries?: TimeEntryRow[];
  expenses?: ExpenseRow[];
  trialSegments?: TrialSegmentRow[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getElapsedSeconds(entry: TimeEntryRow): number {
  return (Date.now() - new Date(entry.start_time).getTime()) / 1000;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function getTrialGroup(
  trial: TrialRow,
  pipelineStages: PipelineStageRow[],
): 'active' | 'future' | 'past' {
  const stage = pipelineStages.find((ps) => ps.id === trial.pipeline_stage_id);
  if (!stage) return 'past';
  const stageName = (stage.name as string).toLowerCase();
  if (stageName.includes('active') || stageName.includes('current')) return 'active';
  if (stageName.includes('future') || stageName.includes('upcoming') || stageName.includes('not started')) return 'future';
  return 'past';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TimeClockInterface({
  trials,
  clients,
  services,
  trialServices,
  pipelineStages,
  onStartTracking,
  onCancelTracking,
  onUpdateDescription,
  activeEntry,
  isLoading,
  companyId,
  consultantId,
  timeEntries = [],
  trialSegments = [],
}: TimeClockInterfaceProps) {
  const isMobile = useIsMobile();
  const [description, setDescription] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedTrialForExpense, setSelectedTrialForExpense] = useState<string | null>(null);
  const [futureExpanded, setFutureExpanded] = useState(false);
  const [pastExpanded, setPastExpanded] = useState(false);
  const descTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isRunning = !!activeEntry;
  const activeEntryId = activeEntry?.id ?? null;

  // Sync description from server
  useEffect(() => {
    if (activeEntry) {
      setDescription((activeEntry.description as string) || '');
    } else {
      setDescription('');
      setElapsedSeconds(0);
    }
  }, [activeEntry, activeEntry?.id, activeEntry?.description]);

  // Timer tick
  useEffect(() => {
    if (!isRunning || !activeEntry) return;
    setElapsedSeconds(getElapsedSeconds(activeEntry));
    const interval = setInterval(() => {
      setElapsedSeconds(getElapsedSeconds(activeEntry));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, activeEntry]);

  // Debounced description save
  useEffect(() => {
    if (!activeEntryId || !isRunning) return;
    if (descTimeoutRef.current) clearTimeout(descTimeoutRef.current);
    descTimeoutRef.current = setTimeout(() => {
      void onUpdateDescription(activeEntryId, description);
    }, 1500);
    return () => {
      if (descTimeoutRef.current) clearTimeout(descTimeoutRef.current);
    };
  }, [description, activeEntryId, isRunning, onUpdateDescription]);

  // Build clockable tasks
  const tasks = trialServices
    .map((ts) => {
      const trial = trials.find((t) => t.id === ts.trial_id);
      if (!trial) return null;
      const client = clients.find((c) => c.id === trial.client_id);
      const service = services.find((s) => s.id === ts.service_id);
      if (!service) return null;
      // Exclude lost/settled
      if (trial.status === 'lost' || trial.status === 'settled') return null;
      return { ts, trial, client, service };
    })
    .filter(Boolean) as Array<{ ts: TrialServiceRow; trial: TrialRow; client: ClientRow | undefined; service: ServiceRow }>;

  // Group trials
  const activeTasks = tasks.filter((t) => getTrialGroup(t.trial, pipelineStages) === 'active');
  const futureTasks = tasks.filter((t) => getTrialGroup(t.trial, pipelineStages) === 'future');
  const pastTasks = tasks.filter((t) => getTrialGroup(t.trial, pipelineStages) === 'past');

  const getLoggedHours = (trialId: string, serviceId: string) => {
    return timeEntries
      .filter((e) => e['trial_id'] === trialId && e['service_id'] === serviceId && e['status'] !== 'rejected')
      .reduce((sum, e) => sum + ((e['duration_hours'] as number) || 0), 0);
  };

  const handleStart = async (ts: TrialServiceRow, trial: TrialRow, service: ServiceRow) => {
    if (isRunning) return;
    await onStartTracking({
      trial_id: trial.id,
      service_id: service.id,
      trial_service_id: ts.id,
      company_id: companyId,
      consultant_id: consultantId,
    });
  };

  const handleStop = async () => {
    if (!activeEntryId) return;
    await onCancelTracking(activeEntryId);
  };

  const renderTaskCard = (item: { ts: TrialServiceRow; trial: TrialRow; client: ClientRow | undefined; service: ServiceRow }) => {
    const { ts, trial, client, service } = item;
    const isActive = activeEntry?.['trial_service_id'] === ts.id || (activeEntry?.['trial_id'] === trial.id && activeEntry?.['service_id'] === service.id);
    const loggedH = getLoggedHours(trial.id, service.id);

    return (
      <div
        key={ts.id}
        className="border rounded-lg p-3 mb-2"
        style={{
          background: isActive ? 'var(--theme-amber-50, #fffbeb)' : 'var(--theme-card-bg)',
          borderColor: isActive ? 'var(--theme-amber-300, #fcd34d)' : 'var(--theme-stone-200)',
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate" style={{ color: 'var(--theme-stone-900)' }}>
              {trial.name}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--theme-stone-500)' }}>
              {client?.name} · {service.name}
            </p>
            {loggedH > 0 && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--theme-stone-400)' }}>
                {loggedH.toFixed(1)}h logged
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {ts.travel_eligible && (
              <Plane className="w-3.5 h-3.5" style={{ color: 'var(--theme-stone-400)' }} />
            )}
            {isActive ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleStop}
                className="h-8 w-8 p-0"
              >
                <Square className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleStart(ts, trial, service)}
                disabled={isRunning || isLoading}
                className="h-8 w-8 p-0"
              >
                <Play className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {isActive && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: 'var(--theme-amber-500, #f59e0b)' }} />
              <span className="font-mono font-bold text-base" style={{ color: 'var(--theme-amber-700, #b45309)' }}>
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              rows={isMobile ? 2 : 3}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedTrialForExpense(trial.id);
                  setExpenseDialogOpen(true);
                }}
                className="gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Expense
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center" style={{ color: 'var(--theme-stone-500)' }}>
        Loading...
      </div>
    );
  }

  void trialSegments; // used in future: filter continued trials
  void selectedTrialForExpense;

  return (
    <div className="space-y-4">
      {/* Active Trials */}
      {activeTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--theme-stone-700)' }}>
            Active Trials
          </h3>
          {activeTasks.map(renderTaskCard)}
        </div>
      )}

      {/* Future Trials */}
      {futureTasks.length > 0 && (
        <div>
          <button
            className="flex items-center gap-1 text-sm font-semibold mb-2 w-full text-left"
            style={{ color: 'var(--theme-stone-600)' }}
            onClick={() => setFutureExpanded((v) => !v)}
          >
            {futureExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Future Trials ({futureTasks.length})
          </button>
          {futureExpanded && futureTasks.map(renderTaskCard)}
        </div>
      )}

      {/* Past Trials */}
      {pastTasks.length > 0 && (
        <div>
          <button
            className="flex items-center gap-1 text-sm font-semibold mb-2 w-full text-left"
            style={{ color: 'var(--theme-stone-600)' }}
            onClick={() => setPastExpanded((v) => !v)}
          >
            {pastExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Past Trials ({pastTasks.length})
          </button>
          {pastExpanded && pastTasks.map(renderTaskCard)}
        </div>
      )}

      {tasks.length === 0 && (
        <div
          className="rounded-lg p-8 text-center"
          style={{ background: 'var(--theme-stone-50)', color: 'var(--theme-stone-500)' }}
        >
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No assigned trials found.</p>
        </div>
      )}

      {/* Expense Dialog placeholder */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: 'var(--theme-stone-500)' }}>
            Expense form coming soon.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TimeClockInterface;
