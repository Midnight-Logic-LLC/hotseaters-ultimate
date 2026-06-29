/**
 * mobile-more-page.tsx — overflow navigation menu for bottom tab bar.
 *
 * BIBLE: HotSeatersMVP/src/pages/MobileMore.jsx (193 lines)
 *
 * Shown at /MobileMore when the user taps the "More" tab on mobile.
 * Lists all nav items that don't fit in the bottom tab bar, grouped by section.
 * Adapts base44 API calls → port primitives:
 *   - `useTier1Data()` → `useTier1()` from @/app/tier1-provider
 *   - `base44.auth.logout(...)` → `signOut()` from useAuth
 *   - `createPageUrl(x)` → `"/${x}"` direct path
 *   - role strings: "owner"/"admin"/"trial_consultant" (LegacyRole)
 */
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  GanttChart,
  CheckCircle2,
  DollarSign,
  HandCoins,
  Users,
  Settings,
  Orbit,
  Search,
  UserPlus,
  Rocket,
  BookOpen,
  LogOut,
  ChevronRight,
  Telescope,
} from 'lucide-react';
import { useTier1 } from '@/app/tier1-provider';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { LegacyRole } from '@/shared/lib/role-mapping';
import type { Tier1UserInfo, Tier1Company } from '@/app/tier1-provider';

interface MoreSection {
  section: string;
}
interface MoreItem {
  label: string;
  icon: React.ElementType;
  page: string;
  url?: string;
}
type MoreEntry = MoreSection | MoreItem;

function isSection(entry: MoreEntry): entry is MoreSection {
  return 'section' in entry;
}

