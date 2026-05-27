import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@/app/app-shell';
import { UiSandbox } from '@/app/ui-sandbox';
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page';
import { RoleGuard } from '@/app/role-guard';
import { ClientsListPage } from '@/features/clients/pages/clients-list-page';
import { ClientDetailPage } from '@/features/clients/pages/client-detail-page';
import { ClientCreatePage } from '@/features/clients/pages/client-create-page';
import { registerClientEntities } from '@/features/clients/entities';
import { TrialsListPage } from '@/features/trials/pages/trials-list-page';
import { TrialDetailPage } from '@/features/trials/pages/trial-detail-page';
import { TrialEditPage } from '@/features/trials/pages/trial-edit-page';
import { registerTrialsFeatureEntities } from '@/features/trials/stores/trials-store';
import { registerLookupEntities } from '@/features/lookups/entities';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { LoginPage } from '@/features/auth/pages/login-page';
import { RegisterPage } from '@/features/auth/pages/register-page';
import { ForgotPasswordPage } from '@/features/auth/pages/forgot-password-page';
import { MagicLinkSentPage } from '@/features/auth/pages/magic-link-sent-page';
import { AuthCallbackPage } from '@/features/auth/pages/auth-callback-page';
import { AcceptInvitePage } from '@/features/auth/pages/accept-invite-page';
import { OnboardingPage } from '@/features/onboarding/pages/onboarding-page';
import { PendingApprovalPage } from '@/features/auth/pages/pending-approval-page';
import { AccountRejectedPage } from '@/features/auth/pages/account-rejected-page';
import { AccountDeactivatedPage } from '@/features/auth/pages/account-deactivated-page';
import { MobileMorePage } from '@/features/mobile/pages/mobile-more-page';
import { PaymentSuccessPage } from '@/features/marketing/pages/payment-success-page';
import { PaymentCancelledPage } from '@/features/marketing/pages/payment-cancelled-page';
import { SettingsPage } from '@/features/settings/pages/settings-page';
import { TeamPage } from '@/features/company/pages/team-page';
import { LandingPage } from '@/features/landing/pages/landing-page';
import { PrivacyPolicyPage } from '@/features/marketing/pages/privacy-policy-page';
import { TermsOfServicePage } from '@/features/marketing/pages/terms-of-service-page';
import { PricingPage } from '@/features/marketing/pages/pricing-page';
import { ReferralLandingPage } from '@/features/marketing/pages/referral-landing-page';
import { ApprovalsPage } from '@/features/approvals/pages/approvals-page';
import { LeadRadarPage } from '@/features/lead-radar/pages/lead-radar-page';
import { DealTrackerPage } from '@/features/deals/pages/deal-tracker-page';
import { SalesPage } from '@/features/sales/pages/sales-page';
import { TimelinePage } from '@/features/trials/pages/timeline-page';
import { LastRouteTracker } from '@/app/last-route-tracker';
import { TimeAndExpensesPage } from '@/features/trials/pages/time-and-expenses-page';
import { InvoicesPage } from '@/features/invoices/pages/invoices-page';
import { BillsPage } from '@/features/bills/pages/bills-page';
import { CollectionsPage } from '@/features/collections/pages/collections-page';
import { PotentialGigsPage } from '@/features/hsh/pages/potential-gigs-page';
import { HelpWantedPage } from '@/features/hsh/pages/help-wanted-page';
import { HshDirectoryPage } from '@/features/hsh/pages/hsh-directory-page';
import { HotSeatHubMarketingPage } from '@/features/hsh/pages/hot-seat-hub-marketing-page';
import { ProjectionsPage } from '@/features/sales/pages/projections-page';

// Register feature entity schemas at module load — idempotent.
registerClientEntities();
registerTrialsFeatureEntities();
registerLookupEntities();

