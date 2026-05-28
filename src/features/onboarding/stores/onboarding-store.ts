/**
 * onboarding-store.ts — Zustand store for the 12-step owner-onboarding
 * wizard. Per RULE D, this is the only place in the onboarding feature
 * that talks to supabase / fetch / network.
 *
 * State is persisted to localStorage via the `persist` middleware so a
 * half-completed onboarding survives a refresh (RULE I — mobile/PWA/Tauri).
 *
 * BIBLE: `HotSeatersMVP/src/components/onboarding/OnboardingWizard.jsx`
 * (586 LOC). Mirrors the bible's local form state + finalize call.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/shared/db/supabase-client';

// ─── Seed snapshot (subset that drives wizard defaults) ────────────────────
export interface SeedSnapshot {
  version: string;
  data: {
    theme: Record<string, unknown> | null;
    custom_fonts: string[];
    service_categories: Array<{ key: string; name: string; order: number }>;
    services: Array<{
      name: string;
      category_key: string;
      base_rate: number;
      rate_type: string;
      service_availability?: string;
      has_daily_minimum?: boolean;
      is_default?: boolean;
      travel_multiplier?: number | null;
      order?: number;
    }>;
    client_tiers: Array<{ name: string; multiplier: number }>;
    consultant_tiers: Array<{ key: string; name: string; multiplier: number; is_active?: boolean }>;
    pipeline_stages: Array<{
      name: string;
      type: string;
      color?: string;
      order?: number;
      revenue_probability?: number;
      auto_move_on_document_sent_key?: string | null;
      auto_move_on_document_signed_key?: string | null;
      auto_move_on_earliest_task_start?: boolean;
      auto_move_on_trial_start?: boolean;
    }>;
  };
}

// ─── Per-step draft shapes ────────────────────────────────────────────────
export interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  title: string;
  /** Free-text fallback when title === 'Other'. */
  title_other: string;
}
export interface CompanyForm {
  companyName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  /** Brand color hex (e.g. `#7c3aed`). Drives invoice/document accents. */
  brandColor: string;
}
export interface TimeSettings {
  time_rounding_minutes: number;
  clock_in_rounding: 'nearest' | 'up' | 'down';
  clock_out_rounding: 'nearest' | 'up' | 'down';
  hide_deals_from_time_clock: boolean;
}
export type BillingFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
export interface BillingSettings {
  default_daily_minimum_hours: number;
  default_tax_rate: string;
  invoice_due_days: number;
  invoice_period: BillingFrequency;
  weekly_billing_day: string;
  monthly_billing_date: number;
  sender_email: string;
  invoice_number_format: string;
  invoice_number_start: number;
  job_number_format: string;
  job_number_start: number;
  /** Prorate the first invoice for a partial billing period (bible default true). */
  prorate_first_invoice: boolean;
  /** Auto-send invoices when they are generated (bible default false). */
  auto_send_invoice_on_generation: boolean;
}
export interface RetainerSettings {
  retainer_minimum: number;
  retainer_divisor: number;
  retainer_multiplier: number;
}
export interface FinancialsForm {
  fiscal_year_start_month: number;
  annual_revenue_target: string;
  monthly_breakeven: string;
}
export interface ServiceDraft {
  id: string;
  name: string;
  category_key: string;
  base_rate: number;
  rate_type: string;
  has_daily_minimum: boolean;
  service_availability: string;
  is_default: boolean;
  is_active: boolean;
  travel_multiplier?: number | null;
  order: number;
}
export interface ServiceCategoryDraft {
  id: string; // virtual key, used by wizard handlers
  name: string;
  order: number;
}
export interface ClientTierDraft {
  id: string;
  name: string;
  multiplier: number;
  /** UI-facing monotonic display order (0..N-1) after drag-reorder. */
  display_order: number;
}
export interface ConsultantTierDraft {
  id: string;
  key: string;
  name: string;
  multiplier: number;
  is_active: boolean;
  /** UI-facing monotonic display order (0..N-1) after drag-reorder. */
  display_order: number;
}
/**
 * Auto-move trigger enum — the four discriminator values the server-side
 * pipeline automation accepts. `none` means no automation for this stage.
 * Bible stores per-event keys (auto_move_on_document_*); the wizard UI
 * collapses those into a single trigger select, then expands back to the
 * legacy keys at finalize time.
 */
export type PipelineAutoMoveTrigger =
  | 'signed_deal'
  | 'invoice_paid'
  | 'trial_completed'
  | 'none';

