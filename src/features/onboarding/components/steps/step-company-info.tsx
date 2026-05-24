/**
 * step-company-info.tsx — firm name + address + contact.
 * Required: companyName.
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepCompanyInfo.jsx
 */
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import { WizardNav } from '../wizard-nav';

export function StepCompanyInfo() {
  const wiz = useOnboardingWizard();
  const c = wiz.companyForm;
  const valid = !!c.companyName?.trim();
  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-1">Your firm</h3>
      <p className="text-sm text-stone-500 mb-6">This appears on invoices, proposals, and documents.</p>
      <div className="space-y-4">
        <div>
          <Label htmlFor="companyName">Firm name *</Label>
          <Input id="companyName" value={c.companyName ?? ''} onChange={(e) => wiz.patchCompany({ companyName: e.target.value })} autoComplete="organization" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" value={c.phone ?? ''} onChange={(e) => wiz.patchCompany({ phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input id="website" type="url" value={c.website ?? ''} onChange={(e) => wiz.patchCompany({ website: e.target.value })} placeholder="https://" />
          </div>
        </div>
        <div>
          <Label htmlFor="address">Street address</Label>
          <Input id="address" value={c.address ?? ''} onChange={(e) => wiz.patchCompany({ address: e.target.value })} autoComplete="street-address" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" value={c.city ?? ''} onChange={(e) => wiz.patchCompany({ city: e.target.value })} autoComplete="address-level2" />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" value={c.state ?? ''} onChange={(e) => wiz.patchCompany({ state: e.target.value })} autoComplete="address-level1" />
          </div>
          <div>
            <Label htmlFor="zip">ZIP</Label>
            <Input id="zip" value={c.zip ?? ''} onChange={(e) => wiz.patchCompany({ zip: e.target.value })} autoComplete="postal-code" />
          </div>
        </div>
      </div>
      <WizardNav nextDisabled={!valid} />
    </div>
  );
}
