/**
 * ensure-lead-for-attorney.ts — pure decision function ported from MVP
 * `lib/ensureLeadForAttorney.js`.
 *
 * The MVP version made a Lead.create() call. Here we keep it pure: given
 * inputs, return a `LeadCreateInstruction | null` that the caller hands to a
 * store action.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

export interface EnsureLeadInput {
  attorneyId: string | null | undefined;
  companyId: string | null | undefined;
  /** Existing leads for this attorney within this company, if known. */
  existingLeads?: ReadonlyArray<{ id: string; attorney_id: string; company_id: string }>;
}

export interface LeadCreateInstruction {
  kind: 'create-lead';
  attorney_id: string;
  company_id: string;
}

export interface LeadExistsResult {
  kind: 'lead-exists';
  leadId: string;
}

export interface NoOpResult {
  kind: 'noop';
  reason: 'missing-attorney' | 'missing-company';
}

export type EnsureLeadDecision =
  | LeadCreateInstruction
  | LeadExistsResult
  | NoOpResult;

export function ensureLeadForAttorney(input: EnsureLeadInput): EnsureLeadDecision {
  if (!input.attorneyId) return { kind: 'noop', reason: 'missing-attorney' };
  if (!input.companyId) return { kind: 'noop', reason: 'missing-company' };

  const existing = input.existingLeads?.find(
    (lead) =>
      lead.attorney_id === input.attorneyId && lead.company_id === input.companyId,
  );
  if (existing) return { kind: 'lead-exists', leadId: existing.id };

  return {
    kind: 'create-lead',
    attorney_id: input.attorneyId,
    company_id: input.companyId,
  };
}
