/**
 * available-services-column.tsx — port of
 * HotSeatersMVP/src/components/deals/AvailableServicesColumn.jsx.
 *
 * Renders the left "Available services" column on wizard steps 3 (pre-trial)
 * and 4 (in-trial): category accordions with an "Add" button per service.
 * Filters services by `service_availability` for the active phase, and shows
 * the client-resolved rate (with a ⚡ marker when a client override applies).
 *
 * Components consume hook-supplied props only (RULE B). HotSeatersMVP is the bible.
 */

import { Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ServiceRecord } from '@/features/company/hooks/use-services';
import type { ClientServiceOverrideRow } from '@/features/clients/stores/clients-store';
import type { LookupRow } from '@/shared/db/lookups-selectors';
import type {
  PreTrialServiceInstance,
  InTrialServiceInstance,
} from './deal-wizard-types';

type ServiceType = 'pre-trial' | 'in-trial';

interface AvailableServicesColumnProps {
  services: ServiceRecord[];
  serviceCategories: LookupRow[];
  addedServiceIds: string[];
  onAddService: (serviceId: string) => void;
  calculateRate: (serviceId: string, baseRate: number, clientId: string) => number;
  clientId: string;
  clientOverrides: ClientServiceOverrideRow[];
  collapsedCategories: Set<string>;
  onToggleCategory: (key: string) => void;
  serviceType: ServiceType;
  existingServices?: PreTrialServiceInstance[];
  inTrialServices?: InTrialServiceInstance[];
}

function isCategoryDefault(category: LookupRow): boolean {
  return category.extra_schema?.is_default === true;
}

function rateUnit(service: ServiceRecord): string {
  return service.rate_type === 'hourly' ? 'hour' : service.rate_type;
}

export function AvailableServicesColumn({
  services,
  serviceCategories,
  addedServiceIds,
  onAddService,
  calculateRate,
  clientId,
  clientOverrides,
  collapsedCategories,
  onToggleCategory,
  serviceType,
  existingServices = [],
  inTrialServices = [],
}: AvailableServicesColumnProps) {
  // A service already assigned with split billing must appear in BOTH columns.
  const isAssignedWithSplitBilling = (serviceId: string): boolean => {
    const existingService = existingServices.find((es) => es.service_id === serviceId);
    const inTrialService = inTrialServices.find((its) => its.service_id === serviceId);
    return (existingService?.split_billing || inTrialService?.split_billing) === true;
  };

  const filteredServices = services.filter((s) => {
    if (!s.is_active) return false;
    const availability = s.service_availability || 'both';
    if (serviceType === 'pre-trial') {
      return (
        availability === 'pre_trial_only' ||
        availability === 'both' ||
        isAssignedWithSplitBilling(s.id)
      );
    }
    return (
      availability === 'in_trial_only' ||
      availability === 'both' ||
      isAssignedWithSplitBilling(s.id)
    );
  });

  const renderServiceRow = (service: ServiceRecord) => {
    const isAdded = addedServiceIds.includes(service.id);
    const rate = calculateRate(service.id, service.base_rate, clientId);
    return (
      <div
        key={service.id}
        className={`rounded-lg border p-2 ${
          isAdded ? 'border-green-300 bg-green-50' : 'border-stone-200'
        }`}
      >
        <div className="mb-1">
          <h5 className="font-medium text-sm">{service.name}</h5>
        </div>
        <div className="grid grid-cols-[1fr_auto_15%] gap-2 items-center">
          <div>
            {service.description && (
              <p className="text-xs text-stone-500">{service.description}</p>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs text-stone-600">
              {clientId && clientOverrides?.some((o) => o.service_id === service.id) && (
                <span className="mr-1 text-amber-600">⚡</span>
              )}
              ${rate.toLocaleString()}/{rateUnit(service)}
            </p>
          </div>
          <div className="text-right">
            <Button
              type="button"
              size="sm"
              onClick={() => onAddService(service.id)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const uncategorizedServices = filteredServices
    .filter((s) => !s.category_id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const uncategorizedKey = `${serviceType}-uncategorized`;
  const uncategorizedCollapsed = collapsedCategories.has(uncategorizedKey);

  return (
    <div className="space-y-6 overflow-y-auto pr-2">
      {serviceCategories
        .filter((cat) => cat.is_active && !isCategoryDefault(cat))
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((category) => {
          const categoryServices = filteredServices
            .filter((s) => s.category_id === category.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          if (categoryServices.length === 0) return null;

          const categoryKey = `${serviceType}-${category.id}`;
          const isCollapsed = collapsedCategories.has(categoryKey);
          const hasServicesAdded = addedServiceIds.some((id) => {
            const service = services.find((s) => s.id === id);
            return service?.category_id === category.id;
          });

          return (
            <div key={category.id}>
              <button
                type="button"
                onClick={() => onToggleCategory(categoryKey)}
                className={`w-full font-medium text-stone-900 mb-3 flex items-center gap-2 hover:opacity-70 transition-opacity p-2 rounded-lg ${
                  hasServicesAdded ? 'bg-green-50 border-2 border-green-300' : ''
                }`}
              >
                <div className="w-1 h-5 bg-indigo-600 rounded-full" />
                {category.name}
                <ChevronDown
                  className={`w-4 h-4 ml-auto transition-transform ${
                    isCollapsed ? '-rotate-90' : ''
                  }`}
                />
              </button>
              {!isCollapsed && (
                <div className="space-y-3 pl-3">{categoryServices.map(renderServiceRow)}</div>
              )}
            </div>
          );
        })}

      {uncategorizedServices.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => onToggleCategory(uncategorizedKey)}
            className="w-full font-medium text-stone-900 mb-3 flex items-center gap-2 hover:opacity-70 transition-opacity p-2 rounded-lg"
          >
            <div className="w-1 h-5 bg-stone-400 rounded-full" />
            Uncategorized
            <ChevronDown
              className={`w-4 h-4 ml-auto transition-transform ${
                uncategorizedCollapsed ? '-rotate-90' : ''
              }`}
            />
          </button>
          {!uncategorizedCollapsed && (
            <div className="space-y-3 pl-3">{uncategorizedServices.map(renderServiceRow)}</div>
          )}
        </div>
      )}
    </div>
  );
}