const CLIENTS_ROLES = ['Owner', 'Admin', 'Sales'] as const;
const OWNER_ADMIN = ['Owner', 'Admin'] as const;
// OWNER_ONLY — reserved for subscription-tab route guard (change-S11)
const OWNER_ONLY = ['Owner'] as const;
void OWNER_ONLY; // suppress unused-variable until the route lands
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
  const { isAuthenticated, hasCompany, isLoading } = useAuth();
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

  if (!hasCompany) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <>
      <LastRouteTracker />
      <Outlet />
    </>
  );
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

        <Route path="/PrivacyPolicy" element={<PrivacyPolicyPage />} />
        <Route path="/privacy-policy" element={<Navigate to="/PrivacyPolicy" replace />} />
        <Route path="/TermsOfService" element={<TermsOfServicePage />} />
        <Route path="/terms-of-service" element={<Navigate to="/TermsOfService" replace />} />
        <Route path="/Pricing" element={<PricingPage />} />
        <Route path="/pricing" element={<Navigate to="/Pricing" replace />} />
        <Route path="/ReferralLanding" element={<ReferralLandingPage />} />
        <Route path="/referral-landing" element={<Navigate to="/ReferralLanding" replace />} />

        <Route path="/ui-sandbox" element={<UiSandbox />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/magic-link-sent" element={<MagicLinkSentPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route path="/AcceptInvite" element={<AcceptInvitePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/Onboarding" element={<OnboardingPage />} />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />
        <Route path="/account-rejected" element={<AccountRejectedPage />} />
        <Route path="/account-deactivated" element={<AccountDeactivatedPage />} />
        <Route path="/AccountDeactivated" element={<Navigate to="/account-deactivated" replace />} />
        <Route path="/PaymentSuccess" element={<PaymentSuccessPage />} />
        <Route path="/payment-success" element={<Navigate to="/PaymentSuccess" replace />} />
        <Route path="/PaymentCancelled" element={<PaymentCancelledPage />} />
        <Route path="/payment-cancelled" element={<Navigate to="/PaymentCancelled" replace />} />

        {/* Authenticated app shell — protected subtree */}
        <Route element={<AppShell />}>
          <Route element={<AuthGate />}>
            <Route path="Dashboard" element={<DashboardPage />} />
            <Route path="dashboard" element={<Navigate to="/Dashboard" replace />} />

            {/* Mobile overflow nav (bottom tab bar "More" tab) */}
            <Route path="MobileMore" element={<MobileMorePage />} />
            <Route path="mobile-more" element={<Navigate to="/MobileMore" replace />} />

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

            {/* Settings shell — all tabs served by SettingsPage (change-S01) */}
            <Route
              path="settings/company"
              element={
                <RoleGuard roles={OWNER_ADMIN}>
                  <SettingsPage />
                </RoleGuard>
              }
            />
            <Route
              path="Settings"
              element={
                <RoleGuard roles={OWNER_ADMIN}>
                  <SettingsPage />
                </RoleGuard>
              }
            />
            <Route path="Team" element={<TeamPage />} />

            {/* Owner + Admin role-gated placeholders */}
            <Route
              path="Approvals"
              element={
                <RoleGuard roles={OWNER_ADMIN}>
                  <ApprovalsPage />
                </RoleGuard>
              }
            />
            <Route
              path="Invoices"
              element={
                <RoleGuard roles={OWNER_ADMIN}>
                  <InvoicesPage />
                </RoleGuard>
              }
            />
            <Route
              path="Collections"
              element={
                <RoleGuard roles={OWNER_ADMIN}>
                  <CollectionsPage />
                </RoleGuard>
              }
            />
            <Route
              path="Bills"
              element={
                <RoleGuard roles={OWNER_ADMIN}>
                  <BillsPage />
                </RoleGuard>
              }
            />

            {/* Sales Hub (bible: Sales.jsx — three-tab Lead Radar / Deal Tracker / Projections) */}
            <Route
              path="Sales"
              element={
                <RoleGuard roles={SALES_ROLES}>
                  <SalesPage />
                </RoleGuard>
              }
            />
            <Route
              path="sales"
              element={<Navigate to="/Sales" replace />}
            />

            {/* Sales-scoped routes */}
            <Route
              path="LeadRadar"
              element={
                <RoleGuard roles={SALES_ROLES}>
                  <LeadRadarPage />
                </RoleGuard>
              }
            />
            <Route
              path="lead-radar"
              element={<Navigate to="/LeadRadar" replace />}
            />
            <Route
              path="DealTracker"
              element={
                <RoleGuard roles={SALES_ROLES}>
                  <DealTrackerPage />
                </RoleGuard>
              }
            />
            <Route
              path="deal-tracker"
              element={<Navigate to="/DealTracker" replace />}
            />

            {/* HotSeatHub — Potential Gigs + Help Wanted */}
            <Route
              path="PotentialGigs"
              element={
                <RoleGuard roles={OWNER_ADMIN}>
                  <PotentialGigsPage />
                </RoleGuard>
              }
            />
            <Route path="potential-gigs" element={<Navigate to="/PotentialGigs" replace />} />
            <Route
              path="HelpWanted"
              element={
                <RoleGuard roles={OWNER_ADMIN}>
                  <HelpWantedPage />
                </RoleGuard>
              }
            />
            <Route path="help-wanted" element={<Navigate to="/HelpWanted" replace />} />
            <Route
              path="HSHDirectory"
              element={
                <RoleGuard roles={OWNER_ADMIN}>
                  <HshDirectoryPage />
                </RoleGuard>
              }
            />
            <Route path="hsh-directory" element={<Navigate to="/HSHDirectory" replace />} />
            <Route
              path="HotSeatHubMarketing"
              element={
                <RoleGuard roles={OWNER_ADMIN}>
                  <HotSeatHubMarketingPage />
                </RoleGuard>
              }
            />
            <Route
              path="hot-seat-hub-marketing"
              element={<Navigate to="/HotSeatHubMarketing" replace />}
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
            <Route path="Timeline" element={<TimelinePage />} />
            <Route
              path="TimeAndExpenses"
              element={<TimeAndExpensesPage />}
            />
            <Route
              path="Projections"
              element={
                <RoleGuard roles={OWNER_ADMIN}>
                  <ProjectionsPage />
                </RoleGuard>
              }
            />

            <Route path=":page" element={<RoutePlaceholder name="(placeholder)" />} />
            <Route path="*" element={<RoutePlaceholder name="Not found" />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
