# V06 Audit — Clients List Page

**Bible:** `HotSeatersMVP/src/pages/Clients.jsx` (1231 lines)
**Port:** `src/features/clients/pages/clients-list-page.tsx` (285 lines)
**Audit date:** 2026-06-29

---

## Gate Results

| Gate | Status | Notes |
|------|--------|-------|
| 1. Bible read end-to-end | PASS | All 1231 lines reviewed |
| 2. DOM regions/hierarchy match | FAIL | See defects below — port is a plain virtualised table; bible is grouped-by-type with collapse/expand, drag-to-reorder, card view toggle |
| 3. Every visible string verbatim | FAIL | Page title: port says "Clients & Contacts" ✓, subtitle "Manage your clients and their contacts" ✓ — but filter labels, empty states, import button tooltip are missing entirely |
| 4. Image assets locally hosted | N/A | No image assets on this page |
| 5. var(--theme-*) tokens referenced | FAIL | Port uses hardcoded Tailwind classes (`text-stone-900`, `border-stone-200`, etc.) instead of `var(--theme-*)` tokens used throughout the bible |
| 6. Animations reproduced | FAIL | Bible has `hover:shadow-md transition-all duration-300` on cards, `transition-transform` on ChevronDown — port has no equivalent |
| 7. Deep links/CTAs correct | PARTIAL | Click-to-detail navigates to `/Clients/:id` ✓; but URL param handling (`?client=…&contact=…`) for auto-opening a specific client/contact is absent |
| 8. Business rules/calculations preserved | FAIL | See RULE J defects |

---

## Defects — Critical (blocking)

### DEF-C1: Missing grouped-by-type list view
**Bible:** Clients are rendered in collapsible groups per `ClientType`, sorted by `type.order`, with drag-to-reorder support via `@hello-pangea/dnd`. Each group has collapse/expand, edit-type, delete-type, lock-for-default controls.
**Port:** Flat virtualised table with a single `<select>` type filter. The grouped layout, collapse, drag handles, and type management UI are entirely absent.
**Severity:** CRITICAL — the primary UX of the Clients page is missing.

### DEF-C2: Missing card view toggle
**Bible:** Toggle between List and Card views, persisted to `userInfo.preferences.clientsViewType`. In Card view, clients render as `3-column grid of Cards` with Building2 icon, type badge, phone, address.
**Port:** Only table view. No card view. No persistence of view preference.
**Severity:** CRITICAL — user-visible functionality loss.

### DEF-C3: Missing "Add Client Type" button and form (owner/admin only)
**Bible:** "Add Client Type" button visible to `isOwnerOrAdmin`. Clicking opens an inline form (type name + multiplier) with info banner explaining what client types are. Supports create/edit/delete of client types.
**Port:** No "Add Client Type" button or form present.
**Severity:** CRITICAL — admin functionality completely missing.

### DEF-C4: Missing Import Wizard
**Bible:** Download icon button opens `ClientImportWizard` modal.
**Port:** No import button or wizard.
**Severity:** CRITICAL.

### DEF-C5: Missing "Show Inactive" toggle, "Hide Empty Types" toggle, "All Sales People" filter
**Bible:** Three controls in the filter bar: `Show Inactive / Active` toggle (switch), `Hide Empty Types` toggle (switch), `All Sales People / [person]` select dropdown.
**Port:** Only type filter select is present.
**Severity:** CRITICAL — filtering capabilities missing.

### DEF-C6: Missing search-in-contact-names
**Bible:** Search matches on `firm_name`, and also on `first_name`, `last_name`, `email` of non-transferred contacts via `attorneys` query.
**Port:** Search only matches on `firm_name`.
**Severity:** HIGH.

### DEF-C7: Missing URL parameter handling for auto-open
**Bible:** `?client=<id>&contact=<contactId>` query params open a specific client and optionally trigger `autoEditContactId` state.
**Port:** No URL param handling.
**Severity:** HIGH — deep links from other pages (e.g. DealTracker opening a contact) will not work.

### DEF-C8: var(--theme-*) token violation
**Bible:** All padding, typography, colors, radii, shadows use `var(--theme-*)` tokens inline on elements.
**Port:** Uses hardcoded Tailwind class names (`text-stone-900`, `border-stone-200`, `bg-stone-50`, `text-sm`, `px-3`, `py-2` etc.).
**Severity:** HIGH — will not adapt when theme changes; diverges visually from the bible's rendered output.

---

## Defects — RULE J (Business rules missing)

