/**
 * team-page.tsx — Full port of HotSeatersMVP/src/pages/Team.jsx
 *
 * Bible: /Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/Team.jsx
 *
 * Adapter mappings vs the bible:
 * - useTier1Data()             → useTier1() from @/app/tier1-provider
 * - consultantTiers            → LookupRow[] with optional multiplier
 * - services/userServices      → stubbed [] (Tier-2 entity pending)
 * - pendingInvitations         → stubbed [] (Tier-2 entity pending)
 * - favoriteUserInfos          → stubbed [] (Tier-2 entity pending)
 * - base44 mutations           → toast.info stubs
 * - isMobile                  → useIsMobile()
 *
 * Sub-components extracted to team-member-card.tsx, team-types.ts.
 * Self-hosted Supabase only. HotSeatersMVP is the bible. RULE B enforced.
 */

import { useState, useMemo, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Plus,
  Search,
  User,
  Mail,
  Phone,
  ChevronDown,
  LayoutGrid,
  List,
  Eye,
  EyeOff,
  Loader2,
  Orbit,
  SlidersHorizontal,
  Heart,
  HeartOff,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { useTier1 } from '@/app/tier1-provider';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useTeam } from '@/features/company/hooks/use-team';

import { ConsultantAvatar } from './team-member-card';
import { TierSection, PendingInviteRow } from './team-sections';
import {
  type Consultant,
  type PendingInvite,
  type ServiceRecord,
  type UserServiceRecord,
} from './team-types';

// ─── TeamPage ─────────────────────────────────────────────────────────────────

