/**
 * features/lead-radar/stores/lead-radar-store.ts — row-shape TYPE exports
 * for the lead-radar entities (`lead`, `sales_activity`, `attorney`).
 *
 * As of change-S03 these tables are synced into PGlite via ElectricSQL and are
 * read locally through `useTierAQuery` (see use-tier-a-query.ts). The former
 * REST `fetch*ForCompany` company-slice readers were removed — they had zero
 * remaining importers once the lead-radar page switched to the local read.
 *
 * This module is now TYPES-ONLY: `LeadRow` / `SalesActivityRow` / `AttorneyRow`
 * are still consumed by the lead-radar page and the deals wizard
 * (deal-wizard-helpers, wizard-step1-client-contact, use-deal-wizard-data),
 * so the exports remain. No I/O lives here anymore.
 *
 * HotSeatersMVP is the bible.
 */

export interface LeadRow {
  id: string;
  company_id: string;
  attorney_id: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SalesActivityRow {
  id: string;
  company_id: string;
  lead_id: string | null;
  scheduled_date: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AttorneyRow {
  id: string;
  company_id: string;
  client_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string | null;
  updated_at: string | null;
}

