import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  registerSettingsTab,
  clearSettingsTabRegistry,
} from '@/features/settings/registry/settings-tab-registry';
import { SettingsPage } from '../settings-page';

// ── Mock the PublishSeedDefaultsButton so this spec stays isolated from the
// company-store + supabase-client transitive imports. ──────────────────────
vi.mock(
  '@/features/company/components/publish-seed-defaults-button',
  () => ({
    PublishSeedDefaultsButton: () => null,
  }),
);

// ── Mock useTier1 ──────────────────────────────────────────────────────────
vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => ({
    userInfo: { id: 'u1', company_id: 'c1', company_role: 'owner' },
    company: { id: 'c1', has_hsh_addon: false },
    role: 'owner',
    user: { id: 'u1', email: 'test@example.com' },
    isLoading: false,
    isError: false,
    pipelineStages: [],
    serviceCategories: [],
    consultantTiers: [],
    clientTypes: [],
  }),
}));

// Stub icon
const StubIcon = (() => null) as unknown as LucideIcon;

function makeComponent(label: string): ComponentType {
  return function StubTab() {
    return <div data-testid={`tab-content-${label}`}>{label} content</div>;
  };
}

function renderPage(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/Settings${search}`]}>
      <SettingsPage />
    </MemoryRouter>,
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    clearSettingsTabRegistry();
  });

  afterEach(() => {
    clearSettingsTabRegistry();
  });

  it('renders header copy', () => {
    renderPage();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(
      screen.getByText('Configure services, rates, and preferences'),
    ).toBeInTheDocument();
  });

  it('renders empty state when no tabs registered', () => {
    renderPage();
    expect(
      screen.getByText('No settings tabs registered.'),
    ).toBeInTheDocument();
  });

  it('renders tab triggers for registered tabs', () => {
    registerSettingsTab({
      id: 'alpha',
      label: 'Alpha',
      icon: StubIcon,
      component: makeComponent('Alpha'),
      order: 10,
      featureSlug: 'alpha',
    });
    registerSettingsTab({
      id: 'beta',
      label: 'Beta',
      icon: StubIcon,
      component: makeComponent('Beta'),
      order: 20,
      featureSlug: 'beta',
    });

    renderPage();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows first tab content by default', () => {
    registerSettingsTab({
      id: 'first',
      label: 'First',
      icon: StubIcon,
      component: makeComponent('First'),
      order: 10,
      featureSlug: 'first',
    });
    registerSettingsTab({
      id: 'second',
      label: 'Second',
      icon: StubIcon,
      component: makeComponent('Second'),
      order: 20,
      featureSlug: 'second',
    });

    renderPage();
    expect(screen.getByTestId('tab-content-First')).toBeInTheDocument();
  });

  it('excludes canView=false tabs', () => {
    registerSettingsTab({
      id: 'visible',
      label: 'Visible',
      icon: StubIcon,
      component: makeComponent('Visible'),
      order: 10,
      featureSlug: 'visible',
      canView: () => true,
    });
    registerSettingsTab({
      id: 'hidden',
      label: 'Hidden',
      icon: StubIcon,
      component: makeComponent('Hidden'),
      order: 20,
      featureSlug: 'hidden',
      canView: () => false,
    });

    renderPage();
    expect(screen.getByText('Visible')).toBeInTheDocument();
    expect(screen.queryByText('Hidden')).toBeNull();
  });

  it('switches tab content on trigger click', () => {
    registerSettingsTab({
      id: 'tab-a',
      label: 'Tab A',
      icon: StubIcon,
      component: makeComponent('Tab A'),
      order: 10,
      featureSlug: 'a',
    });
    registerSettingsTab({
      id: 'tab-b',
      label: 'Tab B',
      icon: StubIcon,
      component: makeComponent('Tab B'),
      order: 20,
      featureSlug: 'b',
    });

    renderPage();
    act(() => {
      fireEvent.click(screen.getByText('Tab B'));
    });
    expect(screen.getByTestId('tab-content-Tab B')).toBeInTheDocument();
  });
});
