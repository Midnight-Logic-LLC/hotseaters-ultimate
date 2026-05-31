/**
 * TrialDetailPage — header + tabs (Services / Contacts / Segments /
 * Assignments / Map). Faithful to HotSeatersMVP/src/components/trials/
 * TrialDetails.jsx + TrialInfoPanel.jsx.
 *
 * Key parity points vs bible (TrialDetails.jsx + TrialInfoPanel.jsx):
 *   - Permission model: owner/admin can always edit; sales can edit their own
 *     trial (consultant_id === userInfo.id). trial_consultant role = read-only.
 *   - Date display: honors continued_date_precision (month_only, none, exact).
 *   - Page container uses var(--theme-*) tokens to match bible wrapper.
 *   - Loading copy: "Loading trial details..." matches bible Loader2 screen.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { Link, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTier1 } from '@/app/tier1-provider';
import { useTrialWithChildren } from '@/features/trials/hooks/use-trial-with-children';
import { TrialServicesPanel } from '@/features/trials/components/trial-services-panel';
import { TrialContactsPanel } from '@/features/trials/components/trial-contacts-panel';
import { TrialSegmentsPanel } from '@/features/trials/components/trial-segments-panel';
import { TrialServiceAssignmentMatrix } from '@/features/trials/components/trial-service-assignment-matrix';
import { TrialMap } from '@/features/trials/components/trial-map';
import { Pencil } from 'lucide-react';
import type { Trial } from '@/features/trials/entities';

const fmtMoney = (n: number | null | undefined) =>
  n == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(n);

/**
 * Format trial dates per bible TrialInfoPanel.jsx lines 514–527.
 * Honors continued_date_precision: "month_only" | "none" | null/undefined.
 */
function formatTrialDates(trial: Trial): React.ReactNode {
  if (!trial.start_date) return null;
  if (trial.continued_date_precision === 'month_only') {
    return (
      <span className="font-medium" style={{ color: 'var(--theme-amber-700, #b45309)' }}>
        Rescheduled to {format(parseISO(trial.start_date), 'MMMM yyyy')} (exact dates TBD)
      </span>
    );
  }
  if (trial.continued_date_precision === 'none') {
    return (
      <span className="font-medium" style={{ color: 'var(--theme-amber-700, #b45309)' }}>
        Continued - new dates to be determined
      </span>
    );
  }
  return (
    <span className="font-medium" style={{ color: 'var(--theme-stone-900)' }}>
      {format(parseISO(trial.start_date), 'MMM d, yyyy')}
      {trial.end_date && ` - ${format(parseISO(trial.end_date), 'MMM d, yyyy')}`}
    </span>
  );
}

/**
 * Derive a human-readable status badge from the trial, mirroring
 * bible TrialInfoPanel.jsx isLostDeal / isDeal logic.
 */
