/**
 * service-segment-selector.tsx — port of
 * HotSeatersMVP/src/components/deals/ServiceSegmentSelector.jsx.
 *
 * Lets a service instance be pinned to a specific trial segment (or "Original
 * dates"). Only rendered when the trial has at least one segment. Components
 * consume hook-supplied props only (RULE B). HotSeatersMVP is the bible.
 */

import { format, parseISO } from 'date-fns';
import { Layers } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TrialSegment } from '@/features/trials/entities';
import type { DealFormData } from './deal-wizard-types';

interface ServiceSegmentSelectorProps {
  segments: TrialSegment[];
  dealData: DealFormData;
  segmentId: string | null | undefined;
  onChange: (segmentId: string | null) => void;
}

export function ServiceSegmentSelector({
  segments,
  dealData,
  segmentId,
  onChange,
}: ServiceSegmentSelectorProps) {
  if (!segments || segments.length === 0) return null;

  const sortedSegments = [...segments].sort(
    (a, b) => (a.segment_number ?? 0) - (b.segment_number ?? 0),
  );

  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <Layers className="w-3 h-3 text-stone-400 flex-shrink-0" />
      <Select
        value={segmentId || '__original__'}
        onValueChange={(val) => onChange(val === '__original__' ? null : val)}
      >
        <SelectTrigger className="h-6 text-xs bg-white border-stone-200 w-full">
          <SelectValue placeholder="Original dates" />
        </SelectTrigger>
        <SelectContent
          style={{
            fontFamily: 'var(--theme-font-body)',
            fontSize: 'var(--theme-text-body)',
          }}
        >
          <SelectItem value="__original__">
            Original —{' '}
            {dealData.start_date && dealData.end_date
              ? `${format(parseISO(dealData.start_date), 'MMM d')} – ${format(
                  parseISO(dealData.end_date),
                  'MMM d, yyyy',
                )}`
              : 'Trial dates'}
          </SelectItem>
          {sortedSegments.map((seg) => (
            <SelectItem key={seg.id} value={seg.id}>
              {seg.label || `Continuation ${(seg.segment_number ?? 1) - 1}`} —{' '}
              {seg.start_date && seg.end_date
                ? `${format(parseISO(seg.start_date), 'MMM d')} – ${format(
                    parseISO(seg.end_date),
                    'MMM d, yyyy',
                  )}`
                : 'No dates'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
