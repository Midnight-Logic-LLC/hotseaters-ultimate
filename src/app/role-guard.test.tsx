/**
 * RoleGuard unit test — confirms the role-based gate fires per the §0.9 matrix.
 *
 * The auth/user hooks are mocked so the test stays isolated from Supabase
 * and the entity graph.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RoleGuard } from './role-guard';

const mockUseAuth = vi.fn();
const mockUseCurrentRoles = vi.fn();

vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/features/auth/hooks/use-current-roles', () => ({
  useCurrentRoles: () => mockUseCurrentRoles(),
}));

describe('RoleGuard', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseCurrentRoles.mockReset();
  });

  function setAuth(over: Partial<ReturnType<typeof mockUseAuth>> = {}) {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      companyId: 'co-1',
      ...over,
    });
  }

  function setRoles(role: string | null, hasAny: (r: string[]) => boolean = () => role !== null) {
    mockUseCurrentRoles.mockReturnValue({
      role,
      isOwner: role === 'Owner',
      isAdmin: role === 'Admin',
      isSales: role === 'Sales',
      isTrialConsultant: role === 'Trial Consultant',
      isSystemAdmin: role === 'System Admin',
      hasAnyRole: hasAny,
      isLoading: false,
    });
  }

  function renderGuard(roles: Array<'Owner' | 'Admin' | 'Sales' | 'Trial Consultant' | 'System Admin'>) {
    return render(
      <MemoryRouter initialEntries={['/settings/billing']}>
        <Routes>
          <Route
            path="/settings/billing"
            element={
              <RoleGuard roles={roles}>
                <div>Billing content</div>
              </RoleGuard>
            }
          />
          <Route path="/login" element={<div>Login screen</div>} />
          <Route path="/onboarding" element={<div>Onboarding screen</div>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('renders children when the user has an allowed role', () => {
    setAuth();
    setRoles('Owner', (r) => r.includes('Owner'));
    renderGuard(['Owner', 'Admin']);
    expect(screen.getByText('Billing content')).toBeInTheDocument();
  });

  it('renders a "Not authorized" fallback for a disallowed role', () => {
    setAuth();
    setRoles('Sales', (r) => r.includes('Sales'));
    renderGuard(['Owner', 'Admin']);
    expect(screen.queryByText('Billing content')).not.toBeInTheDocument();
    expect(screen.getByText(/Not authorized/i)).toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', () => {
    setAuth({ isAuthenticated: false });
    setRoles(null, () => false);
    renderGuard(['Owner']);
    expect(screen.getByText('Login screen')).toBeInTheDocument();
  });

  it('redirects to /onboarding when authenticated without a company', () => {
    setAuth({ companyId: null });
    setRoles(null, () => false);
    renderGuard(['Owner']);
    expect(screen.getByText('Onboarding screen')).toBeInTheDocument();
  });

  it('shows a loading placeholder while auth state resolves', () => {
    setAuth({ isLoading: true });
    setRoles(null, () => false);
    renderGuard(['Owner']);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});
