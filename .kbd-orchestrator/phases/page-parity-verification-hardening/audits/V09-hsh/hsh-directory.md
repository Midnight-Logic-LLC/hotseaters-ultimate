# RULE-0 Parity Audit — HSHDirectory

**Bible:** `HotSeatersMVP/src/pages/HSHDirectory.jsx` (363 lines)
**Port:** `src/features/hsh/pages/hsh-directory-page.tsx`
**Audit date:** 2026-06-29

---

## Gate verdict: BLOCKED

Structure (three sections: Favorites / Everyone Else / Blocked), card/list
toggle, search + location filter, show-blocked switch, and all business-rule
computations are well-ported. Blocking defects are Tier-2 data stubs and
stub sub-components.

---

## Defects

### D1 — BLOCKING — Tier-2 data stubs (HSH store not landed)

```ts
const allCompanies: Company[] = [];
const favorites: FavoriteSubcontractor[] = [];
```

**User impact:** all three sections show empty state. No companies visible.

---

### D2 — BLOCKING — `handleToggleFavorite` / `handleToggleBlock` are no-ops

```ts
const handleToggleFavorite = (_targetCompanyId: string) => {
  // TODO(Tier-2): wire to marketplace store
};
```

Bible toggles `FavoriteSubcontractor` records (create/delete by `is_blocked`).

---

### D3 — BLOCKING — `HSHProfileModal` is an inline stub

Port (lines 746–780) shows a centered card with "Coming soon: HSHProfileModal".
Bible's `HSHProfileModal` shows the full company profile, services, ratings, and
contact actions.

---

### D4 — MEDIUM — `ReferralInviteForm` button is a no-op

Port (lines 439–450) has a "Send Referral Invitation" button that runs a
`// TODO` comment. Bible opens `ReferralInviteForm` modal.

---

### D5 — MEDIUM — Page icon uses `Orbit` instead of `HSHIcon`

Bible: `<HSHIcon className="w-10 h-10" />`. Port: `<Orbit className="w-8 h-8">`.

---

### D6 — MEDIUM — `HSHCompanyCard` stub lacks favorite/block action buttons

Port's `HSHCompanyCard` stub (lines 75–125) shows the company name and
location but no favorite/block/unblock buttons. Bible's card has a heart
icon (favorite toggle) and block button visible on hover.

---

### D7 — LOW — `HSHDirectoryListSection` stub lacks action buttons

Port's list-section stub (lines 144–206) shows company rows with name/location
but no action buttons (favorite/block). Bible list view shows the same per-row
controls.

---

## Business rules preserved

| Rule | Bible ref | Port status |
|------|-----------|-------------|
| `blockedEntries = favorites.filter(f => f.is_blocked)` | line 89 | ✓ line 287 |
| `activeFavorites = favorites.filter(f => !f.is_blocked)` | line 90 | ✓ line 288 |
| `isFavorited(targetId)` predicate | line 92 | ✓ lines 290–293 |
| `filteredCompanies`: excludes own company + excludes blocked | lines 94–108 | ✓ lines 301–318 |
| Search filter: name match | line 99 | ✓ lines 305–307 |
| Location filter: city or state match | lines 103–107 | ✓ lines 308–314 |
| `favoriteCompanies`: filtered + isFavorited + sorted alpha | lines 110–115 | ✓ lines 320–325 |
| `otherCompanies`: filtered + !isFavorited + sorted alpha | lines 117–123 | ✓ lines 327–333 |
| `blockedCompanies`: blocked entries + search + location filter | lines 125–133 | ✓ lines 336–354 |
| Grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4` | line 163 | ✓ lines 551, 624, 707 |
| Card/list toggle (excludeKanban=true, excludeMap=true) | line 159 | ✓ `HshViewToggle` |
| "My Company Profile" button (border hsh-primary) | line 170 | ✓ lines 426–436 |
| "Send Referral Invitation" button (bg hsh-primary, white) | line 172 | ✓ lines 438–450 |
| Blocked section hidden unless `showBlocked` | line 220 | ✓ line 659 |

---

## V11 backlog items

- Wire HSH store hook (Company + FavoriteSubcontractor entities)
- Wire `handleToggleFavorite` / `handleToggleBlock` mutations
- Port `HSHProfileModal` with full company profile, services, ratings
- Port `ReferralInviteForm` modal
- Replace `<Orbit>` icon with `HSHIcon` (w-10 h-10)
- Add favorite/block action buttons to `HSHCompanyCard` and list-section rows