function trialStatusBadge(trial: Trial): React.ReactNode | null {
  const ct = trial.completion_type;
  if (!ct) return null;
  if (ct === 'deal_settled') {
    return (
      <Badge className="bg-red-100 text-red-700 font-medium px-3 py-1">
        Deal Settled
      </Badge>
    );
  }
  if (ct === 'deal_lost') {
    return (
      <Badge className="bg-red-100 text-red-700 font-medium px-3 py-1">
        Lost Deal
      </Badge>
    );
  }
  if (ct === 'case_continued') {
    return (
      <Badge className="bg-amber-100 text-amber-700 font-medium px-3 py-1">
        Continued
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-100 text-green-700 font-medium px-3 py-1">
      Completed
    </Badge>
  );
}

export function TrialDetailPage() {
  const { trialId } = useParams<{ trialId: string }>();
  const { role, userInfo } = useTier1();

  // Permission model (bible TrialInfoPanel.jsx lines 89, 287, 363):
  //   owner/admin: always can edit
  //   sales: only their own trial (consultant_id === userInfo.id)
  //   trial_consultant: read-only
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const isSales = role === 'sales';
  const isOwnTrial = (trial: Trial) =>
    !!userInfo?.id && trial.consultant_id === userInfo.id;
  const canEdit = (trial: Trial) => isOwnerOrAdmin || (isSales && isOwnTrial(trial));

  const { trial, services, contacts, segments, servicesTotal, isLoading, error } =
    useTrialWithChildren(trialId);

  if (isLoading && !trial) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: 'var(--theme-stone-400)' }} />
          <p className="text-sm" style={{ color: 'var(--theme-stone-500)' }}>Loading trial details...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <p className="p-6 text-sm" style={{ color: 'var(--theme-danger, #dc2626)' }}>
        Error: {error}
      </p>
    );
  }
  if (!trial) {
    return (
      <p className="p-6 text-sm" style={{ color: 'var(--theme-stone-500)' }}>
        Trial not found.
      </p>
    );
  }

  const statusBadge = trialStatusBadge(trial);

  return (
    <div
      className="lg:px-8 !pt-2 lg:!pt-[var(--theme-page-padding)]"
      style={{
        padding: 'var(--theme-page-padding)',
        fontFamily: 'var(--theme-font-body)',
        fontSize: 'var(--theme-text-body)',
      }}
    >
      <div style={{ maxWidth: 'var(--theme-max-content-width)' }} className="mx-auto space-y-4">
        {/* Header card (bible TrialInfoPanel.jsx desktop layout) */}
        <Card
          style={{
            borderRadius: 'var(--theme-card-radius)',
            boxShadow: 'var(--theme-card-shadow)',
            borderColor: 'var(--theme-stone-200)',
            backgroundColor: 'var(--theme-card-bg)',
          }}
        >
          <div className="p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1
                  className="font-bold truncate"
                  style={{
                    fontFamily: 'var(--theme-font-page-title)',
                    fontSize: 'var(--theme-text-page-title)',
                    color: 'var(--theme-stone-900)',
                  }}
                >
                  {trial.case_name ?? '(untitled trial)'}
                </h1>

                {/* Job number — shown if present (bible TrialInfoPanel.jsx line 241) */}
                {trial.job_number && (
                  <p className="text-sm mt-1" style={{ color: 'var(--theme-stone-500)' }}>
                    {trial.job_number}
                  </p>
                )}

                {/* Case details — mirrors bible renderCaseDetails() */}
                <div className="mt-2 space-y-1 text-sm" style={{ color: 'var(--theme-stone-600)' }}>
                  {trial.case_number && (
                    <p>
                      <span style={{ color: 'var(--theme-stone-500)' }}>Case #:</span>{' '}
                      <span style={{ color: 'var(--theme-stone-900)' }}>{trial.case_number}</span>
                    </p>
                  )}
                  {trial.judge && (
                    <p>
                      <span style={{ color: 'var(--theme-stone-500)' }}>Judge:</span>{' '}
                      <span style={{ color: 'var(--theme-stone-900)' }}>{trial.judge}</span>
                    </p>
                  )}
                  {(trial.courthouse || trial.city || trial.state) && (
                    <p>
                      <span style={{ color: 'var(--theme-stone-500)' }}>Venue:</span>{' '}
                      {trial.courthouse && (
                        <span style={{ color: 'var(--theme-stone-900)' }}>{trial.courthouse}</span>
                      )}
                      {(trial.city || trial.state) && (
                        <span style={{ color: 'var(--theme-stone-900)' }}>
                          {trial.courthouse ? ' · ' : ''}
                          {[trial.city, trial.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </p>
                  )}
                  {trial.start_date && (
                    <p>
                      <span style={{ color: 'var(--theme-stone-500)' }}>Trial Dates:</span>{' '}
                      {formatTrialDates(trial)}
                    </p>
                  )}
                </div>

                {/* Completion / status badge */}
                {statusBadge && <div className="mt-3">{statusBadge}</div>}
              </div>

              {/* Edit button — gated by permission model from bible */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                {canEdit(trial) && (
                  <Link to={`/trials/${trial.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="mr-1 size-4" /> Edit
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats row (bible TrialDetails.jsx derived counts) */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card
            style={{
              borderRadius: 'var(--theme-card-radius)',
              boxShadow: 'var(--theme-card-shadow)',
              borderColor: 'var(--theme-stone-200)',
              backgroundColor: 'var(--theme-card-bg)',
            }}
            className="p-3"
          >
            <div className="text-xs uppercase" style={{ color: 'var(--theme-stone-500)' }}>Services</div>
            <div className="text-lg font-semibold" style={{ color: 'var(--theme-stone-900)' }}>
              {services.length}
            </div>
          </Card>
          <Card
            style={{
              borderRadius: 'var(--theme-card-radius)',
              boxShadow: 'var(--theme-card-shadow)',
              borderColor: 'var(--theme-stone-200)',
              backgroundColor: 'var(--theme-card-bg)',
            }}
            className="p-3"
          >
            <div className="text-xs uppercase" style={{ color: 'var(--theme-stone-500)' }}>Est. Value</div>
            <div className="text-lg font-semibold text-green-600" data-testid="services-total">
              {fmtMoney(trial.estimated_value ?? servicesTotal)}
            </div>
          </Card>
          <Card
            style={{
              borderRadius: 'var(--theme-card-radius)',
              boxShadow: 'var(--theme-card-shadow)',
              borderColor: 'var(--theme-stone-200)',
              backgroundColor: 'var(--theme-card-bg)',
            }}
            className="p-3"
          >
            <div className="text-xs uppercase" style={{ color: 'var(--theme-stone-500)' }}>Attorneys</div>
            <div className="text-lg font-semibold" style={{ color: 'var(--theme-stone-900)' }}>
              {contacts.length}
            </div>
          </Card>
          <Card
            style={{
              borderRadius: 'var(--theme-card-radius)',
              boxShadow: 'var(--theme-card-shadow)',
              borderColor: 'var(--theme-stone-200)',
              backgroundColor: 'var(--theme-card-bg)',
            }}
            className="p-3"
          >
            <div className="text-xs uppercase" style={{ color: 'var(--theme-stone-500)' }}>Segments</div>
            <div className="text-lg font-semibold" style={{ color: 'var(--theme-stone-900)' }}>
              {segments.length}
            </div>
          </Card>
        </div>

        {/* Notes (bible TrialInfoPanel.jsx lines 930–935) */}
        {trial.notes && (
          <Card
            style={{
              borderRadius: 'var(--theme-card-radius)',
              boxShadow: 'var(--theme-card-shadow)',
              borderColor: 'var(--theme-stone-200)',
              backgroundColor: 'var(--theme-card-bg)',
            }}
            className="p-4"
          >
            <p className="text-sm mb-2" style={{ color: 'var(--theme-stone-500)' }}>Notes</p>
            <p className="whitespace-pre-wrap" style={{ color: 'var(--theme-stone-700)' }}>
              {trial.notes}
            </p>
          </Card>
        )}

        {/* Tabs — Services / Attorneys / Segments / Assignments / Map */}
        <Tabs defaultValue="services">
          <TabsList>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="contacts">Attorneys</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
          </TabsList>
          <TabsContent value="services" className="pt-3">
            <TrialServicesPanel
              trialId={trial.id}
              companyId={trial.company_id}
              canEdit={canEdit(trial)}
            />
          </TabsContent>
          <TabsContent value="contacts" className="pt-3">
            <TrialContactsPanel
              trialId={trial.id}
              companyId={trial.company_id}
              canEdit={canEdit(trial)}
            />
          </TabsContent>
          <TabsContent value="segments" className="pt-3">
            <TrialSegmentsPanel trial={trial} canEdit={canEdit(trial)} />
          </TabsContent>
          <TabsContent value="assignments" className="pt-3">
            <TrialServiceAssignmentMatrix
              trialId={trial.id}
              companyId={trial.company_id}
              canEdit={canEdit(trial)}
            />
          </TabsContent>
          <TabsContent value="map" className="pt-3">
            <TrialMap
              city={trial.city}
              state={trial.state}
              courthouse={trial.courthouse}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default TrialDetailPage;
