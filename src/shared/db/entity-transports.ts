/**
 * entity-transports.ts — process-global transport registry for 2.0.
 *
 * RULE 3: Only `shared/db` may import `@supabase/supabase-js` or touch the
 * Supabase client. This file is the ONE place that wires the entity-management
 * transport registry to the shared Supabase client.
 *
 * Call `registerAllTransports()` ONCE at app boot (from `app-providers.tsx`),
 * before any hook renders. The registry is idempotent — re-registering a type
 * replaces the prior transport (useful in tests).
 *
 * Transport tiers:
 *   `authoritative: true`  — Tier-A entities. Electric syncs them into PGlite;
 *                            `pglite-graph-bridge` watches the `*_synced` tables
 *                            and upserts rows into the entity graph in real time.
 *                            staleTime is intentionally large (24h): the bridge
 *                            keeps the graph fresh, so the REST fallback only fires
 *                            on the very first mount (before the bridge has run).
 *   `authoritative: false` — Tier-C entities: server-only, REST-only.
 *                            These will never live in PGlite; 30 s default.
 *
 * RULE 1: Self-hosted Supabase only. The supabase-client module already
 * refuses to construct a client pointing at `*.supabase.co`.
 */

import {
  registerEntityTransport,
  makeRestTransport,
  type SupabaseLike,
} from '@prometheus-ags/prometheus-entity-management';
import { supabase } from '@/shared/db/supabase-client';

// The library's `SupabaseLike` is a minimal structural type describing the
// subset of the supabase-js builder that `makeRestTransport` exercises. The
// real `SupabaseClient` satisfies it at runtime, but TypeScript can't prove
// structural compatibility here because `from()` on the real client returns
// `PostgrestQueryBuilder` (which only exposes filter methods AFTER `.select()`
// is called). The double-cast is safe — the library only calls `.select()`
// first, which then unlocks the filter chain.
const sb = supabase as unknown as SupabaseLike;

/** Shorthand to keep registrations terse. `identify` defaults to `row.id`. */
function reg<T extends object>(
  type: string,
  table: string,
  authoritative: boolean,
  staleTime?: number,
) {
  registerEntityTransport<T>(
    type,
    makeRestTransport<T>(
      staleTime !== undefined
        ? { supabase: sb, table, authoritative, staleTime }
        : { supabase: sb, table, authoritative },
    ),
  );
}

// ---------------------------------------------------------------------------
// Tier-A — synced into PGlite.  `authoritative: true`, short staleTime.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Tier-C — server-only REST.  `authoritative: false`, default staleTime.
// ---------------------------------------------------------------------------

/**
 * Register ALL entity transports at app boot.
 *
 * Call this ONCE from `app-providers.tsx` before any hook renders.
 * Re-registering a type replaces the prior transport without error (tests rely
 * on this; production code should only call it once).
 *
 * Order: Tier-A first (FK-dependency order), then Tier-C.
 */
// 24 hours in ms — Tier-A staleTime. The pglite-graph-bridge keeps the graph
// current via PGlite live queries, so the REST transport is only a fallback for
// the very first mount (before the bridge's live query has fired).
const TIER_A_STALE_TIME = 24 * 60 * 60 * 1_000;

export function registerAllTransports(): void {
  // Tier-A — synced via Electric + pglite-graph-bridge keeps graph current.
  // Long staleTime: bridge is the reactivity mechanism; REST is the fallback.
  reg('Company',                 'company',                    true,  TIER_A_STALE_TIME);
  reg('UserInfo',                'user_info',                  true,  TIER_A_STALE_TIME);
  reg('MetadataType',            'metadata_type',              true,  TIER_A_STALE_TIME);
  reg('EntityMetadata',          'entity_metadata',            true,  TIER_A_STALE_TIME);
  reg('Client',                  'client',                     true,  TIER_A_STALE_TIME);
  reg('ClientAddress',           'client_address',             true,  TIER_A_STALE_TIME);
  reg('ClientServiceOverride',   'client_service_override',    true,  TIER_A_STALE_TIME);
  reg('Trial',                   'trial',                      true,  TIER_A_STALE_TIME);
  reg('TrialService',            'trial_service',              true,  TIER_A_STALE_TIME);
  reg('TrialContact',            'trial_contact',              true,  TIER_A_STALE_TIME);
  reg('TrialSegment',            'trial_segment',              true,  TIER_A_STALE_TIME);
  reg('TrialServiceAssignment',  'trial_service_assignment',   true,  TIER_A_STALE_TIME);

  // Tier-C — server-only REST, no local PGlite copy.
  reg('Invoice',                 'invoice',                    false);
  reg('TimeEntry',               'time_entry',                 false);
  reg('SubcontractAssignment',   'subcontract_assignment',     false);
  reg('SubcontractRequest',      'subcontract_request',        false);
  reg('Lead',                    'lead',                       false);
  reg('SalesActivity',           'sales_activity',             false);
  reg('Attorney',                'attorney',                   false);
}
