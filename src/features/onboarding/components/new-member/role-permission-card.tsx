/**
 * role-permission-card.tsx — shaded card that summarises what a given
 * role can do in HotSeaters. Caller selects which role to show.
 *
 * BIBLE: HotSeatersMVP/src/components/onboarding/NewMemberOnboarding.jsx
 * (rolePermissionDescriptions + roleIcons + role permission summary block).
 */
import { Shield, Briefcase, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export type MemberRole = 'owner' | 'admin' | 'sales' | 'trial_consultant';

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  sales: 'Sales',
  trial_consultant: 'Trial Consultant',
};

// Verbatim from the bible's `rolePermissionDescriptions` registry — sourced
// from the canonical Role Permissions card (pages/DocInviteWizard).
const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  owner: 'Full access to all features, billing, and team management. Cannot be changed.',
  admin: 'Manage all deals, trials, clients, and team members. Can change roles.',
  sales: 'Manage deals, clients, and move opportunities through the sales pipeline.',
  trial_consultant: 'Track time, view assigned trials, and manage their own tasks.',
};

const ROLE_ICONS: Record<MemberRole, LucideIcon> = {
  owner: Shield,
  admin: Shield,
  sales: Briefcase,
  trial_consultant: User,
};

interface Props {
  role: MemberRole;
  className?: string;
}

export function RolePermissionCard({ role, className }: Props) {
  const Icon = ROLE_ICONS[role] ?? User;
  const label = ROLE_LABELS[role] ?? role;
  const description = ROLE_DESCRIPTIONS[role];

  return (
    <div className={cn('bg-muted/50 border rounded-xl p-4', className)}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-background rounded-lg border flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-indigo-600" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wide mb-0.5">
            {label}
          </p>
          <p className="text-sm text-stone-700">{description}</p>
        </div>
      </div>
    </div>
  );
}
