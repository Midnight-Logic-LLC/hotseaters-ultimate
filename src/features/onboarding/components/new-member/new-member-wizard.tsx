/**
 * new-member-wizard.tsx — invitee 5-step micro-wizard.
 * BIBLE: HotSeatersMVP/src/components/onboarding/NewMemberOnboarding.jsx (503 LOC)
 *
 * Steps: intro → welcome → services → photo → done.
 *
 * The invitee path runs AFTER the accept-invitation Edge Function has
 * already linked the user to the company. This wizard just collects
 * profile photo + shows context. Calling onComplete navigates to
 * /Dashboard.
 */
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Camera, Shield, Briefcase, User } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useNewMemberOnboarding } from '@/features/onboarding/hooks/use-new-member-onboarding';

interface Props {
  companyName: string;
  role: string;
  firstName?: string | null;
  assignedServiceNames?: string[];
  onComplete?: () => void;
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  Owner: 'Full access to all features, billing, and team management.',
  Admin: 'Manage all deals, trials, clients, and team members. Can change roles.',
  Sales: 'Manage deals, clients, and move opportunities through the sales pipeline.',
  'Trial Consultant': 'Track time, view assigned trials, and manage your own tasks.',
};

const ROLE_ICONS: Record<string, typeof Shield> = {
  Owner: Shield,
  Admin: Shield,
  Sales: Briefcase,
  'Trial Consultant': User,
};

export function NewMemberWizard({ companyName, role, firstName, assignedServiceNames = [], onComplete }: Props) {
  const wiz = useNewMemberOnboarding();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    wiz.setContext({ companyName, role, assignedServiceNames });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyName, role, assignedServiceNames.join(',')]);

  function finish() {
    if (onComplete) onComplete();
    else navigate('/Dashboard', { replace: true });
  }

  const RoleIcon = ROLE_ICONS[role] ?? User;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--theme-page-bg, #f5f5f4)', fontFamily: 'var(--theme-font-body)' }}
    >
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {wiz.step === 'intro' && (
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Welcome to HotSeaters{firstName ? `, ${firstName}` : ''}!</h2>
            <p className="text-stone-500 mb-6">Let's set up your profile and get you into the app.</p>
            <Button className="w-full" onClick={wiz.goNext} style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}>
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {wiz.step === 'welcome' && (
          <div>
            <h2 className="text-xl font-bold text-stone-900 mb-1">Your role at {companyName}</h2>
            <p className="text-sm text-stone-500 mb-5">You've been invited as a <strong>{role}</strong>.</p>
            <div className="flex gap-3 items-start p-4 rounded-lg bg-indigo-50 border border-indigo-200 mb-6">
              <RoleIcon className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-indigo-900">{ROLE_DESCRIPTIONS[role] ?? 'You have been granted access by your team Owner.'}</p>
            </div>
            <NavButtons onBack={wiz.goBack} onNext={wiz.goNext} />
          </div>
        )}

        {wiz.step === 'services' && (
          <div>
            <h2 className="text-xl font-bold text-stone-900 mb-1">Services you'll work on</h2>
            <p className="text-sm text-stone-500 mb-5">
              {assignedServiceNames.length > 0
                ? "Your Owner has assigned these services to your queue. You can clock time against them and they'll show on your dashboard."
                : "Your team hasn't assigned specific services yet — you'll see them as soon as your Owner adds you to one."}
            </p>
            {assignedServiceNames.length > 0 && (
              <ul className="space-y-2 mb-6">
                {assignedServiceNames.map((name) => (
                  <li key={name} className="flex items-center gap-2 text-sm text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    {name}
                  </li>
                ))}
              </ul>
            )}
            <NavButtons onBack={wiz.goBack} onNext={wiz.goNext} />
          </div>
        )}

        {wiz.step === 'photo' && (
          <div>
            <h2 className="text-xl font-bold text-stone-900 mb-1">Add a profile photo</h2>
            <p className="text-sm text-stone-500 mb-5">Helps your team recognize you in mentions and on documents.</p>

            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-32 h-32 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center">
                {wiz.photoPreview ? (
                  <img src={wiz.photoPreview} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-12 h-12 text-stone-400" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => void wiz.setPhoto(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Choose file
                </Button>
                {wiz.googlePhotoUrl && (
                  <Button variant="outline" onClick={wiz.useGooglePhoto}>
                    Use Google photo
                  </Button>
                )}
              </div>
              {wiz.error && (
                <p role="alert" className="text-xs text-red-600">{wiz.error}</p>
              )}
            </div>
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={wiz.goBack}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <div className="flex gap-3">
                <button onClick={() => { wiz.setStep('done'); }} className="text-sm text-stone-500 hover:text-stone-700">
                  Skip
                </button>
                <Button onClick={() => void wiz.savePhoto()} disabled={wiz.uploading} style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}>
                  {wiz.uploading ? 'Uploading…' : 'Save & Continue'}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {wiz.step === 'done' && (
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
            >
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">You're all set!</h2>
            <p className="text-stone-500 mb-6">Welcome to the {companyName} team.</p>
            <Button className="w-full" onClick={finish} style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}>
              Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function NavButtons({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex justify-between">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>
      <Button onClick={onNext} style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}>
        Next <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}
