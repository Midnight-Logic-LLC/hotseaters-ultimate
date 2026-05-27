import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ──────────────────────────────────────────────────────────────────

const hookMock: {
  value: {
    isSuperadmin: boolean;
    state: 'idle' | 'publishing' | 'success' | 'error';
    result: { success: boolean; version?: number } | null;
    error: string | null;
    publish: ReturnType<typeof vi.fn>;
    reset: ReturnType<typeof vi.fn>;
  };
} = {
  value: {
    isSuperadmin: false,
    state: 'idle',
    result: null,
    error: null,
    publish: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn(),
  },
};

vi.mock('@/features/company/hooks/use-publish-seed-defaults', () => ({
  usePublishSeedDefaults: () => hookMock.value,
}));

import { PublishSeedDefaultsButton } from '../publish-seed-defaults-button';

describe('PublishSeedDefaultsButton', () => {
  beforeEach(() => {
    hookMock.value = {
      isSuperadmin: false,
      state: 'idle',
      result: null,
      error: null,
      publish: vi.fn().mockResolvedValue(undefined),
      reset: vi.fn(),
    };
  });

  it('renders nothing when the current user is not the seed superadmin', () => {
    const { container } = render(<PublishSeedDefaultsButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the trigger button when the user is the seed superadmin', () => {
    hookMock.value = { ...hookMock.value, isSuperadmin: true };
    render(<PublishSeedDefaultsButton />);
    expect(
      screen.getByRole('button', { name: /publish seed defaults/i }),
    ).toBeInTheDocument();
  });
});
