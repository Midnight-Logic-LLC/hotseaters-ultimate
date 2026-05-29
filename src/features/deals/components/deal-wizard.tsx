/**
 * deal-wizard.tsx — port of HotSeatersMVP/src/components/deals/DealWizard.jsx.
 *
 * The deal-creation / edit wizard: a 4-step flow
 *   1. Client & Contact     (sales lead · client/contacts · FRP)
 *   2. Case Details         (case info · trial dates/segments · venue & court)
 *   3. Pre-Trial Services   (available column + selected/reorderable column)
 *   4. In-Trial Services    (available column + selected column + retainer)
 *
 * Create + edit modes. In edit mode the trial's saved services / secondary
 * contacts are hydrated and the step pips are clickable (jump-to-step).
 *
 * Architecture (RULE B/C/D): this component consumes the `useDealWizardData`
 * read hook and the `createDeal`/`updateDeal` actions passed in from the page
 * (which owns the `useDealsTrialsData` hook). All pricing/date math runs through
 * the pure `business-rules/build-trial-services` + `pdr-calculations` modules
 * (RULE J). DnD reorder uses `@dnd-kit/sortable` (RULE 0 — bible used
 * `@hello-pangea/dnd`). HotSeatersMVP is the bible.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Trial } from '@/features/trials/entities';
import { useDealWizardData } from '@/features/deals/hooks/use-deal-wizard-data';
import type { DealWritePayload } from '@/features/deals/hooks/use-deals-trials-data';
import { useVenueSearch } from '@/features/deals/hooks/use-venue-search';
import {
  buildTrialServices,
  calculateRetainer,
  type BuilderService,
} from '@/features/deals/business-rules/build-trial-services';
import { WizardStep1ClientContact, type NewClientDraft } from './wizard-step1-client-contact';
import { WizardStep2CaseDetails } from './wizard-step2-case-details';
import { AvailableServicesColumn } from './available-services-column';
import { WizardServiceStep } from './wizard-service-step';
import { WizardDialogs, type ContractWarning } from './wizard-dialogs';
import type {
  DealFormData,
  PreTrialServiceInstance,
  InTrialServiceInstance,
  DateRangeValue,
  RangePickerSide,
} from './deal-wizard-types';

export interface DealWizardProps {
  /** The trial being edited, or null for a new deal. */
  trial?: Trial | null;
  mode?: 'deal' | 'trial';
  preselectedClientId?: string | null;
  preselectedContactId?: string | null;
  isLoading?: boolean;
  onCancel: () => void;
  /**
   * Persist the deal. Returns the created/updated trial. The wizard builds the
   * service rows + secondary-contact list and hands them off; the page wires
   * this to `createDeal` / `updateDeal`.
   */
  onSubmit: (payload: DealWritePayload, isEditing: boolean) => Promise<Trial>;
}

const TRAVEL_MULTIPLIER_FALLBACK = 0.5;

function emptyDealData(clientId: string | null, contactId: string | null): DealFormData {
  return {
    client_id: clientId || '',
    primary_contact_id: contactId || '',
    secondary_contact_ids: [],
    consultant_id: '',
    case_name: '',
    case_style: '',
    case_number: '',
    court: '',
    judge: '',
    case_type: '',
    side: '',
    retainer_value: '',
    override_daily_minimum_hours: '',
    courthouse: '',
    city: '',
    state: '',
    start_date: '',
    end_date: '',
    frp_client_id: '',
    frp_contact_id: '',
    services: [],
  };
}

