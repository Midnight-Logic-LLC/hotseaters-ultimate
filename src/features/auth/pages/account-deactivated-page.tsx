/**
 * AccountDeactivatedPage — shown when `account_status === 'disabled'`.
 *
 * BIBLE: HotSeatersMVP/src/components/AccountDeactivated.jsx
 *
 * Replaces base44.auth.logout() with signOut() from useAuth.
 * Dead-end screen: explicit support contact + sign-out. No back/forward.
 */
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Button } from '@/components/ui/button';

export function AccountDeactivatedPage() {
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50 p-6">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-red-100">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Account Deactivated</h1>
          <p className="text-slate-600 mb-6">
            Your HotSeaters account has been deactivated by your company administrator.
            You no longer have access to the application.
          </p>
          <div className="p-4 bg-slate-50 rounded-md text-sm text-slate-600 mb-6">
            <p className="mb-2">If you believe this is an error, please contact:</p>
            <a
              href="mailto:Support@HotSeaters.com"
              className="font-semibold text-slate-900 hover:underline"
            >
              Support@HotSeaters.com
            </a>
          </div>
          <Button
            onClick={() => void signOut()}
            variant="outline"
            className="w-full"
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
