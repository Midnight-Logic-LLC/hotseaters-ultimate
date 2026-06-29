/**
 * PrivacyPolicyPage — public standalone page.
 *
 * 1:1 port of HotSeatersMVP/src/pages/PrivacyPolicy.jsx.
 * Bible: min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 py-12 px-6,
 * max-w-4xl mx-auto wrapper, renders PrivacyPolicyContent.
 *
 * RULE 0 (pixel parity): layout classes are bible-verbatim.
 * HotSeatersMVP is the bible. Self-hosted Supabase only.
 */
import { useEffect } from 'react';
import { PrivacyPolicyContent } from '@/features/marketing/components/privacy-policy-content';
import { applyThemeVars, DEFAULT_THEME, MARKETING_THEME } from '@/shared/lib/theme';

export function PrivacyPolicyPage() {
  useEffect(() => {
    applyThemeVars(MARKETING_THEME);
    return () => applyThemeVars(DEFAULT_THEME);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <PrivacyPolicyContent />
      </div>
    </div>
  );
}
