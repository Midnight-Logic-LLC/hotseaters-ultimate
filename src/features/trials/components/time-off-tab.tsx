/**
 * time-off-tab.tsx — Time Off requests tab.
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
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CalendarOff } from 'lucide-react';

type TimeOffRow = Record<string, unknown> & {
  id: string;
  consultant_id?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  status?: string;
};
type ConsultantRow = Record<string, unknown> & { id: string; first_name?: string; last_name?: string };

interface TimeOffTabProps {
  timeOffRequests: TimeOffRow[];
  isOwnerOrAdmin: boolean;
  consultants: ConsultantRow[];
  userInfoId: string;
  onCreateTimeOff: (data: Record<string, unknown>) => Promise<void>;
  onApproveTimeOff: (id: string) => Promise<void>;
  onDenyTimeOff: (id: string) => Promise<void>;
  isMutating: boolean;
}

const TIME_OFF_TYPES = ['PTO', 'Sick', 'Holiday', 'Other'];

function statusVariant(status: string | undefined): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'approved': return 'default';
    case 'denied': return 'destructive';
    case 'pending': return 'secondary';
    default: return 'outline';
  }
}

function consultantName(c: ConsultantRow): string {
  return [c.first_name, c.last_name].filter(Boolean).join(' ') || c.id;
}

interface FormState {
  type: string | null;
  start_date: string;
  end_date: string;
  notes: string;
}

const today = new Date().toISOString().split('T')[0] ?? '';
const EMPTY_FORM: FormState = { type: 'PTO', start_date: today, end_date: today, notes: '' };

export function TimeOffTab({
  timeOffRequests,
  isOwnerOrAdmin,
  consultants,
  userInfoId,
  onCreateTimeOff,
  onApproveTimeOff,
  onDenyTimeOff,
  isMutating,
}: TimeOffTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const handleSubmit = async () => {
    await onCreateTimeOff({
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date,
      notes: form.notes || null,
      consultant_id: userInfoId,
    });
    setDialogOpen(false);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1">
          <Plus className="w-3.5 h-3.5" />
          Request Time Off
        </Button>
      </div>

      {/* List */}
      {timeOffRequests.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ background: 'var(--theme-stone-50)', color: 'var(--theme-stone-500)' }}
        >
          <CalendarOff className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No time off requests.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {timeOffRequests.map((req) => {
            const consultant = consultants.find((c) => c.id === req.consultant_id);
            const startDate = req.start_date
              ? new Date(req.start_date as string).toLocaleDateString()
              : null;
            const endDate = req.end_date
              ? new Date(req.end_date as string).toLocaleDateString()
              : null;

            return (
              <Card key={req.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium" style={{ color: 'var(--theme-stone-900)' }}>
                          {(req.type as string) ?? 'Time Off'}
                        </span>
                        <Badge variant={statusVariant(req.status as string | undefined)}>
                          {req.status ?? 'pending'}
                        </Badge>
                      </div>
                      {(startDate || endDate) && (
                        <p className="text-xs mt-1" style={{ color: 'var(--theme-stone-500)' }}>
                          {startDate === endDate ? startDate : [startDate, endDate].filter(Boolean).join(' – ')}
                        </p>
                      )}
                      {isOwnerOrAdmin && consultant && (
                        <p className="text-xs" style={{ color: 'var(--theme-stone-400)' }}>
                          {consultantName(consultant)}
                        </p>
                      )}
                      {req.notes && (
                        <p className="text-xs mt-1" style={{ color: 'var(--theme-stone-600)' }}>
                          {req.notes as string}
                        </p>
                      )}
                    </div>
                    {isOwnerOrAdmin && req.status === 'pending' && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isMutating}
                          onClick={() => void onApproveTimeOff(req.id)}
                          className="h-7 text-xs"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isMutating}
                          onClick={() => void onDenyTimeOff(req.id)}
                          className="h-7 text-xs"
                          style={{ color: 'var(--theme-red-600)' }}
                        >
                          Deny
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Time Off</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OFF_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="to-start">Start Date</Label>
                <Input
                  id="to-start"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="to-end">End Date</Label>
                <Input
                  id="to-end"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="to-notes">Notes (optional)</Label>
              <Textarea
                id="to-notes"
                rows={2}
                placeholder="Additional notes..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleSubmit()} disabled={isMutating}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TimeOffTab;
