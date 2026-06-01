/**
 * use-deal-wizard-data.ts — read-side aggregation for the deal wizard.
 *
 * The bible's DealWizard fires ~12 base44 queries on mount (clients,
 * attorneys, consultants, service overrides, existing trial services /
 * contacts / segments, etc.). This hook is the port equivalent: it gathers
 * every read the wizard needs from the existing store seams and tier-1
 * provider (RULE C — hooks call stores + other hooks only; RULE D — all I/O
 * sits in the stores). Components consume THIS hook, never the stores.
 *
 * Data-source map (port → bible):
 *   • services            → company `useServices()` (MetadataType scope=service)
 *   • clients             → `useClientsList()`
 *   • clientTypes         → `useTier1().clientTypes`
 *   • serviceCategories   → `useTier1().serviceCategories`
 *   • pipelineStages      → `useTier1().pipelineStages`
 *   • consultants         → `useTeam(companyId)` (user_info rows)
 *   • attorneys           → `useTierAQuery('attorney')` (local live query, S03)
 *   • clientOverrides     → `loadOverrides(clientId)` (clients store, REST)
 *   • existing trial data → `fetchTrialServices/Contacts/Segments` (trials store)
 *
 * HotSeatersMVP is the bible.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTier1 } from '@/app/tier1-provider';
import { useTierAQuery } from '@/shared/hooks/use-tier-a-query';
import { useCurrentCompany } from '@/features/auth/hooks/use-current-company';
import { useServices, type ServiceRecord } from '@/features/company/hooks/use-services';
import { useClientsList } from '@/features/clients/hooks/use-clients-list';
import type { ClientRow } from '@/features/clients/stores/clients-store';
import { useTeam, type TeamMember } from '@/features/company/hooks/use-team';
import type { AttorneyRow } from '@/features/lead-radar/stores/lead-radar-store';
import {
  loadOverrides,
  createClient,
  type ClientServiceOverrideRow,
  type CreateClientInput,
} from '@/features/clients/stores/clients-store';
import { createAttorney } from '@/features/deals/stores/sales-activity-store';
import { useTrialServices } from '@/features/trials/hooks/use-trial-services';
import { useTrialContacts } from '@/features/trials/hooks/use-trial-contacts';
import { useTrialSegments } from '@/features/trials/hooks/use-trial-segments';
import type {
  TrialService,
  TrialContact,
  TrialSegment,
} from '@/features/trials/entities';
import type { LookupRow, PipelineStage } from '@/shared/db/lookups-selectors';

export interface DealWizardConsultant {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_role: string | null;
  status: string;
}

/** Company billing defaults the wizard's calcs read. */
export interface DealWizardCompanyDefaults {
  default_daily_minimum_hours: number;
  retainer_divisor: number | null;
  retainer_multiplier: number | null;
  retainer_minimum: number | null;
}

export interface UseDealWizardDataResult {
  companyId: string | null;
  companyDefaults: DealWizardCompanyDefaults;
  isLoading: boolean;
  services: ServiceRecord[];
  clients: ClientRow[];
  clientTypes: LookupRow[];
  serviceCategories: LookupRow[];
  pipelineStages: PipelineStage[];
  consultants: DealWizardConsultant[];
  attorneys: AttorneyRow[];
  /** Service-rate overrides for the selected client (empty until a client is chosen). */
  clientOverrides: ClientServiceOverrideRow[];
  /** Existing children for the trial being edited (empty for a new deal). */
  existingServices: TrialService[];
  existingContacts: TrialContact[];
  trialSegments: TrialSegment[];
  /**
   * Inline client-create action. Hooks own the store seam (RULE C), so the
   * wizard component routes its "create new client" path through here rather
   * than importing the clients store directly (RULE B).
   */
  createClient: (input: CreateClientInput) => Promise<string>;
  /** Re-fetch attorneys after a wizard-side contact create (D04). */
  reloadAttorneys: () => void;
  /**
   * Inline contact-create action (D04). Creates an Attorney for the given
   * client, reloads the attorney list, and resolves to the new attorney id.
   */
  createContact: (input: CreateContactInput) => Promise<string>;
}

export interface CreateContactInput {
  company_id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
}

/** Map a user_info TeamMember into the bible's consultant shape. */
function toConsultant(member: TeamMember): DealWizardConsultant {
  return {
    id: member.id,
    first_name: member.first_name,
    last_name: member.last_name,
    company_role: member.company_role,
    // The bible filters consultants on `status === 'active'`; the port's
    // user_info exposes `account_status`.
    status: member.account_status === 'active' ? 'active' : (member.account_status ?? ''),
  };
}

