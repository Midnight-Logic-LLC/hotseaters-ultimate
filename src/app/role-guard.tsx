/**
 * RoleGuard — declarative per-route role check.
 *
 * Usage:
 *   <RoleGuard roles={['Owner', 'Admin']}>
 *     <CompanySettingsPage />
 *   </RoleGuard>
 *
 * Roles follow the V2 schema (`user_info.company_role`): TitleCase strings
 * matching the §0.9 matrix — 'Owner' | 'Admin' | 'Sales' | 'Trial Consultant'
 * | 'System Admin'.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentRoles, type Role } from '@/features/auth/hooks/use-current-roles';
import { useAuth } from '@/features/auth/hooks/use-auth';

export type { Role };

export interface RoleGuardProps {
  roles: ReadonlyArray<Role>;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ roles, children, fallback }: RoleGuardProps) {
  const { isAuthenticated, isLoading, companyId } = useAuth();
  const { hasAnyRole, isLoading: roleLoading } = useCurrentRoles();

  if (isLoading || roleLoading) {
    return (
      <div style={{ padding: 'var(--theme-page-padding)' }}>
        <p style={{ color: 'var(--theme-stone-500)' }}>Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!companyId) return <Navigate to="/onboarding" replace />;
  if (!hasAnyRole(roles)) {
    return fallback ?? <NotAuthorized requiredRoles={roles} />;
  }
  return <>{children}</>;
}

function NotAuthorized({ requiredRoles }: { requiredRoles: ReadonlyArray<Role> }) {
  return (
    <div style={{ padding: 'var(--theme-page-padding)' }}>
      <h1
        style={{
          fontFamily: 'var(--theme-font-brand-title)',
          fontSize: 'var(--theme-text-page-title)',
          color: 'var(--theme-stone-900)',
          margin: 0,
        }}
      >
        Not authorized
      </h1>
      <p style={{ color: 'var(--theme-stone-600)', marginTop: '0.5rem' }}>
        This page requires one of: <strong>{requiredRoles.join(', ')}</strong>. Ask your firm
        owner to update your role if you need access.
      </p>
    </div>
  );
}
