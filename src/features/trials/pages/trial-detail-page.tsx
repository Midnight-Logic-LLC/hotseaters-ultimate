/**
 * TrialDetailPage — header + tabs (Services / Contacts / Segments /
 * Assignments / Map). Faithful to HotSeatersMVP/src/components/trials/
 * TrialDetails.jsx + TrialInfoPanel.jsx.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { Link, useParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTier1 } from '@/app/tier1-provider';
import { useTrialWithChildren } from '@/features/trials/hooks/use-trial-with-children';
import { TrialServicesPanel } from '@/features/trials/components/trial-services-panel';
import { TrialContactsPanel } from '@/features/trials/components/trial-contacts-panel';
import { TrialSegmentsPanel } from '@/features/trials/components/trial-segments-panel';
import { TrialServiceAssignmentMatrix } from '@/features/trials/components/trial-service-assignment-matrix';
import { TrialMap } from '@/features/trials/components/trial-map';
import { Pencil } from 'lucide-react';

const fmtMoney = (n: number | null | undefined) =>
  n == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(n);

export function TrialDetailPage() {
  const { trialId } = useParams<{ trialId: string }>();
  const { role } = useTier1();
  const canEdit = role === 'owner' || role === 'admin' || role === 'sales';

  const { trial, services, contacts, segments, servicesTotal, isLoading, error } =
    useTrialWithChildren(trialId);

  if (isLoading && !trial) {
    return <p className="p-6 text-sm text-stone-500">Loading trial…</p>;
  }
  if (error) {
    return <p className="p-6 text-sm text-red-600">Error: {error}</p>;
  }
  if (!trial) {
    return <p className="p-6 text-sm text-stone-500">Trial not found.</p>;
  }

  return (
    <div className="space-y-4 p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {trial.case_name ?? '(untitled trial)'}
          </h1>
          <p className="text-sm text-stone-500">
            {trial.case_number ?? '—'} · {trial.judge ?? 'no judge'} ·{' '}
            {[trial.city, trial.state].filter(Boolean).join(', ') || '—'}
          </p>
          <p className="text-xs text-stone-500">
            {trial.start_date ?? '?'} → {trial.end_date ?? '?'}
          </p>
        </div>
        {canEdit ? (
          <Link to={`/trials/${trial.id}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-1 size-4" /> Edit
            </Button>
          </Link>
        ) : null}
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3">
          <div className="text-xs uppercase text-stone-500">Services</div>
          <div className="text-lg font-semibold">{services.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs uppercase text-stone-500">Services total</div>
          <div className="text-lg font-semibold">{fmtMoney(servicesTotal)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs uppercase text-stone-500">Attorneys</div>
          <div className="text-lg font-semibold">{contacts.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs uppercase text-stone-500">Segments</div>
          <div className="text-lg font-semibold">{segments.length}</div>
        </Card>
      </div>

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
            canEdit={canEdit}
          />
        </TabsContent>
        <TabsContent value="contacts" className="pt-3">
          <TrialContactsPanel
            trialId={trial.id}
            companyId={trial.company_id}
            canEdit={canEdit}
          />
        </TabsContent>
        <TabsContent value="segments" className="pt-3">
          <TrialSegmentsPanel trial={trial} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="assignments" className="pt-3">
          <TrialServiceAssignmentMatrix
            trialId={trial.id}
            companyId={trial.company_id}
            canEdit={canEdit}
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
  );
}

export default TrialDetailPage;
