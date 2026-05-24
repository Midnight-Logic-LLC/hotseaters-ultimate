/**
 * step-profile.tsx — first wizard step: user's name, phone, title.
 * Required: firstName, lastName.
 *
 * change-205 adds:
 *  - Google identity auto-fill (given_name / family_name) on first mount
 *  - Google avatar preview via <Avatar>
 *  - Title <Select> with Other-fallback free-text input
 *  - Phone auto-format (NNN) NNN-NNNN via format-phone util
 *
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepProfile.jsx
 */
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { formatPhone, stripPhone } from '@/features/onboarding/business-rules/format-phone';
import { WizardNav } from '../wizard-nav';

const TITLE_OPTIONS = ['Owner', 'Founder', 'Trial Tech', 'Operations', 'Other'] as const;

export function StepProfile() {
  const wiz = useOnboardingWizard();
  const { user } = useAuth();
  const p = wiz.profileForm;

  const meta = (user?.user_metadata ?? {}) as {
    given_name?: string;
    family_name?: string;
    avatar_url?: string;
    picture?: string;
  };

  // Auto-fill from Google identity on mount (user can override).
  useEffect(() => {
    const patch: Partial<typeof p> = {};
    if (!p.firstName?.trim() && meta.given_name) {
      patch.firstName = meta.given_name;
    }
    if (!p.lastName?.trim() && meta.family_name) {
      patch.lastName = meta.family_name;
    }
    if (Object.keys(patch).length > 0) wiz.patchProfile(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const avatarUrl = meta.avatar_url || meta.picture;
  const initials = `${(p.firstName ?? '?').charAt(0)}${(p.lastName ?? '').charAt(0)}`.toUpperCase();
  const valid = !!p.firstName?.trim() && !!p.lastName?.trim();

  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-1">Tell us about yourself</h3>
      <p className="text-sm text-stone-500 mb-6">We'll use this to personalize your account and on documents.</p>

      {avatarUrl && (
        <div className="mb-6 flex items-center gap-3">
          <Avatar size="lg">
            <AvatarImage src={avatarUrl} alt="Google profile" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <p className="text-sm text-stone-500">Imported from your Google account.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First name *</Label>
          <Input
            id="firstName"
            value={p.firstName ?? ''}
            onChange={(e) => wiz.patchProfile({ firstName: e.target.value })}
            autoComplete="given-name"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last name *</Label>
          <Input
            id="lastName"
            value={p.lastName ?? ''}
            onChange={(e) => wiz.patchProfile({ lastName: e.target.value })}
            autoComplete="family-name"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formatPhone(p.phone ?? '')}
            onChange={(e) => wiz.patchProfile({ phone: stripPhone(e.target.value) })}
            autoComplete="tel"
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Select
            value={p.title || ''}
            onValueChange={(v) => wiz.patchProfile({ title: v as string })}
          >
            <SelectTrigger id="title" className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {TITLE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {p.title === 'Other' && (
            <Input
              className="mt-2"
              placeholder="Your role"
              value={p.title_other ?? ''}
              onChange={(e) => wiz.patchProfile({ title_other: e.target.value })}
            />
          )}
        </div>
      </div>
      <WizardNav nextDisabled={!valid} />
    </div>
  );
}
