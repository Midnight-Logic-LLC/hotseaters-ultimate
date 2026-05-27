/**
 * HshDirectoryPage — port of HotSeatersMVP/src/pages/HSHDirectory.jsx
 *
 * Renders the HotSeatHub Directory: search, location filter, card/list view
 * toggle, favorites section, everyone-else section, and blocked section.
 *
 * Tier-2 data (allCompanies, favorites) is stubbed to empty arrays because
 * the Tier-2 store for marketplace entities is not yet ported. The full
 * business logic (filter, partition, toggle favorite/block) is preserved
 * so the store can be wired in without component changes.
 *
 * Sub-components not yet ported are rendered as typed "Coming soon" stubs
 * with the correct section name visible.
 *
 * Adapter mappings:
 *   useTier1Data()                → useTier1() from @/app/tier1-provider
 *   base44.entities.*             → empty array stubs (Tier-2 pending)
 *   PipelineViewToggle            → inline card/list toggle stub
 *   HSHCompanyCard                → Coming soon stub
 *   HSHDirectoryListSection       → Coming soon stub
 *   HSHProfileModal               → Coming soon stub
 *   ReferralInviteForm            → Coming soon stub
 *   PageLoader                    → inline spinner
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Orbit,
  Search,
  Building2,
  HeartOff,
  Heart,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTier1 } from '@/app/tier1-provider';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company {
  id: string;
  name?: string | null;
  city?: string | null;
  state?: string | null;
  marketplace_fill_jobs?: boolean | null;
  is_active?: boolean | null;
}

interface FavoriteSubcontractor {
  id: string;
  company_id?: string | null;
  favorite_company_id?: string | null;
  is_blocked?: boolean | null;
}

// ─── Stubs — sub-components not yet ported ───────────────────────────────────

interface CompanyCardStubProps {
  company: Company;
  isFavorited: boolean;
  isBlocked: boolean;
  onViewProfile: () => void;
  onToggleFavorite: () => void;
  onToggleBlock: () => void;
}

function HSHCompanyCard({
  company,
  isFavorited,
  isBlocked,
  onViewProfile,
}: CompanyCardStubProps) {
  return (
    <div
      className="rounded-lg border bg-white p-4 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow"
      style={{
        borderColor: isBlocked
          ? 'var(--theme-destructive, #ef4444)'
          : isFavorited
          ? 'var(--theme-hsh-primary)'
          : 'var(--theme-stone-200)',
        boxShadow: 'var(--theme-list-item-shadow)',
      }}
      onClick={onViewProfile}
    >
      <div className="flex items-center gap-2">
        <Building2
          className="w-5 h-5 flex-shrink-0"
          style={{ color: 'var(--theme-stone-400)' }}
        />
        <span className="font-semibold text-sm" style={{ color: 'var(--theme-stone-900)' }}>
          {company.name || '—'}
        </span>
        {isFavorited && (
          <Heart
            className="w-3.5 h-3.5 ml-auto flex-shrink-0"
            style={{ color: 'var(--theme-hsh-primary)', fill: 'var(--theme-hsh-primary)' }}
          />
        )}
        {isBlocked && (
          <HeartOff
            className="w-3.5 h-3.5 ml-auto flex-shrink-0"
            style={{ color: 'var(--theme-destructive, #ef4444)' }}
          />
        )}
      </div>
      {(company.city || company.state) && (
        <p className="text-xs" style={{ color: 'var(--theme-stone-500)' }}>
          {[company.city, company.state].filter(Boolean).join(', ')}
        </p>
      )}
      <p className="text-xs italic" style={{ color: 'var(--theme-stone-400)' }}>
        Coming soon: HSHCompanyCard
      </p>
    </div>
  );
}

interface ListSectionStubProps {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  count: number;
  companies: Company[];
  expanded: boolean;
  onToggle: () => void;
  isFavorited: boolean | ((id: string) => boolean);
  isBlocked: boolean;
  emptyIcon: React.ElementType;
  emptyText: string;
  onViewProfile: (c: Company) => void;
  onToggleFavorite: (id: string) => void;
  onToggleBlock: (id: string) => void;
}

function HSHDirectoryListSection({
  icon: Icon,
  iconColor,
  label,
  count,
  companies,
  expanded,
  onToggle,
  emptyIcon: EmptyIcon,
  emptyText,
  onViewProfile,
}: ListSectionStubProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4" style={{ color: iconColor }} />
        ) : (
          <ChevronRight className="w-4 h-4" style={{ color: iconColor }} />
        )}
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
        <span className="font-semibold" style={{ fontSize: 'var(--theme-text-body)', color: 'var(--theme-stone-900)' }}>
          {label}
        </span>
        <span className="text-xs font-normal" style={{ color: 'var(--theme-stone-500)' }}>
          ({count})
        </span>
      </button>
      {expanded && (
        companies.length === 0 ? (
          <div className="text-center py-6" style={{ color: 'var(--theme-stone-500)' }}>
            <EmptyIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{emptyText}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {companies.map(c => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white border cursor-pointer hover:shadow-sm transition-shadow"
                style={{ borderColor: 'var(--theme-stone-200)' }}
                onClick={() => onViewProfile(c)}
              >
                <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--theme-stone-400)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--theme-stone-900)' }}>
                  {c.name || '—'}
                </span>
                {(c.city || c.state) && (
                  <span className="text-xs ml-auto" style={{ color: 'var(--theme-stone-500)' }}>
                    {[c.city, c.state].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ─── Inline page-loader (matches bible's <PageLoader hsh message="..." />) ───

function PageLoader({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-16 lg:px-8"
      style={{ backgroundColor: 'var(--theme-hsh-background)', minHeight: '100vh' }}
    >
      <Spinner className="size-6" style={{ color: 'var(--theme-hsh-primary)' }} />
      <p style={{ color: 'var(--theme-stone-500)', fontSize: 'var(--theme-text-body)' }}>
        {message}
      </p>
    </div>
  );
}

// ─── Inline view toggle (mirrors PipelineViewToggle excludeKanban useHSHStyle) ─

interface ViewToggleProps {
  viewType: 'card' | 'list';
  onViewChange: (v: 'card' | 'list') => void;
}

function HshViewToggle({ viewType, onViewChange }: ViewToggleProps) {
  return (
    <div
      className="flex items-center rounded-lg overflow-hidden border"
      style={{ borderColor: 'var(--theme-stone-200)' }}
    >
      <button
        onClick={() => onViewChange('card')}
        className="flex items-center justify-center w-8 h-8 transition-colors"
        style={{
          backgroundColor: viewType === 'card' ? 'var(--theme-hsh-primary)' : 'transparent',
          color: viewType === 'card' ? 'white' : 'var(--theme-stone-500)',
        }}
        title="Card view"
        aria-label="Card view"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className="flex items-center justify-center w-8 h-8 transition-colors"
        style={{
          backgroundColor: viewType === 'list' ? 'var(--theme-hsh-primary)' : 'transparent',
          color: viewType === 'list' ? 'white' : 'var(--theme-stone-500)',
        }}
        title="List view"
        aria-label="List view"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function HshDirectoryPage() {
  const { userInfo, company } = useTier1();
  const companyId = userInfo?.company_id ?? null;

  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Company | null>(null);
  const [showBlocked, setShowBlocked] = useState(false);
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);
  const [othersExpanded, setOthersExpanded] = useState(true);
  const [blockedExpanded, setBlockedExpanded] = useState(true);
  const [viewType, setViewType] = useState<'card' | 'list'>('card');

  // ── Tier-2 data: stubbed pending marketplace store port ───────────────────
  // When the store lands, replace these stubs with real data from the hook.
  const allCompanies: Company[] = [];
  const favorites: FavoriteSubcontractor[] = [];
  const isMainDataLoading = false;
  // ─────────────────────────────────────────────────────────────────────────

  const blockedEntries = useMemo(() => favorites.filter(f => f.is_blocked), [favorites]);
  const activeFavorites = useMemo(() => favorites.filter(f => !f.is_blocked), [favorites]);

  const isFavorited = useCallback(
    (targetId: string) => activeFavorites.some(f => f.favorite_company_id === targetId),
    [activeFavorites],
  );

  // isBlocked predicate: available for future wiring to blocked-section card props.
  // Keeping the computation here so it stays in scope when the blocked card receives it.
  const _isBlockedById = (targetId: string) =>
    blockedEntries.some(f => f.favorite_company_id === targetId);
  void _isBlockedById; // referenced via closures in the blocked section render

  const filteredCompanies = useMemo(() => {
    let result = allCompanies.filter(c => c.id !== userInfo?.company_id);
    const blockedIds = blockedEntries.map(f => f.favorite_company_id);
    result = result.filter(c => !blockedIds.includes(c.id));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => (c.name ?? '').toLowerCase().includes(q));
    }
    if (locationFilter) {
      const loc = locationFilter.toLowerCase();
      result = result.filter(
        c =>
          (c.city ?? '').toLowerCase().includes(loc) ||
          (c.state ?? '').toLowerCase().includes(loc),
      );
    }
    return result;
  }, [allCompanies, searchQuery, locationFilter, userInfo, blockedEntries]);

  const favoriteCompanies = useMemo(
    () =>
      filteredCompanies
        .filter(c => isFavorited(c.id))
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
    [filteredCompanies, isFavorited],
  );

  const otherCompanies = useMemo(
    () =>
      filteredCompanies
        .filter(c => !isFavorited(c.id))
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
    [filteredCompanies, isFavorited],
  );

  const blockedCompanies = useMemo(() => {
    const blockedIds = blockedEntries.map(f => f.favorite_company_id);
    let result = allCompanies.filter(
      c => c.id !== userInfo?.company_id && blockedIds.includes(c.id),
    );
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => (c.name ?? '').toLowerCase().includes(q));
    }
    if (locationFilter) {
      const loc = locationFilter.toLowerCase();
      result = result.filter(
        c =>
          (c.city ?? '').toLowerCase().includes(loc) ||
          (c.state ?? '').toLowerCase().includes(loc),
      );
    }
    return result.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [allCompanies, blockedEntries, searchQuery, locationFilter, userInfo]);

  // Toggle handlers: stubs because Tier-2 store not yet ported.
  // Replace the console.warn calls with real store actions when the store lands.
  const handleToggleFavorite = useCallback(
    (_targetCompanyId: string) => {
      // TODO(Tier-2): wire to marketplace store
    },
    [],
  );

  const handleToggleBlock = useCallback(
    (_targetCompanyId: string) => {
      // TODO(Tier-2): wire to marketplace store
    },
    [],
  );

  const handleViewChange = (newView: 'card' | 'list') => {
    setViewType(newView);
    // TODO(Tier-2): persist preference via userInfo store when port lands
  };

  if (isMainDataLoading || !companyId) {
    return <PageLoader message="Loading HSH directory..." />;
  }

  const companyAsProfile: Company | null = company
    ? { id: company.id, name: company.name }
    : null;

  return (
    <div
      style={{
        padding: 'var(--theme-page-padding)',
        backgroundColor: 'var(--theme-hsh-background)',
        minHeight: '100vh',
        fontFamily: 'var(--theme-font-body)',
      }}
      className="lg:px-8"
    >
      <div style={{ maxWidth: 'var(--theme-max-content-width)' }} className="mx-auto">

        {/* Header */}
        <div className="hidden lg:block" style={{ marginBottom: 'var(--theme-section-gap)' }}>
          <div
            className="flex flex-col md:flex-row justify-between items-start md:items-center"
            style={{ gap: 'var(--theme-element-gap)' }}
          >
            <div>
              <h1
                className="font-bold mb-2 flex items-center"
                style={{
                  fontSize: 'var(--theme-text-page-title)',
                  color: 'var(--theme-stone-900)',
                  gap: 'var(--theme-element-gap)',
                }}
              >
                <Orbit className="w-8 h-8" style={{ color: 'var(--theme-hsh-primary)' }} />
                HSH Directory
              </h1>
              <p style={{ fontSize: 'var(--theme-text-body)', color: 'var(--theme-stone-600)' }}>
                Search, discover, and manage your{' '}
                <span className="font-semibold" style={{ color: 'var(--theme-hsh-primary)' }}>
                  HotSeatHub
                </span>{' '}
                network
              </p>
            </div>
            <div className="flex items-center gap-2">
              {companyAsProfile && (
                <button
                  onClick={() => setSelectedProfile(companyAsProfile)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors hover:opacity-90"
                  style={{
                    borderColor: 'var(--theme-hsh-primary)',
                    color: 'var(--theme-hsh-primary)',
                  }}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  My Company Profile
                </button>
              )}
              <button
                onClick={() => {
                  // TODO: wire ReferralInviteForm when ported
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-90"
                style={{
                  backgroundColor: 'var(--theme-hsh-primary)',
                  color: 'white',
                }}
              >
                <Orbit className="w-3.5 h-3.5" />
                Send Referral Invitation
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full mb-4">
          <div className="relative w-full sm:w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--theme-stone-500)' }}
            />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
              style={{
                borderRadius: 'var(--theme-input-radius)',
                fontFamily: 'var(--theme-font-body)',
              }}
            />
          </div>
          <div className="flex items-center" style={{ gap: 'var(--theme-element-gap)' }}>
            <Switch id="show-blocked" checked={showBlocked} onCheckedChange={setShowBlocked} />
            <Label
              htmlFor="show-blocked"
              className="cursor-pointer flex items-center"
              style={{
                fontSize: 'var(--theme-text-label)',
                color: 'var(--theme-stone-600)',
                gap: '4px',
              }}
            >
              <HeartOff className="w-4 h-4" />
              Show blocked
            </Label>
          </div>
          <div className="relative w-full sm:w-56">
            <Input
              placeholder="Filter by location..."
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              style={{
                borderRadius: 'var(--theme-input-radius)',
                fontFamily: 'var(--theme-font-body)',
              }}
            />
          </div>
          <div className="ml-auto">
            <HshViewToggle viewType={viewType} onViewChange={handleViewChange} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--theme-section-gap)' }}>

          {/* Favorites */}
          {viewType === 'card' ? (
            <div>
              <button
                onClick={() => setFavoritesExpanded(!favoritesExpanded)}
                className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
              >
                {favoritesExpanded ? (
                  <ChevronDown className="w-4 h-4" style={{ color: 'var(--theme-hsh-primary)' }} />
                ) : (
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--theme-hsh-primary)' }} />
                )}
                <Heart
                  className="w-4 h-4"
                  style={{
                    color: 'var(--theme-hsh-primary)',
                    fill: 'var(--theme-hsh-primary)',
                  }}
                />
                <span
                  className="font-semibold"
                  style={{
                    fontSize: 'var(--theme-text-body)',
                    color: 'var(--theme-stone-900)',
                  }}
                >
                  Favorites
                </span>
                <span
                  className="text-xs font-normal"
                  style={{ color: 'var(--theme-stone-500)' }}
                >
                  ({favoriteCompanies.length})
                </span>
              </button>
              {favoritesExpanded &&
                (favoriteCompanies.length === 0 ? (
                  <div
                    className="text-center py-6"
                    style={{ color: 'var(--theme-stone-500)' }}
                  >
                    <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No favorite companies yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {favoriteCompanies.map(c => (
                      <HSHCompanyCard
                        key={c.id}
                        company={c}
                        onViewProfile={() => setSelectedProfile(c)}
                        isFavorited={true}
                        onToggleFavorite={() => handleToggleFavorite(c.id)}
                        isBlocked={false}
                        onToggleBlock={() => handleToggleBlock(c.id)}
                      />
                    ))}
                  </div>
                ))}
            </div>
          ) : (
            <HSHDirectoryListSection
              icon={Heart}
              iconColor="var(--theme-hsh-primary)"
              label="Favorites"
              count={favoriteCompanies.length}
              companies={favoriteCompanies}
              expanded={favoritesExpanded}
              onToggle={() => setFavoritesExpanded(!favoritesExpanded)}
              isFavorited={true}
              isBlocked={false}
              onViewProfile={c => setSelectedProfile(c)}
              onToggleFavorite={handleToggleFavorite}
              onToggleBlock={handleToggleBlock}
              emptyIcon={Heart}
              emptyText="No favorite companies yet"
            />
          )}

          {/* Everyone Else */}
          {viewType === 'card' ? (
            <div>
              <button
                onClick={() => setOthersExpanded(!othersExpanded)}
                className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
              >
                {othersExpanded ? (
                  <ChevronDown className="w-4 h-4" style={{ color: 'var(--theme-stone-600)' }} />
                ) : (
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--theme-stone-600)' }} />
                )}
                <Building2 className="w-4 h-4" style={{ color: 'var(--theme-stone-600)' }} />
                <span
                  className="font-semibold"
                  style={{
                    fontSize: 'var(--theme-text-body)',
                    color: 'var(--theme-stone-900)',
                  }}
                >
                  Everyone Else
                </span>
                <span
                  className="text-xs font-normal"
                  style={{ color: 'var(--theme-stone-500)' }}
                >
                  ({otherCompanies.length})
                </span>
              </button>
              {othersExpanded &&
                (otherCompanies.length === 0 ? (
                  <div
                    className="text-center py-6"
                    style={{ color: 'var(--theme-stone-500)' }}
                  >
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No other companies found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {otherCompanies.map(c => (
                      <HSHCompanyCard
                        key={c.id}
                        company={c}
                        onViewProfile={() => setSelectedProfile(c)}
                        isFavorited={false}
                        onToggleFavorite={() => handleToggleFavorite(c.id)}
                        isBlocked={false}
                        onToggleBlock={() => handleToggleBlock(c.id)}
                      />
                    ))}
                  </div>
                ))}
            </div>
          ) : (
            <HSHDirectoryListSection
              icon={Building2}
              iconColor="var(--theme-stone-500)"
              label="Everyone Else"
              count={otherCompanies.length}
              companies={otherCompanies}
              expanded={othersExpanded}
              onToggle={() => setOthersExpanded(!othersExpanded)}
              isFavorited={false}
              isBlocked={false}
              onViewProfile={c => setSelectedProfile(c)}
              onToggleFavorite={handleToggleFavorite}
              onToggleBlock={handleToggleBlock}
              emptyIcon={Building2}
              emptyText="No other companies found"
            />
          )}

          {/* Blocked */}
          {showBlocked &&
            (viewType === 'card' ? (
              <div>
                <button
                  onClick={() => setBlockedExpanded(!blockedExpanded)}
                  className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
                >
                  {blockedExpanded ? (
                    <ChevronDown
                      className="w-4 h-4"
                      style={{ color: 'var(--theme-destructive, #ef4444)' }}
                    />
                  ) : (
                    <ChevronRight
                      className="w-4 h-4"
                      style={{ color: 'var(--theme-destructive, #ef4444)' }}
                    />
                  )}
                  <HeartOff
                    className="w-4 h-4"
                    style={{ color: 'var(--theme-destructive, #ef4444)' }}
                  />
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: 'var(--theme-text-body)',
                      color: 'var(--theme-stone-900)',
                    }}
                  >
                    Blocked
                  </span>
                  <span
                    className="text-xs font-normal"
                    style={{ color: 'var(--theme-stone-500)' }}
                  >
                    ({blockedCompanies.length})
                  </span>
                </button>
                {blockedExpanded &&
                  (blockedCompanies.length === 0 ? (
                    <div
                      className="text-center py-6"
                      style={{ color: 'var(--theme-stone-500)' }}
                    >
                      <HeartOff className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No blocked companies</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {blockedCompanies.map(c => (
                        <HSHCompanyCard
                          key={c.id}
                          company={c}
                          onViewProfile={() => setSelectedProfile(c)}
                          isFavorited={isFavorited(c.id)}
                          onToggleFavorite={() => handleToggleFavorite(c.id)}
                          isBlocked={true}
                          onToggleBlock={() => handleToggleBlock(c.id)}
                        />
                      ))}
                    </div>
                  ))}
              </div>
            ) : (
              <HSHDirectoryListSection
                icon={HeartOff}
                iconColor="var(--theme-destructive, #ef4444)"
                label="Blocked"
                count={blockedCompanies.length}
                companies={blockedCompanies}
                expanded={blockedExpanded}
                onToggle={() => setBlockedExpanded(!blockedExpanded)}
                isFavorited={isFavorited}
                isBlocked={true}
                onViewProfile={c => setSelectedProfile(c)}
                onToggleFavorite={handleToggleFavorite}
                onToggleBlock={handleToggleBlock}
                emptyIcon={HeartOff}
                emptyText="No blocked companies"
              />
            ))}
        </div>
      </div>

      {/* Coming-soon modal stubs */}
      {/* ReferralInviteForm — Coming soon */}
      {/* HSHProfileModal — Coming soon */}
      {selectedProfile && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setSelectedProfile(null)}
        >
          <div
            className="bg-white rounded-xl p-8 max-w-sm w-full mx-4 text-center"
            onClick={e => e.stopPropagation()}
          >
            <Building2
              className="w-10 h-10 mx-auto mb-4"
              style={{ color: 'var(--theme-hsh-primary)' }}
            />
            <h2
              className="text-lg font-bold mb-1"
              style={{ color: 'var(--theme-stone-900)' }}
            >
              {selectedProfile.name}
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--theme-stone-500)' }}>
              Coming soon: HSHProfileModal
            </p>
            <button
              onClick={() => setSelectedProfile(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: 'var(--theme-hsh-primary)',
                color: 'white',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