function getMoreItems(
  userRole: LegacyRole | undefined,
  company: Tier1Company | null,
  userInfo: Tier1UserInfo | null,
): MoreEntry[] {
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';
  const isOwner = userRole === 'owner';
  const isSales = userRole === 'sales';
  const hasSalesAccess = userInfo?.is_sales === true;
  const isTrialConsultant = userRole === 'trial_consultant';

  const items: MoreEntry[] = [];

  // Trial consultants get a minimal More menu
  if (isTrialConsultant && !hasSalesAccess) {
    items.push({ section: 'Company' });
    items.push({ label: 'Team', icon: Users, page: 'Team' });
    items.push({ section: 'Help' });
    items.push({ label: 'User Manual', icon: BookOpen, page: 'UserManual' });
    return items;
  }

  // --- Overview ---
  items.push({ section: 'Overview' });
  items.push({ label: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' });
  if (isOwner) {
    items.push({ label: 'Projections', icon: TrendingUp, page: 'Projections' });
  }

  // --- Sales ---
  // Bible: show to owner/admin/tc+sales_access; hide from sales role
  if ((!isTrialConsultant || hasSalesAccess) && !isSales) {
    items.push({ section: 'Sales' });
    if (!isOwner && userRole !== 'admin') {
      items.push({ label: 'Deal Tracker', icon: Telescope, page: 'DealTracker' });
    }
    items.push({ label: 'Clients', icon: Building2, page: 'Clients' });
  }

  // --- Operations --- (owners have Trials + Timeline in the bottom tab bar)
  // Bible: hidden from both owner AND sales
  if (!isOwner && !isSales) {
    items.push({ section: 'Operations' });
    items.push({ label: 'Trial Timeline', icon: GanttChart, page: 'Timeline' });
  }

  // --- Billing --- (admin only — NOT owner since owner has Billing in bottom bar)
  // Bible: isOwnerOrAdmin && !isOwner  →  admin only
  if (isOwnerOrAdmin && !isOwner) {
    items.push({ section: 'Billing' });
    items.push({ label: 'Approvals', icon: CheckCircle2, page: 'Approvals' });
    // Bible: Invoices + Payments only if userRole !== 'admin' is FALSE (i.e., shown to admin)
    // Wait — bible says `if (userRole !== "admin")` which means it SKIPS them for admin?
    // Re-read: the block is inside `isOwnerOrAdmin && !isOwner` so only admin enters.
    // `if (userRole !== "admin")` inside means: skip Invoices+Payments for admin, add for non-admin.
    // But the outer gate already restricts to admin only. So Invoices+Payments are NEVER shown.
    // Bible line 63: `if (userRole !== "admin") { push Invoices, Payments }`
    // Inside `isOwnerOrAdmin && !isOwner` block, only admin reaches here.
    // userRole !== "admin" is false for admin → Invoices/Payments are NOT added.
    // This matches: admin gets Approvals only; Invoices/Payments hidden from everyone in this block.
    if (userRole !== 'admin') {
      items.push({ label: 'Invoices', icon: DollarSign, page: 'Invoices' });
      items.push({ label: 'Payments', icon: HandCoins, page: 'Payments' });
    }
  }

  // --- HotSeatHub --- (owner AND admin AND sales — bible: isOwnerOrAdmin || isSales)
  if (isOwnerOrAdmin || isSales) {
    if (!company?.marketplace_fill_jobs && !company?.marketplace_post_jobs) {
      items.push({ section: 'HotSeatHub' });
      items.push({ label: 'Join HotSeatHub', icon: Rocket, page: 'HotSeatHubMarketing' });
    } else {
      const hshItems: MoreEntry[] = [];
      if (company?.marketplace_fill_jobs) {
        hshItems.push({ label: 'Potential Gigs', icon: Search, page: 'PotentialGigs' });
      }
      if (company?.marketplace_post_jobs) {
        hshItems.push({ label: 'Help Wanted', icon: UserPlus, page: 'HelpWanted' });
        hshItems.push({ label: 'HSH Directory', icon: Orbit, page: 'HSHDirectory', url: '/HSHDirectory' });
      }
      if (hshItems.length > 0) {
        items.push({ section: 'HotSeatHub' });
        items.push(...hshItems);
      }
    }
  }

  // --- Company --- (all non-TC roles reach here)
  items.push({ section: 'Company' });
  items.push({ label: 'Team', icon: Users, page: 'Team' });
  if (isOwnerOrAdmin) {
    items.push({ label: 'Settings', icon: Settings, page: 'Settings' });
  }

  // --- Help ---
  items.push({ section: 'Help' });
  items.push({ label: 'User Manual', icon: BookOpen, page: 'UserManual' });

  return items;
}

export function MobileMorePage() {
  const navigate = useNavigate();
  const t1 = useTier1();
  const { signOut } = useAuth();

  const user = t1.user;
  const userInfo = t1.userInfo;
  const company = t1.company;

  if (t1.isLoading || !userInfo) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  const items = getMoreItems(t1.role, company, userInfo);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--theme-page-bg, #f5f5f4)',
        fontFamily: 'var(--theme-font-sidebar)',
      }}
    >
      {/* Profile card */}
      <div className="bg-white border-b border-stone-200 px-4 py-4">
        <button
          onClick={() => navigate(`/Team?editConsultantId=${userInfo.id}`)}
          className="flex items-center gap-3 w-full text-left"
        >
          {userInfo.profile_photo ? (
            <img
              src={userInfo.profile_photo}
              alt=""
              className="w-12 h-12 rounded-full object-cover border border-stone-200"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-brand-primary) 20%, white), color-mix(in srgb, var(--theme-brand-primary) 30%, white))',
              }}
            >
              <span
                className="font-semibold text-base"
                style={{ color: 'var(--theme-brand-primary)' }}
              >
                {(
                  (userInfo.first_name?.[0] ?? '') +
                    (userInfo.last_name?.[0] ?? '') ||
                  user?.email?.[0]?.toUpperCase() ||
                  'U'
                ).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-stone-900 truncate">
              {userInfo.first_name && userInfo.last_name
                ? `${userInfo.first_name} ${userInfo.last_name}`
                : user?.email}
            </p>
            <p className="text-xs text-stone-500 truncate">{user?.email}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
        </button>
      </div>

      {/* Navigation list */}
      <div className="px-4 py-2">
        {items.map((item, i) => {
          if (isSection(item)) {
            return (
              <p
                key={`s-${i}`}
                className="uppercase tracking-wider mt-5 mb-1 px-1"
                style={{
                  fontSize: 'var(--theme-text-caption)',
                  color: 'var(--theme-stone-500)',
                  fontFamily: 'var(--theme-font-sidebar)',
                  fontWeight: 'var(--theme-sidebar-heading-weight)',
                }}
              >
                {item.section}
                {item.section === 'HotSeatHub' && (
                  <Orbit className="inline w-3 h-3 ml-1 -mt-0.5" />
                )}
              </p>
            );
          }

          const Icon = item.icon;
          const url = item.url ?? `/${item.page}`;

          return (
            <Link
              key={item.page}
              to={url}
              className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white mb-0.5 active:bg-stone-50 transition-colors"
            >
              <Icon
                className="w-5 h-5 flex-shrink-0"
                style={{ color: 'var(--theme-stone-500)' }}
              />
              <span
                className="flex-1 font-medium"
                style={{
                  color: 'var(--theme-stone-900)',
                  fontSize: 'var(--theme-text-sidebar)',
                  fontFamily: 'var(--theme-font-sidebar)',
                }}
              >
                {item.label}
              </span>
              <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div className="px-4 py-4 mt-2">
        <button
          onClick={() => void signOut()}
          className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white w-full active:bg-stone-50 transition-colors"
        >
          <LogOut className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="flex-1 text-left text-sm font-medium text-red-600">Log Out</span>
        </button>
      </div>
    </div>
  );
}
