# MobileMore Parity Audit — V05

## Audit Gate Results

| Gate | Result | Notes |
|------|--------|-------|
| 1. Bible read | PASS | MobileMore.jsx read end-to-end (197 lines) |
| 2. DOM hierarchy | PASS | Port reproduces: profile card, navigation list with section headers, logout button. All structural elements present. |
| 3. Visible strings | PASS | "Log Out", section names (Overview, Sales, Operations, Billing, HotSeatHub, Company, Help), nav item labels all match. |
| 4. Image assets | N/A | Profile photo renders from `userInfo.profile_photo` URL — no locally-hosted assets needed. |
| 5. Theme tokens | PASS | `var(--theme-page-bg)`, `var(--theme-font-sidebar)`, `var(--theme-text-caption)`, `var(--theme-stone-500)`, `var(--theme-stone-900)`, `var(--theme-text-sidebar)`, `var(--theme-sidebar-heading-weight)`, `var(--theme-brand-primary)` all referenced correctly. |
| 6. Animations | PASS | `animate-spin` loading spinner, `active:bg-stone-50 transition-colors` on nav links, `hover:shadow-lg` — all reproduced. |
| 7. Deep links/CTAs | PASS | All nav items use `/${item.page}` path format (port) equivalent to bible's `createPageUrl(item.page)`. Profile tap → `/Team?editConsultantId=${userInfo.id}`. |
| 8. Business rules | FAIL | Multiple role-gate defects identified (see below). The `getMoreItems` function in the port has 5 divergences from the bible's gating logic. |

## Role-Gate Defect Analysis

### Bible's `getMoreItems` logic (source of truth)

```
isOwnerOrAdmin = role === 'owner' || role === 'admin'
isOwner        = role === 'owner'
isSales        = role === 'sales'
hasSalesAccess = userInfo.is_sales === true
isTrialConsultant = role === 'trial_consultant'
```

**Bible Sales section gate (line 45):**
```js
if ((!isTrialConsultant || hasSalesAccess) && !isSales)
```
Means: Sales section shown to owner, admin (and trial_consultant with is_sales) BUT **hidden from sales role**.

**Port Sales section gate (line 84):**
```ts
if (!isOwner && (!isTrialConsultant || hasSalesAccess))
```
Means: Sales section shown to admin, sales, trial_consultant+is_sales — **incorrectly shown to `sales` role** AND **incorrectly hidden from `owner`**.

**Bible Operations gate (line 54):**
```js
if (!isOwner && !isSales)
```
Means: Operations section hidden from both owner and sales roles.

**Port Operations gate (line 92):**
```ts
if (!isOwner)
```
Means: Operations section incorrectly **shown to `sales` role**.

**Bible Billing gate (line 60):**
```js
if (isOwnerOrAdmin && !isOwner)
```
And Payments row (line 63-66):
```js
if (userRole !== "admin") {
  items.push(Invoices); items.push(Payments);
}
```
So admin sees only Approvals; owner sees nothing.

**Port Billing gate (lines 98-103):**
```ts
if (isOwnerOrAdmin && !isOwner) {
  items.push(Approvals, Invoices, Payments); // always all three for admin
}
```
**Admin incorrectly sees Invoices and Payments** (bible hides them from admin).

**Bible HotSeatHub gate (line 71):**
```js
if (isOwnerOrAdmin || isSales)
```
Meaning: owner, admin, AND sales role all see HSH.

**Port HotSeatHub gate (line 106):**
```ts
if (isOwnerOrAdmin && !isOwner)
```
**Owner and sales role incorrectly excluded** from HotSeatHub section.

**Bible Projections gate (line 40):**
```js
if (isOwner)
```
Port Projections gate (line 79):
```ts
if (isOwnerOrAdmin)
```
**Admin incorrectly sees Projections.**

## Additional Defects

