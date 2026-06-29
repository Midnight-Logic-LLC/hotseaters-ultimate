/**
 * invite-team-member-wizard.tsx — 3-step invite wizard for team members.
 *
 * BIBLE: HotSeatersMVP/src/components/consultants/InviteTeamMemberWizard.jsx
 *
 * Step 1 — Who:         First Name, Last Name, Email
 * Step 2 — Role:        Card selector (Admin / Sales / Trial Consultant)
 * Step 3 — Tier & Svcs: Tier dropdown + grouped service checklist
 *
 * RULE B: no store imports — onSend callback is passed in from the page.
 */
import { useState, useMemo } from 'react';
import { Check, ArrowLeft, ArrowRight, Send, Shield, Briefcase, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useTier1 } from '@/app/tier1-provider';
import { useServices } from '@/features/company/hooks/use-services';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface InviteWizardData {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  consultant_tier_id: string;
  service_ids: string[];
}

interface InviteTeamMemberWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (data: InviteWizardData) => void;
  isSending?: boolean;
  existingEmails?: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  {
    value: 'admin',
    label: 'Admin',
    Icon: Shield,
    border: 'border-blue-400',
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
    titleColor: 'text-blue-900',
    bodyColor: 'text-blue-800',
    description: 'Manage all deals, trials, clients, and team members. Can change roles.',
  },
  {
    value: 'sales',
    label: 'Sales',
    Icon: Briefcase,
    border: 'border-green-400',
    bg: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-700',
    titleColor: 'text-green-900',
    bodyColor: 'text-green-800',
    description: 'Manage deals, clients, and move opportunities through the sales pipeline.',
  },
  {
    value: 'trial_consultant',
    label: 'Trial Consultant',
    Icon: User,
    border: 'border-stone-400',
    bg: 'bg-stone-50',
    iconBg: 'bg-stone-100',
    iconColor: 'text-stone-700',
    titleColor: 'text-stone-900',
    bodyColor: 'text-stone-800',
    description: 'Track time, view assigned trials, and manage their own tasks.',
  },
] as const;

