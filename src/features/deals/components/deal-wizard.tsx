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
import { parseISO } from 'date-fns';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Trial } from '@/features/trials/entities';
import { useDealWizardData } from '@/features/deals/hooks/use-deal-wizard-data';
import type { DealWritePayload } from '@/features/deals/hooks/use-deals-trials-data';
import { useVenueSearch } from '@/features/deals/hooks/use-venue-search';
import {
  buildTrialServices,
  calculateRetainer,
  type BuilderService,
} from '@/features/deals/business-rules/build-trial-services';
import {
  hydrateServiceInstances,
  filterSalesConsultants,
  filterClientsForLead,
  filterFrpClients,
  filterContactsForClient,
  resolveRate,
  countDays,
  travelCost,
  computePreTrialSubtotal,
} from './deal-wizard-helpers';
import { WizardStep1ClientContact, type NewClientDraft } from './wizard-step1-client-contact';
import { WizardStep4Footer } from './wizard-step4-footer';
import { WizardStep2CaseDetails } from './wizard-step2-case-details';
import { WizardServicesGrid } from './wizard-services-grid';
import { WizardHeader } from './wizard-header';
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
  const [submitError, setSubmitError] = useState<string | null>(null);

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

    const { preList, inList, detectedOverrides } = hydrateServiceInstances({
      rows: existingServices,
      trialId: trial.id,
      trialStartDate: trial.start_date,
      trialClientId: trial.client_id,
      services,
      trialSegments,
      calculateRate,
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
  // Pure logic lives in deal-wizard-helpers (resolveRate); this thin closure
  // binds the live deps so the existing call sites stay unchanged.
  const calculateRate = (
    serviceId: string,
    baseRate: number,
    clientId: string,
    instanceId: number | string | null = null,
  ): number =>
    resolveRate({
      serviceId,
      baseRate,
      clientId,
      instanceId,
      overriddenRates,
      clientOverrides,
      clients,
      clientTypes,
    });

  const dayCount = (start: string, end: string): number =>
    countDays(start, end, billForWeekends);

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
  ): number => travelCost(inst, svcRate, travelMultiplier);

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

  // ── Sales-lead-scoped + FRP client lists (logic in deal-wizard-helpers) ──
  const salesConsultants = useMemo(() => filterSalesConsultants(consultants), [consultants]);
  const filteredClients = useMemo(
    () => filterClientsForLead(clients, dealData.consultant_id, dealData.client_id),
    [clients, dealData.consultant_id, dealData.client_id],
  );
  const frpClients = useMemo(() => filterFrpClients(clients, clientTypes), [clients, clientTypes]);
  const clientContacts = useMemo(
    () => filterContactsForClient(attorneys, dealData.client_id),
    [attorneys, dealData.client_id],
  );
  const frpContacts = useMemo(
    () => filterContactsForClient(attorneys, dealData.frp_client_id),
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

  const preTrialSubtotal = useMemo(
    () =>
      computePreTrialSubtotal({
        instances: preTrialServices,
        services,
        clientId: dealData.client_id,
        rateFor: calculateRate,
        travelCostFor: calcTravelCost,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preTrialServices, services, dealData.client_id, overriddenRates],
  );

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
    setSubmitError(null);
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
    } catch (err: unknown) {
      // Save failed — surface it inline and keep the wizard open so the entered
      // data isn't lost. The page-level onSubmit handler owns the toast +
      // server reconcile (and re-throws to land here), so we don't toast twice.
      const message =
        err instanceof Error ? err.message : `Failed to ${isEditing ? 'update' : 'create'} deal`;
      setSubmitError(message);
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

  const headerTitle = trial
    ? `${mode === 'trial' ? 'Edit Trial' : 'Edit Deal'}: ${dealData.case_name || 'Untitled'}`
    : `New Deal: ${dealData.case_name || 'Untitled'}`;

  return (
    <Card>
      <WizardHeader
        title={headerTitle}
        steps={steps}
        currentStep={currentStep}
        isEditing={isEditing}
        busy={busy}
        onCancel={onCancel}
        onStepClick={setCurrentStep}
      />

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
          <WizardServicesGrid
            phase="pre-trial"
            dealData={dealData}
            services={services}
            serviceCategories={serviceCategories}
            clientOverrides={clientOverrides}
            collapsedCategories={collapsedCategories}
            onToggleCategory={toggleCategory}
            trialSegments={trialSegments}
            calculateRate={calculateRate}
            calculateServiceDays={calculateServiceDays}
            dailyMinimumHours={dailyMinimumHours}
            travelMultiplier={travelMultiplier}
            overriddenRates={overriddenRates}
            onRateOverride={onRateOverride}
            onClearRateOverride={clearRateOverride}
            calcTravelCost={calcTravelCost}
            preTrialServices={preTrialServices}
            inTrialServices={inTrialServices}
            onAddService={addPreTrialService}
            onReorder={setPreTrialServices}
            updateInstance={updatePreTrialService}
            removeInstance={removePreTrialService}
            footer={
              preTrialServices.length > 0 ? (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-stone-900">Pre-Trial Subtotal:</span>
                    <span className="text-green-600 text-lg">
                      ${preTrialSubtotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : null
            }
          />
        )}

        {currentStep === 4 && (
          <WizardServicesGrid
            phase="in-trial"
            dealData={dealData}
            services={services}
            serviceCategories={serviceCategories}
            clientOverrides={clientOverrides}
            collapsedCategories={collapsedCategories}
            onToggleCategory={toggleCategory}
            trialSegments={trialSegments}
            calculateRate={calculateRate}
            calculateServiceDays={calculateServiceDays}
            dailyMinimumHours={dailyMinimumHours}
            travelMultiplier={travelMultiplier}
            overriddenRates={overriddenRates}
            onRateOverride={onRateOverride}
            onClearRateOverride={clearRateOverride}
            calcTravelCost={calcTravelCost}
            preTrialServices={preTrialServices}
            inTrialServices={inTrialServices}
            onAddService={addInTrialService}
            onReorder={setInTrialServices}
            updateInstance={updateInTrialService}
            removeInstance={removeInTrialService}
            footer={
              <WizardStep4Footer
                dealData={dealData}
                setDealData={setDealData}
                defaultDailyMinimumHours={companyDefaults.default_daily_minimum_hours}
                billForWeekends={billForWeekends}
                setBillForWeekends={setBillForWeekends}
                trialDays={calculateTrialDays()}
                estimatedValue={estimatedValue}
                retainerEnabled={retainerEnabled}
                setRetainerEnabled={setRetainerEnabled}
                recalcRetainer={recalcRetainer}
              />
            }
          />
        )}

        {submitError && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {submitError}
          </p>
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
