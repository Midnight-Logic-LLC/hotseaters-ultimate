/**
 * NeedsAttentionBanner — bible Dashboard.jsx lines 711–755.
 *
 * Renders nothing when:
 *   • staleMyCount === 0 AND (not owner OR staleTotalCount === 0).
 *
 * Role-gating to show the banner at all (owner / sales / is_sales) lives
 * in the widget registry (change-408). This component just hides on
 * "nothing to say".
 */

import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTier1 } from '@/app/tier1-provider';
import { useNeedsAttention } from '@/features/dashboard/hooks/use-needs-attention';

export function NeedsAttentionBanner() {
  const navigate = useNavigate();
  const { role } = useTier1();
  const { myCount, totalCount, isLoading } = useNeedsAttention();
  const isOwner = role === 'owner';
  if (isLoading) return null;
  if (myCount === 0 && !(isOwner && totalCount > 0)) return null;

  const headline = isOwner
    ? `${myCount} of yours / ${totalCount} total need attention`
    : `${myCount} ${myCount === 1 ? 'lead needs' : 'leads need'} attention`;

  const subhead = isOwner
    ? 'Overdue or missing a next step — open Lead Radar to follow up.'
    : 'Overdue or no next step scheduled — open Lead Radar to follow up.';

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
