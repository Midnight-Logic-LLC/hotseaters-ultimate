/**
 * NeedsAttentionBanner — bible Dashboard.jsx lines 711–755.
 *
 * Visibility decisions:
 *   • Role-level gate (owner / sales / is_sales) → widget registry.
 *   • Per-data gate ("nothing to say") → useNeedsAttention.shouldRender.
 *
 * Copy variants come pre-baked from useNeedsAttention.{headline,subhead}
 * so this component contains no role-string literal in its JSX.
 */

import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNeedsAttention } from '@/features/dashboard/hooks/use-needs-attention';

export function NeedsAttentionBanner() {
  const navigate = useNavigate();
  const { shouldRender, headline, subhead } = useNeedsAttention();
  if (!shouldRender) return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/LeadRadar')}
      data-testid="needs-attention-banner"
      className="w-full text-left transition-shadow hover:shadow-lg"
      style={{
        borderRadius: 'var(--theme-card-radius)',
        boxShadow: 'var(--theme-card-shadow)',
        borderWidth: 'var(--theme-card-border)',
        backgroundColor: 'color-mix(in srgb, #dc2626 6%, white)',
        borderStyle: 'solid',
        borderColor: '#fca5a5',
        padding: 'var(--theme-card-padding)',
        marginBottom: 'var(--theme-card-gap)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--theme-element-gap)',
      }}
    >
      <div
        className="flex flex-shrink-0 items-center justify-center rounded-full"
        style={{ width: '40px', height: '40px', backgroundColor: '#dc2626' }}
      >
        <AlertTriangle className="h-5 w-5 text-white" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="font-semibold"
          style={{ fontSize: 'var(--theme-text-card-title)', color: '#991b1b' }}
        >
          {headline}
        </p>
        <p style={{ fontSize: 'var(--theme-text-caption)', color: '#b91c1c' }}>{subhead}</p>
      </div>
      <ChevronRight className="h-5 w-5 flex-shrink-0" style={{ color: '#dc2626' }} aria-hidden="true" />
    </button>
  );
}
