import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@/app/app-shell';
import { UiSandbox } from '@/app/ui-sandbox';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { RoleGuard } from '@/app/role-guard';
import { ClientsListPage } from '@/features/clients/pages/ClientsListPage';
import { ClientDetailPage } from '@/features/clients/pages/ClientDetailPage';
import { ClientCreatePage } from '@/features/clients/pages/ClientCreatePage';
import { registerClientEntities } from '@/features/clients/entities';
import { TrialsListPage } from '@/features/trials/pages/TrialsListPage';
import { TrialDetailPage } from '@/features/trials/pages/TrialDetailPage';
import { TrialEditPage } from '@/features/trials/pages/TrialEditPage';
import { registerTrialsFeatureEntities } from '@/features/trials/stores/trials-store';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { MagicLinkSentPage } from '@/features/auth/pages/MagicLinkSentPage';
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage';
import { AcceptInvitePage } from '@/features/auth/pages/AcceptInvitePage';
import { OnboardingPage } from '@/features/auth/pages/OnboardingPage';
import { PendingApprovalPage } from '@/features/auth/pages/PendingApprovalPage';
import { AccountRejectedPage } from '@/features/auth/pages/AccountRejectedPage';
import { CompanySettingsPage } from '@/features/company/pages/CompanySettingsPage';
import { TeamPage } from '@/features/company/pages/TeamPage';
import { LandingPage } from '@/features/landing/pages/LandingPage';

// Register feature entity schemas at module load — idempotent.
registerClientEntities();
registerTrialsFeatureEntities();

const CLIENTS_ROLES = ['Owner', 'Admin', 'Sales'] as const;
const OWNER_ADMIN = ['Owner', 'Admin'] as const;
const OWNER_ONLY = ['Owner'] as const;
const SALES_ROLES = ['Owner', 'Admin', 'Sales'] as const;
const TRIALS_READ_ROLES = [
  'Owner',
  'Admin',
  'Sales',
  'Trial Consultant',
] as const;
const TRIALS_EDIT_ROLES = ['Owner', 'Admin', 'Sales'] as const;

