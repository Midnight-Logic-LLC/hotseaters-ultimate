/**
 * step-company-info.tsx — firm name + address + contact + brand color.
 * Required: companyName.
 *
 * change-205 adds:
 *  - <ColorSwatchPicker> for brand color (reused from change-203)
 *  - Phone auto-format (NNN) NNN-NNNN via format-phone util
 *
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepCompanyInfo.jsx
 */
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorSwatchPicker } from '@/shared/ui/color-swatch-picker';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import { formatPhone, stripPhone } from '@/features/onboarding/business-rules/format-phone';
import { WizardNav } from '../wizard-nav';

const DEFAULT_BRAND_COLOR = '#0891b2';

export function StepCompanyInfo() {
  const wiz = useOnboardingWizard();
  const c = wiz.companyForm;
  const valid = !!c.companyName?.trim();
  const brandColor = c.brandColor || DEFAULT_BRAND_COLOR;

  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-1">Your firm</h3>
      <p className="text-sm text-stone-500 mb-6">This appears on invoices, proposals, and documents.</p>
      <div className="space-y-4">
        <div>
          <Label htmlFor="companyName">Firm name *</Label>
          <Input
            id="companyName"
            value={c.companyName ?? ''}
            onChange={(e) => wiz.patchCompany({ companyName: e.target.value })}
            autoComplete="organization"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formatPhone(c.phone ?? '')}
              onChange={(e) => wiz.patchCompany({ phone: stripPhone(e.target.value) })}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={c.website ?? ''}
              onChange={(e) => wiz.patchCompany({ website: e.target.value })}
              placeholder="https://"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="address">Street address</Label>
          <Input
            id="address"
            value={c.address ?? ''}
            onChange={(e) => wiz.patchCompany({ address: e.target.value })}
            autoComplete="street-address"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={c.city ?? ''}
              onChange={(e) => wiz.patchCompany({ city: e.target.value })}
              autoComplete="address-level2"
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={c.state ?? ''}
              onChange={(e) => wiz.patchCompany({ state: e.target.value })}
              autoComplete="address-level1"
            />
          </div>
          <div>
            <Label htmlFor="zip">ZIP</Label>
            <Input
              id="zip"
              value={c.zip ?? ''}
              onChange={(e) => wiz.patchCompany({ zip: e.target.value })}
              autoComplete="postal-code"
            />
          </div>
        </div>
        <div>
          <Label>Brand color</Label>
          <div className="mt-1 flex items-center gap-3">
            <ColorSwatchPicker
              value={brandColor}
              onChange={(hex) => wiz.patchCompany({ brandColor: hex })}
              aria-label="Pick brand color"
            />
            <span className="font-mono text-xs uppercase text-stone-500">{brandColor}</span>
          </div>
        </div>
      </div>
      <WizardNav nextDisabled={!valid} />
    </div>
  );
}
