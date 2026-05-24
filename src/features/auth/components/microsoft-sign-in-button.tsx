/**
 * MicrosoftSignInButton — branded Microsoft sign-in CTA.
 *
 * Currently rendered disabled with a tooltip — the bible's
 * AuthOptionsDialog promises Microsoft sign-in but the Azure /
 * Entra ID OAuth client has not been provisioned on our self-hosted
 * GoTrue yet. The button is intentionally visible so the screen
 * matches the bible's user-facing copy; clicking it does nothing.
 *
 * Wire-up to enable later:
 *   - Create an Azure App Registration with redirect URI
 *     https://hotbase.prometheusags.ai/auth/v1/callback
 *   - Add GOTRUE_EXTERNAL_AZURE_{ENABLED,CLIENT_ID,SECRET,REDIRECT_URI}
 *     to k8s/base/supabase/auth.yaml (mirroring the Google block)
 *   - Add AZURE_CLIENT_ID + AZURE_SECRET to GH Actions secrets and
 *     deploy.yml's secret-apply step
 *   - Pass `disabled={false}` to this component and wire `onClick` to
 *     `signInWithAzure()` (which calls supabase.auth.signInWithOAuth
 *     with provider: 'azure')
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { Button } from '@/components/ui/button';

export interface MicrosoftSignInButtonProps {
  /** Called when Microsoft auth is actually wired. Currently unused. */
  onClick?: () => void | Promise<void>;
  /** Default true until Azure OAuth is provisioned. */
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}

function MicrosoftIcon() {
  // Official Microsoft 4-square logo (Bing-style spec): the four
  // tiles in #F25022 red, #7FBA00 green, #00A4EF blue, #FFB900 yellow.
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="9" height="9" fill="#F25022" />
      <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
      <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
      <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export function MicrosoftSignInButton({
  onClick,
  disabled = true,
  loading = false,
  label = 'Continue with Microsoft',
}: MicrosoftSignInButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick ? () => void onClick() : undefined}
      disabled={disabled || loading}
      title={disabled ? 'Microsoft sign-in coming soon' : undefined}
      className="w-full justify-center gap-3 h-11"
      style={{
        borderRadius: 'var(--theme-button-radius)',
        fontFamily: 'var(--theme-font-body)',
        fontSize: 'var(--theme-text-button)',
      }}
    >
      <MicrosoftIcon />
      <span>{loading ? 'Redirecting…' : label}</span>
    </Button>
  );
}