export function TeamPage() {
  const { user, isLoading: authLoading, isAuthenticated, companyId } = useAuth();
  const { userInfo, company, consultantTiers, isLoading: tier1Loading } = useTier1();
  const isMobile = useIsMobile();
  const { members, isLoading: teamLoading } = useTeam(companyId);

  // ── State ────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [viewType, setViewType] = useState<'list' | 'card'>('card');
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [showHshFavorites, setShowHshFavorites] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Consultant | null>(null);
  const [cancellingInviteId, setCancellingInviteId] = useState<string | null>(null);

  // Tier-2 stubs — pending entity wiring
  const pendingInvitations: PendingInvite[] = [];
  const favoriteUserInfos: Consultant[] = [];
  const userServices: UserServiceRecord[] = [];
  const services: ServiceRecord[] = [];

  // ── Derived ──────────────────────────────────────────────────────────────
  const currentUserId = user?.id;
  const isOwnerOrAdmin =
    userInfo?.company_role === 'owner' || userInfo?.company_role === 'admin';
  const isLoading = authLoading || tier1Loading || teamLoading;

  // ── Load view prefs ───────────────────────────────────────────────────────
  useEffect(() => {
    if (userInfo && !prefsLoaded) {
      const prefs = (userInfo as unknown as Record<string, unknown>).preferences as
        | Record<string, unknown>
        | undefined;
      if (prefs?.teamViewType === 'list' || prefs?.teamViewType === 'card') {
        setViewType(prefs.teamViewType as 'list' | 'card');
      }
      if (prefs?.teamShowHshFavorites === false) setShowHshFavorites(false);
      setPrefsLoaded(true);
    }
  }, [userInfo, prefsLoaded]);

  // ── URL param: ?editConsultantId= ─────────────────────────────────────────
  useEffect(() => {
    const checkUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get('editConsultantId');
      if (editId && members.length > 0) {
        const found = members.find((m) => m.id === editId) as Consultant | undefined;
        if (found) {
          setSelectedConsultant(found);
          window.history.replaceState({}, '', '/Team');
        }
      }
    };
    checkUrl();
    window.addEventListener('popstate', checkUrl);
    return () => window.removeEventListener('popstate', checkUrl);
  }, [members]);

  // ── Filtered + sorted consultants ─────────────────────────────────────────
  const filteredConsultants = useMemo<Consultant[]>(() => {
    return (members as Consultant[])
      .filter((c) => {
        const q = searchQuery.toLowerCase();
        const matchSearch =
          c.first_name?.toLowerCase().includes(q) ||
          c.last_name?.toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q);
        const matchStatus = showInactive
          ? c.status === 'inactive'
          : c.status !== 'inactive';
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        const ln = (a.last_name ?? '').localeCompare(b.last_name ?? '');
        return ln !== 0 ? ln : (a.first_name ?? '').localeCompare(b.first_name ?? '');
      });
  }, [members, searchQuery, showInactive]);

  const toggleGroup = (key: string) =>
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Invite stubs ──────────────────────────────────────────────────────────
  const handleInvite = () => toast.info('Invite functionality coming soon');
  const handleReferral = () => toast.info('Referral invitation coming soon');
  const handleCancelInvite = (id: string) => {
    setCancellingInviteId(id);
    toast.info('Invitation management coming soon');
    setTimeout(() => setCancellingInviteId(null), 800);
  };
  const handleDeactivateConfirm = () => {
    toast.info('Deactivation coming soon');
    setDeactivateTarget(null);
  };

  // ── Partition invitations ─────────────────────────────────────────────────
  const teamInvites = pendingInvitations.filter((i) => i.invitation_type !== 'referral');
  const referralInvites = pendingInvitations.filter((i) => i.invitation_type === 'referral');

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!authLoading && !isAuthenticated) return <Navigate to="/login" replace />;
  if (!authLoading && !companyId) return <Navigate to="/onboarding" replace />;

  if (isLoading || !prefsLoaded) {
    return (
      <div
        className="flex items-center justify-center lg:px-8"
        style={{ padding: 'var(--theme-page-padding)', minHeight: '60vh' }}
      >
        <div className="text-center">
          <Loader2
            className="w-10 h-10 animate-spin mx-auto mb-4"
            style={{ color: 'var(--theme-brand-primary)' }}
          />
          <p style={{ color: 'var(--theme-stone-500)' }}>Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 'var(--theme-page-padding)',
        fontFamily: 'var(--theme-font-body)',
        fontSize: 'var(--theme-text-body)',
      }}
      className="lg:px-8"
    >
      <div style={{ maxWidth: 'var(--theme-max-content-width)' }} className="mx-auto">

        {/* Page header */}
        <div
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
          style={{ gap: 'var(--theme-element-gap)' }}
        >
          <div className="hidden lg:block">
            <h1
              className="font-bold mb-2"
              style={{ fontFamily: 'var(--theme-font-page-title)', fontSize: 'var(--theme-text-page-title)', color: 'var(--theme-stone-900)' }}
            >
              Team
            </h1>
            <p style={{ fontSize: 'var(--theme-text-body)', color: 'var(--theme-stone-600)' }}>
              Manage your team members
            </p>
          </div>

          {isOwnerOrAdmin && (
            <div className="flex flex-col gap-2 items-end ml-auto lg:ml-0">
              <button
                onClick={handleInvite}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: 'var(--theme-brand-primary)', color: 'white' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Invite Team Member
              </button>
              <button
                onClick={handleReferral}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: 'var(--theme-hsh-primary)', color: 'white' }}
              >
                <Orbit className="w-3.5 h-3.5" />
                Send Referral Invitation
              </button>
            </div>
          )}
        </div>

        {/* Debug panel */}
        {company && !!(company as unknown as Record<string, unknown>).show_debug_info && userInfo && (
          <Card className="mb-4 bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div>
                  <h4 className="font-semibold mb-2 text-stone-900">Local State (In Memory):</h4>
                  <div className="space-y-1 font-mono">
                    <div>viewType: <strong className="text-blue-600">{viewType}</strong></div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-stone-900">Database (UserInfo.preferences):</h4>
                  <div className="space-y-1 font-mono">
                    <div>
                      teamViewType:{' '}
                      <strong className="text-green-600">
                        {String(
                          ((userInfo as unknown as Record<string, unknown>).preferences as
                            | Record<string, unknown>
                            | undefined)?.teamViewType ?? 'null',
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Team Invitations */}
        {teamInvites.length > 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-3 lg:p-6">
              <button
                onClick={() => toggleGroup('pending_team_invitations')}
                className="w-full flex items-center justify-between"
              >
                <h3 className="text-base lg:text-lg font-semibold text-stone-900">
                  Pending Team Invitations ({teamInvites.length})
                </h3>
                <ChevronDown
                  className={`w-5 h-5 text-stone-500 transition-transform ${
                    collapsedGroups.pending_team_invitations ? '-rotate-90' : ''
                  }`}
                />
              </button>
              {!collapsedGroups.pending_team_invitations && (
                <div className="space-y-2 lg:space-y-3 mt-3">
                  {teamInvites.map((invite) => (
                    <PendingInviteRow
                      key={invite.id}
                      invite={invite}
                      isMobile={isMobile}
                      badgeClassName="bg-yellow-100 text-yellow-700"
                      cancellingId={cancellingInviteId}
                      onCancel={handleCancelInvite}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* HSH Referral Invitations */}
        {referralInvites.length > 0 && (
          <Card
            className="mb-6"
            style={{
              borderColor: 'color-mix(in srgb, var(--theme-hsh-primary) 30%, white)',
              backgroundColor: 'color-mix(in srgb, var(--theme-hsh-primary) 8%, white)',
            }}
          >
            <CardContent className="p-3 lg:p-6">
              <button
                onClick={() => toggleGroup('pending_referral_invitations')}
                className="w-full flex items-center justify-between"
              >
                <h3
                  className="text-base lg:text-lg font-semibold flex items-center gap-2"
                  style={{ color: 'var(--theme-stone-900)' }}
                >
                  <Orbit className="w-4 h-4" style={{ color: 'var(--theme-hsh-primary)' }} />
                  HotSeatHub Referrals ({referralInvites.length})
                </h3>
                <ChevronDown
                  className={`w-5 h-5 text-stone-500 transition-transform ${
                    collapsedGroups.pending_referral_invitations ? '-rotate-90' : ''
                  }`}
                />
              </button>
              {!collapsedGroups.pending_referral_invitations && (
                <div className="space-y-2 lg:space-y-3 mt-3">
                  {referralInvites.map((invite) => (
                    <PendingInviteRow
                      key={invite.id}
                      invite={invite}
                      isMobile={isMobile}
                      badgeClassName="bg-stone-100 text-stone-700"
                      cancellingId={cancellingInviteId}
                      onCancel={handleCancelInvite}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search + view toggles */}
        <div
          className="flex items-center"
          style={{ marginBottom: 'var(--theme-section-gap)', gap: 'var(--theme-card-gap)' }}
        >
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--theme-stone-500)' }}
            />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              style={{
                borderRadius: 'var(--theme-input-radius)',
                borderWidth: 'var(--theme-input-border)',
                fontSize: 'var(--theme-text-body)',
                backgroundColor: 'var(--theme-input-bg)',
              }}
            />
          </div>

          {isOwnerOrAdmin && (
            <button
              onClick={() => setShowFilterDrawer(true)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border flex-shrink-0"
              style={{ borderColor: 'var(--theme-stone-200)', color: 'var(--theme-stone-600)' }}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}

          {/* Desktop: HSH toggle */}
          <div
            className="hidden lg:flex items-center rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--theme-stone-200)' }}
          >
            <button
              onClick={() => setShowHshFavorites(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                showHshFavorites
                  ? { backgroundColor: 'var(--theme-hsh-primary)', color: 'white' }
                  : { color: 'var(--theme-stone-600)' }
              }
            >
              <Heart className="w-3.5 h-3.5" />
              Show HSH
            </button>
            <button
              onClick={() => setShowHshFavorites(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                !showHshFavorites
                  ? { backgroundColor: 'var(--theme-hsh-primary)', color: 'white' }
                  : { color: 'var(--theme-stone-600)' }
              }
            >
              <HeartOff className="w-3.5 h-3.5" />
              Hide HSH
            </button>
          </div>

          {/* Desktop: Active/Archived toggle */}
          {isOwnerOrAdmin && (
            <div
              className="hidden lg:flex items-center rounded-lg border overflow-hidden"
              style={{ borderColor: 'var(--theme-stone-200)' }}
            >
              <button
                onClick={() => setShowInactive(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                style={
                  !showInactive
                    ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' }
                    : { color: 'var(--theme-stone-600)' }
                }
              >
                <Eye className="w-3.5 h-3.5" />
                Active
              </button>
              <button
                onClick={() => setShowInactive(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                style={
                  showInactive
                    ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' }
                    : { color: 'var(--theme-stone-600)' }
                }
              >
                <EyeOff className="w-3.5 h-3.5" />
                Archived
              </button>
            </div>
          )}

          {/* Desktop: list/card toggle */}
          <div
            className="ml-auto hidden lg:flex items-center rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--theme-stone-200)' }}
          >
            <button
              onClick={() => setViewType('list')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                viewType === 'list'
                  ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' }
                  : { color: 'var(--theme-stone-600)' }
              }
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setViewType('card')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                viewType === 'card'
                  ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' }
                  : { color: 'var(--theme-stone-600)' }
              }
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Card
            </button>
          </div>
        </div>

        {/* Mobile filter drawer */}
        <Drawer open={showFilterDrawer} onOpenChange={setShowFilterDrawer}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filters</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label
                  className="flex items-center"
                  style={{
                    fontSize: 'var(--theme-text-body)',
                    color: 'var(--theme-stone-700)',
                    gap: 'var(--theme-element-gap)',
                  }}
                >
                  Status
                </Label>
                <div
                  className="flex items-center rounded-lg border overflow-hidden"
                  style={{ borderColor: 'var(--theme-stone-200)' }}
                >
                  <button
                    onClick={() => { setShowInactive(false); setShowFilterDrawer(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                    style={
                      !showInactive
                        ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' }
                        : { color: 'var(--theme-stone-600)' }
                    }
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Active
                  </button>
                  <button
                    onClick={() => { setShowInactive(true); setShowFilterDrawer(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                    style={
                      showInactive
                        ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' }
                        : { color: 'var(--theme-stone-600)' }
                    }
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    Archived
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label
                  className="cursor-pointer flex items-center"
                  style={{
                    fontSize: 'var(--theme-text-body)',
                    color: 'var(--theme-stone-700)',
                    gap: 'var(--theme-element-gap)',
                  }}
                >
                  {showHshFavorites ? <Heart className="w-4 h-4" /> : <HeartOff className="w-4 h-4" />}
                  Show HotSeatHub Favorites
                </Label>
                <Switch
                  checked={showHshFavorites}
                  onCheckedChange={(v) => { setShowHshFavorites(v); setShowFilterDrawer(false); }}
                />
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Selected consultant detail panel */}
        {selectedConsultant && (
          <Card
            className="overflow-hidden border-stone-200 mb-6"
            style={{
              borderRadius: 'var(--theme-card-radius)',
              boxShadow: 'var(--theme-card-shadow)',
              borderWidth: 'var(--theme-card-border)',
              backgroundColor: 'var(--theme-card-bg)',
            }}
          >
            <CardContent
              style={{ padding: 'var(--theme-card-padding)', backgroundColor: 'var(--theme-card-bg)' }}
            >
              <div className="flex items-start gap-4">
                <ConsultantAvatar consultant={selectedConsultant} size="xl" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-stone-900 truncate">
                    {selectedConsultant.first_name} {selectedConsultant.last_name}
                  </h3>
                  {selectedConsultant.title && (
                    <p className="text-xs text-stone-500 italic">{selectedConsultant.title}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-stone-600 mt-1">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{selectedConsultant.email}</span>
                  </div>
                  {selectedConsultant.phone && (
                    <div className="flex items-center gap-2 text-sm text-stone-600">
                      <Phone className="w-4 h-4" />
                      <span>{selectedConsultant.phone}</span>
                    </div>
                  )}
                  <p className="mt-3 text-sm text-stone-500 italic">
                    Full profile editing coming soon.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {isOwnerOrAdmin && selectedConsultant.status !== 'inactive' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-orange-600 hover:text-orange-700"
                    onClick={() => setDeactivateTarget(selectedConsultant)}
                  >
                    Deactivate
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setSelectedConsultant(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Member list grouped by tier */}
        {!selectedConsultant && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--theme-section-gap)' }}>
            {consultantTiers.map((tier) => (
              <TierSection
                key={tier.id}
                tier={tier}
                consultants={filteredConsultants.filter((c) => c.consultant_tier_id === tier.id)}
                viewType={viewType}
                isMobile={isMobile}
                isOwnerOrAdmin={isOwnerOrAdmin}
                currentUserId={currentUserId}
                userServices={userServices}
                services={services}
                collapsed={!!collapsedGroups[tier.id]}
                onToggle={() => toggleGroup(tier.id)}
                onSelect={setSelectedConsultant}
              />
            ))}

            {/* HSH Favorites */}
            {showHshFavorites && favoriteUserInfos.length > 0 && (
              <TierSection
                key="hsh_favorites"
                tier={null}
                consultants={favoriteUserInfos}
                viewType={viewType}
                isMobile={isMobile}
                isOwnerOrAdmin={false}
                currentUserId={currentUserId}
                userServices={userServices}
                services={services}
                collapsed={!!collapsedGroups.hsh_favorites}
                onToggle={() => toggleGroup('hsh_favorites')}
                onSelect={() => {}}
              />
            )}

            {/* No-tier group */}
            {(() => {
              const noTier = filteredConsultants.filter((c) => !c.consultant_tier_id);
              if (noTier.length === 0) return null;
              return (
                <TierSection
                  key="no_tier"
                  tier={null}
                  consultants={noTier}
                  viewType={viewType}
                  isMobile={isMobile}
                  isOwnerOrAdmin={isOwnerOrAdmin}
                  currentUserId={currentUserId}
                  userServices={userServices}
                  services={services}
                  collapsed={!!collapsedGroups.no_tier}
                  onToggle={() => toggleGroup('no_tier')}
                  onSelect={setSelectedConsultant}
                />
              );
            })()}
          </div>
        )}

        {/* Empty state */}
        {!selectedConsultant && filteredConsultants.length === 0 && (
          <div className="text-center py-16">
            <User className="w-16 h-16 mx-auto mb-4 text-stone-300" />
            <h3 className="text-lg font-medium text-stone-900 mb-2">No team members found</h3>
            <p className="text-stone-600 mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Get started by adding your first team member'}
            </p>
            {!searchQuery && isOwnerOrAdmin && (
              <Button
                onClick={handleInvite}
                style={{
                  backgroundColor: 'var(--theme-brand-primary)',
                  color: 'white',
                  borderRadius: 'var(--theme-button-radius)',
                  boxShadow: 'var(--theme-button-shadow)',
                }}
                className="hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            )}
          </div>
        )}

        {/* Deactivate confirmation */}
        <AlertDialog
          open={!!deactivateTarget}
          onOpenChange={(open) => { if (!open) setDeactivateTarget(null); }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate Team Member</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to deactivate{' '}
              <strong>
                {deactivateTarget?.first_name} {deactivateTarget?.last_name}
              </strong>
              ? They will no longer appear in the active team list, but all their historical data
              (timesheets, expenses, etc.) will be preserved. You can reactivate them later if needed.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeactivateConfirm}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Deactivate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
}