export interface PipelineStageDraft {
  /** Stable UI id for dnd-kit. Mirrors `name` slug if not supplied. */
  id: string;
  name: string;
  type: string;
  color: string;
  /** Bible field. Kept for finalize payload + sorting. */
  order: number;
  /** UI-facing monotonic display order (0..N-1) after drag-reorder. */
  display_order: number;
  revenue_probability: number;
  /** UI-facing collapsed enum (drives the select). */
  auto_move_trigger: PipelineAutoMoveTrigger;
  auto_move_on_document_sent_key: string | null;
  auto_move_on_document_signed_key: string | null;
  auto_move_on_earliest_task_start: boolean;
  auto_move_on_trial_start: boolean;
}
export interface InvitationDraft {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'Admin' | 'Sales' | 'Trial Consultant';
  consultant_tier_key: string | null;
  service_keys: string[];
}

export type FinalizingPhase = 'company' | 'services' | 'pipeline' | 'theme' | 'invitations' | 'done';

/**
 * Bible's six default pipeline stages — used by step-pipeline-tiers "Reset
 * to defaults". Order + colors mirror StepPipelineTiers.jsx / seed snapshot.
 */
export const DEFAULT_PIPELINE_STAGES: PipelineStageDraft[] = [
  { id: 'stage-0-lead', name: 'Lead', type: 'sales', color: '#94a3b8', order: 0, display_order: 0, revenue_probability: 0.1, auto_move_trigger: 'none', auto_move_on_document_sent_key: null, auto_move_on_document_signed_key: null, auto_move_on_earliest_task_start: false, auto_move_on_trial_start: false },
  { id: 'stage-1-qualified', name: 'Qualified', type: 'sales', color: '#0891b2', order: 1, display_order: 1, revenue_probability: 0.25, auto_move_trigger: 'none', auto_move_on_document_sent_key: null, auto_move_on_document_signed_key: null, auto_move_on_earliest_task_start: false, auto_move_on_trial_start: false },
  { id: 'stage-2-proposal', name: 'Proposal Sent', type: 'sales', color: '#6366f1', order: 2, display_order: 2, revenue_probability: 0.5, auto_move_trigger: 'none', auto_move_on_document_sent_key: 'proposal', auto_move_on_document_signed_key: null, auto_move_on_earliest_task_start: false, auto_move_on_trial_start: false },
  { id: 'stage-3-signed', name: 'Signed Deal', type: 'sales', color: '#10b981', order: 3, display_order: 3, revenue_probability: 0.9, auto_move_trigger: 'signed_deal', auto_move_on_document_sent_key: null, auto_move_on_document_signed_key: 'engagement', auto_move_on_earliest_task_start: false, auto_move_on_trial_start: false },
  { id: 'stage-4-won', name: 'Won', type: 'sales', color: '#059669', order: 4, display_order: 4, revenue_probability: 1.0, auto_move_trigger: 'trial_completed', auto_move_on_document_sent_key: null, auto_move_on_document_signed_key: null, auto_move_on_earliest_task_start: false, auto_move_on_trial_start: true },
  { id: 'stage-5-lost', name: 'Lost', type: 'sales', color: '#ef4444', order: 5, display_order: 5, revenue_probability: 0, auto_move_trigger: 'none', auto_move_on_document_sent_key: null, auto_move_on_document_signed_key: null, auto_move_on_earliest_task_start: false, auto_move_on_trial_start: false },
];

// ─── Step index (12 — bible STEPS[] verbatim) ─────────────────────────────
export const ONBOARDING_STEPS = [
  { key: 'profile', label: 'Profile' },
  { key: 'company', label: 'Company' },
  { key: 'learn_billing', label: 'Billing Phases', learn: true as const },
  { key: 'services', label: 'Services' },
  { key: 'tiers', label: 'Tiers' },
  { key: 'learn_leads', label: 'Leads & Deals', learn: true as const },
  { key: 'time', label: 'Time' },
  { key: 'billing', label: 'Billing' },
  { key: 'learn_trials', label: 'Deals & Trials', learn: true as const },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'financials', label: 'Financials' },
  { key: 'team', label: 'Team' },
] as const;

interface OnboardingState {
  // boot
  isBooting: boolean;
  bootError: string | null;
  snapshotVersion: string | null;
  snapshotTheme: Record<string, unknown> | null;
  snapshotCustomFonts: string[];

  // step nav
  step: number;
  highestStep: number;

