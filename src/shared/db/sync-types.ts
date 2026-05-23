/**
 * sync-types.ts — compile-time strongly-typed sync surface.
 *
 * Derives the `EntityName` union from `SYNC_CONFIG` so the rest of the
 * codebase cannot reference a table that isn't in the allowlist. Also defines
 * the tenant claim shape and the sync-gate state machine surface.
 */

import type { SyncEntityConfig } from './sync-config';
import { SYNC_CONFIG } from './sync-config';

type Names<T extends readonly { name: string }[]> = T[number]['name'];

/** Union of every Tier-A entity name registered in `SYNC_CONFIG`. */
export type EntityName = Names<typeof SYNC_CONFIG>;

/** Auth claim required to register tenant-scoped shapes. */
export interface TenantClaim {
  companyId: string;
}

/** The runtime sync-gate state machine surface. */
export type SyncGatePhase =
  | 'idle'
  | 'hydrating'
  | 'syncing'
  | 'ready'
  | 'error';

export interface SyncGateState {
  phase: SyncGatePhase;
  message?: string;
  error?: string;
  didMigrate?: boolean;
  isFirstLogin?: boolean;
}

/** Look up a SyncEntityConfig by name. Throws on unknown name. */
export function getSyncConfig(name: EntityName): SyncEntityConfig {
  const entry = SYNC_CONFIG.find((c) => c.name === name);
  if (!entry) {
    throw new Error(`sync-types: no SYNC_CONFIG entry for "${name}"`);
  }
  return entry;
}
