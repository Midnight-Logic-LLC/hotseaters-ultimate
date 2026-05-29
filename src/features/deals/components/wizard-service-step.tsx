/**
 * wizard-service-step.tsx — the right-hand "selected services" panel for
 * wizard steps 3 (pre-trial) and 4 (in-trial). Port of the inline step-3/4
 * blocks in HotSeatersMVP/src/components/deals/DealWizard.jsx.
 *
 * DnD adaptation (RULE 0): the bible reorders service instances with
 * `@hello-pangea/dnd` (Droppable/Draggable). The port uses `@dnd-kit/sortable`
 * (already a port dep, used by the DealTracker kanban). Each service row is a
 * `useSortable` item inside a `SortableContext`; dropping reorders the array —
 * the same user-visible effect (display_order is taken from array index in
 * `buildServicesFromAnswers`).
 *
 * Deferred affordances (auditable parity gaps — see change report):
 *   • TODO(schedule ServiceAssignmentModal): the bible's per-row "assign team"
 *     (Users icon) opens a schedule-feature modal — deferred to that feature.
 *   • TODO(D04 assignments): the assigned-consultant avatars shown per saved
 *     row read TrialServiceAssignment data the D03 wizard doesn't load.
 *
 * Components consume hook-supplied props only (RULE B). HotSeatersMVP is the bible.
 */

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, parseISO } from 'date-fns';
import { GripVertical, Trash2, Edit, X, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { ServiceRecord } from '@/features/company/hooks/use-services';
import type { TrialSegment } from '@/features/trials/entities';
import { ServiceSegmentSelector } from './service-segment-selector';
import type {
  DealFormData,
  PreTrialServiceInstance,
  InTrialServiceInstance,
} from './deal-wizard-types';

interface PreTrialStepProps {
  phase: 'pre-trial';
  instances: PreTrialServiceInstance[];
  onReorder: (next: PreTrialServiceInstance[]) => void;
  updateInstance: (id: number | string, updates: Partial<PreTrialServiceInstance>) => void;
  removeInstance: (id: number | string) => void;
}

interface InTrialStepProps {
  phase: 'in-trial';
  instances: InTrialServiceInstance[];
  onReorder: (next: InTrialServiceInstance[]) => void;
  updateInstance: (id: number | string, updates: Partial<InTrialServiceInstance>) => void;
  removeInstance: (id: number | string) => void;
}

type CommonProps = {
  services: ServiceRecord[];
  dealData: DealFormData;
  trialSegments: TrialSegment[];
  calculateRate: (
    serviceId: string,
    baseRate: number,
    clientId: string,
    instanceId?: number | string | null,
  ) => number;
  calculateServiceDays: (
    serviceId: string,
    arrivalDate?: string | null,
    segmentId?: string | null,
  ) => number;
  dailyMinimumHours: number;
  travelMultiplier: number;
  overriddenRates: Record<string, number>;
  onRateOverride: (instanceId: number | string, serviceId: string) => void;
  onClearRateOverride: (instanceId: number | string) => void;
  calcTravelCost: (
    inst: { travel_eligible?: boolean | undefined; estimated_travel_hours?: number | null | undefined },
    svcRate: number,
  ) => number;
};

type WizardServiceStepProps = CommonProps & (PreTrialStepProps | InTrialStepProps);

const ROW_STYLE_BASE: React.CSSProperties = {
  padding: '0.75rem',
  backgroundColor: 'var(--theme-stone-100)',
  borderRadius: 'var(--theme-card-radius)',
};

const NUMBER_INPUT_CLASS =
  'text-xs text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

// ── Sortable row wrapper ──
function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (handleProps: Record<string, unknown>) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        ...ROW_STYLE_BASE,
        transform: CSS.Transform.toString(transform),
        transition,
        boxShadow: isDragging ? '0 10px 15px -3px rgba(0,0,0,0.1)' : 'var(--theme-card-shadow)',
      }}
    >
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

