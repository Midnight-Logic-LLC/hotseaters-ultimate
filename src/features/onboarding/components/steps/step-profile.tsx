/**
 * step-profile.tsx — first wizard step: user's name, phone, title.
 * Required: firstName, lastName.
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepProfile.jsx
 */
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import { WizardNav } from '../wizard-nav';

export function StepProfile() {
  const wiz = useOnboardingWizard();
  const p = wiz.profileForm;
  const valid = !!p.firstName?.trim() && !!p.lastName?.trim();
  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-1">Tell us about yourself</h3>
      <p className="text-sm text-stone-500 mb-6">We'll use this to personalize your account and on documents.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First name *</Label>
          <Input id="firstName" value={p.firstName ?? ''} onChange={(e) => wiz.patchProfile({ firstName: e.target.value })} autoComplete="given-name" />
        </div>
        <div>
          <Label htmlFor="lastName">Last name *</Label>
          <Input id="lastName" value={p.lastName ?? ''} onChange={(e) => wiz.patchProfile({ lastName: e.target.value })} autoComplete="family-name" />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" value={p.phone ?? ''} onChange={(e) => wiz.patchProfile({ phone: e.target.value })} autoComplete="tel" />
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={p.title ?? ''} onChange={(e) => wiz.patchProfile({ title: e.target.value })} placeholder="e.g. Founder, Trial Tech" />
        </div>
      </div>
      <WizardNav nextDisabled={!valid} />
    </div>
  );
}
