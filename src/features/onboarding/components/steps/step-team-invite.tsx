/**
 * step-team-invite.tsx — last step. Collect optional invitations + Finalize.
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepTeamInvite.jsx
 */
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import { WizardNav } from '../wizard-nav';
import type { InvitationDraft } from '@/features/onboarding/stores/onboarding-store';

const ROLES: InvitationDraft['role'][] = ['Admin', 'Sales', 'Trial Consultant'];

export function StepTeamInvite() {
  const wiz = useOnboardingWizard();
  const navigate = useNavigate();

  function addInvite() {
    wiz.setInvitations([
      ...wiz.invitations,
      {
        id: `inv-${Date.now()}`,
        first_name: '',
        last_name: '',
        email: '',
        role: 'Trial Consultant',
        consultant_tier_key: null,
        service_keys: [],
      },
    ]);
  }
  function updateInvite(id: string, patch: Partial<InvitationDraft>) {
    wiz.setInvitations(wiz.invitations.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function deleteInvite(id: string) {
    wiz.setInvitations(wiz.invitations.filter((i) => i.id !== id));
  }

  async function onFinalize() {
    const companyId = await wiz.finalize();
    if (companyId) {
      navigate('/Dashboard', { replace: true });
    }
  }

  const allValid = wiz.invitations.every(
    (i) => i.email.trim() !== '' && /@/.test(i.email) && ROLES.includes(i.role),
  );

  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-1">Invite your team (optional)</h3>
      <p className="text-sm text-stone-500 mb-6">You can skip this and add team members later from Settings.</p>
      <div className="space-y-3">
        {wiz.invitations.map((inv) => (
          <div key={inv.id} className="border border-stone-200 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-[1fr_1fr_180px_32px] gap-2 items-center">
            <Input placeholder="First name" value={inv.first_name} onChange={(e) => updateInvite(inv.id, { first_name: e.target.value })} />
            <Input placeholder="Email *" type="email" value={inv.email} onChange={(e) => updateInvite(inv.id, { email: e.target.value })} />
            <select
              value={inv.role}
              onChange={(e) => updateInvite(inv.id, { role: e.target.value as InvitationDraft['role'] })}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm bg-white"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button onClick={() => deleteInvite(inv.id)} className="p-1.5 text-stone-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <Button variant="outline" onClick={addInvite}>
          <Plus className="w-4 h-4 mr-1" />
          Add team member
        </Button>
      </div>

      {wiz.finalizeError && (
        <p role="alert" className="text-sm text-red-600 mt-4">{wiz.finalizeError}</p>
      )}

      <WizardNav
        onNext={onFinalize}
        nextDisabled={!allValid}
        nextLabel="Finish & Launch"
      />

      <p className="text-xs text-stone-400 mt-3 text-center">
        <Label htmlFor="" className="inline" />
        Clicking Finish creates your company, services, tiers, pipeline, and sends any invitations above.
      </p>
    </div>
  );
}
