import { describe, it, expect, beforeEach } from 'vitest';
import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  registerSettingsTab,
  getRegisteredSettingsTabs,
  clearSettingsTabRegistry,
  type SettingsAuthContext,
  type SettingsTabDefinition,
} from '../settings-tab-registry';

// Minimal stub icon that satisfies the LucideIcon type.
const StubIcon = (() => null) as unknown as LucideIcon;
const StubComponent = (() => null) as ComponentType;

function makeTab(
  overrides: Partial<SettingsTabDefinition>,
): SettingsTabDefinition {
  return {
    id: 'test-tab',
    label: 'Test',
    icon: StubIcon,
    component: StubComponent,
    order: 10,
    featureSlug: 'test',
    ...overrides,
  };
}

const baseCtx: SettingsAuthContext = {
  userRole: 'owner',
  companyRole: 'owner',
  hasHshAddon: false,
};

describe('settings-tab-registry', () => {
  beforeEach(() => {
    clearSettingsTabRegistry();
  });

  it('returns empty array when nothing is registered', () => {
    expect(getRegisteredSettingsTabs(baseCtx)).toEqual([]);
  });

  it('returns a registered tab', () => {
    const tab = makeTab({ id: 'company', label: 'Company' });
    registerSettingsTab(tab);
    const result = getRegisteredSettingsTabs(baseCtx);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('company');
  });

  it('sorts tabs ascending by order', () => {
    registerSettingsTab(makeTab({ id: 'second', order: 20 }));
    registerSettingsTab(makeTab({ id: 'first', order: 10 }));
    const result = getRegisteredSettingsTabs(baseCtx);
    expect(result[0]?.id).toBe('first');
    expect(result[1]?.id).toBe('second');
  });

  it('includes tab when canView returns true', () => {
    registerSettingsTab(
      makeTab({ id: 'gated', canView: () => true }),
    );
    const result = getRegisteredSettingsTabs(baseCtx);
    expect(result).toHaveLength(1);
  });

  it('excludes tab when canView returns false', () => {
    registerSettingsTab(
      makeTab({ id: 'hidden', canView: () => false }),
    );
    const result = getRegisteredSettingsTabs(baseCtx);
    expect(result).toHaveLength(0);
  });

  it('includes tab when canView is omitted', () => {
    // Use spread without canView key to avoid exactOptionalPropertyTypes violation.
    const tab = makeTab({ id: 'open' });
    delete (tab as Partial<typeof tab>).canView;
    registerSettingsTab(tab);
    const result = getRegisteredSettingsTabs(baseCtx);
    expect(result).toHaveLength(1);
  });

  it('passes auth context to canView predicate', () => {
    const received: SettingsAuthContext[] = [];
    registerSettingsTab(
      makeTab({
        id: 'ctx-test',
        canView: (ctx) => {
          received.push(ctx);
          return true;
        },
      }),
    );
    const ctx: SettingsAuthContext = {
      userRole: 'admin',
      companyRole: 'admin',
      hasHshAddon: true,
    };
    getRegisteredSettingsTabs(ctx);
    expect(received[0]).toEqual(ctx);
  });

  it('last registration wins for duplicate id', () => {
    registerSettingsTab(makeTab({ id: 'dup', label: 'First' }));
    registerSettingsTab(makeTab({ id: 'dup', label: 'Second' }));
    const result = getRegisteredSettingsTabs(baseCtx);
    expect(result).toHaveLength(1);
    expect(result[0]?.label).toBe('Second');
  });

  it('clearSettingsTabRegistry empties the registry', () => {
    registerSettingsTab(makeTab({ id: 'a' }));
    clearSettingsTabRegistry();
    expect(getRegisteredSettingsTabs(baseCtx)).toHaveLength(0);
  });
});
