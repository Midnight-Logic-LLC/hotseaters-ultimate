/**
 * onboarding-boot-error.tsx — blocking error screen when the snapshot
 * fetch fails. Bible's no-fallback rule: do NOT silently substitute
 * hardcoded defaults — surface the failure so the user can contact
 * support or retry.
 */
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  message: string;
  onRetry: () => void;
}

export function OnboardingBootError({ message, onRetry }: Props) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-stone-50 via-white to-indigo-50"
      style={{ fontFamily: 'var(--theme-font-body)' }}
    >
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 mb-2">We couldn't start your setup</h2>
        <p className="text-sm text-stone-500 mb-1">
          Our onboarding defaults failed to load.
        </p>
        <p className="text-xs text-stone-400 mb-6 font-mono break-all">{message}</p>
        <div className="flex flex-col gap-2">
          <Button onClick={onRetry} style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}>
            Try Again
          </Button>
          <a
            href="mailto:support@hotseaters.com"
            className="text-sm text-stone-500 hover:text-stone-700 underline"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
