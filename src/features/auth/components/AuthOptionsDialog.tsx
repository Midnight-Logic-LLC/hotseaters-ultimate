/**
 * AuthOptionsDialog — modal that initiates a sign-in flow.
 *
 * Bible: `HotSeatersMVP/src/components/AuthOptionsDialog.jsx` (50 lines).
 * Verbatim copy, adapted from base44's `redirectToLogin` to our
 * `useAuth().signInWithGoogle()` (which performs PKCE + redirect to
 * `/auth/callback?next=<redirectUrl>`).
 *
 * Triggered from:
 *   - MarketingShell header `Login` button (redirectUrl: /Dashboard)
 *   - Landing hero `Get Started Free` button (redirectUrl: /Onboarding)
 *   - Landing hero `Watch Demo` button (redirectUrl: /Dashboard — bible
 *     behavior: no real demo, just sends to dashboard for authed users)
 *   - Landing CTA-band `Start Your Free Trial` button (redirectUrl: /Onboarding)
 *   - Pricing page CTAs (future)
 *
 * Copy is verbatim from the bible. Do not vary.
 *
 * HotSeatersMVP is the bible. Self-hosted Supabase only.
 */
import { LogIn } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';

export interface AuthOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  /**
   * Post-auth redirect target. Bible defaults to `/Dashboard`; the Landing
   * page passes `/Onboarding` for sign-up CTAs.
   */
  redirectUrl?: string;
}

export function AuthOptionsDialog({
  open,
  onClose,
  redirectUrl = '/Dashboard',
}: AuthOptionsDialogProps) {
  const { signInWithGoogle } = useAuth();

  const handleSignIn = async () => {
    // Bible behavior: redirectUrl is the post-auth target. We stash it in
    // sessionStorage so the OAuth callback page can read it after the PKCE
    // round-trip (current `useAuth().signInWithGoogle()` takes no args; the
    // callback reads `post_auth_redirect` and routes there).
    //
    // RULE 1: self-hosted only — the supabase-client guards against
    // *.supabase.co.
    try {
      sessionStorage.setItem('post_auth_redirect', redirectUrl);
    } catch {
      // sessionStorage unavailable (private mode / blocked) — fall back to
      // the default dashboard redirect handled by the callback.
    }
    await signInWithGoogle();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In or Create Account</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="rounded-lg border p-4"
            style={{
              backgroundColor: 'var(--theme-stone-50)',
              borderColor: 'var(--theme-stone-200)',
            }}
          >
            <p
              className="text-sm"
              style={{ color: 'var(--theme-stone-600)' }}
            >
              You can sign in with your <strong>Google</strong> or{' '}
              <strong>Microsoft</strong> account, or create a new account with
              email/password.
            </p>
          </div>

          <p
            className="text-center text-xs"
            style={{ color: 'var(--theme-stone-600)' }}
          >
            Don't have an account? Click the <strong>"Sign up"</strong> link on
            the next screen.
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSignIn}
            size="lg"
            className="w-full"
            style={{
              backgroundColor: 'var(--theme-brand-primary)',
              color: '#ffffff',
              borderRadius: 'var(--theme-button-radius)',
              fontFamily: 'var(--theme-font-body)',
            }}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Continue to Sign In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