**Icon divergence:** Bible uses `HSHIcon` (custom HotSeatHub SVG icon) for the HotSeatHub section header inline decoration. Port uses `Orbit` (Lucide generic icon). HSHIcon is the brand-critical icon that must appear next to "HotSeatHub" section heading.

**Missing nav item — Lead Radar:** Port adds `{ label: 'Lead Radar', icon: Radar, page: 'LeadRadar' }` to the Sales section (line 86). Bible does NOT include Lead Radar in `getMoreItems` — Radar is imported at the top of MobileMore.jsx but never used in the nav list. Port exposes an extra item the bible doesn't show.

**Missing icon — HSHDirectory:** Bible uses `BookUser` icon for HSH Directory. Port uses `Orbit`. These are different Lucide icons.

## Defects (V11 Backlog)

- [DEF-M001] Severity: HIGH — **Sales section shown to `sales` role**: Bible explicitly hides the Sales section from users with `role === 'sales'` (those users already have sales items in their bottom tab bar). Port incorrectly shows it. Fix: add `&& !isSales` to the port's Sales section gate.

- [DEF-M002] Severity: HIGH — **Sales section hidden from `owner`**: Bible shows owner the Sales section (Clients only — no Deal Tracker). Port's `!isOwner` gate incorrectly hides it from owners. Fix: match bible's `(!isTrialConsultant || hasSalesAccess) && !isSales` gate, noting that owner passes this.

- [DEF-M003] Severity: HIGH — **Operations section shown to `sales` role**: Bible gate is `!isOwner && !isSales`; port gate is `!isOwner`. Fix: add `&& userRole !== 'sales'` (or `&& !isSales`) to port's Operations gate.

- [DEF-M004] Severity: HIGH — **Admin sees Invoices + Payments in Billing section**: Bible shows admin only Approvals; Invoices and Payments are guarded by `userRole !== "admin"`. Port always adds all three to admin's list. Fix: add a sub-gate for Invoices/Payments: only add them when `companyRole !== 'admin'`.

- [DEF-M005] Severity: HIGH — **HotSeatHub section missing for owner and sales**: Bible shows HSH to `isOwnerOrAdmin || isSales`. Port gate `isOwnerOrAdmin && !isOwner` excludes both owner and sales. Fix: match bible's gate.

- [DEF-M006] Severity: MED — **Projections shown to admin**: Bible gates Projections to `isOwner` only. Port gates to `isOwnerOrAdmin`. Fix: change port's Projections gate to `userRole === 'owner'`.

- [DEF-M007] Severity: MED — **Lead Radar spuriously added**: Port adds Lead Radar to the Sales section; bible does not include it in MobileMore. Remove the Lead Radar entry from port's `getMoreItems`.

- [DEF-M008] Severity: MED — **`HSHIcon` replaced by `Orbit` for HotSeatHub section heading**: Bible renders `<HSHIcon className="inline w-4 h-4 ml-1 -mt-0.5" />` next to the "HotSeatHub" section label. Port renders `<Orbit className="inline w-3 h-3 ml-1 -mt-0.5" />`. Fix: import and use `HSHIcon` from `@/shared/ui/hsh-icon` (or wherever it is in the port).

- [DEF-M009] Severity: MED — **HSHDirectory uses `Orbit` icon instead of `BookUser`**: Bible uses `BookUser` for HSH Directory nav item. Port uses `Orbit`. Fix: replace with `BookUser` from lucide-react.

- [DEF-M010] Severity: LOW — **`isSales` variable not tracked in port's `getMoreItems`**: Bible derives `isSales = userRole === 'sales'` and uses it in multiple gates. Port's `getMoreItems` doesn't declare an `isSales` variable, making several gate conditions silently wrong (see DEF-M001, M003, M005). Fix: add `const isSales = userRole === 'sales';` in `getMoreItems`.

## Inline Fixes Applied

None — all defects require logic changes to `getMoreItems` in `mobile-more-page.tsx` that affect multiple conditions and must be tested together to avoid new regressions.