export function WizardServiceStep(props: WizardServiceStepProps) {
  const {
    services,
    dealData,
    trialSegments,
    calculateRate,
    calculateServiceDays,
    dailyMinimumHours,
    travelMultiplier,
    overriddenRates,
    onRateOverride,
    onClearRateOverride,
    calcTravelCost,
  } = props;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const ids = props.instances.map((i) => String(i.id));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    if (props.phase === 'pre-trial') {
      props.onReorder(arrayMove(props.instances, oldIndex, newIndex));
    } else {
      props.onReorder(arrayMove(props.instances, oldIndex, newIndex));
    }
  };

  const emptyState = (
    <div className="text-center py-8 text-stone-500">
      <p className="text-sm">
        No {props.phase === 'pre-trial' ? 'pre-trial' : 'in-trial'} services selected
      </p>
      <p className="text-xs mt-1">Add services from the left column</p>
    </div>
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div
          className={`${
            props.phase === 'pre-trial' ? 'max-h-[50vh]' : 'max-h-[35vh]'
          } overflow-y-auto space-y-3 pr-1`}
        >
          {props.phase === 'pre-trial'
            ? props.instances.map((instance) => {
                const service = services.find((s) => s.id === instance.service_id);
                if (!service) return null;
                const rate = calculateRate(
                  service.id,
                  service.base_rate,
                  dealData.client_id,
                  instance.id,
                );
                const total = rate * (instance.quantity || 1);
                const hasOverride = overriddenRates[String(instance.id)] !== undefined;
                return (
                  <SortableRow key={String(instance.id)} id={String(instance.id)}>
                    {(handleProps) => (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="cursor-grab active:cursor-grabbing" {...handleProps}>
                              <GripVertical className="w-4 h-4 text-stone-400" />
                            </div>
                            <h5 className="font-medium text-stone-900 text-sm">
                              {service.name}
                              {instance.split_billing && (
                                <Badge variant="outline" className="ml-2 text-xs bg-blue-50">
                                  Split Billing
                                </Badge>
                              )}
                            </h5>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => props.removeInstance(instance.id)}
                              className="h-5 w-5 p-0 text-stone-400 hover:text-red-600"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="mb-0.5">
                          <textarea
                            placeholder="Custom description (optional)"
                            value={instance.custom_description || ''}
                            onChange={(e) =>
                              props.updateInstance(instance.id, {
                                custom_description: e.target.value,
                              })
                            }
                            style={{ backgroundColor: 'white' }}
                            className="w-full text-xs border border-stone-200 rounded px-2 py-1 min-h-[50px] resize-y"
                          />
                        </div>
                        <div className="grid grid-cols-[45%_1fr_15%] gap-2 items-center">
                          <div className="flex items-center gap-1 p-0">
                            <span className="text-xs text-stone-500 whitespace-nowrap">
                              begin work
                            </span>
                            <Input
                              type="number"
                              min="0"
                              placeholder="Lead"
                              value={instance.lead_days ?? ''}
                              onChange={(e) =>
                                props.updateInstance(instance.id, {
                                  lead_days: e.target.value ? parseInt(e.target.value, 10) : undefined,
                                })
                              }
                              style={{ backgroundColor: 'white' }}
                              className={`w-16 h-7 ${NUMBER_INPUT_CLASS}`}
                            />
                            <span className="text-xs text-stone-500 whitespace-nowrap">
                              days before trial
                            </span>
                          </div>
                          <div className="flex items-center gap-2 justify-end p-2">
                            <Input
                              type="number"
                              min="1"
                              value={instance.quantity || 1}
                              onChange={(e) =>
                                props.updateInstance(instance.id, {
                                  quantity: parseInt(e.target.value, 10) || 1,
                                })
                              }
                              style={{ backgroundColor: 'white' }}
                              className={`w-16 h-7 ${NUMBER_INPUT_CLASS}`}
                            />
                            <span className="text-xs text-stone-600">
                              hours ×{' '}
                              {hasOverride ? (
                                <span className="text-orange-600 font-semibold">
                                  {' '}
                                  ⚙️ ${rate.toLocaleString()}
                                </span>
                              ) : (
                                <span> ${rate.toLocaleString()}</span>
                              )}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                hasOverride
                                  ? onClearRateOverride(instance.id)
                                  : onRateOverride(instance.id, service.id)
                              }
                              className="h-5 w-5 p-0"
                              title={hasOverride ? 'Clear override' : 'Override rate'}
                            >
                              {hasOverride ? (
                                <X className="w-3 h-3 text-orange-600" />
                              ) : (
                                <Edit className="w-3 h-3 text-stone-400" />
                              )}
                            </Button>
                          </div>
                          <div className="text-right p-0">
                            <span className="text-base font-semibold text-green-600">
                              ${total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {trialSegments.length > 0 && (
                          <ServiceSegmentSelector
                            segments={trialSegments}
                            dealData={dealData}
                            segmentId={instance.segment_id}
                            onChange={(val) =>
                              props.updateInstance(instance.id, { segment_id: val })
                            }
                          />
                        )}
                      </>
                    )}
                  </SortableRow>
                );
              })
            : props.instances.map((instance) => {
                const service = services.find((s) => s.id === instance.service_id);
                if (!service) return null;
                const rate = calculateRate(
                  service.id,
                  service.base_rate,
                  dealData.client_id,
                  instance.id,
                );
                const hasOverride = overriddenRates[String(instance.id)] !== undefined;
                const useDailyMinimum = service.has_daily_minimum;
                let serviceDays = 1;
                let total: number;
                if (useDailyMinimum) {
                  serviceDays = calculateServiceDays(
                    service.id,
                    instance.arrival_date,
                    instance.segment_id,
                  );
                  total = rate * dailyMinimumHours * serviceDays;
                } else {
                  total = rate * (instance.quantity || 1);
                }
                return (
                  <SortableRow key={String(instance.id)} id={String(instance.id)}>
                    {(handleProps) => (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="cursor-grab active:cursor-grabbing" {...handleProps}>
                              <GripVertical className="w-4 h-4 text-stone-400" />
                            </div>
                            <h5 className="font-medium text-stone-900 text-sm">
                              {service.name}
                              {service.has_daily_minimum && !instance.split_billing && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Daily Min
                                </Badge>
                              )}
                            </h5>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => props.removeInstance(instance.id)}
                              className="h-5 w-5 p-0 text-stone-400 hover:text-red-600"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="mb-0.5">
                          <textarea
                            placeholder="Custom description (optional)"
                            value={instance.custom_description || ''}
                            onChange={(e) =>
                              props.updateInstance(instance.id, {
                                custom_description: e.target.value,
                              })
                            }
                            style={{ backgroundColor: 'white' }}
                            className="w-full text-xs border border-stone-200 rounded px-2 py-1 min-h-[50px] resize-y"
                          />
                        </div>
                        <div className="mt-3 p-2 bg-stone-50 border border-stone-200 rounded space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`travel-eligible-${instance.id}`}
                              checked={instance.travel_eligible || false}
                              onChange={(e) =>
                                props.updateInstance(instance.id, {
                                  travel_eligible: e.target.checked,
                                  estimated_travel_hours: e.target.checked
                                    ? (instance.estimated_travel_hours ?? 0)
                                    : null,
                                })
                              }
                              className="w-3.5 h-3.5 text-indigo-600 rounded"
                            />
                            <Label
                              htmlFor={`travel-eligible-${instance.id}`}
                              className="text-xs text-stone-700 cursor-pointer"
                            >
                              Allow Travel Time Billing
                            </Label>
                          </div>
                          {instance.travel_eligible && (
                            <div className="ml-4 space-y-1">
                              <div className="flex items-center gap-2">
                                <Label
                                  htmlFor={`travel-hours-${instance.id}`}
                                  className="text-xs text-stone-600 whitespace-nowrap"
                                >
                                  Estimated Travel Hours:
                                </Label>
                                <Input
                                  id={`travel-hours-${instance.id}`}
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  placeholder="0"
                                  value={instance.estimated_travel_hours ?? ''}
                                  onChange={(e) =>
                                    props.updateInstance(instance.id, {
                                      estimated_travel_hours: e.target.value
                                        ? parseFloat(e.target.value)
                                        : null,
                                    })
                                  }
                                  style={{ backgroundColor: 'white' }}
                                  className={`w-20 h-6 ${NUMBER_INPUT_CLASS}`}
                                />
                              </div>
                              {(instance.estimated_travel_hours ?? 0) > 0 && (
                                <div className="text-right text-xs text-stone-500">
                                  Travel: {instance.estimated_travel_hours}h × $
                                  {(rate * travelMultiplier).toLocaleString()}/hr ={' '}
                                  <span className="text-base font-semibold text-green-600">
                                    ${calcTravelCost(instance, rate).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {trialSegments.length > 0 && (
                          <ServiceSegmentSelector
                            segments={trialSegments}
                            dealData={dealData}
                            segmentId={instance.segment_id}
                            onChange={(val) =>
                              props.updateInstance(instance.id, { segment_id: val })
                            }
                          />
                        )}
                        {useDailyMinimum ? (
                          <div className="grid grid-cols-[35%_1fr_15%] gap-2 items-center">
                            <div className="p-0">
                              <Popover>
                                <PopoverTrigger
                                  render={
                                    <Button
                                      variant="outline"
                                      className="h-7 text-xs justify-start px-2 w-full"
                                    >
                                      <CalendarIcon className="mr-1 h-3 w-3" />
                                      {instance.arrival_date
                                        ? format(parseISO(instance.arrival_date), 'MMM d')
                                        : 'Arrival Date'}
                                    </Button>
                                  }
                                />
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={
                                      instance.arrival_date
                                        ? parseISO(instance.arrival_date)
                                        : undefined
                                    }
                                    onSelect={(date) =>
                                      props.updateInstance(instance.id, {
                                        arrival_date: date ? format(date, 'yyyy-MM-dd') : null,
                                      })
                                    }
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div className="flex items-center gap-2 justify-end p-2">
                              <span className="text-xs text-stone-600">
                                {serviceDays}d × {dailyMinimumHours}h ×{' '}
                                {hasOverride ? (
                                  <span className="text-orange-600 font-semibold">
                                    {' '}
                                    ⚙️ ${rate.toLocaleString()}
                                  </span>
                                ) : (
                                  <span> ${rate.toLocaleString()}</span>
                                )}
                                /hour
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  hasOverride
                                    ? onClearRateOverride(instance.id)
                                    : onRateOverride(instance.id, service.id)
                                }
                                className="h-6 w-6 p-0"
                                title={hasOverride ? 'Clear override' : 'Override rate'}
                              >
                                {hasOverride ? (
                                  <X className="w-3 h-3 text-orange-600" />
                                ) : (
                                  <Edit className="w-3 h-3 text-stone-400" />
                                )}
                              </Button>
                            </div>
                            <div className="text-right p-0">
                              <span className="text-base font-semibold text-green-600">
                                ${total.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-[1fr_15%] gap-2 items-center">
                            <div className="flex items-center gap-1 justify-end p-0">
                              <Input
                                type="number"
                                min="1"
                                value={instance.quantity || 1}
                                onChange={(e) =>
                                  props.updateInstance(instance.id, {
                                    quantity: parseInt(e.target.value, 10) || 1,
                                  })
                                }
                                style={{ backgroundColor: 'white' }}
                                className={`w-16 h-7 ${NUMBER_INPUT_CLASS}`}
                              />
                              <span className="text-xs text-stone-600">
                                hours ×{' '}
                                {hasOverride ? (
                                  <span className="text-orange-600 font-semibold">
                                    {' '}
                                    ⚙️ ${rate.toLocaleString()}
                                  </span>
                                ) : (
                                  <span> ${rate.toLocaleString()}</span>
                                )}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  hasOverride
                                    ? onClearRateOverride(instance.id)
                                    : onRateOverride(instance.id, service.id)
                                }
                                className="h-6 w-6 p-0"
                              >
                                {hasOverride ? (
                                  <X className="w-3 h-3 text-orange-600" />
                                ) : (
                                  <Edit className="w-3 h-3 text-stone-400" />
                                )}
                              </Button>
                            </div>
                            <div className="text-right p-2">
                              <span className="text-base font-semibold text-green-600">
                                ${total.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </SortableRow>
                );
              })}
          {props.instances.length === 0 && emptyState}
        </div>
      </SortableContext>
    </DndContext>
  );
}
