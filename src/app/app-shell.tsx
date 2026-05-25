/**
 * AppShell — structural layout for hotseaters-ultimate.
 *
 * Ports `HotSeatersMVP/src/Layout.jsx` (the bible) to base-ui + the new
 * sidebar primitive. Structural only — no data loading, no auth gates. Data
 * hooks land in Change 5.
 *
 * Breakpoints:
 *   - lg (≥1024px): full left rail sidebar, no bottom tab bar
 *   - md (768-1023): collapsed icon-only rail (handled by Sidebar `collapsible='icon'`)
 *   - <md: top app bar (hamburger opens Sheet) + bottom tab bar
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useTier1 } from '@/app/tier1-provider';
import {
  getNavigationGroups,
  type NavigationGroup,
} from '@/app/navigation';
import { getPageMetadata } from '@/app/page-metadata';
import { BottomTabBar } from '@/app/bottom-tab-bar';

function NavigationContent({ groups }: { groups: NavigationGroup[] }) {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const handleClick = () => setOpenMobile(false);

  return (
    <>
      {groups.map((group) => {
        const TrailingIcon = group.trailingIcon;
        return (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel
              className="flex items-center uppercase tracking-wider"
              style={{
                color: 'var(--theme-stone-500)',
                fontSize: 'var(--theme-text-caption)',
                padding: 'var(--theme-element-gap)',
                gap: 'var(--theme-element-gap)',
                fontFamily: 'var(--theme-font-sidebar)',
                fontWeight: 'var(--theme-sidebar-heading-weight)' as unknown as number,
              }}
            >
              {group.label}
              {TrailingIcon && <TrailingIcon className="h-3.5 w-3.5" />}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className="mb-1 transition-all duration-200"
                        style={{
                          borderRadius: 'var(--theme-button-radius)',
                          ...(active
                            ? {
                                backgroundColor:
                                  'color-mix(in srgb, var(--theme-brand-primary) 10%, white)',
                                color: 'var(--theme-brand-primary)',
                                fontWeight: 500,
                              }
                            : { color: 'var(--theme-stone-600)' }),
                        }}
                        render={
                          <Link
                            to={item.url}
                            onClick={handleClick}
                            className="flex items-center"
                            style={{
                              gap: 'var(--theme-element-gap)',
                              padding: 'var(--theme-element-gap)',
                              fontSize: 'var(--theme-text-sidebar)',
                              fontFamily: 'var(--theme-font-sidebar)',
                            }}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span className="flex-1">{item.title}</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </>
  );
}

/**
 * BrandHeader — sidebar / mobile header brand mark + wordmark.
 *
 * Bible: `HotSeatersMVP/src/Layout.jsx` `SidebarHeader` (chameleon logo +
 * "HotSeaters" / "Trial Tech Toolkit" wordmark stack).
 *
 * Logo source: `public/brand/chameleon-logo.png` (in-org chameleon brand
 * mark). Single canonical asset across login, sidebar, mobile header.
 */
function BrandHeader() {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/brand/chameleon-logo.png"
        alt="HotSeaters Logo"
        width={40}
        height={40}
        className="h-10 w-10 flex-shrink-0 object-contain"
      />
      <div className="group-data-[collapsible=icon]:hidden">
        <h2
          className="tracking-wider"
          style={{
            fontFamily: 'var(--theme-font-brand-title)',
            fontSize: 'var(--theme-text-card-title)',
            color: 'var(--theme-stone-900)',
            fontWeight: 700,
          }}
        >
          HotSeaters
        </h2>
        <p
          className="-mt-1"
          style={{
            fontFamily: 'var(--theme-font-brand-subtitle)',
            fontSize: 'var(--theme-text-caption)',
            color: 'var(--theme-stone-500)',
          }}
        >
          Trial Tech Toolkit
        </p>
      </div>
    </div>
  );
}

export function AppShell() {
  const { user, userInfo, company, role } = useTier1();
  const isMobile = useIsMobile();
  const location = useLocation();

  const companyFlags = company ?? { marketplace_fill_jobs: false, marketplace_post_jobs: false };
  const groups = getNavigationGroups(role, companyFlags, user, userInfo);
  const meta = getPageMetadata(location.pathname);

  return (
    <SidebarProvider defaultOpen>
      <div className="flex w-full overflow-hidden" style={{ height: '100dvh' }}>
        <Sidebar
          collapsible="icon"
          className="flex-shrink-0 border-r"
          style={{
            backgroundColor: 'var(--theme-sidebar-bg)',
            fontFamily: 'var(--theme-font-sidebar)',
            borderColor: 'var(--theme-stone-200)',
          }}
        >
          <SidebarHeader
            className="border-b"
            style={{
              borderColor: 'var(--theme-stone-200)',
              backgroundColor: 'var(--theme-stone-50)',
              padding: 'var(--theme-card-header-padding)',
            }}
          >
            <BrandHeader />
          </SidebarHeader>

          <SidebarContent
            style={{
              backgroundColor: 'var(--theme-sidebar-bg)',
              padding: 'var(--theme-element-gap)',
            }}
          >
            <NavigationContent groups={groups} />
          </SidebarContent>

          <SidebarRail />
        </Sidebar>

        <div className="flex min-w-0 flex-1 flex-col">
          {isMobile && (
            <header
              className="flex-shrink-0 overflow-visible border-b safe-top"
              style={{
                backgroundColor: 'var(--theme-sidebar-bg)',
                borderColor: 'var(--theme-stone-200)',
                padding: '0.375rem 1rem',
              }}
            >
              <div className="flex items-center gap-2.5">
                <SidebarTrigger aria-label="Open navigation" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <h1
                    className="truncate leading-tight"
                    style={{
                      fontFamily: 'var(--theme-font-body)',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: 'var(--theme-stone-900)',
                    }}
                  >
                    {meta.title || 'HotSeaters'}
                  </h1>
                  {meta.description && (
                    <p
                      className="truncate leading-tight"
                      style={{
                        fontFamily: 'var(--theme-font-body)',
                        fontSize: '0.72rem',
                        color: 'var(--theme-stone-500)',
                      }}
                    >
                      {meta.description}
                    </p>
                  )}
                </div>
              </div>
            </header>
          )}

          <main
            className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden"
            style={{ backgroundColor: 'var(--theme-page-bg)' }}
          >
            <Outlet />
          </main>

          {isMobile && !meta.hideTabBar && (
            <BottomTabBar
              userRole={role}
              company={companyFlags}
              hasSalesAccess={userInfo?.is_sales === true}
              user={user}
              userInfo={userInfo}
            />
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