/**
 * AppRouter — Changes 3 / 5 / 6 / 8 wire the AppShell, auth UI, Clients
 * and Dashboard feature routes. Trials lands in Change 7; manual in Change 17.
 *
 * `/ui-sandbox` and the auth routes render outside the shell. Inside the
 * shell, `<AuthGate>` redirects unauthenticated users to `/login` and
 * uncompanied users to `/onboarding` before any inner route renders. Role
 * gating uses the §0.9 matrix.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

function RoutePlaceholder({ name }: { name: string }) {
  return (
    <div style={{ padding: 'var(--theme-page-padding)' }}>
      <h1 style={{ fontSize: 'var(--theme-text-page-title)', margin: 0 }}>{name}</h1>
      <p style={{ marginTop: '0.5rem', color: 'var(--theme-stone-500)' }}>
        Placeholder — lands in a future change.
      </p>
    </div>
  );
}

function AuthGate() {
  const { isAuthenticated, companyId, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--theme-page-padding)' }}>
        <p style={{ color: 'var(--theme-stone-500)' }}>Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!companyId) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/*
          Public surface — outside <AppShell> and outside <AuthGate>.
          Bible: HotSeatersMVP/src/pages.config.js declares Landing as
          mainPage, so '/' and '/Landing' BOTH render the marketing page.
          The LandingPage itself does an auth-aware redirect for logged-in
          visitors (pending invite → /AcceptInvite; no company → /Onboarding;
          ready → /Dashboard). Unauthenticated visitors see the marketing
          page — they NEVER hit /login until they click a CTA.
        */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/Landing" element={<LandingPage />} />
        <Route path="/landing" element={<Navigate to="/Landing" replace />} />

        <Route path="/ui-sandbox" element={<UiSandbox />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/magic-link-sent" element={<MagicLinkSentPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route path="/AcceptInvite" element={<AcceptInvitePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/Onboarding" element={<OnboardingPage />} />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />
        <Route path="/account-rejected" element={<AccountRejectedPage />} />

        {/* Authenticated app shell — protected subtree */}
        <Route element={<AppShell />}>
          <Route element={<AuthGate />}>
            {/* index now redirects authenticated users to /Dashboard;
                unauthenticated users never reach this — they hit the
                top-level '/' → LandingPage above. AuthGate enforces this. */}
            <Route index element={<Navigate to="/Dashboard" replace />} />
            <Route path="Dashboard" element={<DashboardPage />} />

            {/* Clients (Change 6) */}
            <Route
              path="Clients"
              element={
                <RoleGuard roles={CLIENTS_ROLES}>
                  <ClientsListPage />
                </RoleGuard>
              }
            />
            <Route
              path="Clients/new"
              element={
                <RoleGuard roles={CLIENTS_ROLES}>
                  <ClientCreatePage />
                </RoleGuard>
              }
            />
            <Route
              path="Clients/:clientId"
              element={
                <RoleGuard roles={CLIENTS_ROLES}>
                  <ClientDetailPage />
                </RoleGuard>
              }
            />

            {/* Company settings + team (Change 5) */}
            <Route
              path="settings/company"
              element={
                <RoleGuard roles={OWNER_ADMIN}>
                  <CompanySettingsPage />
                </RoleGuard>
              }
            />
            <Route
              path="Settings"
              element={
                <RoleGuard roles={OWNER_ADMIN}>
                  <CompanySettingsPage />
                </RoleGuard>
              }
            />
            <Route
              path="settings/billing"
              element={
                <RoleGuard roles={OWNER_ONLY}>
                  <RoutePlaceholder name="Billing settings" />
                </RoleGuard>
              }
            />
            <Route path="Team" element={<TeamPage />} />

            {/* Owner + Admin role-gated placeholders */}
            <Route
              path="Approvals"
              element={
                <RoleGuard roles={OWNER_ADMIN}>
                  <RoutePlaceholder name="Approvals" />
                </RoleGuard>
              }
            />
            <Route
              path="Invoices"
              element={
                <RoleGuard roles={OWNER_ADMIN}>
                  <RoutePlaceholder name="Invoices" />
                </RoleGuard>
              }
            />
            <Route
              path="Collections"
              element={
                <RoleGuard roles={OWNER_ADMIN}>
                  <RoutePlaceholder name="Collections" />
                </RoleGuard>
              }
            />
            <Route
              path="Bills"
              element={
                <RoleGuard roles={OWNER_ADMIN}>
                  <RoutePlaceholder name="Bills" />
                </RoleGuard>
              }
            />

            {/* Sales-scoped placeholders */}
            <Route
              path="LeadRadar"
              element={
                <RoleGuard roles={SALES_ROLES}>
                  <RoutePlaceholder name="Lead Radar" />
                </RoleGuard>
              }
            />
            <Route
              path="DealTracker"
              element={
                <RoleGuard roles={SALES_ROLES}>
                  <RoutePlaceholder name="Deal Tracker" />
                </RoleGuard>
              }
            />

            {/* Trials (Change 7) */}
            <Route
              path="Trials"
              element={
                <RoleGuard roles={TRIALS_READ_ROLES}>
                  <TrialsListPage />
                </RoleGuard>
              }
            />
            <Route
              path="trials"
              element={
                <RoleGuard roles={TRIALS_READ_ROLES}>
                  <TrialsListPage />
                </RoleGuard>
              }
            />
            <Route
              path="trials/:trialId"
              element={
                <RoleGuard roles={TRIALS_READ_ROLES}>
                  <TrialDetailPage />
                </RoleGuard>
              }
            />
            <Route
              path="trials/:trialId/edit"
              element={
                <RoleGuard roles={TRIALS_EDIT_ROLES}>
                  <TrialEditPage />
                </RoleGuard>
              }
            />
            <Route path="Timeline" element={<RoutePlaceholder name="Trial Timeline" />} />
            <Route
              path="TimeAndExpenses"
              element={<RoutePlaceholder name="Time & Expenses" />}
            />
            <Route path="Projections" element={<RoutePlaceholder name="Projections" />} />

            <Route path=":page" element={<RoutePlaceholder name="(placeholder)" />} />
            <Route path="*" element={<RoutePlaceholder name="Not found" />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
