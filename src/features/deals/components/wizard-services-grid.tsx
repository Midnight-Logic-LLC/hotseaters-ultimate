/**
 * wizard-services-grid.tsx — the two-column "available + selected" services
 * layout shared by deal-wizard step 3 (pre-trial) and step 4 (in-trial),
 * extracted to keep deal-wizard.tsx under the RULE A 800-line limit.
 *
 * Renders the available-services column + the selected/reorderable column with
 * a phase-specific header. The trailing subtotal/footer panel is passed via
 * `footer`. Behaviour is identical to the inline grids it replaced.
 * HotSeatersMVP is the bible.
 */

import { format, parseISO } from 'date-fns';
import type { ServiceRecord } from '@/features/company/hooks/use-services';
import type { LookupRow } from '@/shared/db/lookups-selectors';
import type { ClientServiceOverrideRow } from '@/features/clients/stores/clients-store';
import type { TrialSegment } from '@/features/trials/entities';
import { AvailableServicesColumn } from './available-services-column';
import { WizardServiceStep } from './wizard-service-step';
import type {
  DealFormData,
  PreTrialServiceInstance,
  InTrialServiceInstance,
} from './deal-wizard-types';

type RateFn = (serviceId: string, baseRate: number, clientId: string, instanceId?: number | string | null) => number;
type ServiceDaysFn = (serviceId: string, arrivalDate?: string | null, segmentId?: string | null) => number;
type TravelCostFn = (
  inst: { travel_eligible?: boolean | undefined; estimated_travel_hours?: number | null | undefined },
  svcRate: number,
) => number;

interface SharedGridProps {
  dealData: DealFormData;
  services: ServiceRecord[];
  serviceCategories: LookupRow[];
  clientOverrides: ClientServiceOverrideRow[];
  collapsedCategories: Set<string>;
  onToggleCategory: (key: string) => void;
  trialSegments: TrialSegment[];
  calculateRate: RateFn;
  calculateServiceDays: ServiceDaysFn;
  dailyMinimumHours: number;
  travelMultiplier: number;
  overriddenRates: Record<string, number>;
  onRateOverride: (instanceId: number | string, serviceId: string) => void;
  onClearRateOverride: (instanceId: number | string) => void;
  calcTravelCost: TravelCostFn;
  preTrialServices: PreTrialServiceInstance[];
  inTrialServices: InTrialServiceInstance[];
  footer?: React.ReactNode;
}

type PhaseGridProps =
  | {
      phase: 'pre-trial';
      onAddService: (serviceId: string) => void;
      onReorder: (next: PreTrialServiceInstance[]) => void;
      updateInstance: (id: number | string, updates: Partial<PreTrialServiceInstance>) => void;
      removeInstance: (id: number | string) => void;
    }
  | {
      phase: 'in-trial';
      onAddService: (serviceId: string) => void;
      onReorder: (next: InTrialServiceInstance[]) => void;
      updateInstance: (id: number | string, updates: Partial<InTrialServiceInstance>) => void;
      removeInstance: (id: number | string) => void;
    };

export type WizardServicesGridProps = SharedGridProps & PhaseGridProps;

export function WizardServicesGrid(props: WizardServicesGridProps) {
  const {
    phase,
    dealData,
    services,
    serviceCategories,
    clientOverrides,
    collapsedCategories,
    onToggleCategory,
    trialSegments,
    calculateRate,
    calculateServiceDays,
    dailyMinimumHours,
    travelMultiplier,
    overriddenRates,
    onRateOverride,
    onClearRateOverride,
    calcTravelCost,
    preTrialServices,
    inTrialServices,
    footer,
    onAddService,
  } = props;

  const isPre = phase === 'pre-trial';
  const instances = isPre ? preTrialServices : inTrialServices;
  const availableTitle = isPre ? 'Available Pre-Trial Services' : 'Available In-Trial Services';
  const availableHint = isPre ? 'Services before trial begins' : 'Services during trial';
  const selectedTitle = isPre ? 'Selected Pre-Trial Services' : 'Selected In-Trial Services';

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="pb-3 border-b border-stone-200">
          <h3 className="font-semibold text-stone-900">{availableTitle}</h3>
          <p className="text-xs text-stone-600 mt-1">{availableHint}</p>
        </div>
        <AvailableServicesColumn
          services={services}
          serviceCategories={serviceCategories}
          addedServiceIds={instances.map((s) => s.service_id)}
          onAddService={onAddService}
          calculateRate={(id, base, cid) => calculateRate(id, base, cid)}
          clientId={dealData.client_id}
          clientOverrides={clientOverrides}
          collapsedCategories={collapsedCategories}
          onToggleCategory={onToggleCategory}
          serviceType={phase}
          existingServices={preTrialServices}
          inTrialServices={inTrialServices}
        />
      </div>
      <div className="space-y-4">
        <div className="pb-3 border-b border-stone-200">
          <h3 className="font-semibold text-stone-900">{selectedTitle}</h3>
          <p className="text-xs text-stone-600 mt-1">
            {dealData.case_name}
            {isPre ? (
              <>
                {' '}
                • Trial starts{' '}
                {dealData.start_date && format(parseISO(dealData.start_date), 'MMM d, yyyy')}
              </>
            ) : (
              <>
                {' '}
                •{' '}
                {dealData.start_date &&
                  dealData.end_date &&
                  `${format(parseISO(dealData.start_date), 'MMM d')} - ${format(
                    parseISO(dealData.end_date),
                    'MMM d, yyyy',
                  )}`}
              </>
            )}
            {dealData.city && dealData.state && ` • ${dealData.city}, ${dealData.state}`}
          </p>
        </div>
        {props.phase === 'pre-trial' ? (
          <WizardServiceStep
            phase="pre-trial"
            instances={preTrialServices}
            onReorder={props.onReorder}
            updateInstance={props.updateInstance}
            removeInstance={props.removeInstance}
            services={services}
            dealData={dealData}
            trialSegments={trialSegments}
            calculateRate={calculateRate}
            calculateServiceDays={calculateServiceDays}
            dailyMinimumHours={dailyMinimumHours}
            travelMultiplier={travelMultiplier}
            overriddenRates={overriddenRates}
            onRateOverride={onRateOverride}
            onClearRateOverride={onClearRateOverride}
            calcTravelCost={calcTravelCost}
          />
        ) : (
          <WizardServiceStep
            phase="in-trial"
            instances={inTrialServices}
            onReorder={props.onReorder}
            updateInstance={props.updateInstance}
            removeInstance={props.removeInstance}
            services={services}
            dealData={dealData}
            trialSegments={trialSegments}
            calculateRate={calculateRate}
            calculateServiceDays={calculateServiceDays}
            dailyMinimumHours={dailyMinimumHours}
            travelMultiplier={travelMultiplier}
            overriddenRates={overriddenRates}
            onRateOverride={onRateOverride}
            onClearRateOverride={onClearRateOverride}
            calcTravelCost={calcTravelCost}
          />
        )}
        {footer}
      </div>
    </div>
  );
}
