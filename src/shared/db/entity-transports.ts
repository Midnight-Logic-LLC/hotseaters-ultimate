/**
 * entity-transports.ts — process-global transport registry for entity-management 2.0.
 *
 * RULE 3: Only `shared/db` may import `@supabase/supabase-js` or touch the
 * Supabase client. This file is the ONE place that wires the entity-management
 * transport registry to the shared Supabase client.
 *
 * Call `registerAllTransports()` ONCE at app boot (from `app-providers.tsx`),
 * before any hook renders. The registry is idempotent — re-registering a type
 * replaces the prior transport (useful in tests).
 *
 * Pattern 4 architecture:
 *   Tier-A entities (company, user_info, client, trial, metadata_type, etc.)
 *   are now read via `useLiveQuery` directly from PGlite — they no longer need
 *   a REST transport registration. Only Tier-C (server-only) entities are
 *   registered here.
 *
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

/**
 * Register ALL entity transports at app boot.
 *
 * Call this ONCE from `app-providers.tsx` before any hook renders.
 * Re-registering a type replaces the prior transport without error (tests rely
 * on this; production code should only call it once).
 *
 * Tier-A entities are NOT registered here — they are read directly from PGlite
 * via `useLiveQuery` (Pattern 4). Only Tier-C (server-only REST) entities need
 * a transport registration.
 */
export function registerAllTransports(): void {
  // Tier-C — server-only REST, no local PGlite copy.
  reg('Invoice',                 'invoice',                    false);
  reg('TimeEntry',               'time_entry',                 false);
  reg('SubcontractAssignment',   'subcontract_assignment',     false);
  reg('SubcontractRequest',      'subcontract_request',        false);
  reg('Lead',                    'lead',                       false);
  reg('SalesActivity',           'sales_activity',             false);
  reg('Attorney',                'attorney',                   false);
}
