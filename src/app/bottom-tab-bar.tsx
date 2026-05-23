/**
 * BottomTabBar — port of
 * `HotSeatersMVP/src/components/mobile/BottomTabBar.jsx`.
 *
 * Mobile-only nav. Renders 4-6 primary tabs based on role + company flags.
 * "More" opens a vaul drawer-from-bottom listing the rest of the navigation.
 *
 * Per RULE 4, this is the primary surface on Tauri mobile builds.
 */

import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Drawer } from 'vaul';
import {
  type LucideIcon,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Ellipsis,
  GanttChart,
  Gavel,
  HandCoins,
  LayoutDashboard,
  Orbit,
  Radar,
  ScrollText,
  Search,
  Settings2,
  Telescope,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { getNavigationGroups, type Role, type CompanyFlags } from '@/app/navigation';

type PopupKey = 'sales' | 'ops' | 'hsh' | 'billing';
type Tab =
  | { kind: 'link'; label: string; to: string; icon: LucideIcon }
  | { kind: 'popup'; label: string; key: PopupKey; icon: LucideIcon }
  | { kind: 'more'; label: string; icon: LucideIcon };

const SALES_PAGES: { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'Lead Radar', to: '/LeadRadar', icon: Radar },
  { label: 'Deal Tracker', to: '/DealTracker', icon: Telescope },
  { label: 'Clients', to: '/Clients', icon: Building2 },
];

const OPS_PAGES: { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'Trials', to: '/Trials', icon: Gavel },
  { label: 'Timeline', to: '/Timeline', icon: GanttChart },
  { label: 'Time & Expenses', to: '/TimeAndExpenses', icon: Clock },
];

const BILLING_PAGES: { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'Approvals', to: '/Approvals', icon: CheckCircle2 },
  { label: 'Invoices', to: '/Invoices', icon: DollarSign },
  { label: 'Collections', to: '/Collections', icon: HandCoins },
  { label: 'Bills', to: '/Bills', icon: ScrollText },
];

const HSH_PAGES: { label: string; to: string; icon: LucideIcon; key: 'fill' | 'post' }[] = [
  { label: 'Potential Gigs', to: '/PotentialGigs', icon: Search, key: 'fill' },
  { label: 'Help Wanted', to: '/HelpWanted', icon: UserPlus, key: 'post' },
  { label: 'HSH Directory', to: '/HSHDirectory', icon: Orbit, key: 'post' },
];

function buildTabs(role: Role | undefined, company: CompanyFlags, hasSalesAccess: boolean): Tab[] {
  const hshTab: Tab | null =
    company.marketplace_fill_jobs || company.marketplace_post_jobs
      ? { kind: 'popup', label: 'HSH', key: 'hsh', icon: Orbit }
      : null;

  switch (role) {
    case 'owner':
      return [
        { kind: 'popup', label: 'Sales', key: 'sales', icon: TrendingUp },
        { kind: 'popup', label: 'Operations', key: 'ops', icon: Settings2 },
        ...(hshTab ? [hshTab] : []),
        { kind: 'popup', label: 'Billing', key: 'billing', icon: DollarSign },
        { kind: 'more', label: 'More', icon: Ellipsis },
      ];
    case 'admin':
      return [
        { kind: 'link', label: 'Sales', to: '/Sales', icon: TrendingUp },
        { kind: 'link', label: 'Time', to: '/TimeAndExpenses', icon: Clock },
        { kind: 'link', label: 'Invoices', to: '/Invoices', icon: DollarSign },
        { kind: 'link', label: 'Collections', to: '/Collections', icon: HandCoins },
        { kind: 'more', label: 'More', icon: Ellipsis },
      ];
    case 'sales':
      return [
        { kind: 'popup', label: 'Sales', key: 'sales', icon: TrendingUp },
        { kind: 'link', label: 'Clients', to: '/Clients', icon: Users },
        { kind: 'link', label: 'Time', to: '/TimeAndExpenses', icon: Clock },
        ...(hshTab ? [hshTab] : []),
        { kind: 'more', label: 'More', icon: Ellipsis },
      ];
    case 'trial_consultant':
    default: {
      const tabs: Tab[] = [
        { kind: 'link', label: 'Dashboard', to: '/Dashboard', icon: LayoutDashboard },
      ];
      if (hasSalesAccess) {
        tabs.push({ kind: 'link', label: 'Sales', to: '/Sales', icon: TrendingUp });
      }
      tabs.push({ kind: 'link', label: 'Trials', to: '/Trials', icon: Gavel });
      tabs.push({ kind: 'link', label: 'Timeline', to: '/Timeline', icon: GanttChart });
      tabs.push({ kind: 'link', label: 'Time', to: '/TimeAndExpenses', icon: Clock });
      tabs.push({ kind: 'more', label: 'More', icon: Ellipsis });
      return tabs;
    }
  }
}

interface BottomTabBarProps {
  userRole: Role | undefined;
  company: CompanyFlags;
  hasSalesAccess: boolean;
  /** Full navigation list — feeds the "More" drawer. */
  user?: { role?: string | undefined } | null | undefined;
  userInfo?: { is_sales?: boolean | undefined } | null | undefined;
}