export function DealWizard({
  trial = null,
  mode = 'deal',
  preselectedClientId = null,
  preselectedContactId = null,
  isLoading = false,
  onCancel,
  onSubmit,
}: DealWizardProps) {
  const isEditing = !!trial;
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [dealData, setDealData] = useState<DealFormData>(() =>
    emptyDealData(preselectedClientId, preselectedContactId),
  );

  // Feed the LIVE selected client (dealData.client_id) into the data hook so
  // clientOverrides + rates reload when the user changes the client in step 1.
  // Falls back to the preselected id until the form initializes.
  const data = useDealWizardData({
    trialId: trial?.id ?? null,
    clientId: dealData.client_id || preselectedClientId,
  });
  const {
    services,
    clients,
    clientTypes,
    serviceCategories,
    pipelineStages,
    consultants,
    attorneys,
    clientOverrides,
    existingServices,
    trialSegments,
    companyDefaults,
    companyId,
    createClient,
  } = data;
  const [dateRange, setDateRange] = useState<DateRangeValue | undefined>(undefined);
  const [activeRangePicker, setActiveRangePicker] = useState<RangePickerSide>('from');
  const [hasFRP, setHasFRP] = useState(false);
  const [preTrialServices, setPreTrialServices] = useState<PreTrialServiceInstance[]>([]);
  const [inTrialServices, setInTrialServices] = useState<InTrialServiceInstance[]>([]);
  const [billForWeekends, setBillForWeekends] = useState(true);
  const [retainerEnabled, setRetainerEnabled] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [overriddenRates, setOverriddenRates] = useState<Record<string, number>>({});

  // Dialog state.
  const [showNoServicesAlert, setShowNoServicesAlert] = useState(false);
  const [showContractWarning, setShowContractWarning] = useState<ContractWarning | null>(null);
  const [showRateOverrideDialog, setShowRateOverrideDialog] = useState(false);
  const [rateOverrideInstanceId, setRateOverrideInstanceId] = useState<number | string | null>(null);
  const [rateOverrideServiceId, setRateOverrideServiceId] = useState<string | null>(null);
  const [newRateValue, setNewRateValue] = useState('');

  const venue = useVenueSearch();

  const formInitializedRef = useRef(false);
  const servicesLoadedRef = useRef(false);
  useEffect(() => {
    formInitializedRef.current = false;
    servicesLoadedRef.current = false;
  }, [trial?.id]);

  // ── Seed default-collapsed categories once services/categories load ──
  useEffect(() => {
    if (services.length > 0 && serviceCategories.length > 0 && collapsedCategories.size === 0) {
      const nc = new Set<string>();
      serviceCategories.forEach((cat) => {
        nc.add(`pre-trial-${cat.id}`);
        nc.add(`in-trial-${cat.id}`);
      });
      nc.add('pre-trial-uncategorized');
      nc.add('in-trial-uncategorized');
      setCollapsedCategories(nc);
    }
  }, [services, serviceCategories, collapsedCategories.size]);

  // ── New-deal: default the sales lead to the current user when appropriate ──
  // (Bible auto-selects for sales role / preselected client.) The port keeps
  // it simple: the user picks the sales lead. No auto-select side effect needed.

  // ── Edit-mode: hydrate dealData + secondary contacts from the trial ──
  useEffect(() => {
    if (!trial || data.isLoading || formInitializedRef.current) return;
    formInitializedRef.current = true;

    const secondaryIds = data.existingContacts
      .filter((tc) => tc.trial_id === trial.id)
      .map((tc) => tc.attorney_id);

    setDealData({
      client_id: trial.client_id || '',
      primary_contact_id: trial.primary_contact_id || '',
      secondary_contact_ids: secondaryIds,
      consultant_id: trial.consultant_id || '',
      case_name: trial.case_name || '',
      case_style: trial.case_style || '',
      case_number: trial.case_number || '',
      court: trial.court || '',
      judge: trial.judge || '',
      case_type: trial.case_type || '',
      side: trial.side || '',
      retainer_value: trial.retainer_value ?? '',
      override_daily_minimum_hours: trial.daily_minimum_hours ?? '',
      courthouse: trial.courthouse || '',
      city: trial.city || '',
      state: trial.state || '',
      start_date: trial.start_date || '',
      end_date: trial.end_date || '',
      frp_client_id: trial.frp_client_id || '',
      frp_contact_id: trial.frp_contact_id || '',
      services: [],
    });
    if (trial.start_date && trial.end_date) {
      setDateRange({ from: parseISO(trial.start_date), to: parseISO(trial.end_date) });
    }
    setBillForWeekends(trial.bill_for_weekends ?? true);
    setHasFRP(!!trial.frp_client_id);
    setRetainerEnabled(trial.retainer_value !== 0);
    // Seed existing-venue suggestions so the saved values render.
    if (trial.courthouse) venue.setVenueSuggestions([{ courthouse: trial.courthouse, isExisting: true }]);
    if (trial.court) venue.setCourtSuggestions([{ court: trial.court, isExisting: true }]);
    if (trial.judge) venue.setJudgeSuggestions([{ judge: trial.judge, isExisting: true }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial, data.isLoading, data.existingContacts]);

  // ── Edit-mode: hydrate pre/in-trial service instances from saved rows ──
  useEffect(() => {
    if (servicesLoadedRef.current) return;
    if (!trial || existingServices.length === 0 || services.length === 0) return;
    servicesLoadedRef.current = true;

    const rows = existingServices
      .filter((ts) => ts.trial_id === trial.id)
      .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));

    const preList: PreTrialServiceInstance[] = [];
    const inList: InTrialServiceInstance[] = [];
    const detectedOverrides: Record<string, number> = {};

    rows.forEach((ts) => {
      const service = services.find((s) => s.id === ts.service_id);
      if (!service) return;
      const expectedRate = calculateRate(service.id, service.base_rate, trial.client_id || '', null);
      if (ts.rate != null && Math.abs(ts.rate - expectedRate) > 0.01) {
        detectedOverrides[ts.id] = ts.rate;
      }
      const phase =
        ts.service_phase ||
        (ts.final_billing_method === 'split'
          ? 'split'
          : ts.final_billing_method === 'hourly'
            ? 'pre_trial'
            : 'in_trial');
      const seg = ts.segment_id ? trialSegments.find((s) => s.id === ts.segment_id) : null;
      const segStart = seg?.start_date || trial.start_date || '';

      if (phase === 'split') {
        const leadDays =
          segStart && ts.start_date
            ? Math.floor((parseISO(segStart).getTime() - parseISO(ts.start_date).getTime()) / 86400000)
            : (service.default_lead_days ?? 0);
        preList.push({
          id: ts.id,
          service_id: ts.service_id ?? '',
          quantity: ts.pre_trial_estimated_hours ?? 1,
          lead_days: leadDays,
          split_billing: true,
          custom_description: ts.custom_description ?? '',
          travel_eligible: ts.travel_eligible || false,
          estimated_travel_hours: ts.estimated_travel_hours ?? 0,
          segment_id: ts.segment_id ?? null,
        });
        inList.push({
          id: ts.id,
          service_id: ts.service_id ?? '',
          arrival_date: ts.start_date !== segStart ? ts.start_date : null,
          split_billing: true,
          pre_trial_hours: ts.pre_trial_estimated_hours ?? 1,
          start_date: ts.start_date,
          end_date: ts.end_date,
          custom_description: ts.custom_description ?? '',
          travel_eligible: ts.travel_eligible || false,
          estimated_travel_hours: ts.estimated_travel_hours ?? 0,
          segment_id: ts.segment_id ?? null,
        });
      } else if (phase === 'in_trial') {
        inList.push({
          id: ts.id,
          service_id: ts.service_id ?? '',
          arrival_date: ts.start_date !== segStart ? ts.start_date : null,
          split_billing: false,
          end_date: ts.end_date,
          quantity: ts.final_billing_method === 'hourly' ? (ts.estimated_quantity ?? 1) : undefined,
          // Preserve the in-trial offset (bible DealWizard.jsx ~L377) so
          // buildTrialServices recomputes the correct start_date on next save.
          days_before_trial: ts.days_before_trial ?? undefined,
          custom_description: ts.custom_description ?? '',
          travel_eligible: ts.travel_eligible || false,
          estimated_travel_hours: ts.estimated_travel_hours ?? 0,
          segment_id: ts.segment_id ?? null,
        });
      } else {
        const leadDays =
          segStart && ts.start_date
            ? Math.floor((parseISO(segStart).getTime() - parseISO(ts.start_date).getTime()) / 86400000)
            : (service.default_lead_days ?? 0);
        const durationDays =
          ts.start_date && ts.end_date
            ? Math.floor((parseISO(ts.end_date).getTime() - parseISO(ts.start_date).getTime()) / 86400000) + 1
            : (service.default_duration_days ?? 1);
        preList.push({
          id: ts.id,
          service_id: ts.service_id ?? '',
          quantity: ts.estimated_quantity ?? 1,
          lead_days: leadDays,
          duration_days: durationDays,
          split_billing: false,
          start_date: ts.start_date,
          end_date: ts.end_date,
          custom_description: ts.custom_description ?? '',
          travel_eligible: ts.travel_eligible || false,
          estimated_travel_hours: ts.estimated_travel_hours ?? 0,
          segment_id: ts.segment_id ?? null,
        });
      }
    });
    setPreTrialServices(preList);
    setInTrialServices(inList);
    setOverriddenRates(detectedOverrides);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial, existingServices, services, trialSegments]);

  // ── Derived data ──
  const dailyMinimumHours =
    dealData.override_daily_minimum_hours !== '' && dealData.override_daily_minimum_hours !== null
      ? parseFloat(String(dealData.override_daily_minimum_hours))
      : companyDefaults.default_daily_minimum_hours;

  const travelMultiplier =
    services.find((s) => s.name === 'Travel Time' && s.is_active)?.travel_multiplier ||
    TRAVEL_MULTIPLIER_FALLBACK;

  const isExistingTrial =
    !!trial && pipelineStages.find((s) => s.id === trial.pipeline_stage_id)?.type === 'operations';

  // Rate resolver — overrides → client overrides → client-type multiplier.
  function calculateRate(
    serviceId: string,
    baseRate: number,
    clientId: string,
    instanceId: number | string | null = null,
  ): number {
    if (instanceId !== null && overriddenRates[String(instanceId)] !== undefined) {
      return overriddenRates[String(instanceId)]!;
    }
    if (clientId) {
      const override = clientOverrides.find((o) => o.service_id === serviceId);
      if (override && override.custom_rate != null) {
        return typeof override.custom_rate === 'number'
          ? override.custom_rate
          : parseFloat(override.custom_rate) || baseRate;
      }
    }
    const client = clients.find((c) => c.id === clientId);
    const clientType = clientTypes.find((t) => t.id === client?.client_type_id);
    return baseRate * (clientType?.multiplier || 1);
  }

  function dayCount(start: string, end: string): number {
    const s = new Date(`${start}T00:00:00`);
    const e = new Date(`${end}T00:00:00`);
    let total = Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1;
    if (!billForWeekends) {
      let wc = 0;
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0 && d.getDay() !== 6) wc++;
      }
      total = wc;
    }
    return total;
  }

  function calculateTrialDays(): number {
    if (!dealData.start_date || !dealData.end_date) return 1;
    return dayCount(dealData.start_date, dealData.end_date);
  }

  function calculateServiceDays(
    _serviceId: string,
    arrivalDate: string | null = null,
    segmentId: string | null = null,
  ): number {
    const seg = segmentId ? trialSegments.find((s) => s.id === segmentId) : null;
    const rangeStart = seg?.start_date || dealData.start_date;
    const rangeEnd = seg?.end_date || dealData.end_date;
    if (!rangeEnd || !rangeStart) return 1;
    return dayCount(arrivalDate || rangeStart, rangeEnd);
  }

  const builderServices: BuilderService[] = useMemo(
    () =>
      services.map((s) => ({
        id: s.id,
        name: s.name,
        base_rate: s.base_rate,
        rate_type: s.rate_type,
        has_daily_minimum: s.has_daily_minimum,
      })),
    [services],
  );

  function buildServices() {
    return buildTrialServices({
      dealData,
      services: builderServices,
      segments: trialSegments,
      preTrialServices,
      inTrialServices,
      calculateRate,
      dailyMinimumHours,
      isExistingTrial,
      calculateTrialDays,
      calculateServiceDays,
      billForWeekends,
    });
  }

  const calcTravelCost = (
    inst: { travel_eligible?: boolean | undefined; estimated_travel_hours?: number | null | undefined },
    svcRate: number,
  ): number =>
    inst.travel_eligible && (inst.estimated_travel_hours ?? 0) > 0
      ? (inst.estimated_travel_hours ?? 0) * svcRate * travelMultiplier
      : 0;

  // ── Service add / remove / update ──
  const addPreTrialService = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;
    setPreTrialServices((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        service_id: serviceId,
        quantity: 1,
        lead_days: service.default_lead_days ?? undefined,
        duration_days: service.default_duration_days ?? undefined,
        custom_description: '',
        travel_eligible: false,
        estimated_travel_hours: null,
      },
    ]);
  };
  const addInTrialService = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    setInTrialServices((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        service_id: serviceId,
        arrival_date: null,
        quantity: service?.has_daily_minimum ? undefined : 1,
        days_before_trial: service?.has_daily_minimum ? undefined : 0,
        custom_description: '',
        travel_eligible: false,
        estimated_travel_hours: null,
      },
    ]);
  };
  const updatePreTrialService = (id: number | string, updates: Partial<PreTrialServiceInstance>) =>
    setPreTrialServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  const updateInTrialService = (id: number | string, updates: Partial<InTrialServiceInstance>) =>
    setInTrialServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  const removePreTrialService = (id: number | string) =>
    setPreTrialServices((prev) => prev.filter((s) => s.id !== id));
  const removeInTrialService = (id: number | string) =>
    setInTrialServices((prev) => prev.filter((s) => s.id !== id));

  const toggleCategory = (key: string) =>
    setCollapsedCategories((prev) => {
      const nc = new Set(prev);
      if (nc.has(key)) nc.delete(key);
      else nc.add(key);
      return nc;
    });

  const toggleSecondaryContact = (contactId: string) =>
    setDealData((prev) => ({
      ...prev,
      secondary_contact_ids: prev.secondary_contact_ids.includes(contactId)
        ? prev.secondary_contact_ids.filter((id) => id !== contactId)
        : [...prev.secondary_contact_ids, contactId],
    }));

  const promptForRateOverride = (instanceId: number | string, serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;
    const currentRate = calculateRate(serviceId, service.base_rate, dealData.client_id, instanceId);
    setRateOverrideInstanceId(instanceId);
    setRateOverrideServiceId(serviceId);
    setNewRateValue(currentRate.toFixed(2));
    setShowRateOverrideDialog(true);
  };
  const onRateOverride = (instanceId: number | string, serviceId: string) =>
    promptForRateOverride(instanceId, serviceId);
  const clearRateOverride = (instanceId: number | string) =>
    setOverriddenRates((prev) => {
      const next = { ...prev };
      delete next[String(instanceId)];
      return next;
    });

  // ── Sales-lead-scoped + FRP client lists ──
  const salesConsultants = useMemo(
    () => consultants.filter((c) => ['owner', 'admin', 'sales'].includes(c.company_role ?? '') && c.status === 'active'),
    [consultants],
  );
  const filteredClients = useMemo(
    () =>
      dealData.consultant_id
        ? clients.filter((c) => c.id === dealData.client_id || c.sales_lead === dealData.consultant_id)
        : clients,
    [clients, dealData.consultant_id, dealData.client_id],
  );
  const frpClients = useMemo(
    () =>
      clients.filter((c) => {
        const ct = clientTypes.find((t) => t.id === c.client_type_id);
        return ct?.name === 'Financially Responsible Party';
      }),
    [clients, clientTypes],
  );
  const clientContacts = useMemo(
    () => attorneys.filter((a) => a.client_id === dealData.client_id),
    [attorneys, dealData.client_id],
  );
  const frpContacts = useMemo(
    () => attorneys.filter((a) => a.client_id === dealData.frp_client_id),
    [attorneys, dealData.frp_client_id],
  );

  const salesStages = pipelineStages.filter((s) => s.type === 'sales' && s.is_active);
  const firstSalesStage = salesStages[0] ?? null;

  // ── Estimated value + retainer ──
  const estimatedValue = useMemo(() => {
    const built = buildServices();
    const svcTotal = built.reduce((sum, s) => sum + (s.estimated_total || 0), 0);
    const trvTotal = [...preTrialServices, ...inTrialServices].reduce((sum, inst) => {
      const svc = services.find((s) => s.id === inst.service_id);
      if (!svc) return sum;
      return sum + calcTravelCost(inst, calculateRate(svc.id, svc.base_rate, dealData.client_id, inst.id));
    }, 0);
    return svcTotal + trvTotal;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preTrialServices, inTrialServices, services, dealData, overriddenRates, billForWeekends, trialSegments]);

  const recalcRetainer = () =>
    setDealData((prev) => ({ ...prev, retainer_value: calculateRetainer(estimatedValue, companyDefaults) }));

  // ── Submit ──
  const handleSaveOrSubmit = async () => {
    const built = buildServices();
    if (built.length === 0) {
      setShowNoServicesAlert(true);
      return;
    }
    const calculatedRetainer = calculateRetainer(estimatedValue, companyDefaults);
    const finalRetainer =
      dealData.retainer_value !== '' && dealData.retainer_value !== undefined
        ? parseFloat(String(dealData.retainer_value))
        : calculatedRetainer;

    const trialData: Partial<Trial> = {
      client_id: dealData.client_id || null,
      primary_contact_id: dealData.primary_contact_id || null,
      consultant_id: dealData.consultant_id || null,
      frp_client_id: dealData.frp_client_id || null,
      frp_contact_id: dealData.frp_contact_id || null,
      case_name: dealData.case_name || null,
      case_style: dealData.case_style || null,
      case_number: dealData.case_number || null,
      case_type: dealData.case_type || null,
      side: dealData.side || null,
      court: dealData.court || null,
      judge: dealData.judge || null,
      courthouse: dealData.courthouse || null,
      city: dealData.city || null,
      state: dealData.state || null,
      start_date: dealData.start_date || null,
      end_date: dealData.end_date || null,
      pipeline_stage_id: trial?.pipeline_stage_id || firstSalesStage?.id || null,
      estimated_value: estimatedValue,
      retainer_value: finalRetainer,
      daily_minimum_hours: dailyMinimumHours,
      bill_for_weekends: billForWeekends,
    };

    setSaving(true);
    try {
      await onSubmit(
        {
          ...(isEditing && trial ? { id: trial.id } : {}),
          trialData,
          services: built,
          secondaryContacts: dealData.secondary_contact_ids,
        } as DealWritePayload,
        isEditing,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreateClient = async (draft: NewClientDraft): Promise<string> => {
    // Inline client create routes through the wizard data hook's createClient
    // action (RULE B: components consume hooks; the hook owns the store seam).
    if (!companyId) throw new Error('No active company');
    return createClient({
      company_id: companyId,
      firm_name: draft.firm_name,
      client_type_id: draft.client_type_id || null,
      sales_lead: dealData.consultant_id || null,
    });
  };

  const canProceed = (): boolean => {
    if (currentStep === 1) {
      const basicValid = dealData.consultant_id && dealData.client_id && dealData.primary_contact_id;
      if (!basicValid) return false;
      if (hasFRP) return !!(dealData.frp_client_id && dealData.frp_contact_id);
      return true;
    }
    if (currentStep === 2) return !!(dealData.case_name && dealData.start_date && dealData.end_date);
    return true;
  };

  const steps = [
    { number: 1, title: 'Client & Contact' },
    { number: 2, title: 'Case Details' },
    { number: 3, title: 'Pre-Trial Services' },
    { number: 4, title: 'In-Trial Services' },
  ];

  const busy = isLoading || saving;

  // ── Loading gate ──
  if (data.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-24">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4"
              style={{ borderColor: 'var(--theme-brand-primary)' }}
            />
            <p className="text-stone-500 text-sm">
              {isEditing ? 'Loading trial data...' : 'Loading...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-stone-100">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-xl">
            {trial
              ? `${mode === 'trial' ? 'Edit Trial' : 'Edit Deal'}: ${dealData.case_name || 'Untitled'}`
              : `New Deal: ${dealData.case_name || 'Untitled'}`}
          </CardTitle>
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        </div>
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <div key={step.number} className="contents">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => isEditing && setCurrentStep(step.number)}
                  disabled={!isEditing}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep > step.number
                      ? 'bg-green-600 text-white'
                      : currentStep === step.number
                        ? 'text-white'
                        : 'bg-stone-200 text-stone-600'
                  } ${isEditing ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                  style={
                    currentStep === step.number
                      ? { backgroundColor: 'var(--theme-brand-operations)' }
                      : {}
                  }
                >
                  {currentStep > step.number ? <CheckCircle2 className="w-5 h-5" /> : step.number}
                </button>
                <span
                  className={`text-sm font-medium ${
                    currentStep === step.number ? 'text-stone-900' : 'text-stone-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    currentStep > step.number ? 'bg-green-600' : 'bg-stone-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {currentStep === 1 && (
          <WizardStep1ClientContact
            dealData={dealData}
            setDealData={setDealData}
            salesConsultants={salesConsultants}
            filteredClients={filteredClients}
            clientContacts={clientContacts}
            clientTypes={clientTypes}
            hasFRP={hasFRP}
            setHasFRP={setHasFRP}
            frpClients={frpClients}
            frpContacts={frpContacts}
            toggleSecondaryContact={toggleSecondaryContact}
            onCreateClient={handleCreateClient}
            onCreateFRPClient={handleCreateClient}
          />
        )}

        {/* TODO(D05): when the trial start/end date changes here, cascade-
            recompute already-scheduled service start/end dates. Bible applies
            this offset shift on edit; deferred to D05 (no seam yet). */}
        {currentStep === 2 && (
          <WizardStep2CaseDetails
            dealData={dealData}
            setDealData={setDealData}
            dateRange={dateRange}
            setDateRange={setDateRange}
            activeRangePicker={activeRangePicker}
            setActiveRangePicker={setActiveRangePicker}
            trial={trial}
            pipelineStages={pipelineStages}
            segments={trialSegments}
            venueSuggestions={venue.venueSuggestions}
            setVenueSuggestions={venue.setVenueSuggestions}
            isSearchingVenue={venue.isSearchingVenue}
            searchVenues={venue.searchVenues}
            courtSuggestions={venue.courtSuggestions}
            setCourtSuggestions={venue.setCourtSuggestions}
            isSearchingCourts={venue.isSearchingCourts}
            searchCourts={venue.searchCourts}
            judgeSuggestions={venue.judgeSuggestions}
            setJudgeSuggestions={venue.setJudgeSuggestions}
            isSearchingJudges={venue.isSearchingJudges}
            searchJudges={venue.searchJudges}
          />
        )}

        {currentStep === 3 && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="pb-3 border-b border-stone-200">
                <h3 className="font-semibold text-stone-900">Available Pre-Trial Services</h3>
                <p className="text-xs text-stone-600 mt-1">Services before trial begins</p>
              </div>
              <AvailableServicesColumn
                services={services}
                serviceCategories={serviceCategories}
                addedServiceIds={preTrialServices.map((s) => s.service_id)}
                onAddService={addPreTrialService}
                calculateRate={(id, base, cid) => calculateRate(id, base, cid)}
                clientId={dealData.client_id}
                clientOverrides={clientOverrides}
                collapsedCategories={collapsedCategories}
                onToggleCategory={toggleCategory}
                serviceType="pre-trial"
                existingServices={preTrialServices}
                inTrialServices={inTrialServices}
              />
            </div>
            <div className="space-y-4">
              <div className="pb-3 border-b border-stone-200">
                <h3 className="font-semibold text-stone-900">Selected Pre-Trial Services</h3>
                <p className="text-xs text-stone-600 mt-1">
                  {dealData.case_name} • Trial starts{' '}
                  {dealData.start_date && format(parseISO(dealData.start_date), 'MMM d, yyyy')}
                  {dealData.city && dealData.state && ` • ${dealData.city}, ${dealData.state}`}
                </p>
              </div>
              <WizardServiceStep
                phase="pre-trial"
                instances={preTrialServices}
                onReorder={setPreTrialServices}
                updateInstance={updatePreTrialService}
                removeInstance={removePreTrialService}
                services={services}
                dealData={dealData}
                trialSegments={trialSegments}
                calculateRate={calculateRate}
                calculateServiceDays={calculateServiceDays}
                dailyMinimumHours={dailyMinimumHours}
                travelMultiplier={travelMultiplier}
                overriddenRates={overriddenRates}
                onRateOverride={onRateOverride}
                onClearRateOverride={clearRateOverride}
                calcTravelCost={calcTravelCost}
              />
              {preTrialServices.length > 0 && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-stone-900">Pre-Trial Subtotal:</span>
                    <span className="text-green-600 text-lg">
                      $
                      {preTrialServices
                        .reduce((sum, ps) => {
                          const svc = services.find((s) => s.id === ps.service_id);
                          if (!svc) return sum;
                          const r = calculateRate(svc.id, svc.base_rate, dealData.client_id, ps.id);
                          return sum + r * (ps.quantity || 1) + calcTravelCost(ps, r);
                        }, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="pb-3 border-b border-stone-200">
                <h3 className="font-semibold text-stone-900">Available In-Trial Services</h3>
                <p className="text-xs text-stone-600 mt-1">Services during trial</p>
              </div>
              <AvailableServicesColumn
                services={services}
                serviceCategories={serviceCategories}
                addedServiceIds={inTrialServices.map((s) => s.service_id)}
                onAddService={addInTrialService}
                calculateRate={(id, base, cid) => calculateRate(id, base, cid)}
                clientId={dealData.client_id}
                clientOverrides={clientOverrides}
                collapsedCategories={collapsedCategories}
                onToggleCategory={toggleCategory}
                serviceType="in-trial"
                existingServices={preTrialServices}
                inTrialServices={inTrialServices}
              />
            </div>
            <div className="space-y-4">
              <div className="pb-3 border-b border-stone-200">
                <h3 className="font-semibold text-stone-900">Selected In-Trial Services</h3>
                <p className="text-xs text-stone-600 mt-1">
                  {dealData.case_name} •{' '}
                  {dealData.start_date &&
                    dealData.end_date &&
                    `${format(parseISO(dealData.start_date), 'MMM d')} - ${format(
                      parseISO(dealData.end_date),
                      'MMM d, yyyy',
                    )}`}
                  {dealData.city && dealData.state && ` • ${dealData.city}, ${dealData.state}`}
                </p>
              </div>
              <WizardServiceStep
                phase="in-trial"
                instances={inTrialServices}
                onReorder={setInTrialServices}
                updateInstance={updateInTrialService}
                removeInstance={removeInTrialService}
                services={services}
                dealData={dealData}
                trialSegments={trialSegments}
                calculateRate={calculateRate}
                calculateServiceDays={calculateServiceDays}
                dailyMinimumHours={dailyMinimumHours}
                travelMultiplier={travelMultiplier}
                overriddenRates={overriddenRates}
                onRateOverride={onRateOverride}
                onClearRateOverride={clearRateOverride}
                calcTravelCost={calcTravelCost}
              />
              <div className="space-y-3 pt-3 border-t border-stone-200">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="override_daily_minimum_hours"
                      className="text-xs text-stone-600 whitespace-nowrap"
                    >
                      Daily Min Hours:
                    </Label>
                    <Input
                      id="override_daily_minimum_hours"
                      type="number"
                      step="0.5"
                      min="0"
                      value={dealData.override_daily_minimum_hours}
                      onChange={(e) =>
                        setDealData({ ...dealData, override_daily_minimum_hours: e.target.value })
                      }
                      placeholder={`${companyDefaults.default_daily_minimum_hours}`}
                      className="h-7 text-xs w-16"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="billForWeekends"
                      checked={billForWeekends}
                      onChange={(e) => setBillForWeekends(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <Label htmlFor="billForWeekends" className="cursor-pointer text-xs text-stone-700">
                      Bill weekends ({calculateTrialDays()} {billForWeekends ? 'total' : 'weekday'} days)
                    </Label>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between font-semibold pt-2 border-t border-indigo-200">
                  <span className="text-stone-900">Estimated Total:</span>
                  <span className="text-green-600 text-lg">${estimatedValue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="retainerEnabled"
                      checked={retainerEnabled}
                      onChange={(e) => {
                        setRetainerEnabled(e.target.checked);
                        if (!e.target.checked) setDealData((p) => ({ ...p, retainer_value: 0 }));
                        else recalcRetainer();
                      }}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <Label htmlFor="retainerEnabled" className="text-sm text-stone-600 cursor-pointer">
                      Retainer:
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={recalcRetainer}
                      className="h-7 w-7 p-0"
                      disabled={!retainerEnabled}
                    >
                      ↻
                    </Button>
                    <div className="relative w-32">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-stone-500">
                        $
                      </span>
                      <Input
                        id="retainer_value"
                        type="number"
                        step="100"
                        min="0"
                        value={dealData.retainer_value}
                        onChange={(e) => setDealData({ ...dealData, retainer_value: e.target.value })}
                        className="h-7 text-xs pl-5 text-right bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        disabled={!retainerEnabled}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setCurrentStep((s) => s - 1)} disabled={currentStep === 1 || busy}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex gap-2">
            {isEditing && currentStep < 4 && (
              <Button
                disabled={!canProceed() || busy}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
                type="button"
                onClick={handleSaveOrSubmit}
              >
                {busy ? 'Saving...' : 'Save Changes'}
                <CheckCircle2 className="w-4 h-4 ml-2" />
              </Button>
            )}
            <Button
              onClick={() => {
                if (currentStep === 4) void handleSaveOrSubmit();
                else setCurrentStep((s) => s + 1);
              }}
              disabled={!canProceed() || busy}
              style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
              className="hover:opacity-90 transition-opacity"
            >
              {busy
                ? isEditing
                  ? 'Updating...'
                  : 'Creating...'
                : currentStep === 4
                  ? isEditing
                    ? 'Update Deal'
                    : 'Create Deal'
                  : 'Next'}
              {currentStep < 4 && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </CardContent>

      <WizardDialogs
        mode={mode}
        services={services}
        showNoServicesAlert={showNoServicesAlert}
        setShowNoServicesAlert={setShowNoServicesAlert}
        showContractWarning={showContractWarning}
        setShowContractWarning={setShowContractWarning}
        promptForRateOverride={promptForRateOverride}
        showRateOverrideDialog={showRateOverrideDialog}
        setShowRateOverrideDialog={setShowRateOverrideDialog}
        rateOverrideServiceId={rateOverrideServiceId}
        rateOverrideInstanceId={rateOverrideInstanceId}
        newRateValue={newRateValue}
        setNewRateValue={setNewRateValue}
        setOverriddenRates={setOverriddenRates}
      />
    </Card>
  );
}
