import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Type-only import to avoid loading the Supabase client at test time. The
// component itself reaches the store via the mocked `useTemplates` hook.
import type { DocumentTemplateRow } from '@/features/company/stores/templates-store';

// The component module also re-exports TEMPLATE_TYPES from templates-store at
// runtime (for the <select>). Stub the store module before importing the SUT.
vi.mock('@/features/company/stores/templates-store', () => ({
  TEMPLATE_TYPES: [
    { value: 'document', label: 'Document' },
    { value: 'billing', label: 'Billing' },
    { value: 'email', label: 'Email' },
  ],
}));

// ── Mocks ──────────────────────────────────────────────────────────────────
const createMock = vi.fn().mockResolvedValue({
  id: 'tpl-new',
  name: 'New Template',
  template_type: 'document',
  category_id: null,
  company_id: 'c1',
  is_active: true,
  has_signature_fields: false,
  is_contract: false,
  created_at: '2026-05-26T00:00:00.000Z',
  updated_at: '2026-05-26T00:00:00.000Z',
} satisfies DocumentTemplateRow);
const removeMock = vi.fn().mockResolvedValue(undefined);
const refetchMock = vi.fn();

interface TemplatesMockShape {
  templates: DocumentTemplateRow[];
  isLoading: boolean;
  total: number | null;
  refetch: () => void;
  create: typeof createMock;
  remove: typeof removeMock;
  mutating: boolean;
  error: string | null;
}

const templatesMock: { value: TemplatesMockShape } = {
  value: {
    templates: [],
    isLoading: false,
    total: 0,
    refetch: refetchMock,
    create: createMock,
    remove: removeMock,
    mutating: false,
    error: null,
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
  } as unknown as ReturnType<typeof import('@/app/tier1-provider').useTier1>,
};

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => tier1Mock.value,
}));

vi.mock('@/features/company/hooks/use-templates', () => ({
  useTemplates: () => templatesMock.value,
}));

import { TemplatesSettingsTab } from '../templates-settings-tab';

function buildTemplate(overrides: Partial<DocumentTemplateRow> = {}): DocumentTemplateRow {
  return {
    id: 'tpl-1',
    name: 'Engagement Letter',
    template_type: 'document',
    category_id: null,
    company_id: 'c1',
    is_active: true,
    has_signature_fields: false,
    is_contract: false,
    created_at: '2026-05-01T12:00:00.000Z',
    updated_at: '2026-05-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('TemplatesSettingsTab', () => {
  beforeEach(() => {
    createMock.mockClear();
    removeMock.mockClear();
    refetchMock.mockClear();
    templatesMock.value = {
      templates: [],
      isLoading: false,
      total: 0,
      refetch: refetchMock,
      create: createMock,
      remove: removeMock,
      mutating: false,
      error: null,
    };
  });

  it('renders the empty state when there are no templates', () => {
    render(<TemplatesSettingsTab />);
    expect(
      screen.getByText('No templates yet. Create your first template.'),
    ).toBeInTheDocument();
  });

  it('renders the template list when templates exist', () => {
    templatesMock.value = {
      ...templatesMock.value,
      templates: [
        buildTemplate({ id: 't1', name: 'Engagement Letter', template_type: 'document' }),
        buildTemplate({ id: 't2', name: 'Standard Invoice', template_type: 'billing' }),
      ],
    };
    render(<TemplatesSettingsTab />);
    expect(screen.getByText('Engagement Letter')).toBeInTheDocument();
    expect(screen.getByText('Standard Invoice')).toBeInTheDocument();
    // Empty-state copy must NOT be present.
    expect(
      screen.queryByText('No templates yet. Create your first template.'),
    ).toBeNull();
  });

  it('shows the create form when the header New Template button is clicked', () => {
    templatesMock.value = {
      ...templatesMock.value,
      templates: [buildTemplate()],
    };
    render(<TemplatesSettingsTab />);
    // Header create button (next to title)
    const newBtns = screen.getAllByRole('button', { name: /new template/i });
    fireEvent.click(newBtns[0]!);
    expect(screen.getByLabelText('Template Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
  });

  it('calls create() with the typed name and selected type on submit', async () => {
    render(<TemplatesSettingsTab />);
    // Empty state renders one "New Template" CTA, header renders another —
    // either works to open the form.
    const newBtns = screen.getAllByRole('button', { name: /new template/i });
    fireEvent.click(newBtns[0]!);

    const nameInput = screen.getByLabelText('Template Name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Master Services Agreement' } });

    const typeSelect = screen.getByLabelText('Type') as HTMLSelectElement;
    fireEvent.change(typeSelect, { target: { value: 'billing' } });

    fireEvent.click(screen.getByRole('button', { name: /create template/i }));

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith({
      name: 'Master Services Agreement',
      template_type: 'billing',
    });
  });

  it('opens the edit-deferred placeholder when Edit is clicked', () => {
    templatesMock.value = {
      ...templatesMock.value,
      templates: [buildTemplate({ id: 't1', name: 'Engagement Letter' })],
    };
    render(<TemplatesSettingsTab />);
    fireEvent.click(
      screen.getByRole('button', { name: /edit engagement letter/i }),
    );
    expect(
      screen.getByText(/coming soon — full editor in a future update\./i),
    ).toBeInTheDocument();
  });

  it('calls remove() after confirming the delete dialog', async () => {
    templatesMock.value = {
      ...templatesMock.value,
      templates: [buildTemplate({ id: 't1', name: 'Engagement Letter' })],
    };
    render(<TemplatesSettingsTab />);
    fireEvent.click(
      screen.getByRole('button', { name: /delete engagement letter/i }),
    );
    // Confirm in the AlertDialog
    const confirm = await screen.findByRole('button', { name: /^delete$/i });
    fireEvent.click(confirm);
    expect(removeMock).toHaveBeenCalledTimes(1);
    expect(removeMock).toHaveBeenCalledWith('t1');
  });
});