export function BottomTabBar({
  userRole,
  company,
  hasSalesAccess,
  user,
  userInfo,
}: BottomTabBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [popup, setPopup] = useState<PopupKey | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs = useMemo(
    () => buildTabs(userRole, company, hasSalesAccess),
    [userRole, company, hasSalesAccess],
  );

  const allGroups = useMemo(
    () => getNavigationGroups(userRole, company, user ?? null, userInfo ?? null),
    [userRole, company, user, userInfo],
  );

  const hshPages = HSH_PAGES.filter((p) => {
    if (p.key === 'fill') return company.marketplace_fill_jobs === true;
    return company.marketplace_post_jobs === true;
  });

  const isActiveLink = (to: string) => location.pathname === to;

  const renderPopupItems = (
    items: { label: string; to: string; icon: LucideIcon }[],
    align: 'left' | 'right' | 'center',
  ) => {
    const alignClass =
      align === 'left'
        ? 'left-0'
        : align === 'right'
          ? 'right-0'
          : 'left-1/2 -translate-x-1/2';
    return (
      <div
        className={`absolute bottom-full ${alignClass} mb-2 z-50 min-w-[180px] rounded-lg border bg-white py-1 shadow-lg`}
        style={{ borderColor: 'var(--theme-stone-200)' }}
      >
        {items.map((p) => {
          const active = isActiveLink(p.to);
          return (
            <button
              key={p.to}
              onClick={() => {
                setPopup(null);
                navigate(p.to);
              }}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                active ? 'bg-stone-50 font-semibold' : 'text-stone-700 hover:bg-stone-50'
              }`}
              style={{
                fontFamily: 'var(--theme-font-sidebar)',
                color: active ? 'var(--theme-brand-primary)' : undefined,
              }}
            >
              <p.icon className="h-4 w-4" />
              {p.label}
            </button>
          );
        })}
      </div>
    );
  };

  const popupForKey = (key: PopupKey) => {
    switch (key) {
      case 'sales':
        return { items: SALES_PAGES, align: 'left' as const };
      case 'ops':
        return { items: OPS_PAGES, align: 'left' as const };
      case 'billing':
        return { items: BILLING_PAGES, align: 'right' as const };
      case 'hsh':
        return { items: hshPages, align: 'center' as const };
    }
  };

  const isPopupActive = (key: PopupKey) => {
    const list = popupForKey(key).items;
    return list.some((p) => isActiveLink(p.to));
  };

  return (
    <nav
      className="bottom-tab-bar-nav safe-bottom z-40 flex-shrink-0 border-t bg-white"
      style={{ borderColor: 'var(--theme-stone-200)' }}
    >
      <div className="flex h-12 items-stretch justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          if (tab.kind === 'link') {
            const active = isActiveLink(tab.to);
            return (
              <Link
                key={tab.label}
                to={tab.to}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? '' : 'text-stone-400 active:text-stone-600'
                }`}
                style={active ? { color: 'var(--theme-brand-primary)' } : undefined}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
              </Link>
            );
          }

          if (tab.kind === 'more') {
            return (
              <button
                key="more"
                type="button"
                onClick={() => setMoreOpen(true)}
                className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-stone-400 transition-colors active:text-stone-600"
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
              </button>
            );
          }

          const open = popup === tab.key;
          const active = isPopupActive(tab.key);
          const { items, align } = popupForKey(tab.key);

          return (
            <div key={tab.key} className="relative min-w-0 flex-1">
              {open && renderPopupItems(items, align)}
              <button
                type="button"
                onClick={() => setPopup(open ? null : tab.key)}
                className={`flex h-full w-full flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? '' : 'text-stone-400 active:text-stone-600'
                }`}
                style={active ? { color: 'var(--theme-brand-primary)' } : undefined}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* "More" drawer with the full navigation tree */}
      <Drawer.Root open={moreOpen} onOpenChange={setMoreOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Drawer.Content
            className="fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[85vh] flex-col rounded-t-2xl bg-white safe-bottom"
            style={{ fontFamily: 'var(--theme-font-body)' }}
          >
            <div className="mx-auto my-2 h-1.5 w-12 rounded-full bg-stone-300" />
            <Drawer.Title className="sr-only">Navigation</Drawer.Title>
            <div className="overflow-y-auto px-4 pb-6">
              {allGroups.map((group) => (
                <div key={group.label} className="mb-4">
                  <div
                    className="mb-1 px-2 uppercase tracking-wider"
                    style={{
                      color: 'var(--theme-stone-500)',
                      fontSize: 'var(--theme-text-caption)',
                      fontFamily: 'var(--theme-font-sidebar)',
                    }}
                  >
                    {group.label}
                  </div>
                  <ul className="flex flex-col gap-1">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      const active = isActiveLink(item.url);
                      return (
                        <li key={item.url}>
                          <Link
                            to={item.url}
                            onClick={() => setMoreOpen(false)}
                            className="flex items-center gap-3 rounded-md px-3 py-2.5"
                            style={{
                              color: active
                                ? 'var(--theme-brand-primary)'
                                : 'var(--theme-stone-600)',
                              backgroundColor: active
                                ? 'color-mix(in srgb, var(--theme-brand-primary) 10%, white)'
                                : undefined,
                              fontWeight: active ? 500 : 400,
                              fontSize: 'var(--theme-text-body)',
                            }}
                          >
                            <ItemIcon className="h-4 w-4 flex-shrink-0" />
                            <span>{item.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </nav>
  );
}
