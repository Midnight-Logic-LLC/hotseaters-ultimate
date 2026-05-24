/**
 * GoogleSignInButton — branded Google sign-in CTA.
 * Pure presentational. Caller wires the `onClick` to a hook action.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { Button } from '@/components/ui/button';

export interface GoogleSignInButtonProps {
  onClick: () => void | Promise<void>;
  loading?: boolean;
  label?: string;
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.994 3.018v2.51h3.227c1.886-1.736 2.985-4.295 2.985-7.351Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.895 6.615-2.422l-3.227-2.51c-.895.6-2.04.955-3.388.955-2.604 0-4.81-1.76-5.596-4.122H3.064v2.59A9.997 9.997 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.404 13.9A6 6 0 0 1 6.09 12c0-.66.114-1.3.314-1.9V7.51H3.064A9.997 9.997 0 0 0 2 12c0 1.614.386 3.14 1.064 4.49l3.34-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.978c1.47 0 2.787.505 3.823 1.498l2.867-2.866C16.96 2.99 14.696 2 12 2A9.997 9.997 0 0 0 3.064 7.51l3.34 2.59C7.19 7.74 9.396 5.978 12 5.978Z"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  onClick,
  loading = false,
  label = 'Continue with Google',
}: GoogleSignInButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        void onClick();
      }}
      disabled={loading}
      className="w-full justify-center gap-3 h-11"
      style={{
        borderRadius: 'var(--theme-button-radius)',
        fontFamily: 'var(--theme-font-body)',
        fontSize: 'var(--theme-text-button)',
      }}
    >
      <GoogleIcon />
      <span>{loading ? 'Redirecting…' : label}</span>
    </Button>
  );
}
