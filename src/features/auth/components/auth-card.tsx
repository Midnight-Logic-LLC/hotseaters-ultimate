/**
 * AuthCard — visual wrapper for login/signup/onboarding screens.
 * Pure presentational. Components only — no hooks beyond children.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import type { PropsWithChildren, ReactNode } from 'react';

export interface AuthCardProps extends PropsWithChildren {
  title: string;
  subtitle?: ReactNode;
  footer?: ReactNode;
  /**
   * Optional icon override. Defaults to the chameleon brand mark,
   * which mirrors the bible's landing-page header and the onboarding
   * wizard chrome. Pass a different node only when an auth-related
   * surface genuinely needs a different mark (rare).
   */
  icon?: ReactNode;
  /**
   * Hide the icon entirely. Used by `/register` and `/forgot-password`
   * per the bible-aligned mockups (no brand chameleon on those forms).
   */
  hideIcon?: boolean;
}

export function AuthCard({ title, subtitle, footer, icon, hideIcon, children }: AuthCardProps) {
  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center safe-top safe-bottom"
      style={{
        backgroundColor: 'var(--theme-page-bg)',
        padding: 'var(--theme-page-padding)',
      }}
    >
      <div
        className="w-full max-w-md relative"
        style={{
          backgroundColor: 'var(--theme-cards-background, #fff)',
          borderRadius: 'var(--theme-card-radius, 12px)',
          boxShadow:
            'var(--theme-cards-shadow, 0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(15,23,42,0.08))',
          padding: 'var(--theme-card-padding, 2rem)',
        }}
      >
        <div className="flex flex-col items-center gap-3" style={{ marginBottom: '1.5rem' }}>
          {!hideIcon &&
            (icon ?? (
              <img
                src="/brand/chameleon-logo.png"
                alt="HotSeaters"
                className="h-20 w-20 object-contain"
                loading="eager"
                decoding="async"
              />
            ))}
          <div className="text-center">
            <h1
              style={{
                fontFamily: 'var(--theme-font-brand-title)',
                fontSize: 'var(--theme-text-page-title)',
                color: 'var(--theme-stone-900)',
                fontWeight: 700,
                margin: 0,
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                style={{
                  marginTop: '0.5rem',
                  fontFamily: 'var(--theme-font-body)',
                  fontSize: 'var(--theme-text-body)',
                  color: 'var(--theme-stone-500)',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {children}

        {footer && (
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--theme-stone-200)',
              fontSize: 'var(--theme-text-caption)',
              color: 'var(--theme-stone-500)',
              textAlign: 'center',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
