/**
 * TermsOfServicePage — public standalone page.
 *
 * 1:1 port of HotSeatersMVP/src/pages/TermsOfService.jsx.
 * Bible: min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 py-12 px-6,
 * max-w-4xl mx-auto wrapper, renders TermsOfServiceContent.
 *
 * RULE 0 (pixel parity): layout classes are bible-verbatim.
 * HotSeatersMVP is the bible. Self-hosted Supabase only.
 */
import { useEffect } from 'react';
import { TermsOfServiceContent } from '@/features/marketing/components/terms-of-service-content';
import { applyThemeVars, DEFAULT_THEME, MARKETING_THEME } from '@/shared/lib/theme';

export function TermsOfServicePage() {
  useEffect(() => {
    applyThemeVars(MARKETING_THEME);
    return () => applyThemeVars(DEFAULT_THEME);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <TermsOfServiceContent />
      </div>
    </div>
  );
}
