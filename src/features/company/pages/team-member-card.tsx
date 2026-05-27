/**
 * team-member-card.tsx — ConsultantAvatar, MemberCard, and MemberRow sub-components.
 *
 * Extracted from team-page.tsx (>800 lines). HotSeatersMVP is the bible.
 * Components → no store imports (RULE B).
 */

import { User, Mail, Phone, Award, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LookupRow } from '@/shared/db/lookups-selectors';
import {
  type Consultant,
  type ServiceRecord,
  type LucideIcon,
  roleIcons,
  roleColors,
  roleLabels,
  formatPhoneNumber,
  getTierColor,
} from './team-types';

// ─── ConsultantAvatar ─────────────────────────────────────────────────────────

interface ConsultantAvatarProps {
  consultant: Consultant;
  size?: 'lg' | 'xl';
}

export function ConsultantAvatar({ consultant, size = 'lg' }: ConsultantAvatarProps) {
  const dim = size === 'xl' ? 'w-16 h-16' : 'w-12 h-12';
  const text = size === 'xl' ? 'text-xl' : 'text-lg';
  const initials = [consultant.first_name?.[0], consultant.last_name?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase();

  if (consultant.profile_photo) {
    return (
      <img
        src={consultant.profile_photo}
        alt={`${consultant.first_name ?? ''} ${consultant.last_name ?? ''}`}
        className={`${dim} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center flex-shrink-0 font-bold ${text}`}
      style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
    >
      {initials || <User className="w-6 h-6" />}
    </div>
  );
}

// ─── MemberCard (card view) ───────────────────────────────────────────────────

interface MemberCardProps {
  consultant: Consultant;
  tier: LookupRow | undefined;
  assignedServices: ServiceRecord[];
  isOwnerOrAdmin: boolean;
  currentUserId: string | undefined;
  onClick: () => void;
}

export function MemberCard({
  consultant,
  tier,
  assignedServices,
  onClick,
}: MemberCardProps) {
  const roleKey = consultant.company_role ?? 'trial_consultant';
  const RoleIcon: LucideIcon = roleIcons[roleKey] ?? User;

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-300 border-stone-200 cursor-pointer ${
        consultant.status === 'inactive' ? 'opacity-60 bg-stone-50' : ''
      }`}
      onClick={onClick}
      style={{
        borderRadius: 'var(--theme-card-radius)',
        boxShadow: 'var(--theme-card-shadow)',
        borderWidth: 'var(--theme-card-border)',
        backgroundColor: 'var(--theme-card-bg)',
      }}
    >
      <CardContent style={{ padding: 'var(--theme-card-padding)' }} className="flex flex-col h-full">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-stone-900 truncate">
              {consultant.first_name} {consultant.last_name}
            </h3>
            {consultant.title && (
              <p className="text-xs text-stone-500 italic truncate">{consultant.title}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-stone-600 mt-1">
              <Mail className="w-4 h-4" />
              <span className="truncate">{consultant.email}</span>
            </div>
            {consultant.phone && (
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <Phone className="w-4 h-4" />
                <span>{consultant.phone}</span>
              </div>
            )}
          </div>
          <ConsultantAvatar consultant={consultant} size="xl" />
        </div>

        <div className="space-y-2 mb-4 flex-1">
          {assignedServices.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-stone-600">
              <Award className="w-4 h-4 mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {assignedServices.map((service, idx) => (
                  <span key={service.id}>
                    {service.name}
                    {idx < assignedServices.length - 1 ? ',' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-auto">
          <div className="flex flex-wrap gap-2">
            {tier ? (
              <Badge className={getTierColor(tier)}>{tier.name}</Badge>
            ) : (
              <Badge className="bg-stone-100 text-stone-700">No Tier</Badge>
            )}
            <Badge className={roleColors[roleKey] ?? 'bg-stone-100 text-stone-700'}>
              <RoleIcon className="w-3 h-3 mr-1" />
              {roleLabels[roleKey] ?? roleKey}
            </Badge>
            {consultant.google_calendar_refresh_token ? (
              <Badge className="bg-green-100 text-green-700">
                <Calendar className="w-3 h-3 mr-1" />
                Calendar
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-stone-50 text-stone-500">
                <Calendar className="w-3 h-3 mr-1" />
                No Calendar
              </Badge>
            )}
          </div>
          {consultant.status === 'inactive' && (
            <Badge variant="outline" className="bg-stone-100">Inactive</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MemberRow (list view) ────────────────────────────────────────────────────

interface MemberRowProps {
  consultant: Consultant;
  tier: LookupRow | undefined;
  assignedServices: ServiceRecord[];
  onClick: () => void;
}

export function MemberRow({ consultant, tier, assignedServices, onClick }: MemberRowProps) {
  const roleKey = consultant.company_role ?? 'trial_consultant';
  const RoleIcon: LucideIcon = roleIcons[roleKey] ?? User;

  return (
    <Card
      className={`hover:shadow-md transition-all duration-300 border-stone-200 cursor-pointer ${
        consultant.status === 'inactive' ? 'opacity-60 bg-stone-50' : ''
      }`}
      onClick={(e) => {
        if (!(e.target as Element).closest('button')) onClick();
      }}
      style={{
        borderRadius: 'var(--theme-card-radius)',
        boxShadow: 'var(--theme-card-shadow)',
        borderWidth: 'var(--theme-card-border)',
        backgroundColor: 'var(--theme-card-bg)',
      }}
    >
      <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
        <div className="flex items-start gap-4">
          <ConsultantAvatar consultant={consultant} size="lg" />
          <div className="flex-1 min-w-[200px]">
            <h4 className="font-semibold text-stone-900 text-lg truncate">
              {consultant.first_name} {consultant.last_name}
            </h4>
            {consultant.title && (
              <p className="text-xs text-stone-500 italic">{consultant.title}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-stone-600">
              <span className="flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{consultant.email}</span>
              </span>
              {consultant.phone && (
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Phone className="w-3 h-3" />
                  {formatPhoneNumber(consultant.phone)}
                </span>
              )}
            </div>
            {assignedServices.length > 0 && (
              <div className="flex items-start gap-1 mt-2 text-xs text-stone-500">
                <Award className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span className="break-words">
                  {assignedServices.map((s) => s.name).join(', ')}
                </span>
              </div>
            )}
          </div>
          <div className="hidden lg:flex flex-col items-end gap-2">
            {tier ? (
              <Badge className={`${getTierColor(tier)} whitespace-nowrap`}>{tier.name}</Badge>
            ) : (
              <Badge className="bg-stone-100 text-stone-700 whitespace-nowrap">No Tier</Badge>
            )}
            <Badge
              className={`${roleColors[roleKey] ?? 'bg-stone-100 text-stone-700'} whitespace-nowrap`}
            >
              <RoleIcon className="w-3 h-3 mr-1" />
              {roleLabels[roleKey] ?? roleKey}
            </Badge>
            {consultant.google_calendar_refresh_token ? (
              <Badge className="whitespace-nowrap bg-green-100 text-green-700">
                <Calendar className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-stone-50 text-stone-500 whitespace-nowrap">
                <Calendar className="w-3 h-3 mr-1" />
                No Calendar
              </Badge>
            )}
            {consultant.status === 'inactive' && (
              <Badge variant="outline" className="bg-stone-100 text-stone-700 whitespace-nowrap">
                Inactive
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