  // drafts
  profileForm: Partial<ProfileForm>;
  companyForm: Partial<CompanyForm>;
  financialsForm: FinancialsForm;
  timeForm: TimeSettings;
  billingForm: BillingSettings;
  retainerForm: RetainerSettings;
  pipelineStages: PipelineStageDraft[];
  services: ServiceDraft[];
  serviceCategories: ServiceCategoryDraft[];
  clientTiers: ClientTierDraft[];
  consultantTiers: ConsultantTierDraft[];
  invitations: InvitationDraft[];

  // finalize state
  isFinalizing: boolean;
  finalizingPhase: FinalizingPhase;
  complete: boolean;
  finalizeError: string | null;

  // actions
  clearBooting: () => void;
  setStep: (s: number) => void;
  goNext: () => void;
  goBack: () => void;
  patchProfile: (patch: Partial<ProfileForm>) => void;
  patchCompany: (patch: Partial<CompanyForm>) => void;
  patchTime: (patch: Partial<TimeSettings>) => void;
  patchBilling: (patch: Partial<BillingSettings>) => void;
  patchRetainer: (patch: Partial<RetainerSettings>) => void;
  patchFinancials: (patch: Partial<FinancialsForm>) => void;
  setServiceCategories: (next: ServiceCategoryDraft[]) => void;
  setServices: (next: ServiceDraft[]) => void;
  setClientTiers: (next: ClientTierDraft[]) => void;
  setConsultantTiers: (next: ConsultantTierDraft[]) => void;
  setPipelineStages: (next: PipelineStageDraft[]) => void;
  setInvitations: (next: InvitationDraft[]) => void;

  // server actions
  bootstrap: () => Promise<void>;
  finalize: () => Promise<string | null>;
  reset: () => void;
}

