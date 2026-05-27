/**
 * Settings tab registry — plugin-ready, static module-level Map.
 *
 * Features register their settings tabs at boot time by calling
 * `registerSettingsTab`. The SettingsPage shell calls
 * `getRegisteredSettingsTabs` on render to receive the filtered, sorted list.
 *
 * Third-party integrations call `registerSettingsTab` during their init phase
 * — the shell requires no changes.
 *
 * RULE B: no store imports here; this is a pure data registry.
 */

import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

/** Auth context passed to `canView` predicates for role-gating. */
export interface SettingsAuthContext {
  /** Legacy role string from `useTier1().role` (e.g. 'owner', 'admin', 'trial_consultant'). */
  userRole: string | null;
  /** `company_role` from the user_info row. */
  companyRole: string | null;
  /** Whether the company has the HotSeatHub add-on. */
  hasHshAddon: boolean;
}

/** A single registered settings tab. */
export interface SettingsTabDefinition {
  /** Unique tab identifier (matches `?tab=<id>` URL param). */
  id: string;
  /** Human-readable label shown in the TabsTrigger. */
  label: string;
  /** Lucide icon component rendered next to the label. */
  icon: LucideIcon;
  /** Lazy-loadable React component that renders the tab content. */
  component: ComponentType;
  /**
   * Optional gate: when provided, tab is only visible if this returns `true`.
   * When omitted, the tab is always visible.
   */
  canView?: (ctx: SettingsAuthContext) => boolean;
  /**
   * Sort order. Lower values appear first.
   * Use multiples of 10 (10, 20, 30…) to leave room for insertions.
   */
  order: number;
  /** Feature slug for traceability (e.g. 'company', 'billing', 'services'). */
  featureSlug: string;
}

/** Module-level registry — populated at boot, read on render. */
const registry = new Map<string, SettingsTabDefinition>();

/**
 * Register a settings tab.
 * Duplicate `id` registrations overwrite the previous entry
 * (last-writer-wins — callers should use unique IDs).
 */
export function registerSettingsTab(def: SettingsTabDefinition): void {
  registry.set(def.id, def);
}

/**
 * Return all registered tabs visible to the given auth context,
 * sorted ascending by `order`.
 */
export function getRegisteredSettingsTabs(
  ctx: SettingsAuthContext,
): SettingsTabDefinition[] {
  return Array.from(registry.values())
    .filter((tab) => (tab.canView ? tab.canView(ctx) : true))
    .sort((a, b) => a.order - b.order);
}

/**
 * Clear the registry.
 * FOR TEST USE ONLY — never call in production code.
 */
export function clearSettingsTabRegistry(): void {
  registry.clear();
}
