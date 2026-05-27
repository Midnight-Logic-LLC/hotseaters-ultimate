/**
 * theme-settings-tab.spec.tsx — unit tests for the admin theme editor.
 *
 * Mocks `useCompanySettings`, `useTier1`, and the `applyThemeVars` helper
 * so tests assert on observable behaviour without hitting the DOM theme
 * resolver or the company store.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const saveSettingsMock = vi.fn().mockResolvedValue(undefined);
const applyThemeVarsMock = vi.fn();

const tier1Mock = {
  value: {
    user: { id: 'u1', email: 'admin@example.com' },
    userInfo: { id: 'ui1', company_id: 'c1', company_role: 'admin' as const },
    company: { id: 'c1', name: 'Acme' },
    role: 'admin' as const,
    isLoading: false,
    isError: false,
    pipelineStages: [],
    serviceCategories: [],
    consultantTiers: [],
    clientTypes: [],
  } as unknown as ReturnType<typeof import('@/app/tier1-provider').useTier1>,
};

const companySettingsMock = {
  value: {
    company: {
      id: 'c1',
      name: 'Acme',
      theme: null,
    } as unknown as Record<string, unknown>,
    generalSettings: {} as unknown,
    isLoading: false,
    saving: false,
    error: null,
    save: vi.fn(),
    saveSettings: saveSettingsMock,
    updateCompanyImmediate: vi.fn(),
    uploadLogo: vi.fn(),
  },
};

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => tier1Mock.value,
}));

vi.mock('@/features/company/hooks/use-company-settings', () => ({
  useCompanySettings: () => companySettingsMock.value,
}));

vi.mock('@/shared/lib/theme', async () => {
  const actual = await vi.importActual<typeof import('@/shared/lib/theme')>(
    '@/shared/lib/theme',
  );
  return {
    ...actual,
    applyThemeVars: (...args: unknown[]) => applyThemeVarsMock(...args),
  };
});

import { ThemeSettingsTab } from '../theme-settings-tab';
import { THEME_TOKENS } from '@/shared/lib/theme-tokens';

describe('ThemeSettingsTab', () => {
  beforeEach(() => {
    saveSettingsMock.mockClear();
    applyThemeVarsMock.mockClear();
    // Clear any inline vars left by previous tests.
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('style');
    }
  });

  it('renders a control for every catalog token', () => {
    render(<ThemeSettingsTab />);
    for (const token of THEME_TOKENS) {
      // Text input for every token uses the token key as its id; ensure
      // at least one labelled control with the token's label is present.
      expect(
        screen.getAllByText(token.label).length,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it('changing a color input writes the CSS variable immediately', () => {
    render(<ThemeSettingsTab />);
    const brandColorPicker = screen.getByLabelText(
      /Brand Primary color picker/i,
    ) as HTMLInputElement;
    fireEvent.change(brandColorPicker, { target: { value: '#ff00aa' } });
    expect(
      document.documentElement.style.getPropertyValue('--theme-brand-primary'),
    ).toBe('#ff00aa');
  });

  it('Save Theme button calls saveSettings with a tokens object', async () => {
    render(<ThemeSettingsTab />);
    const saveBtn = screen.getByRole('button', { name: /save theme/i });
    fireEvent.click(saveBtn);
    expect(saveSettingsMock).toHaveBeenCalledTimes(1);
    const arg = saveSettingsMock.mock.calls[0]?.[0] as {
      theme?: { tokens?: Record<string, string> };
    };
    expect(arg.theme).toBeDefined();
    expect(arg.theme?.tokens).toBeDefined();
    // The persisted tokens cover every entry in the catalog.
    const tokens = arg.theme?.tokens ?? {};
    expect(Object.keys(tokens).length).toBeGreaterThanOrEqual(
      THEME_TOKENS.length,
    );
  });

  it('Reset to Defaults calls applyThemeVars and persists defaults', async () => {
    render(<ThemeSettingsTab />);
    const resetBtn = screen.getByRole('button', {
      name: /reset to defaults/i,
    });
    fireEvent.click(resetBtn);
    expect(applyThemeVarsMock).toHaveBeenCalledTimes(1);
    // Save is also invoked as part of reset to persist the defaults.
    expect(saveSettingsMock).toHaveBeenCalledTimes(1);
    const arg = saveSettingsMock.mock.calls[0]?.[0] as {
      theme?: { tokens?: Record<string, string> };
    };
    const tokens = arg.theme?.tokens ?? {};
    // Default values for known tokens should match the catalog.
    const brand = THEME_TOKENS.find((t) => t.key === 'theme-brand-primary');
    expect(tokens['theme-brand-primary']).toBe(brand?.default);
  });
});
