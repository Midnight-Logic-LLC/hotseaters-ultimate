/**
 * ⚠️  DO NOT USE WITHOUT BIBLE AUDIT  ⚠️
 *
 * MarketingShell was an early abstraction attempt for "shared marketing
 * chrome." Landing's pixel-parity port (RULE 0) revealed the abstraction
 * diverges from the bible — bible Landing inlines its own header/footer
 * with specific copy, classes, and the chameleon-logo PNG. Wrapping
 * Landing in MarketingShell hid bugs.
 *
 * Until each public page (Pricing, ReferralLanding, PrivacyPolicy,
 * TermsOfService) has been audited side-by-side against its bible file
 * and the chrome is confirmed bible-identical, this shell MUST NOT be
 * added to any page's render tree. Landing intentionally bypasses it
 * and inlines header+footer (see `landing-page.tsx`).
 *
 * Keeping the file here as a reference scaffold — delete or rebuild it
 * during each subsequent page's parity port.
 *
 * ───────────────────────────────────────────────────────────────────────
 *
 * MarketingShell — shared sticky-header + footer for public pages.
 *
 * Bible: `HotSeatersMVP/src/pages/Landing.jsx` header (lines 100-125) +
 * footer (lines 305-340). Used by Landing, Pricing, ReferralLanding,
 * PrivacyPolicy, TermsOfService.
 *
 * Visual contract (verbatim from bible):
 *   - Sticky `<header>` with bottom border, card-bg, backdrop-blur, z-50
 *   - Brand block: 40×40 chameleon logo + "HotSeaters" h1 (brand title font)
 *     and "Trial Tech Toolkit" subtitle (brand subtitle font)
 *   - Right-aligned `Login` outline button (opens AuthOptionsDialog)
 *   - Footer: `© 2026 HotSeaters. All rights reserved.` + Privacy/Terms
 *     buttons that open PolicyViewerModal
 *
 * Styles use `--theme-*` CSS variables only — every value comes from
 * MARKETING_THEME (the bible's defaultTheme.jsx) when consumers apply it on
 * mount via `applyThemeVars(MARKETING_THEME)`.
 *
 * HotSeatersMVP is the bible. Self-hosted Supabase only.
 */
import type { PropsWithChildren, ReactNode } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuthOptionsDialog } from '@/features/auth/components/auth-options-dialog';
import { PolicyViewerModal } from '@/features/marketing/components/policy-viewer-modal';

interface MarketingShellProps {
  /** Override the post-auth redirect URL passed to AuthOptionsDialog. */
  loginRedirectUrl?: string;
  /** Optional content slot below the header, above the children. */
  banner?: ReactNode;
}

export function MarketingShell({
  children,
  loginRedirectUrl = '/Dashboard',
  banner,
}: PropsWithChildren<MarketingShellProps>) {
  const [authOpen, setAuthOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyType, setPolicyType] = useState<'privacy' | 'terms'>('privacy');
  const [policyTitle, setPolicyTitle] = useState('Privacy Policy');

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(to bottom right, var(--theme-stone-50), #ffffff, #eef2ff)',
      }}
    >
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          borderColor: 'var(--theme-stone-200)',
          backgroundColor: 'var(--theme-card-bg)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          className="mx-auto flex items-center justify-between px-6 py-4"
          style={{ maxWidth: 'var(--theme-max-content-width)' }}
        >
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="HotSeaters Logo"
              width={40}
              height={40}
              className="h-10 w-10 flex-shrink-0 object-contain"
            />
            <div>
              <h1
                className="text-xl font-bold"
                style={{
                  fontFamily: 'var(--theme-font-brand-title)',
                  color: 'var(--theme-stone-900)',
                }}
              >
                HotSeaters
              </h1>
              <p
                className="text-xs"
                style={{
                  fontFamily: 'var(--theme-font-brand-subtitle)',
                  color: 'var(--theme-stone-500)',
                }}
              >
                Trial Tech Toolkit
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setAuthOpen(true)}
            style={{
              borderRadius: 'var(--theme-button-radius)',
              boxShadow: 'var(--theme-button-shadow)',
              fontFamily: 'var(--theme-font-body)',
            }}
          >
            Login
          </Button>
        </div>
      </header>

      {banner}

      {children}

      <footer
        className="border-t"
        style={{
          borderColor: 'var(--theme-stone-200)',
          backgroundColor: 'var(--theme-card-bg)',
        }}
      >
        <div
          className="mx-auto px-6 py-8"
          style={{
            maxWidth: 'var(--theme-max-content-width)',
            fontFamily: 'var(--theme-font-body)',
            color: 'var(--theme-stone-600)',
          }}
        >
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p>&copy; 2026 HotSeaters. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => {
                  setPolicyType('privacy');
                  setPolicyTitle('Privacy Policy');
                  setPolicyOpen(true);
                }}
                className="cursor-pointer border-none bg-transparent p-0 text-sm transition-colors hover:text-stone-900"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => {
                  setPolicyType('terms');
                  setPolicyTitle('Terms of Service');
                  setPolicyOpen(true);
                }}
                className="cursor-pointer border-none bg-transparent p-0 text-sm transition-colors hover:text-stone-900"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </footer>

      <PolicyViewerModal
        open={policyOpen}
        onClose={() => setPolicyOpen(false)}
        policyType={policyType}
        title={policyTitle}
      />

      <AuthOptionsDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        redirectUrl={loginRedirectUrl}
      />
    </div>
  );
}
