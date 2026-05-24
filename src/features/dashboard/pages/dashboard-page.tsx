/**
 * DashboardPage — read-only aggregate surface ported from
 * `HotSeatersMVP/src/pages/Dashboard.jsx` (the bible).
 *
 * Layout faithful to MVP:
 *   1. Hero / welcome header (hidden on mobile — handled by AppShell)
 *   2. Key Metrics band (6 tiles on lg, 2-col grid on mobile)
 *   3. Pipeline + QuickStats + RecentActivity row
 *   4. Recent Trials + Recent Clients + Quick Actions row
 *
 * v0.1 scope: cards backed by Tier-C entities (Invoice, TimeEntry, etc.)
 * render as `StubCard` placeholders so the layout stays recognisable until
 * those entities sync (Tier-A expansion in v0.2). See feature CLAUDE.md.
 *
 * RULE 3: this component imports only hooks and UI primitives. No store,
 * no fetch, no Supabase.
 * RULE 4: mobile-first. Touch targets ≥ 44pt on every interactive element.
 */

import { useNavigate } from 'react-router-dom';
import {
  Gavel,
  DollarSign,
  FileText,
  Briefcase,
  Users,
} from 'lucide-react';
import { useTier1 } from '@/app/tier1-provider';
import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard-stats';
import { useDashboardEmpty } from '@/features/dashboard/hooks/use-dashboard-card-data';
import { StatCard } from '@/features/dashboard/components/stat-card';
import { StubCard } from '@/features/dashboard/components/stub-card';
import { PipelineCard } from '@/features/dashboard/components/pipeline-card';
import { QuickStatsCard } from '@/features/dashboard/components/quick-stats-card';
import { RecentActivityCard } from '@/features/dashboard/components/recent-activity-card';
import { RecentTrialsCard } from '@/features/dashboard/components/recent-trials-card';
import { RecentClientsCard } from '@/features/dashboard/components/recent-clients-card';
import { QuickActionsCard } from '@/features/dashboard/components/quick-actions-card';
import { EmptyDashboard } from '@/features/dashboard/components/empty-dashboard';

export function DashboardPage() {
  const navigate = useNavigate();
  const { userInfo, role } = useTier1();
  const stats = useDashboardStats();
  const empty = useDashboardEmpty();

  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const isSales = role === 'sales';
  const isTrialConsultant = role === 'trial_consultant';
  const canSeeSales = isOwnerOrAdmin || isSales;

  return (
    <div
      className="w-full min-w-0 lg:px-8"
      style={{
        padding: 'var(--theme-page-padding)',
        fontFamily: 'var(--theme-font-body)',
        fontSize: 'var(--theme-text-body)',
      }}
    >
      <div
        style={{ maxWidth: 'var(--theme-max-content-width)' }}
        className="mx-auto"
      >
        {/* Hero (desktop only — mobile header is rendered by AppShell) */}
        <header
          className="hidden lg:block"
          style={{ marginBottom: 'var(--theme-section-gap)' }}
        >
          <h1
            className="mb-2 font-bold"
            style={{
              fontSize: 'var(--theme-text-page-title)',
              color: 'var(--theme-stone-900)',
            }}
          >
            Welcome back{userInfo ? ',' : ''}
          </h1>
          <p
            style={{
              fontSize: 'var(--theme-text-body)',
              color: 'var(--theme-stone-600)',
            }}
          >
            Here&apos;s what&apos;s happening with your business
          </p>
        </header>

        {empty ? (
          <EmptyDashboard />
        ) : (
          <>
            {/* Key Metrics — mirrors MVP 6-tile band */}
            <section
              className={`grid ${
                isTrialConsultant
                  ? 'grid-cols-2'
                  : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6'
              }`}
              style={{
                gap: 'var(--theme-card-gap)',
                marginBottom: 'var(--theme-section-gap)',
              }}
              aria-label="Key metrics"
            >
              {!isTrialConsultant && (
                <StubCard
                  title="Revenue YTD"
                  icon={DollarSign}
                  iconClassName="h-4 w-4 text-green-600"
                  description="Lands when Invoice syncs (v0.2)."
                />
              )}
              {!isTrialConsultant && (
                <StatCard
                  title="Pipeline Value"
                  value={`$${Math.round(stats.pipelineValue).toLocaleString()}`}
                  icon={Briefcase}
                  iconClassName="h-4 w-4 text-purple-600"
                  caption={`${stats.dealsActive} active deals • $${Math.round(
                    stats.pipelineWeighted,
                  ).toLocaleString()} weighted`}
                  onClick={() => navigate('/DealTracker?tab=pipeline')}
                />
              )}
              {!isTrialConsultant && (
                <StubCard
                  title="Outstanding"
                  icon={FileText}
                  iconClassName="h-4 w-4 text-amber-600"
                  description="Lands when Invoice syncs (v0.2)."
                />
              )}
              <StatCard
                title="Active Trials"
                value={stats.trialsActive}
                icon={Gavel}
                iconClassName="h-4 w-4 text-indigo-600"
                caption={`${stats.trialsUpcoming} upcoming • ${Math.max(
                  0,
                  stats.trialsActive - stats.trialsUpcoming,
                )} in progress`}
                onClick={() => navigate('/Trials')}
              />
              <StatCard
                title="Trials YTD"
                value={stats.trialsYtdCount}
                icon={Gavel}
                iconClassName="h-4 w-4 text-blue-600"
                caption={`Won since Jan 1, ${new Date().getFullYear()}`}
                onClick={() => navigate('/Trials')}
              />
              {!isTrialConsultant && (
                <StubCard
                  title="Revenue/Trial YTD"
                  icon={DollarSign}
                  iconClassName="h-4 w-4 text-teal-600"
                  description="Lands when Invoice syncs (v0.2)."
                />
              )}
            </section>

            {/* Pipeline + QuickStats + RecentActivity */}
            <section
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              style={{
                gap: 'var(--theme-card-gap)',
                marginBottom: 'var(--theme-section-gap)',
              }}
            >
              {canSeeSales && <PipelineCard stageType="sales" />}
              {!isTrialConsultant && <QuickStatsCard />}
              <RecentActivityCard />
            </section>

            {/* Recent Trials + Recent Clients + Quick Actions */}
            <section
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              style={{
                gap: 'var(--theme-card-gap)',
                marginBottom: 'var(--theme-section-gap)',
              }}
            >
              <RecentTrialsCard />
              <RecentClientsCard />
              <QuickActionsCard />
            </section>

            {/* Active Clients / Team summary row (compact) */}
            <section
              className="grid grid-cols-2 md:grid-cols-2"
              style={{
                gap: 'var(--theme-card-gap)',
                marginBottom: 'var(--theme-section-gap)',
              }}
            >
              <StatCard
                title="Active Clients"
                value={stats.clientsActive}
                icon={Users}
                iconClassName="h-4 w-4 text-emerald-600"
                caption={`${stats.clientsTotal} total`}
                onClick={() => navigate('/clients')}
              />
              <StatCard
                title="Team"
                value={stats.teamActive}
                icon={Users}
                iconClassName="h-4 w-4 text-stone-600"
                caption="Active members"
                onClick={() => navigate('/Settings')}
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
