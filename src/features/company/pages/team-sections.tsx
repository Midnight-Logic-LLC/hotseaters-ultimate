/**
 * team-sections.tsx — TierSection and PendingInviteRow sub-components.
 *
 * Extracted from team-page.tsx (>800 lines). HotSeatersMVP is the bible.
 * Components → no store imports (RULE B).
 */

import { ChevronDown, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { LookupRow } from '@/shared/db/lookups-selectors';
import { MemberCard, MemberRow } from './team-member-card';
import {
  type Consultant,
  type PendingInvite,
  type ServiceRecord,
  type UserServiceRecord,
  roleLabels,
  sortServicesByOrder,
} from './team-types';

// ─── TierSection ──────────────────────────────────────────────────────────────

export interface TierSectionProps {
  tier: LookupRow | null;
  consultants: Consultant[];
  viewType: 'list' | 'card';
  isMobile: boolean;
  isOwnerOrAdmin: boolean;
  currentUserId: string | undefined;
  userServices: UserServiceRecord[];
  services: ServiceRecord[];
  collapsed: boolean;
  onToggle: () => void;
  onSelect: (c: Consultant) => void;
}

export function TierSection({
  tier,
  consultants,
  viewType,
  isMobile,
  isOwnerOrAdmin,
  currentUserId,
  userServices,
  services,
  collapsed,
  onToggle,
  onSelect,
}: TierSectionProps) {
  if (consultants.length === 0) return null;

  const accentColor = tier ? 'var(--theme-brand-primary)' : 'var(--theme-stone-400)';
  const label = tier
    ? `${tier.name} (×${tier.multiplier}) - ${consultants.length} ${consultants.length === 1 ? 'Member' : 'Members'}`
    : `No Tier - ${consultants.length} ${consultants.length === 1 ? 'Member' : 'Members'}`;
  const isListView = isMobile || viewType === 'list';

  const getAssigned = (c: Consultant) =>
    sortServicesByOrder(
      userServices
        .filter((us) => us.consultant_id === c.id)
        .map((us) => services.find((s) => s.id === us.service_id))
        .filter((s): s is ServiceRecord => !!s),
    );

  return (
    <div>
      {isListView ? (
        <button
          onClick={onToggle}
          className="w-full text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2 transition-colors"
        >
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accentColor }} />
          {label}
          <ChevronDown
            className={`w-5 h-5 ml-auto transition-transform ${collapsed ? '-rotate-90' : ''}`}
          />
        </button>
      ) : (
        <div
          className="w-full font-semibold flex items-center pb-3 border-b"
          style={{
            fontSize: 'var(--theme-section-font-size)',
            color: 'var(--theme-stone-900)',
            backgroundColor: 'var(--theme-section-bg)',
            padding: 'var(--theme-section-padding)',
            borderBottomWidth: 'var(--theme-section-border)',
            borderBottomColor: 'var(--theme-stone-200)',
            marginBottom: 'var(--theme-section-spacing)',
            gap: 'var(--theme-element-gap)',
          }}
        >
          <button
            onClick={onToggle}
            className="flex items-center transition-colors flex-1"
            style={{ color: 'var(--theme-stone-900)', gap: 'var(--theme-element-gap)' }}
          >
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accentColor }} />
            {label}
            <ChevronDown
              className={`w-5 h-5 transition-transform ${collapsed ? '-rotate-90' : ''}`}
            />
          </button>
        </div>
      )}

      {!collapsed &&
        (isListView ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--theme-list-spacing)' }}>
            {consultants.map((c) => (
              <MemberRow
                key={c.id}
                consultant={c}
                tier={tier ?? undefined}
                assignedServices={getAssigned(c)}
                onClick={() => onSelect(c)}
              />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'var(--theme-card-gap)' }}>
            {consultants.map((c) => (
              <MemberCard
                key={c.id}
                consultant={c}
                tier={tier ?? undefined}
                assignedServices={getAssigned(c)}
                isOwnerOrAdmin={isOwnerOrAdmin}
                currentUserId={currentUserId}
                onClick={() => onSelect(c)}
              />
            ))}
          </div>
        ))}
    </div>
  );
}

// ─── PendingInviteRow ─────────────────────────────────────────────────────────

export interface PendingInviteRowProps {
  invite: PendingInvite;
  isMobile: boolean;
  badgeClassName: string;
  cancellingId: string | null;
  onCancel: (id: string) => void;
}

export function PendingInviteRow({
  invite,
  isMobile,
  badgeClassName,
  cancellingId,
  onCancel,
}: PendingInviteRowProps) {
  const isAccepted = invite.status === 'accepted';
  const isReferral = invite.invitation_type === 'referral';

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 lg:gap-2 border border-stone-200"
      style={{
        borderRadius: 'var(--theme-list-item-radius)',
        boxShadow: 'var(--theme-list-item-shadow)',
        borderWidth: 'var(--theme-list-item-border)',
        backgroundColor: 'var(--theme-list-item-bg)',
        padding: isMobile ? '0.5rem 0.75rem' : 'var(--theme-list-item-padding)',
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-stone-900 truncate text-sm lg:text-base">
          {invite.first_name && invite.last_name
            ? `${invite.first_name} ${invite.last_name}`
            : invite.email}
        </p>
        <p className="text-xs lg:text-sm text-stone-600 truncate">{invite.email}</p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          <Badge className={`${badgeClassName} w-fit text-xs`}>
            {isReferral ? 'HSH Referral' : (roleLabels[invite.role ?? ''] ?? invite.role)}
          </Badge>
          {isAccepted && isReferral && (
            <Badge className="w-fit text-xs bg-green-100 text-green-700">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Accepted — Joined HotSeaters
            </Badge>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onCancel(invite.id)}
        disabled={cancellingId !== null}
        className={`self-end sm:self-center text-xs ${
          isAccepted
            ? 'text-stone-600 hover:text-stone-700 hover:bg-stone-100'
            : 'text-red-600 hover:text-red-700 hover:bg-red-50'
        }`}
      >
        {cancellingId === invite.id ? (
          <>
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            {isAccepted ? 'Dismissing...' : 'Cancelling...'}
          </>
        ) : isAccepted ? (
          'Dismiss'
        ) : (
          'Cancel'
        )}
      </Button>
    </div>
  );
}
