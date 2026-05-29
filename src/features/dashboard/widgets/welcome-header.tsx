/**
 * WelcomeHeader — bible Dashboard.jsx lines 698–709 (hidden on mobile).
 */

import { useTier1 } from '@/app/tier1-provider';

export function WelcomeHeader() {
  const { userInfo } = useTier1();
  return (
    <header
      className="hidden lg:block"
      style={{ marginBottom: 'var(--theme-section-gap)' }}
      data-testid="welcome-header"
    >
      <h1
        className="mb-2 font-bold"
        style={{
          fontFamily: 'var(--theme-font-page-title)',
          fontSize: 'var(--theme-text-page-title)',
          color: 'var(--theme-stone-900)',
        }}
      >
        Welcome back, {userInfo?.first_name || 'User'}
      </h1>
      <p style={{ fontSize: 'var(--theme-text-body)', color: 'var(--theme-stone-600)' }}>
        Here&apos;s what&apos;s happening with your business
      </p>
    </header>
  );
}
