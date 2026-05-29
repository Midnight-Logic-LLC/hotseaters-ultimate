/**
 * deal-card-types.ts — shared row + prop types for the Deal Tracker cards.
 *
 * The port's data layer (D01) currently exposes trials, pipeline stages and
 * clients. The bible cards additionally consult consultants, attorneys,
 * salesActivities, documents and documentSigners. Those entity lists are NOT
 * yet wired as port hooks (they land with later deal-activity / documents
 * changes), so the card props accept them as OPTIONAL arrays defaulting to
 * empty — the card renders the same layout with those sections collapsed when
 * the data is absent, and lights up automatically once the lists are wired.
 *
 * HotSeatersMVP is the bible.
 */

import { Phone, Mail, CalendarDays } from 'lucide-react';

import type { Trial } from '@/features/trials/entities';
import type { PipelineStage } from '@/shared/db/lookups-selectors';
import type { ClientRow } from '@/features/clients/hooks/use-clients-list';

/**
 * Activity-type → icon + Tailwind color class. Single source consumed by both
 * DealCard and OpportunityCard (bible parity for the next-activity display).
 */
export const ACTIVITY_TYPE_ICON: Record<string, { icon: typeof Phone; color: string }> = {
  Call: { icon: Phone, color: 'text-blue-600' },
  Email: { icon: Mail, color: 'text-amber-600' },
  Meeting: { icon: CalendarDays, color: 'text-green-600' },
};

/** A deal is a Trial with a derived `daysUntilTrial`. */
export interface DealRow extends Trial {
  daysUntilTrial: number | null;
}

/** Minimal attorney/contact shape the cards read. */
export interface AttorneyRow {
  id: string;
  client_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  is_active_prospect?: boolean | null;
  contact_status?: string | null;
}

/** Minimal consultant (sales lead) shape the cards read. */
export interface ConsultantRow {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  profile_photo?: string | null;
}

/** Minimal sales-activity shape the cards read. */
export interface SalesActivityRow {
  id: string;
  trial_id?: string | null;
  attorney_id?: string | null;
  status?: string | null;
  scheduled_date?: string | null;
  activity_type?: string | null;
  content?: string | null;
}

/** Minimal document shape the cards read (LOE status footer). */
export interface DocumentRow {
  id: string;
  trial_id?: string | null;
  status?: string | null;
  document_name?: string | null;
  template_id?: string | null;
}

/** Minimal document-signer shape the cards read. */
export interface DocumentSignerRow {
  id: string;
  document_id?: string | null;
  status?: string | null;
  view_only?: boolean | null;
}

/** Props every card consumes (the bible's `sharedCardProps`). */
export interface SharedCardProps {
  clients: ClientRow[];
  pipelineStages: PipelineStage[];
  attorneys: AttorneyRow[];
  documents: DocumentRow[];
  documentSigners: DocumentSignerRow[];
  consultants: ConsultantRow[];
  salesActivities: SalesActivityRow[];
  showMyDeals?: boolean;
  onSelectTrial: (trial: Trial) => void;
  /** Reminder send for an LOE doc. Out of scope until the documents change lands. */
  onSendReminder?: (doc: DocumentRow, e: React.MouseEvent) => void;
  /** Add-deal-for-contact (D03 wizard). Optional. */
  onAddDealForContact?: (attorney: AttorneyRow) => void;
  /** Hard-delete the deal's trial row (deals hook `deleteDeal`). Deal-mode only. */
  onDeleteTrial?: (id: string) => Promise<void>;
  /** Delete the deal's trial child rows (services/contacts). Deal-mode only. */
  onDeleteTrialChildren?: (id: string) => Promise<void>;
}
