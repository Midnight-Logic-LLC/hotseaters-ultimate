/**
 * finalizing-overlay.tsx — full-screen overlay while
 * `finalize-owner-onboarding` runs. Mirrors the bible's phase animation
 * (`company → services → pipeline → theme → invitations → done`).
 */
import { Loader2, Building2, Briefcase, GitBranch, Palette, Mail, CheckCircle2 } from 'lucide-react';
import type { FinalizingPhase } from '@/features/onboarding/stores/onboarding-store';

interface Props {
  currentPhase: FinalizingPhase;
  hasInvitations: boolean;
}

const PHASE_LABELS: Record<FinalizingPhase, { icon: typeof Loader2; label: string }> = {
  company: { icon: Building2, label: 'Creating your company…' },
  services: { icon: Briefcase, label: 'Configuring services & tiers…' },
  pipeline: { icon: GitBranch, label: 'Setting up your sales pipeline…' },
  theme: { icon: Palette, label: 'Applying your brand theme…' },
  invitations: { icon: Mail, label: 'Sending team invitations…' },
  done: { icon: CheckCircle2, label: 'All set!' },
};

const PHASE_ORDER: FinalizingPhase[] = ['company', 'services', 'pipeline', 'theme', 'invitations', 'done'];

export function FinalizingOverlay({ currentPhase, hasInvitations }: Props) {
  const phases = hasInvitations ? PHASE_ORDER : PHASE_ORDER.filter((p) => p !== 'invitations');
  const currentIndex = phases.indexOf(currentPhase);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        fontFamily: 'var(--theme-font-body)',
      }}
    >
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex items-center justify-center mb-6">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 text-center mb-1">Finalizing setup</h2>
        <p className="text-sm text-stone-500 text-center mb-6">
          Hang tight — this usually takes about 5 seconds.
        </p>
        <ul className="space-y-2.5">
          {phases.map((p, i) => {
            const { icon: Icon, label } = PHASE_LABELS[p];
            const done = i < currentIndex || currentPhase === 'done';
            const active = i === currentIndex && currentPhase !== 'done';
            return (
              <li key={p} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    done
                      ? 'bg-green-100 text-green-700'
                      : active
                        ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-300'
                        : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-sm ${
                    done ? 'text-stone-700' : active ? 'text-stone-900 font-medium' : 'text-stone-400'
                  }`}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