const DEFAULT_FINANCIALS: FinancialsForm = {
  fiscal_year_start_month: 1,
  annual_revenue_target: '150000',
  monthly_breakeven: '10000',
};
const DEFAULT_TIME: TimeSettings = {
  time_rounding_minutes: 15,
  clock_in_rounding: 'nearest',
  clock_out_rounding: 'nearest',
  hide_deals_from_time_clock: true,
};
const DEFAULT_BILLING: BillingSettings = {
  default_daily_minimum_hours: 10,
  default_tax_rate: '',
  invoice_due_days: 30,
  invoice_period: 'weekly',
  weekly_billing_day: 'Sunday',
  monthly_billing_date: 1,
  sender_email: '',
  invoice_number_format: 'INV-0000',
  invoice_number_start: 1,
  job_number_format: 'JOB-0000',
  job_number_start: 1,
  prorate_first_invoice: true,
  auto_send_invoice_on_generation: false,
};
const DEFAULT_RETAINER: RetainerSettings = {
  retainer_minimum: 1000,
  retainer_divisor: 15000,
  retainer_multiplier: 5000,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      isBooting: true,
      bootError: null,
      snapshotVersion: null,
      snapshotTheme: null,
      snapshotCustomFonts: [],
      step: 0,
      highestStep: 0,
      profileForm: {},
      companyForm: {},
      financialsForm: DEFAULT_FINANCIALS,
      timeForm: DEFAULT_TIME,
      billingForm: DEFAULT_BILLING,
      retainerForm: DEFAULT_RETAINER,
      pipelineStages: [],
      services: [],
      serviceCategories: [],
      clientTiers: [],
      consultantTiers: [],
      invitations: [],
      isFinalizing: false,
      finalizingPhase: 'company',
      complete: false,
      finalizeError: null,

      clearBooting: () => set({ isBooting: false, bootError: null }),
      setStep: (s) => set((st) => ({ step: s, highestStep: Math.max(st.highestStep, s) })),
      goNext: () => {
        const s = get().step;
        const last = ONBOARDING_STEPS.length - 1;
        if (s < last) set({ step: s + 1, highestStep: Math.max(get().highestStep, s + 1) });
      },
      goBack: () => {
        const s = get().step;
        if (s > 0) set({ step: s - 1 });
      },
      patchProfile: (patch) => set((st) => ({ profileForm: { ...st.profileForm, ...patch } })),
      patchCompany: (patch) => set((st) => ({ companyForm: { ...st.companyForm, ...patch } })),
      patchTime: (patch) => set((st) => ({ timeForm: { ...st.timeForm, ...patch } })),
      patchBilling: (patch) => set((st) => ({ billingForm: { ...st.billingForm, ...patch } })),
      patchRetainer: (patch) => set((st) => ({ retainerForm: { ...st.retainerForm, ...patch } })),
      patchFinancials: (patch) => set((st) => ({ financialsForm: { ...st.financialsForm, ...patch } })),
      setServiceCategories: (next) => set({ serviceCategories: next }),
      setServices: (next) => set({ services: next }),
      setClientTiers: (next) => set({ clientTiers: next }),
      setConsultantTiers: (next) => set({ consultantTiers: next }),
      setPipelineStages: (next) => set({ pipelineStages: next }),
      setInvitations: (next) => set({ invitations: next }),

      bootstrap: async () => {
        set({ isBooting: true, bootError: null });
        try {
          const { data, error } = await supabase.functions.invoke<{ version: string; data: SeedSnapshot['data']; error?: string }>(
            'get-seed-defaults',
            { method: 'POST' },
          );
          if (error) throw error;
          if (!data) throw new Error('Empty response from get-seed-defaults');
          if (data.error) throw new Error(data.error);

          const d = data.data;
          set({
            snapshotVersion: data.version,
            snapshotTheme: d.theme,
            snapshotCustomFonts: d.custom_fonts ?? [],
            serviceCategories: (d.service_categories ?? []).map((c) => ({
              id: c.key,
              name: c.name,
              order: c.order ?? 0,
            })),
            services: (d.services ?? []).map((s, i) => ({
              id: `svc-${i}-${(s.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
              name: s.name,
              category_key: s.category_key,
              base_rate: s.base_rate ?? 0,
              rate_type: s.rate_type ?? 'hourly',
              has_daily_minimum: !!s.has_daily_minimum,
              service_availability: s.service_availability ?? 'both',
              is_default: !!s.is_default,
              is_active: true,
              travel_multiplier: s.travel_multiplier ?? null,
              order: s.order ?? i,
            })),
            clientTiers: (d.client_tiers ?? []).map((t, i) => ({
              id: `ct-${i}`,
              name: t.name,
              multiplier: t.multiplier ?? 1.0,
              display_order: i,
            })),
            consultantTiers: (d.consultant_tiers ?? []).map((t, i) => ({
              id: `cot-${i}`,
              key: t.key,
              name: t.name,
              multiplier: t.multiplier ?? 1.0,
              is_active: t.is_active !== false,
              display_order: i,
            })),
            pipelineStages: (d.pipeline_stages ?? []).map((s, i) => {
              const signed = s.auto_move_on_document_signed_key ?? null;
              const sent = s.auto_move_on_document_sent_key ?? null;
              // Collapse bible's per-event keys into the UI enum.
              const trigger: PipelineAutoMoveTrigger = signed
                ? 'signed_deal'
                : sent === 'invoice'
                  ? 'invoice_paid'
                  : s.auto_move_on_trial_start
                    ? 'trial_completed'
                    : 'none';
              return {
                id: `stage-${i}-${(s.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                name: s.name,
                type: s.type,
                color: s.color ?? '#9ca3af',
                order: s.order ?? i,
                display_order: s.order ?? i,
                revenue_probability: s.revenue_probability ?? 1.0,
                auto_move_trigger: trigger,
                auto_move_on_document_sent_key: sent,
                auto_move_on_document_signed_key: signed,
                auto_move_on_earliest_task_start: !!s.auto_move_on_earliest_task_start,
                auto_move_on_trial_start: !!s.auto_move_on_trial_start,
              };
            }),
            isBooting: false,
          });
        } catch (err: unknown) {
          set({
            isBooting: false,
            bootError: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      },

      finalize: async () => {
        const st = get();
        // Validation (bible-verbatim).
        if (!st.profileForm.firstName?.trim() || !st.profileForm.lastName?.trim()) {
          set({ finalizeError: 'Please go back and fill in your name on the Profile step.' });
          return null;
        }
        if (!st.companyForm.companyName?.trim()) {
          set({ finalizeError: 'Please go back and fill in your company name.' });
          return null;
        }

        set({ isFinalizing: true, finalizingPhase: 'company', finalizeError: null });

        // Animate phase progression while the single backend call runs.
        const phaseOrder: FinalizingPhase[] = ['company', 'services', 'pipeline', 'theme'];
        if (st.invitations.length > 0) phaseOrder.push('invitations');
        let phaseIdx = 0;
        const phaseTimer = window.setInterval(() => {
          phaseIdx++;
          if (phaseIdx < phaseOrder.length) {
            set({ finalizingPhase: phaseOrder[phaseIdx] ?? 'done' });
          } else {
            window.clearInterval(phaseTimer);
          }
        }, 1800);

        let referralToken: string | null = null;
        try {
          referralToken = localStorage.getItem('pending_referral_token');
          if (referralToken) localStorage.removeItem('pending_referral_token');
        } catch {
          // private mode — ignore
        }

        const payload = {
          profile: st.profileForm,
          company: {
            companyName: st.companyForm.companyName,
            address: st.companyForm.address,
            city: st.companyForm.city,
            state: st.companyForm.state,
            zip: st.companyForm.zip,
            phone: st.companyForm.phone,
            website: st.companyForm.website,
          },
          services: st.services.map((s) => ({
            name: s.name,
            category_key: s.category_key,
            base_rate: s.base_rate,
            rate_type: s.rate_type,
            has_daily_minimum: s.has_daily_minimum,
            service_availability: s.service_availability,
            order: s.order,
            is_default: s.is_default,
            travel_multiplier: s.travel_multiplier ?? null,
          })),
          categories: st.serviceCategories.map((c) => ({
            key: c.id,
            name: c.name,
            order: c.order,
            is_default: c.id === 'travel',
          })),
          pipelineStages: st.pipelineStages,
          clientTiers: st.clientTiers.map((t) => ({ name: t.name, multiplier: t.multiplier })),
          consultantTiers: st.consultantTiers.map((t) => ({
            key: t.key || t.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
            name: t.name,
            multiplier: t.multiplier,
            is_active: t.is_active !== false,
          })),
          timeSettings: st.timeForm,
          billingSettings: st.billingForm,
          retainerSettings: st.retainerForm,
          financialSettings: st.financialsForm,
          invitations: st.invitations.map((inv) => ({
            first_name: inv.first_name,
            last_name: inv.last_name,
            email: inv.email,
            role: inv.role,
            consultant_tier_key: inv.consultant_tier_key,
            service_keys: inv.service_keys ?? [],
          })),
          create_sample_data: false,
          theme: st.snapshotTheme,
          custom_fonts: st.snapshotCustomFonts,
          snapshot_version: st.snapshotVersion,
          referral_token: referralToken,
        };

        try {
          const { data, error } = await supabase.functions.invoke<{
            ok: boolean;
            companyId?: string;
            error?: string;
            detail?: string;
          }>('finalize-owner-onboarding', { body: payload });

          window.clearInterval(phaseTimer);

          if (error) throw error;
          if (!data?.ok || !data.companyId) {
            throw new Error(data?.error ?? 'finalize_failed');
          }

          set({ finalizingPhase: 'done' });
          await new Promise((r) => setTimeout(r, 600));
          set({ isFinalizing: false, complete: true });
          return data.companyId;
        } catch (err: unknown) {
          window.clearInterval(phaseTimer);
          set({
            isFinalizing: false,
            finalizeError: err instanceof Error ? err.message : 'Setup failed',
          });
          return null;
        }
      },

      reset: () =>
        set({
          isBooting: true,
          bootError: null,
          snapshotVersion: null,
          snapshotTheme: null,
          snapshotCustomFonts: [],
          step: 0,
          highestStep: 0,
          profileForm: {},
          companyForm: {},
          financialsForm: DEFAULT_FINANCIALS,
          timeForm: DEFAULT_TIME,
          billingForm: DEFAULT_BILLING,
          retainerForm: DEFAULT_RETAINER,
          pipelineStages: [],
          services: [],
          serviceCategories: [],
          clientTiers: [],
          consultantTiers: [],
          invitations: [],
          isFinalizing: false,
          finalizingPhase: 'company',
          complete: false,
          finalizeError: null,
        }),
    }),
    {
      name: 'hs.onboarding',
      partialize: (s) => ({
        step: s.step,
        highestStep: s.highestStep,
        profileForm: s.profileForm,
        companyForm: s.companyForm,
        financialsForm: s.financialsForm,
        timeForm: s.timeForm,
        billingForm: s.billingForm,
        retainerForm: s.retainerForm,
        pipelineStages: s.pipelineStages,
        services: s.services,
        serviceCategories: s.serviceCategories,
        clientTiers: s.clientTiers,
        consultantTiers: s.consultantTiers,
        invitations: s.invitations,
        snapshotVersion: s.snapshotVersion,
        snapshotTheme: s.snapshotTheme,
        snapshotCustomFonts: s.snapshotCustomFonts,
      }),
    },
  ),
);
