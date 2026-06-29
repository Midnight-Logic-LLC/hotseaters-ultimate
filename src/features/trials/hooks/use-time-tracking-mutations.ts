/**
 * use-time-tracking-mutations.ts — mutations for time entries and expenses.
 *
 * Interim: calls Supabase directly. TODO: migrate to stores.
 *
 * RULE C: hooks own I/O; stores will replace these calls in a future phase.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/shared/db/supabase-client';
import { useTier1 } from '@/app/tier1-provider';

export interface TimeTrackingMutations {
  handleCreateEntry: (entryData: Record<string, unknown>, subcontractInfo?: unknown) => Promise<void>;
  handleUpdateEntry: (id: string, data: Record<string, unknown>) => Promise<void>;
  handleDeleteEntry: (id: string) => Promise<void>;
  handleApproveEntry: (id: string) => Promise<void>;
  handleRejectEntry: (id: string, reason?: string) => Promise<void>;
  handleResetToPending: (id: string) => Promise<void>;
  handleBulkApprove: (ids: string[]) => Promise<void>;
  handleBulkReject: (ids: string[]) => Promise<void>;
  handleBulkResetToPending: (ids: string[]) => Promise<void>;
  handleStartTracking: (entryData: Record<string, unknown>) => Promise<string | null>;
  handleCancelTracking: (id: string) => Promise<void>;
  handleUpdateDescription: (id: string, description: string) => Promise<void>;
  handleCreateExpense: (data: Record<string, unknown>) => Promise<void>;
  handleDeleteExpense: (id: string) => Promise<void>;
  handleApproveExpense: (id: string) => Promise<void>;
  handleCreateTimeOff: (data: Record<string, unknown>) => Promise<void>;
  handleApproveTimeOff: (id: string) => Promise<void>;
  handleDenyTimeOff: (id: string) => Promise<void>;
  isMutating: boolean;
}

export function useTimeTrackingMutations(onRefetch: () => void): TimeTrackingMutations {
  const { userInfo, company } = useTier1();
  const companyId = (userInfo as Record<string, unknown> | null)?.['company_id'] as string | null;
  const consultantId = (userInfo as Record<string, unknown> | null)?.['id'] as string | null;

  const [isMutating, setIsMutating] = useState(false);

  const withMutation = useCallback(
    async (fn: () => Promise<void>) => {
      setIsMutating(true);
      try {
        await fn();
        onRefetch();
      } finally {
        setIsMutating(false);
      }
    },
    [onRefetch],
  );

  const handleCreateEntry = useCallback(
    async (entryData: Record<string, unknown>, _subcontractInfo?: unknown) => {
      await withMutation(async () => {
        await supabase.from('time_entry').insert({
          ...entryData,
          company_id: companyId,
          consultant_id: consultantId,
          status: 'pending',
        });
      });
    },
    [withMutation, companyId, consultantId],
  );

  const handleUpdateEntry = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      await withMutation(async () => {
        await supabase.from('time_entry').update(data).eq('id', id);
      });
    },
    [withMutation],
  );

  const handleDeleteEntry = useCallback(
    async (id: string) => {
      await withMutation(async () => {
        await supabase.from('time_entry').delete().eq('id', id);
      });
    },
    [withMutation],
  );

  const handleApproveEntry = useCallback(
    async (id: string) => {
      await withMutation(async () => {
        await supabase.from('time_entry').update({ status: 'approved' }).eq('id', id);
      });
    },
    [withMutation],
  );

  const handleRejectEntry = useCallback(
    async (id: string, reason?: string) => {
      await withMutation(async () => {
        await supabase
          .from('time_entry')
          .update({ status: 'rejected', rejection_reason: reason ?? null })
          .eq('id', id);
      });
    },
    [withMutation],
  );

  const handleResetToPending = useCallback(
    async (id: string) => {
      await withMutation(async () => {
        await supabase.from('time_entry').update({ status: 'pending' }).eq('id', id);
      });
    },
    [withMutation],
  );

  const handleBulkApprove = useCallback(
    async (ids: string[]) => {
      await withMutation(async () => {
        await supabase.from('time_entry').update({ status: 'approved' }).in('id', ids);
      });
    },
    [withMutation],
  );

  const handleBulkReject = useCallback(
    async (ids: string[]) => {
      await withMutation(async () => {
        await supabase.from('time_entry').update({ status: 'rejected' }).in('id', ids);
      });
    },
    [withMutation],
  );

  const handleBulkResetToPending = useCallback(
    async (ids: string[]) => {
      await withMutation(async () => {
        await supabase.from('time_entry').update({ status: 'pending' }).in('id', ids);
      });
    },
    [withMutation],
  );

  const handleStartTracking = useCallback(
    async (entryData: Record<string, unknown>): Promise<string | null> => {
      setIsMutating(true);
      try {
        const { data } = await supabase
          .from('time_entry')
          .insert({
            ...entryData,
            company_id: companyId,
            consultant_id: consultantId,
            status: 'in_progress',
            start_time: new Date().toISOString(),
          })
          .select('id')
          .single();
        onRefetch();
        return (data as Record<string, unknown> | null)?.['id'] as string | null;
      } finally {
        setIsMutating(false);
      }
    },
    [companyId, consultantId, onRefetch],
  );

  const handleCancelTracking = useCallback(
    async (id: string) => {
      await withMutation(async () => {
        await supabase.from('time_entry').delete().eq('id', id);
      });
    },
    [withMutation],
  );

  const handleUpdateDescription = useCallback(
    async (id: string, description: string) => {
      // No isMutating flip — this is a silent background save
      await supabase.from('time_entry').update({ description }).eq('id', id);
    },
    [],
  );

  const handleCreateExpense = useCallback(
    async (data: Record<string, unknown>) => {
      await withMutation(async () => {
        await supabase.from('expense').insert({
          ...data,
          company_id: companyId,
          consultant_id: consultantId,
          status: 'pending',
        });
      });
    },
    [withMutation, companyId, consultantId],
  );

  const handleDeleteExpense = useCallback(
    async (id: string) => {
      await withMutation(async () => {
        await supabase.from('expense').delete().eq('id', id);
      });
    },
    [withMutation],
  );

  const handleApproveExpense = useCallback(
    async (id: string) => {
      await withMutation(async () => {
        await supabase.from('expense').update({ status: 'approved' }).eq('id', id);
      });
    },
    [withMutation],
  );

  const handleCreateTimeOff = useCallback(
    async (data: Record<string, unknown>) => {
      await withMutation(async () => {
        await supabase.from('time_off').insert({
          ...data,
          company_id: companyId,
          consultant_id: consultantId,
          status: 'pending',
        });
      });
    },
    [withMutation, companyId, consultantId],
  );

  const handleApproveTimeOff = useCallback(
    async (id: string) => {
      await withMutation(async () => {
        await supabase.from('time_off').update({ status: 'approved' }).eq('id', id);
      });
    },
    [withMutation],
  );

  const handleDenyTimeOff = useCallback(
    async (id: string) => {
      await withMutation(async () => {
        await supabase.from('time_off').update({ status: 'denied' }).eq('id', id);
      });
    },
    [withMutation],
  );

  void company; // available for future rate/rounding calculations

  return {
    handleCreateEntry,
    handleUpdateEntry,
    handleDeleteEntry,
    handleApproveEntry,
    handleRejectEntry,
    handleResetToPending,
    handleBulkApprove,
    handleBulkReject,
    handleBulkResetToPending,
    handleStartTracking,
    handleCancelTracking,
    handleUpdateDescription,
    handleCreateExpense,
    handleDeleteExpense,
    handleApproveExpense,
    handleCreateTimeOff,
    handleApproveTimeOff,
    handleDenyTimeOff,
    isMutating,
  };
}