export function useDealWizardData({
  trialId,
  clientId,
}: {
  trialId?: string | null;
  clientId?: string | null;
}): UseDealWizardDataResult {
  const { company, pipelineStages, serviceCategories, clientTypes, isLoading: t1Loading } =
    useTier1();
  const companyId = company?.id ?? null;

  // Raw company row carries the billing defaults the bible reads
  // (default_daily_minimum_hours, retainer_*). Tier1Company doesn't lift them,
  // so read them from the live company row defensively.
  const { company: rawCompany } = useCurrentCompany();
  const companyDefaults = useMemo<DealWizardCompanyDefaults>(() => {
    const raw = (rawCompany ?? {}) as Record<string, unknown>;
    const num = (v: unknown, fallback: number | null): number | null =>
      typeof v === 'number' && !Number.isNaN(v) ? v : fallback;
    return {
      default_daily_minimum_hours: num(raw.default_daily_minimum_hours, 8) ?? 8,
      retainer_divisor: num(raw.retainer_divisor, null),
      retainer_multiplier: num(raw.retainer_multiplier, null),
      retainer_minimum: num(raw.retainer_minimum, null),
    };
  }, [rawCompany]);

  const { services } = useServices();
  const { clients, isLoading: clientsLoading } = useClientsList();
  const { members, isLoading: teamLoading } = useTeam(companyId);

  const consultants = useMemo(() => members.map(toConsultant), [members]);

  // ── Attorneys (S03: local live query — was REST) ──
  // `attorney` is now synced into PGlite, so we read it reactively. A
  // wizard-side contact create (D04) lands in the local view and shows up in
  // the contact picker automatically — no manual reload needed. `reloadAttorneys`
  // is retained as a stable no-op so `createContact` keeps its signature.
  const { rows: attorneys, loading: attorneysLoading } = useTierAQuery<AttorneyRow>(
    'attorney',
    companyId,
  );
  const reloadAttorneys = useCallback(() => {}, []);

  // ── Client service overrides (REST — depends on the selected client) ──
  const [clientOverrides, setClientOverrides] = useState<ClientServiceOverrideRow[]>([]);
  useEffect(() => {
    if (!clientId) {
      setClientOverrides([]);
      return;
    }
    let cancelled = false;
    loadOverrides(clientId)
      .then((rows) => {
        if (!cancelled) setClientOverrides(rows);
      })
      .catch(() => {
        if (!cancelled) setClientOverrides([]);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  // ── Existing trial children (edit mode only) — live-query reads ──
  const { items: existingServices, isLoading: servicesLoading } = useTrialServices(trialId);
  const { items: existingContacts, isLoading: contactsLoading } = useTrialContacts(trialId);
  const { items: trialSegments, isLoading: segmentsLoading } = useTrialSegments(trialId);
  const editLoading = !!trialId && (servicesLoading || contactsLoading || segmentsLoading);

  const isLoading =
    t1Loading ||
    !companyId ||
    clientsLoading ||
    teamLoading ||
    attorneysLoading ||
    (!!trialId && editLoading);

  // `createClient` is a stable module-level store fn, so it can be passed
  // through directly (no useCallback / dependency dance needed).
  const createClientAction = createClient;

  const createContactAction = useCallback(
    async (input: CreateContactInput): Promise<string> => {
      const created = await createAttorney({
        company_id: input.company_id,
        client_id: input.client_id,
        first_name: input.first_name.trim(),
        last_name: input.last_name.trim(),
        email: input.email?.trim() || null,
        phone: input.phone ? input.phone.replace(/\D/g, '') || null : null,
        title: input.title?.trim() || null,
        // Wizard-created contacts are not auto-flagged as prospects; they
        // attach to a deal directly (the deal is the pipeline anchor).
      });
      reloadAttorneys();
      return created.id;
    },
    [reloadAttorneys],
  );

  return {
    companyId,
    companyDefaults,
    isLoading,
    services,
    clients,
    clientTypes,
    serviceCategories,
    pipelineStages,
    consultants,
    attorneys,
    clientOverrides,
    existingServices,
    existingContacts,
    trialSegments,
    createClient: createClientAction,
    reloadAttorneys,
    createContact: createContactAction,
  };
}
