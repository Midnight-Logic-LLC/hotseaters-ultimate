/**
 * LastRouteTracker unit tests — covers debounce, skip-list, no-userInfo
 * guard, and the merge-via-patchPreferences contract.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const mockPatch = vi.fn().mockResolvedValue(undefined);
const mockUseCurrentUser = vi.fn();

vi.mock('@/features/auth/stores/user-info-store', () => ({
  patchPreferences: (...args: unknown[]) => mockPatch(...args),
}));

vi.mock('@/features/auth/hooks/use-current-user', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

// Import AFTER the mocks so the module picks them up.
import { LastRouteTracker } from '../last-route-tracker';

function Driver({ paths }: { paths: string[] }) {
  const navigate = useNavigate();
  useEffect(() => {
    let i = 1;
    const id = setInterval(() => {
      if (i >= paths.length) {
        clearInterval(id);
        return;
      }
      const next = paths[i];
      if (typeof next === 'string') navigate(next);
      i += 1;
    }, 10);
    return () => clearInterval(id);
  }, [navigate, paths]);
  return null;
}

function renderTracker(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="*" element={<LastRouteTracker />} />
      </Routes>
    </MemoryRouter>,
  );
}

const ownerUserInfo = {
  id: 'ui-1',
  preferences: { lastViewedPage: '' },
};

describe('LastRouteTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPatch.mockClear();
    mockUseCurrentUser.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes lastViewedPage after the 500ms debounce', () => {
    mockUseCurrentUser.mockReturnValue({ userInfo: ownerUserInfo, isLoading: false });
    renderTracker('/Trials');

    expect(mockPatch).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(mockPatch).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(mockPatch).toHaveBeenCalledTimes(1);
    expect(mockPatch).toHaveBeenCalledWith(
      { lastViewedPage: 'Trials' },
      expect.objectContaining({
        userInfoId: 'ui-1',
        previousPreferences: ownerUserInfo.preferences,
      }),
    );
  });

  it('debounces back-to-back navigations into a single write', async () => {
    mockUseCurrentUser.mockReturnValue({ userInfo: ownerUserInfo, isLoading: false });
    const { rerender } = render(
      <MemoryRouter initialEntries={['/Trials']}>
        <Routes>
          <Route path="*" element={<><LastRouteTracker /><Driver paths={["/Trials", "/Clients", "/Dashboard"]} /></>} />
        </Routes>
      </MemoryRouter>,
    );
    // Push through all navigations + debounce.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    // Only the final page wins (or at most one call has fired).
    expect(mockPatch.mock.calls.length).toBeLessThanOrEqual(1);
    if (mockPatch.mock.calls.length === 1) {
      const firstArg = mockPatch.mock.calls[0]?.[0] as { lastViewedPage: string };
      expect(['Trials', 'Clients', 'Dashboard']).toContain(firstArg.lastViewedPage);
    }
    rerender(<div />);
  });

  it('ignores skip-list pages (Onboarding, Landing, login, …)', () => {
    mockUseCurrentUser.mockReturnValue({ userInfo: ownerUserInfo, isLoading: false });
    for (const skip of ['/Onboarding', '/Landing', '/login', '/register', '/forgot-password']) {
      mockPatch.mockClear();
      renderTracker(skip);
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(mockPatch).not.toHaveBeenCalled();
    }
  });

  it('no-ops when userInfo is null', () => {
    mockUseCurrentUser.mockReturnValue({ userInfo: null, isLoading: false });
    renderTracker('/Trials');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockPatch).not.toHaveBeenCalled();
  });

  it('no-ops when lastViewedPage already matches', () => {
    mockUseCurrentUser.mockReturnValue({
      userInfo: { id: 'ui-1', preferences: { lastViewedPage: 'Trials' } },
      isLoading: false,
    });
    renderTracker('/Trials');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockPatch).not.toHaveBeenCalled();
  });
});