### BR-C1: Client type multiplier color mapping
**Bible:** `getTypeColor(typeId)` — `multiplier < 0.9` → `bg-purple-100 text-purple-700`; `0.9 ≤ multiplier < 1.0` → `bg-blue-100 text-blue-700`; `≥ 1.0` → `bg-stone-100 text-stone-700`. Applied to badges in card view.
**Port:** `clientTierBadgeClass(mult)` exists in `business-rules/client-tier-multiplier.ts` — needs verification that thresholds match exactly.
**Action:** Cross-check `clientTierBadgeClass` thresholds against bible's `getTypeColor` formula.

### BR-C2: Client sort order within groups
**Bible:** `filteredClients.sort((a, b) => a.firm_name?.localeCompare(b.firm_name))` — alphabetical by firm name within each type group.
**Port:** No explicit sort applied — relies on store fetch order.
**Severity:** MEDIUM.

### BR-C3: Active/inactive filter logic
**Bible:** `client.status !== 'inactive'` for active mode; `client.status === 'inactive'` for inactive mode. `showInactive` toggle controls.
**Port:** `filtered.filter((c) => !c.is_lead)` — no active/inactive filter at all.
**Severity:** HIGH — inactive clients bleed into the list.

### BR-C4: Sales lead filter
**Bible:** `salesPersonFilter === 'all' || client.sales_lead === salesPersonFilter` — dropdown filters clients by assigned sales person (only users where `is_sales === true`).
**Port:** No sales lead filter.

### BR-C5: ClientType drag-to-reorder with order index write-back
**Bible:** Drag end calls `reorderClientTypesMutation` which writes `order` field to all affected ClientType rows in parallel.
**Port:** No reorder capability; no `order` field write-back.

### BR-C6: ClientType create re-orders existing types (shift-down)
**Bible:** Before creating a new ClientType, all existing active types have their `order` incremented by 1, then new type is created at `order: 0` (top).
**Port:** Not implemented.

### BR-C7: ClientType delete re-orders remaining types
**Bible:** After delete, remaining types are re-indexed starting from 0 to close the gap.
**Port:** Not implemented.

### BR-C8: Cascade-delete dialog for firm deletion
**Bible:** `CascadeDeleteDialog` with `requireTypedConfirmation` for firms — calls `cascadeDeleteFirm` on backend which removes Trials/Invoices/SalesActivities/etc. Inline `setFirmToDelete(selectedClient)` then `handleFirmDeleteSuccess` invalidates caches.
**Port:** The port's `client-detail-page.tsx` has a simple Edit-only button; delete is not wired at all.

---

## Defects — Visual / copy strings

### VIS-C1: List view row columns mismatch
**Bible list row (6-column grid):** icon | firm name | phone | address | contacts (up to 2, +N more) | sales lead
**Port table columns:** firm name | phone | type | tier | primary location
Missing: contacts column, sales lead column. Extra: type badge column in table (bible shows type as group header, not a column).

### VIS-C2: Missing empty state with icon
**Bible:** When no clients found: `Building2` icon (64×64) + "No clients found" heading + subtitle + "Add New Client" button (if no search query).
**Port:** Plain text "No matching clients." / "No clients yet." — no icon, no heading, no CTA button.

---

## V11 Backlog Items

- [ ] **V11-C1** Port grouped-by-type list layout with collapsible sections and drag-to-reorder (DEF-C1, BR-C5, BR-C6, BR-C7)
- [ ] **V11-C2** Port card view toggle with preference persistence (DEF-C2)
- [ ] **V11-C3** Add Client Type inline form with create/edit/delete/lock (DEF-C3, BR-C5)
- [ ] **V11-C4** Wire Client Import Wizard (DEF-C4)
- [ ] **V11-C5** Add Show Inactive, Hide Empty Types, Sales People filter controls (DEF-C5, BR-C3, BR-C4)
- [ ] **V11-C6** Extend search to contact names/emails (DEF-C6)
- [ ] **V11-C7** Implement `?client=&contact=` URL param deep-link (DEF-C7)
- [ ] **V11-C8** Replace hardcoded Tailwind tokens with `var(--theme-*)` (DEF-C8)
- [ ] **V11-C9** Verify `clientTierBadgeClass` thresholds match bible `getTypeColor` formula (BR-C1)
- [ ] **V11-C10** Add alphabetical sort within type groups (BR-C2)
- [ ] **V11-C11** Wire cascade-delete dialog on ClientDetail (BR-C8)
- [ ] **V11-C12** Port 6-column list row: contacts column + sales lead column (VIS-C1)
- [ ] **V11-C13** Port empty state with Building2 icon + CTA (VIS-C2)

---

## Inline fixes applied
None — all defects require structural changes beyond 1–2 lines.
