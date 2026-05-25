/**
 * SidebarUserFooter — sidebar footer with avatar, profile button,
 * collapse toggle, and sign-out.
 *
 * Bible: `HotSeatersMVP/src/components/sidebar/SidebarUserFooter.jsx`.
 *
 * NotificationsMenu is intentionally NOT mounted here — it lands in a
 * follow-up change (see change-402 proposal "Out of scope"). The
 * companion stub is left as a comment marker so the diff against the
 * bible is obvious.
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthSession } from '@/shared/db/auth-session';

interface UserShape {
  email?: string | null;
}

interface UserInfoShape {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  profile_photo?: string | null;
}

function UserAvatar({
  userInfo,
  user,
}: {
  userInfo: UserInfoShape | null;
  user: UserShape | null;
}) {
  if (userInfo?.profile_photo) {
    return (
      <img
        src={userInfo.profile_photo}
        alt={`${userInfo.first_name ?? ''} ${userInfo.last_name ?? ''}`.trim()}
        className="h-9 w-9 min-h-9 min-w-9 flex-shrink-0 rounded-full border object-cover"
        style={{ borderColor: 'var(--theme-stone-200)' }}
      />
    );
  }
  const initials = (
    (userInfo?.first_name?.[0] ?? '') +
      (userInfo?.last_name?.[0] ?? '') ||
    user?.email?.[0]?.toUpperCase() ||
    'U'
  ).toUpperCase();
  return (
    <div
      className="flex h-9 w-9 min-h-9 min-w-9 flex-shrink-0 items-center justify-center rounded-full"
      style={{
        background:
          'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-brand-primary) 20%, white), color-mix(in srgb, var(--theme-brand-primary) 30%, white))',
      }}
    >
      <span
        className="text-sm font-semibold"
        style={{ color: 'var(--theme-brand-primary)' }}
      >
        {initials}
      </span>
    </div>
  );
}

function CollapseToggle() {
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            onClick={toggleSidebar}
            variant="outline"
            size="icon"
            className="hidden h-8 w-8 flex-shrink-0 md:flex"
            style={{
              color: 'var(--theme-stone-500)',
              borderRadius: 'var(--theme-button-radius)',
            }}
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        }
      />
      <TooltipContent
        side="right"
        style={{ fontFamily: 'var(--theme-font-sidebar)' }}
      >
        {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      </TooltipContent>
    </Tooltip>
  );
}

export interface SidebarUserFooterProps {
  user: UserShape | null;
  userInfo: UserInfoShape | null;
}

export function SidebarUserFooter({ user, userInfo }: SidebarUserFooterProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const signOut = useAuthSession((s) => s.signOut);

  const handleProfileClick = () => {
    if (!userInfo?.id) return;
    const target = `/Team?editConsultantId=${userInfo.id}`;
    if (location.pathname === '/Team') {
      window.history.pushState({}, '', target);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      navigate(target);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      // Land on /login regardless of signOut outcome — if the call failed
      // the user is still better off on the landing/login surface.
      window.location.replace('/login');
    }
  };

  const fullName =
    userInfo?.first_name && userInfo?.last_name
      ? `${userInfo.first_name} ${userInfo.last_name}`
      : user?.email ?? 'User';

  return (
    <SidebarFooter
      className="border-t"
      style={{
        borderColor: 'var(--theme-stone-200)',
        backgroundColor: '#f9fafb',
        padding: 'var(--theme-card-padding)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--theme-element-gap)',
        }}
      >
        {/* Avatar row */}
        <div
          className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}
          style={{ gap: 'var(--theme-element-gap)' }}
        >
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleProfileClick}
                    className="mx-auto flex items-center justify-center rounded-lg p-1 transition-colors hover:bg-stone-100"
                  >
                    <UserAvatar userInfo={userInfo} user={user} />
                  </button>
                }
              />
              <TooltipContent
                side="right"
                style={{ fontFamily: 'var(--theme-font-sidebar)' }}
              >
                {fullName}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={handleProfileClick}
              className="-m-1 flex min-w-0 flex-1 items-center rounded-lg p-1 transition-colors hover:bg-stone-100"
              style={{ gap: 'var(--theme-element-gap)' }}
            >
              <UserAvatar userInfo={userInfo} user={user} />
              <div className="min-w-0 flex-1 text-left">
                <p
                  className="truncate text-left font-medium"
                  style={{
                    color: 'var(--theme-stone-900)',
                    fontSize: 'var(--theme-text-sidebar)',
                    fontFamily: 'var(--theme-font-sidebar)',
                  }}
                >
                  {fullName}
                </p>
                <p
                  className="truncate text-left"
                  style={{
                    color: 'var(--theme-stone-500)',
                    fontSize: '9px',
                    fontFamily: 'var(--theme-font-sidebar)',
                    textTransform: 'lowercase',
                  }}
                >
                  {user?.email ?? ''}
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Action buttons row */}
        <div
          className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}
          style={{ gap: 'var(--theme-element-gap)' }}
        >
          <CollapseToggle />
          {!isCollapsed && (
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="flex-1 justify-start"
              size="sm"
              style={{
                color: 'var(--theme-stone-600)',
                borderRadius: 'var(--theme-button-radius)',
                fontSize: 'var(--theme-text-sidebar)',
                fontFamily: 'var(--theme-font-sidebar)',
                gap: 'var(--theme-element-gap)',
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
            // NotificationsMenu intentionally omitted — out of scope for
            // change-402 per proposal. Lands in a follow-up.
          )}
        </div>
      </div>
    </SidebarFooter>
  );
}

export default SidebarUserFooter;
