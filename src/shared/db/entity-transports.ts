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
 *   `authoritative: true`  — Tier-A entities that also sync into PGlite via
 *                            Electric. The transport is used as the REST
 *                            fallback while offline-first wiring is pending.
 *   `authoritative: false` — Tier-C entities: server-only, REST-only.
 *                            These will never live in PGlite.
 *
 * staleTime: Tier-A entities use 5 s (kept fresh via Electric/realtime).
 *            Tier-C entities use the library default (30 s).
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
export function registerAllTransports(): void {
  // Tier-A — synced via Electric, authoritative local copies expected.
  reg('Company',                 'company',                    true,  5_000);
  reg('UserInfo',                'user_info',                  true,  5_000);
  reg('MetadataType',            'metadata_type',              true, 10_000);
  reg('EntityMetadata',          'entity_metadata',            true,  5_000);
  reg('Client',                  'client',                     true,  5_000);
  reg('ClientAddress',           'client_address',             true,  5_000);
  reg('ClientServiceOverride',   'client_service_override',    true,  5_000);
  reg('Trial',                   'trial',                      true,  5_000);
  reg('TrialService',            'trial_service',              true,  5_000);
  reg('TrialContact',            'trial_contact',              true,  5_000);
  reg('TrialSegment',            'trial_segment',              true,  5_000);
  reg('TrialServiceAssignment',  'trial_service_assignment',   true,  5_000);

  // Tier-C — server-only REST, no local PGlite copy.
  reg('Invoice',                 'invoice',                    false);
  reg('TimeEntry',               'time_entry',                 false);
  reg('SubcontractAssignment',   'subcontract_assignment',     false);
  reg('SubcontractRequest',      'subcontract_request',        false);
  reg('Lead',                    'lead',                       false);
  reg('SalesActivity',           'sales_activity',             false);
  reg('Attorney',                'attorney',                   false);
}