const EMPTY: InviteWizardData = {
  email: '',
  first_name: '',
  last_name: '',
  role: 'trial_consultant',
  consultant_tier_id: '',
  service_ids: [],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function deriveCompanyDomain(company: Record<string, unknown> | null | undefined): string | null {
  if (!company) return null;
  const website = (company.website as string | undefined)?.trim() ?? '';
  if (website) {
    try {
      const url = new URL(website.match(/^https?:\/\//i) ? website : `https://${website}`);
      const host = url.hostname.replace(/^www\./i, '');
      if (host && host.includes('.')) return host.toLowerCase();
    } catch {
      // fall through
    }
  }
  const emailish =
    ((company.sender_email as string | undefined) ?? (company.email as string | undefined) ?? '').trim();
  const atIdx = emailish.lastIndexOf('@');
  if (atIdx > -1 && atIdx < emailish.length - 1) return emailish.slice(atIdx + 1).toLowerCase();
  return null;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function InviteTeamMemberWizard({
  open,
  onOpenChange,
  onSend,
  isSending = false,
  existingEmails = [],
}: InviteTeamMemberWizardProps) {
  const { company, consultantTiers, serviceCategories } = useTier1();
  const { services } = useServices();
  const isMobile = useIsMobile();

  const companyRecord = company as Record<string, unknown> | null | undefined;
  const companyDomain = useMemo(() => deriveCompanyDomain(companyRecord), [companyRecord]);
  const prefilledEmail = companyDomain ? `@${companyDomain}` : '';

  const existingEmailSet = useMemo(
    () => new Set(existingEmails.map((e) => e.trim().toLowerCase())),
    [existingEmails],
  );

  const [step, setStep] = useState(1);
  const [data, setData] = useState<InviteWizardData>(EMPTY);

  // Reset on close; pre-fill domain on open
  useMemo(() => {
    if (!open) {
      setStep(1);
      setData(EMPTY);
    } else {
      setData((d) => ({ ...d, email: d.email || prefilledEmail }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((data.email ?? '').trim());
  const emailIsDuplicate = emailValid && existingEmailSet.has((data.email ?? '').trim().toLowerCase());
  const step1Valid = !!data.first_name?.trim() && !!data.last_name?.trim() && emailValid && !emailIsDuplicate;
  const step2Valid = !!data.role;
  const isSalesOnly = data.role === 'sales';
  const tierAndServicesValid = isSalesOnly
    ? true
    : !!data.consultant_tier_id && (data.service_ids?.length ?? 0) > 0;
  const canSend = step1Valid && step2Valid && tierAndServicesValid && !isSending;

  const goNext = () => setStep((s) => Math.min(3, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const toggleService = (svcId: string) =>
    setData((d) => ({
      ...d,
      service_ids: d.service_ids.includes(svcId)
        ? d.service_ids.filter((x) => x !== svcId)
        : [...d.service_ids, svcId],
    }));

  const selectAllServices = () => {
    const travelIds = new Set(
      (serviceCategories ?? [])
        .filter((c) => c.name?.toLowerCase() === 'travel')
        .map((c) => c.id),
    );
    setData((d) => ({
      ...d,
      service_ids: services
        .filter((s) => s.is_active !== false && !travelIds.has(s.category_id ?? ''))
        .map((s) => s.id),
    }));
  };

  const footer = (
    <div className="flex justify-between items-center gap-3 w-full">
      <div className="text-xs text-stone-500">Step {step} of 3</div>
      <div className="flex gap-2">
        {step > 1 && (
          <Button type="button" variant="outline" onClick={goBack} disabled={isSending}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSending}
        >
          Cancel
        </Button>
        {step < 3 ? (
          <Button
            onClick={goNext}
            disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
            style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
            className="hover:opacity-90 transition-opacity"
          >
            Next <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        ) : (
          <Button
            onClick={() => { if (canSend) onSend(data); }}
            disabled={!canSend}
            style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
            className="hover:opacity-90 transition-opacity"
          >
            <Send className="w-4 h-4 mr-1.5" />
            {isSending ? 'Sending...' : 'Send Invitation'}
          </Button>
        )}
      </div>
    </div>
  );

  const innerContent = (
    <>
      {/* Step dots */}
      <div className="flex items-center justify-center gap-2 mb-5">
        {[1, 2, 3].map((n) => (
          <span key={n} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                n < step
                  ? 'bg-stone-300 text-white'
                  : n === step
                    ? 'text-white'
                    : 'bg-stone-100 text-stone-400'
              }`}
              style={n === step ? { backgroundColor: 'var(--theme-brand-primary)' } : {}}
            >
              {n < step ? <Check className="w-3.5 h-3.5" /> : n}
            </div>
            {n < 3 && <div className={`h-0.5 w-8 ${n < step ? 'bg-stone-300' : 'bg-stone-100'}`} />}
          </span>
        ))}
      </div>

      {/* Step 1 — Who */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900">Who are you inviting?</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              We&apos;ll send an invitation email to this person.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="wizFirstName">First Name *</Label>
              <Input
                id="wizFirstName"
                value={data.first_name}
                onChange={(e) => setData({ ...data, first_name: e.target.value })}
                placeholder="John"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="wizLastName">Last Name *</Label>
              <Input
                id="wizLastName"
                value={data.last_name}
                onChange={(e) => setData({ ...data, last_name: e.target.value })}
                placeholder="Doe"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="wizEmail">Email Address *</Label>
            <Input
              id="wizEmail"
              type="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              onFocus={(e) => {
                const val = e.target.value;
                if (val.startsWith('@')) {
                  requestAnimationFrame(() => {
                    try { e.target.setSelectionRange(0, 0); } catch { /* ignore */ }
                  });
                }
              }}
              placeholder="john.doe@example.com"
            />
            {companyDomain && data.email === prefilledEmail && (
              <p className="text-xs text-stone-500 mt-1">
                Pre-filled with your company domain. Type the username before{' '}
                <strong>@{companyDomain}</strong>.
              </p>
            )}
            {data.email?.trim() && data.email !== prefilledEmail && !emailValid && (
              <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
            )}
            {emailIsDuplicate && (
              <p className="text-xs text-red-500 mt-1">This email has already been added.</p>
            )}
          </div>
        </div>
      )}

      {/* Step 2 — Role */}
      {step === 2 && (
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-stone-900">What role will they have?</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              You can change this later. Owner role is not selectable — there is exactly one Owner
              per company.
            </p>
          </div>
          <div className="space-y-2">
            {ROLE_OPTIONS.map((opt) => {
              const selected = data.role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setData({ ...data, role: opt.value })}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selected ? `${opt.border} ${opt.bg}` : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${opt.iconBg}`}
                    >
                      <opt.Icon className={`w-4 h-4 ${opt.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-semibold text-sm ${opt.titleColor}`}>{opt.label}</h4>
                        {selected && <Check className="w-4 h-4 text-stone-500" />}
                      </div>
                      <p className={`text-xs mt-0.5 ${opt.bodyColor}`}>{opt.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3 — Tier & Services */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-stone-900">Tier &amp; Services</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {isSalesOnly
                ? "Sales-only invites don't require a tier or services — you can leave these blank and assign them later."
                : 'Pick the consultant tier and the services this person can log time against.'}
            </p>
          </div>

          <div>
            <Label htmlFor="wizTier">Team Member Tier {isSalesOnly ? '' : '*'}</Label>
            <Select
              value={data.consultant_tier_id}
              onValueChange={(v) => setData({ ...data, consultant_tier_id: v ?? '' })}
            >
              <SelectTrigger id="wizTier">
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                {(consultantTiers ?? []).map((tier) => {
                  const t = tier as { id: string; name?: string; multiplier?: number };
                  return (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.multiplier != null ? `(×${t.multiplier})` : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Assigned Services {isSalesOnly ? '' : '*'}</Label>
              <button
                type="button"
                onClick={selectAllServices}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Select All
              </button>
            </div>
            <div className="border border-stone-200 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1.5">
              {(serviceCategories ?? [])
                .filter((c) => !(c.name?.toLowerCase() ?? '').includes('travel'))
                .map((cat) => {
                  const catSvcs = services.filter(
                    (s) => s.category_id === cat.id && s.is_active !== false,
                  );
                  if (catSvcs.length === 0) return null;
                  return (
                    <div key={cat.id}>
                      <p className="text-xs font-semibold text-stone-400 uppercase mb-0.5">
                        {cat.name}
                      </p>
                      {catSvcs.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 py-0.5 cursor-pointer">
                          <Checkbox
                            checked={data.service_ids.includes(s.id)}
                            onCheckedChange={() => toggleService(s.id)}
                          />
                          <span className="text-xs text-stone-700">{s.name}</span>
                          <span className="text-xs text-stone-400 ml-auto">
                            ${s.base_rate}/{s.rate_type === 'hourly' ? 'hr' : 'day'}
                          </span>
                        </label>
                      ))}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Invite Team Member</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2 overflow-y-auto">{innerContent}</div>
          <DrawerFooter>{footer}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        <div className="py-2">{innerContent}</div>
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
