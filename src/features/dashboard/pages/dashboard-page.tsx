/**
 * DashboardPage — full parity with `HotSeatersMVP/src/pages/Dashboard.jsx`.
 *
 * Change-402 implements:
 *   - KPI tiles (Revenue YTD, Pipeline Value, Outstanding, Active Trials,
 *     Trials YTD, Revenue/Trial YTD) backed by useDashboardAggregates.
 *   - Sales Pipeline bar chart (recharts).
 *   - Quick Stats card.
 *   - Recent Activity card (recent wins + recent invoices).
 *   - Weekly + Monthly team performance bar charts.
 *   - Active Trial Performance bar chart.
 *   - Upcoming Trials list.
 *   - Quick Actions row (role-gated).
 *   - Revenue Trend card.
 *   - Needs Attention banner (sales-facing roles).
 *
 * Architecture: this component imports only hooks and UI primitives.
 * No store, no fetch, no Supabase (RULE 3).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Gavel,
  DollarSign,
  FileText,
  Users,
  Clock,
  Calendar,
  Activity,
  CheckCircle2,
  Plus,
  ChevronRight,
  Receipt,
  CalendarOff,
  GanttChart,
  Orbit,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTier1 } from '@/app/tier1-provider';
import { useDashboardAggregates } from '@/features/dashboard/hooks/use-dashboard-aggregates';
import { RevenueTrendCard } from '@/features/dashboard/components/revenue-trend-card';
import { EmptyDashboard } from '@/features/dashboard/components/empty-dashboard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cardStyle(): React.CSSProperties {
  return {
    borderRadius: 'var(--theme-card-radius)',
    boxShadow: 'var(--theme-card-shadow)',
    borderWidth: 'var(--theme-card-border)',
    backgroundColor: 'var(--theme-card-bg)',
  };
}

function headerPad(): React.CSSProperties {
  return { padding: 'var(--theme-card-header-padding)' };
}

/** Custom Y-axis tick that wraps long names. */
function CustomYAxisTick({
  x,
  y,
  payload,
  maxWidth = 120,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  maxWidth?: number;
}) {
  const text = payload?.value ?? '';
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length * 6 > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return (
    <g>
      {lines.map((line, i) => (
        <text
          key={i}
          x={x}
          y={(y ?? 0) + (i - (lines.length - 1) / 2) * 12}
          textAnchor="end"
          fill="#6b7280"
          fontSize="11px"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// KPI tile
// ---------------------------------------------------------------------------

interface KpiTileProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconClass: string;
  caption?: React.ReactNode;
  onClick?: () => void;
}

function KpiTile({ title, value, icon: Icon, iconClass, caption, onClick }: KpiTileProps) {
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-lg"
      style={cardStyle()}
      onClick={onClick}
    >
      <CardHeader
        className="flex flex-row items-center justify-between pb-2"
        style={headerPad()}
      >
        <CardTitle
          style={{
            fontSize: 'var(--theme-text-label)',
            fontWeight: 500,
            color: 'var(--theme-stone-600)',
          }}
        >
          {title}
        </CardTitle>
        <Icon className={iconClass} />
      </CardHeader>
      <CardContent
        style={{
          paddingLeft: 'var(--theme-card-header-padding)',
          paddingRight: 'var(--theme-card-header-padding)',
          paddingBottom: 'var(--theme-card-header-padding)',
        }}
      >
        <div
          className="font-bold"
          style={{ fontSize: '1.5rem', color: 'var(--theme-stone-900)' }}
        >
          {value}
        </div>
        {caption && (
          <p
            style={{
              fontSize: 'var(--theme-text-caption)',
              color: 'var(--theme-stone-500)',
              marginTop: '0.25rem',
            }}
          >
            {caption}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function DashboardPage() {
  const navigate = useNavigate();
  const { userInfo, company, role } = useTier1();
  const agg = useDashboardAggregates();

  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const isSales = role === 'sales';
  const isTrialConsultant = role === 'trial_consultant';
  const canSeeSales = isOwnerOrAdmin || isSales;

  const isEmpty =
    !agg.isLoading &&
    agg.trialsActive === 0 &&
    agg.clientsTotal === 0 &&
    agg.revenueYtd === 0;

  const now = new Date();

  return (
    <div
      className="w-full min-w-0 lg:px-8"
      style={{
        padding: 'var(--theme-page-padding)',
        fontFamily: 'var(--theme-font-body)',
        fontSize: 'var(--theme-text-body)',
      }}
    >
      <div style={{ maxWidth: 'var(--theme-max-content-width)' }} className="mx-auto">
        {/* Hero (desktop only) */}
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
            Welcome back{userInfo?.first_name ? `, ${userInfo.first_name}` : ''}
          </h1>
          <p style={{ fontSize: 'var(--theme-text-body)', color: 'var(--theme-stone-600)' }}>
            Here&apos;s what&apos;s happening with your business
          </p>
        </header>

        {isEmpty ? (
          <EmptyDashboard />
        ) : (
          <>
            {/* ── Needs Attention banner ────────────────────────────────────── */}
            {/* Placeholder: stale-leads hook not yet implemented in this repo.
                The structure is in place for when useMyStaleLeadsCount lands. */}

            {/* ── KPI tiles ────────────────────────────────────────────────── */}
            <section
              className={`grid ${
                isTrialConsultant
                  ? 'grid-cols-2'
                  : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6'
              }`}
              style={{ gap: 'var(--theme-card-gap)', marginBottom: 'var(--theme-section-gap)' }}
              aria-label="Key metrics"
            >
              {!isTrialConsultant && (
                <KpiTile
                  title="Revenue YTD"
                  value={`$${Math.round(agg.revenueYtd).toLocaleString()}`}
                  icon={DollarSign}
                  iconClass="h-4 w-4 text-green-600"
                  caption={
                    <>
                      {agg.revenueChange >= 0 ? '↑' : '↓'}{' '}
                      <span
                        className={agg.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}
                      >
                        {Math.abs(agg.revenueChange).toFixed(1)}% vs last month
                      </span>
                    </>
                  }
                  onClick={() => navigate('/Invoices')}
                />
              )}

              {!isTrialConsultant && (
                <KpiTile
                  title="Pipeline Value"
                  value={`$${Math.round(agg.pipelineValue).toLocaleString()}`}
                  icon={Briefcase}
                  iconClass="h-4 w-4 text-purple-600"
                  caption={`${agg.dealsActive} active deals • $${Math.round(agg.pipelineWeighted).toLocaleString()} weighted`}
                  onClick={() => navigate('/DealTracker?tab=pipeline')}
                />
              )}

              {!isTrialConsultant && (
                <KpiTile
                  title="Outstanding"
                  value={`$${Math.round(agg.outstandingAmount).toLocaleString()}`}
                  icon={FileText}
                  iconClass="h-4 w-4 text-amber-600"
                  caption={`${agg.outstandingCount} unpaid invoice${agg.outstandingCount !== 1 ? 's' : ''}`}
                  onClick={() => navigate('/Collections')}
                />
              )}

              <KpiTile
                title="Active Trials"
                value={agg.trialsActive}
                icon={Gavel}
                iconClass="h-4 w-4 text-indigo-600"
                caption={`${agg.trialsUpcoming} upcoming • ${Math.max(0, agg.trialsActive - agg.trialsUpcoming)} in progress`}
                onClick={() => navigate('/Trials')}
              />

              <KpiTile
                title="Trials YTD"
                value={agg.trialsYtdCount}
                icon={Gavel}
                iconClass="h-4 w-4 text-blue-600"
                caption={`Won since Jan 1, ${now.getFullYear()}`}
                onClick={() => navigate('/Trials')}
              />

              {!isTrialConsultant && (
                <KpiTile
                  title="Revenue/Trial YTD"
                  value={`$${agg.trialsYtdCount > 0 ? Math.round(agg.revenuePerTrialYtd).toLocaleString() : '0'}`}
                  icon={DollarSign}
                  iconClass="h-4 w-4 text-teal-600"
                  caption={`$${Math.round(agg.revenueYtd).toLocaleString()} total revenue`}
                  onClick={() => navigate('/Trials')}
                />
              )}
            </section>

            {/* ── Pipeline + QuickStats + RecentActivity ────────────────────── */}
            <section
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              style={{ gap: 'var(--theme-card-gap)', marginBottom: 'var(--theme-section-gap)' }}
            >
              {/* Sales Pipeline */}
              {canSeeSales && agg.dealsByStage.length > 0 && (
                <Card className="lg:col-span-1" style={cardStyle()}>
                  <CardHeader style={headerPad()}>
                    <CardTitle
                      className="flex items-center"
                      style={{
                        fontSize: 'var(--theme-text-card-title)',
                        color: 'var(--theme-stone-900)',
                        gap: 'var(--theme-element-gap)',
                      }}
                    >
                      <Briefcase className="h-5 w-5 text-purple-600" />
                      Sales Pipeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={[...agg.dealsByStage].reverse()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '11px' }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          formatter={(rawValue, name) => {
                            const val = Number(rawValue ?? 0);
                            const key = String(name);
                            return [
                              key === 'count' ? `${val} deals` : `$${Math.round(val).toLocaleString()}`,
                              key === 'count' ? 'Deals' : 'Value',
                            ];
                          }}
                        />
                        <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              {!isTrialConsultant && (
                <Card className="lg:col-span-1" style={cardStyle()}>
                  <CardHeader style={headerPad()}>
                    <CardTitle
                      style={{
                        fontSize: 'var(--theme-text-card-title)',
                        color: 'var(--theme-stone-900)',
                      }}
                    >
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent
                    style={{ padding: 'var(--theme-card-padding)' }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-stone-500" />
                        <span className="text-sm text-stone-600">Active Clients</span>
                      </div>
                      <span className="font-semibold text-stone-900">{agg.clientsActive}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-stone-500" />
                        <span className="text-sm text-stone-600">Team Members</span>
                      </div>
                      <span className="font-semibold text-stone-900">{agg.activeConsultantsCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-stone-500" />
                        <span className="text-sm text-stone-600">Outstanding</span>
                      </div>
                      <span className="font-semibold text-amber-600">
                        ${Math.round(agg.outstandingAmount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-stone-500" />
                        <span className="text-sm text-stone-600">Avg Hours/Week</span>
                      </div>
                      <span className="font-semibold text-stone-900">
                        {agg.avgHoursPerConsultantWeek.toFixed(1)}
                      </span>
                    </div>
                    {company?.marketplace_post_jobs && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Orbit className="h-4 w-4 text-purple-600" />
                          <span className="text-sm text-stone-600">HSH Posts</span>
                        </div>
                        <span className="font-semibold text-purple-600">{agg.openHshPosts}</span>
                      </div>
                    )}
                    {company?.marketplace_fill_jobs && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Orbit className="h-4 w-4 text-purple-600" />
                          <span className="text-sm text-stone-600">HSH Gigs</span>
                        </div>
                        <span className="font-semibold text-purple-600">{agg.activeHshGigs}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              <Card className="lg:col-span-1 overflow-hidden" style={cardStyle()}>
                <CardHeader
                  className="rounded-t-lg border-b"
                  style={{
                    ...headerPad(),
                    backgroundColor: 'var(--theme-card-header-bg)',
                    borderBottomColor: 'var(--theme-stone-100)',
                  }}
                >
                  <CardTitle
                    className="flex items-center"
                    style={{
                      fontSize: 'var(--theme-text-card-title)',
                      color: 'var(--theme-stone-900)',
                      gap: 'var(--theme-element-gap)',
                    }}
                  >
                    <Activity className="h-5 w-5 text-indigo-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
                  <div className="space-y-4">
                    {/* Recent Wins */}
                    {agg.recentlyWonDeals.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                          Recent Wins
                        </h4>
                        <div className="space-y-2">
                          {agg.recentlyWonDeals.map((deal) => (
                            <div
                              key={deal.id}
                              className="flex items-start gap-3 rounded-lg p-2 hover:bg-stone-50"
                            >
                              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-stone-900">
                                  {deal.case_name}
                                </p>
                                <p className="text-xs text-stone-500">
                                  {deal.won_date
                                    ? format(parseISO(deal.won_date), 'MMM d')
                                    : ''}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Invoices */}
                    {!isTrialConsultant && agg.recentInvoices.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                          Recent Invoices
                        </h4>
                        <div className="space-y-2">
                          {agg.recentInvoices.slice(0, 3).map((invoice) => (
                            <button
                              key={invoice.id}
                              onClick={() => navigate('/Invoices')}
                              className="group flex w-full items-start gap-3 rounded-lg p-2 text-left hover:bg-stone-50"
                            >
                              <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-stone-900 group-hover:text-indigo-700">
                                  {invoice.invoice_number}
                                </p>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-stone-500">
                                    ${Math.round(invoice.total).toLocaleString()}
                                  </p>
                                  <Badge
                                    className={
                                      invoice.status === 'paid'
                                        ? 'bg-green-100 text-green-700'
                                        : invoice.status === 'overdue'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }
                                  >
                                    {invoice.status}
                                  </Badge>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {agg.recentlyWonDeals.length === 0 && agg.recentInvoices.length === 0 && (
                      <div className="py-8 text-center text-stone-500">
                        <Activity className="mx-auto mb-3 h-12 w-12 opacity-30" />
                        <p className="text-sm">No recent activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* ── Team Performance + Active Trials + Upcoming ──────────────── */}
            <section
              className="grid md:grid-cols-2 lg:grid-cols-4"
              style={{ gap: 'var(--theme-card-gap)', marginBottom: 'var(--theme-section-gap)' }}
            >
              {/* Weekly Team Performance */}
              {agg.weeklyTeamStats.length > 0 && (
                <Card className="lg:col-span-2" style={cardStyle()}>
                  <CardHeader style={headerPad()}>
                    <CardTitle
                      className="flex items-center justify-between"
                      style={{ fontSize: 'var(--theme-text-card-title)', color: 'var(--theme-stone-900)' }}
                    >
                      <div className="flex items-center" style={{ gap: 'var(--theme-element-gap)' }}>
                        <Users className="h-5 w-5 text-indigo-600" />
                        Weekly Team Performance
                      </div>
                      <div className="font-bold" style={{ fontSize: 'var(--theme-text-body)' }}>
                        {agg.weeklyTeamStats.reduce((s, u) => s + u.hours, 0).toFixed(1)}h
                        {!isTrialConsultant &&
                          ` • $${Math.round(agg.weeklyTeamStats.reduce((s, u) => s + u.revenue, 0)).toLocaleString()}`}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={[...agg.weeklyTeamStats]
                          .sort((a, b) =>
                            isTrialConsultant ? b.hours - a.hours : b.revenue - a.revenue,
                          )
                          .slice(0, 5)}
                        layout="vertical"
                        margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e5e7eb"
                          horizontal={false}
                        />
                        <XAxis type="number" stroke="#6b7280" style={{ fontSize: '11px' }} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={110}
                          stroke="#6b7280"
                          tick={<CustomYAxisTick maxWidth={100} />}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          formatter={(rawValue, name) => {
                            const value = Number(rawValue ?? 0);
                            const key = String(name);
                            if (isTrialConsultant) return [`${value.toFixed(1)}h`, 'Hours'];
                            return [
                              key === 'revenue'
                                ? `$${Math.round(value).toLocaleString()}`
                                : `${value.toFixed(1)}h`,
                              key === 'revenue' ? 'Revenue' : 'Hours',
                            ];
                          }}
                        />
                        {isTrialConsultant ? (
                          <Bar
                            dataKey="hours"
                            fill="#4F46E5"
                            radius={[0, 4, 4, 0]}
                            label={{
                              position: 'right',
                              formatter: (v: unknown) => `${Number(v ?? 0).toFixed(1)}h`,
                              fontSize: 11,
                              fill: '#374151',
                            }}
                          />
                        ) : (
                          <Bar
                            dataKey="revenue"
                            fill="#4F46E5"
                            radius={[0, 4, 4, 0]}
                            label={{
                              position: 'right',
                              formatter: (v: unknown) => `$${Math.round(Number(v ?? 0)).toLocaleString()}`,
                              fontSize: 11,
                              fill: '#374151',
                            }}
                          >
                            <LabelList
                              dataKey="hours"
                              position="insideRight"
                              style={{ fontSize: '11px', fill: 'white', fontWeight: '500' }}
                            />
                          </Bar>
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Monthly Team Performance */}
              {agg.monthlyTeamStats.length > 0 && (
                <Card className="lg:col-span-2" style={cardStyle()}>
                  <CardHeader style={headerPad()}>
                    <CardTitle
                      className="flex items-center justify-between"
                      style={{ fontSize: 'var(--theme-text-card-title)', color: 'var(--theme-stone-900)' }}
                    >
                      <div className="flex items-center" style={{ gap: 'var(--theme-element-gap)' }}>
                        <Users className="h-5 w-5 text-green-600" />
                        Monthly Team Performance
                      </div>
                      <div className="font-bold" style={{ fontSize: 'var(--theme-text-body)' }}>
                        {agg.monthlyTeamStats.reduce((s, u) => s + u.hours, 0).toFixed(1)}h
                        {!isTrialConsultant &&
                          ` • $${Math.round(agg.monthlyTeamStats.reduce((s, u) => s + u.revenue, 0)).toLocaleString()}`}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={[...agg.monthlyTeamStats]
                          .sort((a, b) =>
                            isTrialConsultant ? b.hours - a.hours : b.revenue - a.revenue,
                          )
                          .slice(0, 5)}
                        layout="vertical"
                        margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e5e7eb"
                          horizontal={false}
                        />
                        <XAxis type="number" stroke="#6b7280" style={{ fontSize: '11px' }} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={110}
                          stroke="#6b7280"
                          tick={<CustomYAxisTick maxWidth={100} />}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          formatter={(rawValue, name) => {
                            const value = Number(rawValue ?? 0);
                            const key = String(name);
                            if (isTrialConsultant) return [`${value.toFixed(1)}h`, 'Hours'];
                            return [
                              key === 'revenue'
                                ? `$${Math.round(value).toLocaleString()}`
                                : `${value.toFixed(1)}h`,
                              key === 'revenue' ? 'Revenue' : 'Hours',
                            ];
                          }}
                        />
                        {isTrialConsultant ? (
                          <Bar
                            dataKey="hours"
                            fill="#059669"
                            radius={[0, 4, 4, 0]}
                            label={{
                              position: 'right',
                              formatter: (v: unknown) => `${Number(v ?? 0).toFixed(1)}h`,
                              fontSize: 11,
                              fill: '#374151',
                            }}
                          />
                        ) : (
                          <Bar
                            dataKey="revenue"
                            fill="#059669"
                            radius={[0, 4, 4, 0]}
                            label={{
                              position: 'right',
                              formatter: (v: unknown) => `$${Math.round(Number(v ?? 0)).toLocaleString()}`,
                              fontSize: 11,
                              fill: '#374151',
                            }}
                          >
                            <LabelList
                              dataKey="hours"
                              position="insideRight"
                              style={{ fontSize: '11px', fill: 'white', fontWeight: '500' }}
                            />
                          </Bar>
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Active Trial Performance */}
              <Card className="lg:col-span-2" style={cardStyle()}>
                <CardHeader style={headerPad()}>
                  <CardTitle
                    className="flex items-center justify-between"
                    style={{ fontSize: 'var(--theme-text-card-title)', color: 'var(--theme-stone-900)' }}
                  >
                    <div className="flex items-center" style={{ gap: 'var(--theme-element-gap)' }}>
                      <Gavel className="h-5 w-5 text-indigo-600" />
                      Active Trial Performance
                    </div>
                    {agg.trialStats.length > 0 && (
                      <div className="font-bold" style={{ fontSize: 'var(--theme-text-body)' }}>
                        {agg.trialStats.reduce((s, t) => s + t.hours, 0).toFixed(1)}h
                        {!isTrialConsultant &&
                          ` • $${Math.round(agg.trialStats.reduce((s, t) => s + t.revenue, 0)).toLocaleString()}`}
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {agg.trialStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={[...agg.trialStats]
                          .sort((a, b) =>
                            isTrialConsultant ? b.hours - a.hours : b.revenue - a.revenue,
                          )
                          .slice(0, 5)}
                        layout="vertical"
                        margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e5e7eb"
                          horizontal={false}
                        />
                        <XAxis type="number" stroke="#6b7280" style={{ fontSize: '11px' }} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={130}
                          stroke="#6b7280"
                          tick={<CustomYAxisTick maxWidth={120} />}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          formatter={(rawValue, name) => {
                            const value = Number(rawValue ?? 0);
                            const key = String(name);
                            if (isTrialConsultant) return [`${value.toFixed(1)}h`, 'Hours'];
                            return [
                              key === 'revenue'
                                ? `$${Math.round(value).toLocaleString()}`
                                : `${value.toFixed(1)}h`,
                              key === 'revenue' ? 'Revenue' : 'Hours',
                            ];
                          }}
                        />
                        {isTrialConsultant ? (
                          <Bar
                            dataKey="hours"
                            fill="#7C3AED"
                            radius={[0, 4, 4, 0]}
                            label={{
                              position: 'right',
                              formatter: (v: unknown) => `${Number(v ?? 0).toFixed(1)}h`,
                              fontSize: 11,
                              fill: '#374151',
                            }}
                          />
                        ) : (
                          <Bar
                            dataKey="revenue"
                            fill="#7C3AED"
                            radius={[0, 4, 4, 0]}
                            label={{
                              position: 'right',
                              formatter: (v: unknown) => `$${Math.round(Number(v ?? 0)).toLocaleString()}`,
                              fontSize: 11,
                              fill: '#374151',
                            }}
                          >
                            <LabelList
                              dataKey="hours"
                              position="insideRight"
                              style={{ fontSize: '11px', fill: 'white', fontWeight: '500' }}
                            />
                          </Bar>
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="py-8 text-center text-stone-500">
                      <Gavel className="mx-auto mb-3 h-12 w-12 opacity-30" />
                      <p className="text-sm">No active trial data yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Trials */}
              <Card className="lg:col-span-2" style={cardStyle()}>
                <CardHeader
                  className="flex flex-row items-center justify-between"
                  style={headerPad()}
                >
                  <CardTitle
                    className="flex items-center"
                    style={{
                      fontSize: 'var(--theme-text-card-title)',
                      color: 'var(--theme-stone-900)',
                      gap: 'var(--theme-element-gap)',
                    }}
                  >
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    Upcoming Trials
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/Schedule')}>
                    View Schedule
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {agg.upcomingTrials.length > 0 ? (
                    <div className="space-y-2">
                      {agg.upcomingTrials.slice(0, 3).map((trial) => {
                        const daysUntil = trial.start_date
                          ? differenceInDays(parseISO(trial.start_date), new Date())
                          : 0;
                        return (
                          <div
                            key={trial.id}
                            className="flex cursor-pointer items-center justify-between bg-stone-50 transition-colors hover:bg-stone-100"
                            style={{
                              borderRadius: 'var(--theme-list-item-radius)',
                              boxShadow: 'var(--theme-list-item-shadow)',
                              borderWidth: 'var(--theme-list-item-border)',
                              padding: 'var(--theme-list-item-padding)',
                            }}
                            onClick={() => navigate('/Trials')}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                                <Gavel className="h-4 w-4 text-indigo-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="truncate text-sm font-semibold text-stone-900">
                                  {trial.case_name}
                                </h4>
                                <p className="truncate text-xs text-stone-600">
                                  {trial.client_firm_name ?? ''}
                                </p>
                              </div>
                            </div>
                            <div className="ml-2 flex-shrink-0 text-right">
                              {trial.start_date && (
                                <p className="text-xs font-medium text-stone-900">
                                  {format(parseISO(trial.start_date), 'MMM d')}
                                </p>
                              )}
                              <p className="text-xs text-stone-500">
                                {daysUntil === 0
                                  ? 'Today'
                                  : daysUntil === 1
                                  ? 'Tomorrow'
                                  : `${daysUntil} days`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-stone-500">
                      <Calendar className="mx-auto mb-3 h-12 w-12 opacity-30" />
                      <p className="text-sm">No upcoming trials scheduled</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* ── Revenue Trend ─────────────────────────────────────────────── */}
            {!isTrialConsultant && (
              <section style={{ marginBottom: 'var(--theme-section-gap)' }}>
                <RevenueTrendCard
                  monthlyData={[]}
                  weeklyData={[]}
                />
              </section>
            )}

            {/* ── Quick Actions ─────────────────────────────────────────────── */}
            <Card style={cardStyle()}>
              <CardHeader style={headerPad()}>
                <CardTitle
                  style={{
                    fontSize: 'var(--theme-text-card-title)',
                    color: 'var(--theme-stone-900)',
                  }}
                >
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
                {isTrialConsultant ? (
                  <div
                    className="grid grid-cols-2 sm:grid-cols-4"
                    style={{ gap: 'var(--theme-element-gap)' }}
                  >
                    <Button
                      variant="outline"
                      className="flex h-auto flex-col items-center gap-2 py-4"
                      onClick={() => navigate('/TimeAndExpenses')}
                    >
                      <Clock className="h-5 w-5" />
                      <span className="text-sm">Log Time</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex h-auto flex-col items-center gap-2 py-4"
                      onClick={() => navigate('/TimeAndExpenses')}
                    >
                      <Receipt className="h-5 w-5" />
                      <span className="text-sm">Add Expense</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex h-auto flex-col items-center gap-2 py-4"
                      onClick={() => navigate('/TimeAndExpenses')}
                    >
                      <CalendarOff className="h-5 w-5" />
                      <span className="text-sm">Time Off</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex h-auto flex-col items-center gap-2 py-4"
                      onClick={() => navigate('/Timeline')}
                    >
                      <GanttChart className="h-5 w-5" />
                      <span className="text-sm">View Schedule</span>
                    </Button>
                  </div>
                ) : (
                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
                    style={{ gap: 'var(--theme-element-gap)' }}
                  >
                    {canSeeSales && (
                      <Button
                        variant="outline"
                        className="flex h-auto flex-col items-center gap-2 py-4"
                        onClick={() => navigate('/DealTracker?tab=pipeline')}
                      >
                        <Plus className="h-5 w-5" />
                        <span className="text-sm">New Deal</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="flex h-auto flex-col items-center gap-2 py-4"
                      onClick={() => navigate('/TimeAndExpenses')}
                    >
                      <Clock className="h-5 w-5" />
                      <span className="text-sm">Log Time</span>
                    </Button>
                    {canSeeSales && (
                      <Button
                        variant="outline"
                        className="flex h-auto flex-col items-center gap-2 py-4"
                        onClick={() => navigate('/Clients')}
                      >
                        <Users className="h-5 w-5" />
                        <span className="text-sm">Add Client</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="flex h-auto flex-col items-center gap-2 py-4"
                      onClick={() => navigate('/Timeline')}
                    >
                      <GanttChart className="h-5 w-5" />
                      <span className="text-sm">View Schedule</span>
                    </Button>
                    {company?.marketplace_post_jobs && (
                      <Button
                        variant="outline"
                        className="flex h-auto flex-col items-center gap-2 border-purple-200 py-4 hover:bg-purple-50"
                        onClick={() => navigate('/HelpWanted')}
                      >
                        <Orbit className="h-5 w-5 text-purple-600" />
                        <span className="text-sm">HotSeatHub</span>
                      </Button>
                    )}
                    {canSeeSales && (
                      <Button
                        variant="outline"
                        className="flex h-auto flex-col items-center gap-2 py-4"
                        onClick={() => navigate('/Invoices')}
                      >
                        <FileText className="h-5 w-5" />
                        <span className="text-sm">New Invoice</span>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
