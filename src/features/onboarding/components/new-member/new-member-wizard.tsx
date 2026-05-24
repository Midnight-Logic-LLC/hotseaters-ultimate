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
 *
 * change-208: explicit "Use Google photo" button (no auto-apply),
 * role-permission-card, assigned-services preview w/ green badges,
 * upload progress bar, error/retry path, photo-drop-zone for the
 * photo step.
 */
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Briefcase,
  Check,
} from 'lucide-react';
import { useEffect } from 'react';
import { useNewMemberOnboarding } from '@/features/onboarding/hooks/use-new-member-onboarding';
import { PhotoDropZone } from './photo-drop-zone';
import { RolePermissionCard, type MemberRole } from './role-permission-card';
import { cn } from '@/shared/lib/cn';

interface Props {
  companyName: string;
  role: string;
  firstName?: string | null;
  assignedServiceNames?: string[];
  onComplete?: () => void;
}

// Map labelled roles (Owner, Admin, …) to the canonical MemberRole key the
// RolePermissionCard expects. Defaults to `trial_consultant` for unknown.
function toMemberRole(role: string): MemberRole {
  const normalized = role.trim().toLowerCase();
  if (normalized === 'owner') return 'owner';
  if (normalized === 'admin') return 'admin';
  if (normalized === 'sales') return 'sales';
  if (normalized === 'trial consultant' || normalized === 'trial_consultant') return 'trial_consultant';
  return 'trial_consultant';
}

export function NewMemberWizard({ companyName, role, firstName, assignedServiceNames = [], onComplete }: Props) {
  const wiz = useNewMemberOnboarding();
  const navigate = useNavigate();

  useEffect(() => {
    wiz.setContext({ companyName, role, assignedServiceNames });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyName, role, assignedServiceNames.join(',')]);

  function finish() {
    if (onComplete) onComplete();
    else navigate('/Dashboard', { replace: true });
  }

  const memberRole = toMemberRole(role);
  const usingGooglePhoto =
    !!wiz.googlePhotoUrl && wiz.photoPreview === wiz.googlePhotoUrl;

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
            <p className="text-sm text-stone-500 mb-5">
              You've been invited as a <strong>{role}</strong>.
            </p>
            <RolePermissionCard role={memberRole} className="mb-6" />
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
            {assignedServiceNames.length > 0 ? (
              <ul className="space-y-2 mb-6">
                {assignedServiceNames.map((name) => (
                  <li key={name} className="flex items-center gap-2 text-sm text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-green-600" aria-hidden />
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 border border-dashed border-stone-300 rounded-xl mb-6">
                <Briefcase className="w-10 h-10 text-stone-300 mx-auto mb-2" aria-hidden />
                <p className="text-stone-500 text-sm">Your admin will assign services to your profile.</p>
              </div>
            )}
            <NavButtons onBack={wiz.goBack} onNext={wiz.goNext} />
          </div>
        )}

        {wiz.step === 'photo' && (
          <div>
            <h2 className="text-xl font-bold text-stone-900 mb-1">Add a profile photo</h2>
            <p className="text-sm text-stone-500 mb-5">Helps your team recognize you in mentions and on documents.</p>

            <div className="flex flex-col items-center gap-3 mb-6">
              <PhotoDropZone
                onFileSelected={(f) => void wiz.setPhoto(f)}
                currentPreviewUrl={wiz.photoPreview ?? undefined}
              />

              {wiz.googlePhotoUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={wiz.useGooglePhoto}
                  className={cn(
                    'gap-1.5',
                    usingGooglePhoto && 'border-primary text-primary bg-primary/5'
                  )}
                  aria-pressed={usingGooglePhoto}
                >
                  {usingGooglePhoto && <Check className="w-3.5 h-3.5" aria-hidden />}
                  Use Google photo
                </Button>
              )}

              {wiz.uploading && (
                <div className="w-full" aria-live="polite">
                  <p className="text-xs text-stone-500 mb-1">Uploading…</p>
                  <div className="bg-muted h-2 rounded overflow-hidden">
                    <div
                      className="bg-primary h-2 rounded transition-all animate-pulse"
                      style={{ width: '60%' }}
                    />
                  </div>
                </div>
              )}

              {wiz.error && !wiz.uploading && (
                <div role="alert" className="flex items-center gap-3 text-xs text-red-600">
                  <span>Upload failed — </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void wiz.savePhoto()}
                    className="h-7 px-2 text-xs"
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={wiz.goBack}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    wiz.setStep('done');
                  }}
                  className="text-sm text-stone-500 hover:text-stone-700"
                >
                  Skip
                </button>
                <Button
                  onClick={() => void wiz.savePhoto()}
                  disabled={wiz.uploading}
                  style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
                >
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
