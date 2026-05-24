/**
 * step-team-invite.tsx — last step. Collect optional invitations + Finalize.
 *
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepTeamInvite.jsx (116 LOC).
 *
 * change-204 — wires the two business-critical fields the server already
 * accepts but the port previously ignored:
 *   • `consultant_tier_key` per invitee — sourced from `wiz.consultantTiers`
 *   • `service_keys[]` per invitee — a multiselect over `wiz.services`
 *     grouped by service category. Selected services render as chips.
 *
 * Also: blocks self-invites (caller's email) and warns on duplicate rows.
 */
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Plus, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import { WizardNav } from '../wizard-nav';
import type { InvitationDraft } from '@/features/onboarding/stores/onboarding-store';

const ROLES: InvitationDraft['role'][] = ['Admin', 'Sales', 'Trial Consultant'];

/** Service key matches the bible's `${category_key}:${name}` shape. */
function serviceKey(categoryKey: string, name: string): string {
  return `${categoryKey}:${name}`;
}

export function StepTeamInvite() {
  const wiz = useOnboardingWizard();
  const navigate = useNavigate();
  const { user } = useAuth();
  const ownerEmail = (user?.email ?? '').toLowerCase();

  // Pre-compute "email occurrence count" so the warning is O(n) not O(n²).
  const emailCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const inv of wiz.invitations) {
      const k = inv.email.trim().toLowerCase();
      if (!k) continue;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return counts;
  }, [wiz.invitations]);

  // Group services by category for the palette.
  const servicesByCategory = useMemo(() => {
    const groups = new Map<string, { categoryName: string; items: { key: string; name: string }[] }>();
    for (const svc of wiz.services) {
      const cat = wiz.serviceCategories.find((c) => c.id === svc.category_key);
      const catName = cat?.name ?? svc.category_key;
      const entry = groups.get(svc.category_key) ?? { categoryName: catName, items: [] };
      entry.items.push({ key: serviceKey(svc.category_key, svc.name), name: svc.name });
      groups.set(svc.category_key, entry);
    }
    return Array.from(groups.entries()).map(([categoryKey, v]) => ({
      categoryKey,
      categoryName: v.categoryName,
      items: v.items,
    }));
  }, [wiz.services, wiz.serviceCategories]);

  // Look up display name for a service key (chip label).
  const serviceNameByKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const svc of wiz.services) {
      m.set(serviceKey(svc.category_key, svc.name), svc.name);
    }
    return m;
  }, [wiz.services]);

  function defaultTierKey(): string | null {
    const firstActive = wiz.consultantTiers.find((t) => t.is_active !== false);
    return firstActive?.key ?? wiz.consultantTiers[0]?.key ?? null;
  }

  function addInvite() {
    wiz.setInvitations([
      ...wiz.invitations,
      {
        id: `inv-${Date.now()}`,
        first_name: '',
        last_name: '',
        email: '',
        role: 'Trial Consultant',
        consultant_tier_key: defaultTierKey(),
        service_keys: [],
      },
    ]);
  }
  function updateInvite(id: string, patch: Partial<InvitationDraft>) {
    wiz.setInvitations(
      wiz.invitations.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    );
  }
  function deleteInvite(id: string) {
    wiz.setInvitations(wiz.invitations.filter((i) => i.id !== id));
  }
  function toggleService(id: string, key: string) {
    const inv = wiz.invitations.find((i) => i.id === id);
    if (!inv) return;
    const has = inv.service_keys.includes(key);
    const next = has
      ? inv.service_keys.filter((k) => k !== key)
      : [...inv.service_keys, key];
    updateInvite(id, { service_keys: next });
  }

  async function onFinalize() {
    const companyId = await wiz.finalize();
    if (companyId) {
      navigate('/Dashboard', { replace: true });
    }
  }

  const allValid = wiz.invitations.every(
    (i) =>
      i.email.trim() !== '' &&
      /@/.test(i.email) &&
      ROLES.includes(i.role) &&
      i.email.trim().toLowerCase() !== ownerEmail,
  );

  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-1">Invite your team (optional)</h3>
      <p className="text-sm text-stone-500 mb-6">
        You can skip this and add team members later from Settings.
      </p>

      <div className="space-y-3">
        {wiz.invitations.map((inv) => {
          const lowerEmail = inv.email.trim().toLowerCase();
          const isSelfInvite = lowerEmail !== '' && lowerEmail === ownerEmail;
          const isDuplicate = lowerEmail !== '' && (emailCounts.get(lowerEmail) ?? 0) > 1;

          return (
            <div
              key={inv.id}
              data-testid="invitation-row"
              data-invitation-id={inv.id}
              className={`border rounded-lg p-3 space-y-2 ${
                isSelfInvite
                  ? 'border-amber-300 bg-amber-50 opacity-75'
                  : 'border-stone-200'
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_180px_32px] gap-2 items-center">
                <Input
                  placeholder="First name"
                  value={inv.first_name}
                  disabled={isSelfInvite}
                  onChange={(e) => updateInvite(inv.id, { first_name: e.target.value })}
                />
                <Input
                  placeholder="Last name"
                  value={inv.last_name}
                  disabled={isSelfInvite}
                  onChange={(e) => updateInvite(inv.id, { last_name: e.target.value })}
                />
                <Input
                  placeholder="Email *"
                  type="email"
                  value={inv.email}
                  onChange={(e) => updateInvite(inv.id, { email: e.target.value })}
                  data-testid="invite-email"
                />
                <NativeSelect
                  value={inv.role}
                  disabled={isSelfInvite}
                  className="w-full"
                  onChange={(e) =>
                    updateInvite(inv.id, { role: e.target.value as InvitationDraft['role'] })
                  }
                >
                  {ROLES.map((r) => (
                    <NativeSelectOption key={r} value={r}>{r}</NativeSelectOption>
                  ))}
                </NativeSelect>
                <button
                  type="button"
                  onClick={() => deleteInvite(inv.id)}
                  className="p-1.5 text-stone-400 hover:text-red-600"
                  aria-label="Remove invitation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Tier + Services row — hidden when this is a self-invite block */}
              {!isSelfInvite && (
                <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 items-start">
                  <NativeSelect
                    value={inv.consultant_tier_key ?? ''}
                    onChange={(e) =>
                      updateInvite(inv.id, {
                        consultant_tier_key: e.target.value || null,
                      })
                    }
                    className="w-full"
                    data-testid="invite-tier"
                  >
                    <NativeSelectOption value="">Select tier…</NativeSelectOption>
                    {wiz.consultantTiers
                      .filter((t) => t.is_active !== false)
                      .map((t) => (
                        <NativeSelectOption key={t.key} value={t.key}>
                          {t.name}
                        </NativeSelectOption>
                      ))}
                  </NativeSelect>

                  <div
                    className="flex flex-wrap gap-1 items-center"
                    data-testid="invite-services"
                  >
                    {inv.service_keys.map((k) => (
                      <Badge
                        key={k}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        <span className="truncate max-w-[10rem]">
                          {serviceNameByKey.get(k) ?? k.split(':')[1] ?? k}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleService(inv.id, k)}
                          aria-label={`Remove ${k}`}
                          className="rounded hover:bg-stone-300/40"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    <ServicePicker
                      groups={servicesByCategory}
                      selected={inv.service_keys}
                      onToggle={(k) => toggleService(inv.id, k)}
                    />
                  </div>
                </div>
              )}

              {isSelfInvite && (
                <p className="text-xs text-amber-700">
                  You&apos;re the Owner — you don&apos;t need to invite yourself.
                </p>
              )}
              {!isSelfInvite && isDuplicate && (
                <p className="text-xs text-amber-700" data-testid="duplicate-warning">
                  Duplicate email — this address is already in another row.
                </p>
              )}
            </div>
          );
        })}
        <Button variant="outline" onClick={addInvite}>
          <Plus className="w-4 h-4 mr-1" />
          Add team member
        </Button>
      </div>

      {wiz.finalizeError && (
        <p role="alert" className="text-sm text-red-600 mt-4">
          {wiz.finalizeError}
        </p>
      )}

      <WizardNav onNext={onFinalize} nextDisabled={!allValid} nextLabel="Finish & Launch" />

      <p className="text-xs text-stone-400 mt-3 text-center">
        Clicking Finish creates your company, services, tiers, pipeline, and sends any invitations above.
      </p>
    </div>
  );
}

interface ServiceGroup {
  categoryKey: string;
  categoryName: string;
  items: { key: string; name: string }[];
}

function ServicePicker({
  groups,
  selected,
  onToggle,
}: {
  groups: ServiceGroup[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-stone-300 px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-50"
            data-testid="invite-add-service"
          >
            <Plus className="w-3 h-3" />
            Add service
          </button>
        }
      />
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Search services…" />
          <CommandList>
            <CommandEmpty>No services found.</CommandEmpty>
            {groups.map((g) => (
              <CommandGroup key={g.categoryKey} heading={g.categoryName}>
                {g.items.map((it) => {
                  const checked = selectedSet.has(it.key);
                  return (
                    <CommandItem
                      key={it.key}
                      value={`${g.categoryName} ${it.name}`}
                      data-checked={checked}
                      onSelect={() => onToggle(it.key)}
                    >
                      {it.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
