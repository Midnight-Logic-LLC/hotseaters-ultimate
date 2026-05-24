/**
 * onboarding-wizard.tsx — 12-step Owner-onboarding wizard host.
 *
 * BIBLE: `HotSeatersMVP/src/components/onboarding/OnboardingWizard.jsx`
 * (586 LOC). This is the FUNCTIONAL port (Wave B). Visual parity polish
 * pass tracked as Wave B.2 per RULE 0 honest-execution discipline.
 *
 * Structure:
 *   - Brand panel (desktop) + mobile header — step progress + clickable
 *     history (only steps ≤ highestStep are clickable).
 *   - Step body renders one of 12 step components by index.
 *   - FinalizingOverlay shown while the finalize Edge Function runs.
 *   - Completion screen on success → CTA into Dashboard.
 *   - OnboardingBootError shown on snapshot fetch failure (no silent
 *     fallback to hardcoded defaults — bible's no-fallback rule).
 *
 * RULE 0.2: matched bible STEPS[] sequence verbatim.
 * RULE 0.3: any visual rendering bug fixed in primitives + this file,
 * never in step components.
 */
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, BookOpen } from 'lucide-react';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import { StepProfile } from './steps/step-profile';
import { StepCompanyInfo } from './steps/step-company-info';
import { StepServices } from './steps/step-services';
import { StepTiers } from './steps/step-tiers';
import { StepTimeTracking } from './steps/step-time-tracking';
import { StepBilling } from './steps/step-billing';
import { StepPipelineTiers } from './steps/step-pipeline-tiers';
import { StepFinancials } from './steps/step-financials';
import { StepTeamInvite } from './steps/step-team-invite';
import { LearnPreTrialInTrial } from './learn/learn-pre-trial-in-trial';
import { LearnLeadsToDeals } from './learn/learn-leads-to-deals';
import { LearnDealsToTrials } from './learn/learn-deals-to-trials';
import { FinalizingOverlay } from './finalizing-overlay';
import { OnboardingBootError } from './onboarding-boot-error';

export function OnboardingWizard() {
  const navigate = useNavigate();
  const wiz = useOnboardingWizard();

  if (wiz.bootError) {
    return <OnboardingBootError message={wiz.bootError} onRetry={wiz.bootstrap} />;
  }
  if (wiz.isBooting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-stone-50">
        <p className="text-stone-500">Loading setup defaults…</p>
      </div>
    );
  }

  if (wiz.complete) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: 'var(--theme-page-bg, #f5f5f4)', fontFamily: 'var(--theme-font-body)' }}
      >
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">You're All Set!</h2>
          <p className="text-stone-500 mb-6">
            Welcome to HotSeaters, {wiz.profileForm.firstName}. Your company{' '}
            <strong>{wiz.companyForm.companyName}</strong> is ready to go.
          </p>
          <Button
            onClick={() => navigate('/Dashboard', { replace: true })}
            className="w-full"
            style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (wiz.isFinalizing) {
    return <FinalizingOverlay currentPhase={wiz.finalizingPhase} hasInvitations={wiz.invitations.length > 0} />;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center lg:p-8"
      style={{
        backgroundColor: 'var(--theme-page-bg, #f5f5f4)',
        fontFamily: 'var(--theme-font-body)',
      }}
    >
      <div className="w-full lg:max-w-5xl">
        <div className="bg-white lg:rounded-2xl shadow-2xl overflow-hidden lg:grid lg:grid-cols-[280px_1fr]">
          {/* Desktop brand panel */}
          <div
            className="hidden lg:flex flex-col items-center p-8 text-center"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
          >
            <img
              src="/brand/chameleon-logo.png"
              alt="HotSeaters"
              className="w-20 h-20 object-contain mb-4"
            />
            <h2 className="text-white text-2xl mb-1" style={{ fontFamily: 'var(--theme-font-brand-title)' }}>
              HotSeaters
            </h2>
            <p
              className="text-indigo-200 text-sm mb-6"
              style={{ fontFamily: 'var(--theme-font-brand-subtitle)' }}
            >
              Trial Tech Toolkit
            </p>

            <div className="w-full space-y-1.5 text-left">
              {wiz.steps.map((s, i) => {
                const isCurrent = i === wiz.step;
                const isDone = i < wiz.step;
                const isClickable = i <= wiz.highestStep;
                const isLearn = 'learn' in s && s.learn === true;
                return (
                  <button
                    key={s.key}
                    onClick={() => isClickable && wiz.setStep(i)}
                    disabled={!isClickable}
                    className={`w-full flex items-center rounded-lg transition-all ${
                      isLearn ? 'gap-2 px-3 pl-6 py-0' : 'gap-3 px-3 py-2'
                    } ${isCurrent ? 'bg-white/20' : ''} ${isClickable ? 'hover:bg-white/10' : 'opacity-50'}`}
                  >
                    {isLearn ? (
                      <BookOpen
                        className={`w-3.5 h-3.5 flex-shrink-0 ml-1 ${
                          isCurrent ? 'text-white' : isDone ? 'text-white/70' : 'text-white/30'
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isDone
                            ? 'bg-white text-indigo-600'
                            : isCurrent
                              ? 'bg-white/30 text-white ring-2 ring-white/50'
                              : 'bg-white/10 text-white/50'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                      </div>
                    )}
                    <span
                      className={`${isLearn ? 'text-xs italic' : 'text-sm'} ${
                        isCurrent ? 'text-white font-semibold' : isDone ? 'text-white/70' : 'text-white/30'
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col px-5 pb-5 pt-6 lg:px-8 lg:py-8 lg:max-h-[85vh] lg:overflow-y-auto">
            {wiz.step === 0 && <StepProfile />}
            {wiz.step === 1 && <StepCompanyInfo />}
            {wiz.step === 2 && <LearnPreTrialInTrial />}
            {wiz.step === 3 && <StepServices />}
            {wiz.step === 4 && <StepTiers />}
            {wiz.step === 5 && <LearnLeadsToDeals />}
            {wiz.step === 6 && <StepTimeTracking />}
            {wiz.step === 7 && <StepBilling />}
            {wiz.step === 8 && <LearnDealsToTrials />}
            {wiz.step === 9 && <StepPipelineTiers />}
            {wiz.step === 10 && <StepFinancials />}
            {wiz.step === 11 && <StepTeamInvite />}
          </div>
        </div>
      </div>
    </div>
  );
}
