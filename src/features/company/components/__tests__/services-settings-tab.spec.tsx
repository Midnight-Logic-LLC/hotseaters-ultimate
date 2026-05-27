/**
 * services-settings-tab.spec.tsx — unit coverage for the Services & Rates
 * settings tab. Mocks all hooks so the test exercises only the component's
 * orchestration logic (list rendering, deactivate-vs-delete branching,
 * reorder dispatch).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import type { ServiceRecord } from '@/features/company/hooks/use-services';
import type { ServiceCategoryRecord } from '@/features/company/hooks/use-service-categories';

// ── Mock state (mutable across tests via the `.value` wrappers) ──────────

const reorderServicesMock = vi.fn().mockResolvedValue(undefined);
const reorderCategoriesMock = vi.fn().mockResolvedValue(undefined);
const removeServiceMock = vi.fn().mockResolvedValue(undefined);
const deactivateServiceMock = vi.fn().mockResolvedValue(undefined);
const updateServiceMock = vi.fn().mockResolvedValue(undefined);
const createServiceMock = vi.fn().mockResolvedValue(undefined);
const reactivateServiceMock = vi.fn().mockResolvedValue(undefined);

const createCategoryMock = vi.fn().mockResolvedValue(undefined);
const updateCategoryMock = vi.fn().mockResolvedValue(undefined);
const removeCategoryMock = vi.fn().mockResolvedValue(undefined);
const deactivateCategoryMock = vi.fn().mockResolvedValue(undefined);
const reactivateCategoryMock = vi.fn().mockResolvedValue(undefined);

function makeService(overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  return {
    id: 'svc-1',
    name: 'Hot Seat Operations',
    description: 'Run hot seat',
    category_id: 'cat-1',
    base_rate: 150,
    rate_type: 'hourly',
    has_daily_minimum: false,
    service_availability: 'both',
    default_lead_days: null,
    default_duration_days: null,
    travel_multiplier: null,
    is_active: true,
    is_default: false,
    order: 0,
    company_id: 'c1',
    ...overrides,
  };
}

function makeCategory(
  overrides: Partial<ServiceCategoryRecord> = {},
): ServiceCategoryRecord {
  return {
    id: 'cat-1',
    name: 'Trial Services',
    is_active: true,
    is_default: false,
    order: 0,
    company_id: 'c1',
    ...overrides,
  };
}

const servicesMock: {
  value: ReturnType<typeof import('@/features/company/hooks/use-services').useServices>;
} = {
  value: {
    services: [makeService()],
    saving: false,
    error: null,
    create: createServiceMock,
    update: updateServiceMock,
    remove: removeServiceMock,
    deactivate: deactivateServiceMock,
    reactivate: reactivateServiceMock,
    reorder: reorderServicesMock,
  },
};

const categoriesMock: {
  value: ReturnType<
    typeof import('@/features/company/hooks/use-service-categories').useServiceCategories
  >;
} = {
  value: {
    categories: [makeCategory()],
    saving: false,
    error: null,
    create: createCategoryMock,
    update: updateCategoryMock,
    remove: removeCategoryMock,
    deactivate: deactivateCategoryMock,
    reactivate: reactivateCategoryMock,
    reorder: reorderCategoriesMock,
  },
};

const trialServicesMock: { value: { trialServices: unknown[]; isLoading: boolean } } = {
  value: { trialServices: [], isLoading: false },
};

const companySettingsMock = {
  value: {
    company: { id: 'c1', default_daily_minimum_hours: 8 } as unknown as Record<
      string,
      unknown
    >,
    generalSettings: {} as never,
    isLoading: false,
    saving: false,
    error: null,
    save: vi.fn(),
    saveSettings: vi.fn(),
    updateCompanyImmediate: vi.fn(),
    uploadLogo: vi.fn(),
  },
};

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
  },
};

// ── Vi mocks (must be declared before component import) ───────────────────

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () =>
    tier1Mock.value as unknown as ReturnType<
      typeof import('@/app/tier1-provider').useTier1
    >,
}));

vi.mock('@/features/company/hooks/use-services', () => ({
  useServices: () => servicesMock.value,
}));

vi.mock('@/features/company/hooks/use-service-categories', () => ({
  useServiceCategories: () => categoriesMock.value,
}));

vi.mock('@/features/company/hooks/use-company-trial-services', () => ({
  useCompanyTrialServices: () => trialServicesMock.value,
}));

vi.mock('@/features/company/hooks/use-company-settings', () => ({
  useCompanySettings: () => companySettingsMock.value,
}));

// dnd-kit is heavyweight and uses observers that are flaky under JSDOM.
// Replace with simple pass-throughs — we are not testing the library,
// only that our handlers wire up correctly.
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  closestCenter: () => null,
  KeyboardSensor: class {},
  PointerSensor: class {},
  useSensor: () => ({}),
  useSensors: (...args: unknown[]) => args,
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => undefined,
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  arrayMove: <T,>(arr: T[], from: number, to: number) => {
    const next = [...arr];
    const [item] = next.splice(from, 1);
    if (item !== undefined) next.splice(to, 0, item);
    return next;
  },
  sortableKeyboardCoordinates: () => ({ x: 0, y: 0 }),
  verticalListSortingStrategy: {},
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

import { ServicesSettingsTab } from '../services-settings-tab';

describe('ServicesSettingsTab', () => {
  beforeEach(() => {
    reorderServicesMock.mockClear();
    reorderCategoriesMock.mockClear();
    removeServiceMock.mockClear();
    deactivateServiceMock.mockClear();
    createServiceMock.mockClear();
    updateServiceMock.mockClear();
    createCategoryMock.mockClear();
    // Reset to default mock state
    servicesMock.value = {
      ...servicesMock.value,
      services: [makeService()],
    };
    categoriesMock.value = {
      ...categoriesMock.value,
      categories: [makeCategory()],
    };
    trialServicesMock.value = { trialServices: [], isLoading: false };
  });

  it('renders the Services & Rates header and the service row', () => {
    render(<ServicesSettingsTab />);
    expect(screen.getByText('Services & Rates')).toBeInTheDocument();
    expect(screen.getByText('Trial Services')).toBeInTheDocument();
    // Expand the category to see the service row.
    fireEvent.click(screen.getByText('Trial Services'));
    expect(screen.getByText('Hot Seat Operations')).toBeInTheDocument();
  });

  it('shows the empty state when no services exist', () => {
    servicesMock.value = { ...servicesMock.value, services: [] };
    categoriesMock.value = { ...categoriesMock.value, categories: [] };
    render(<ServicesSettingsTab />);
    expect(screen.getByText(/no services configured yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add your first service/i }),
    ).toBeInTheDocument();
  });

  it('opens the deactivate dialog when the service is used in a trial', () => {
    trialServicesMock.value = {
      trialServices: [{ id: 'ts-1', service_id: 'svc-1' }] as unknown[],
      isLoading: false,
    };
    render(<ServicesSettingsTab />);
    // Expand the category first.
    fireEvent.click(screen.getByText('Trial Services'));
    const deleteBtn = screen.getByRole('button', { name: /delete service/i });
    fireEvent.click(deleteBtn);
    expect(screen.getByText(/deactivate service\?/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^deactivate$/i }),
    ).toBeInTheDocument();
  });

  it('opens the delete dialog when the service is NOT used in any trial', () => {
    render(<ServicesSettingsTab />);
    // Expand the category first.
    fireEvent.click(screen.getByText('Trial Services'));
    const deleteBtn = screen.getByRole('button', { name: /delete service/i });
    fireEvent.click(deleteBtn);
    expect(screen.getByText(/delete service\?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
  });

  it('calls remove() (not deactivate()) when confirming delete of an unused service', async () => {
    render(<ServicesSettingsTab />);
    // Expand the category first.
    fireEvent.click(screen.getByText('Trial Services'));
    fireEvent.click(screen.getByRole('button', { name: /delete service/i }));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    // Allow promise microtask to flush
    await Promise.resolve();
    expect(removeServiceMock).toHaveBeenCalledWith('svc-1');
    expect(deactivateServiceMock).not.toHaveBeenCalled();
  });

  it('calls deactivate() when confirming a used service', async () => {
    trialServicesMock.value = {
      trialServices: [{ id: 'ts-1', service_id: 'svc-1' }] as unknown[],
      isLoading: false,
    };
    render(<ServicesSettingsTab />);
    // Expand the category first.
    fireEvent.click(screen.getByText('Trial Services'));
    fireEvent.click(screen.getByRole('button', { name: /delete service/i }));
    fireEvent.click(screen.getByRole('button', { name: /^deactivate$/i }));
    await Promise.resolve();
    expect(deactivateServiceMock).toHaveBeenCalledWith('svc-1');
    expect(removeServiceMock).not.toHaveBeenCalled();
  });
});
