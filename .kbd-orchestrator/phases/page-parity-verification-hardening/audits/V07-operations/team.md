# Team Page — RULE-0 Parity Audit

**Bible:** `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/Team.jsx` (1764 lines)
**Port:** `/Users/gqadonis/Projects/midnight/hotseaters-ultimate/src/features/company/pages/team-page.tsx`
**Audit date:** 2026-06-29

---

## Gate Results

| Gate | Result | Notes |
|------|--------|-------|
| G1 — Bible read end-to-end | PASS | All 1764 lines read |
| G2 — Rendered DOM regions match | PARTIAL | Chrome, search, toggles, tier grouping present; team member card detail missing services; member form missing; invite wizard missing |
| G3 — Every visible string verbatim | PARTIAL | Most visible strings match; invite wizard strings absent; ConsultantForm content absent |
| G4 — Image assets locally hosted | N/A | Avatars are user-uploaded photos; no bundled images |
| G5 — var(--theme-*) tokens referenced | PASS | All card, button, and layout tokens correctly referenced |
| G6 — Animations reproduced | N/A | Bible has `hover:shadow-md transition-all duration-300` hover states on cards — present in port's `TierSection` component |
| G7 — Deep links / CTAs correct | FAIL | See defects |
| G8 — Business rules / calculations preserved (RULE J) | PARTIAL | Core filtering/sorting preserved; mutations stubbed |

**Overall: FAIL** — 7 blocking defects, 5 medium defects. Closest to parity of the five pages but still has significant gaps.

---

## What the port has (PASS)

1. Page title "Team" — verbatim.
2. Subtitle "Manage your team members" — verbatim.
3. "Invite Team Member" button with `var(--theme-brand-primary)` bg — verbatim.
4. "Send Referral Invitation" button with `var(--theme-hsh-primary)` bg + Orbit icon — verbatim.
5. `showInactive` toggle (Active/Archived) with Eye/EyeOff icons — verbatim.
6. `showHshFavorites` toggle (Show HSH/Hide HSH) with Heart/HeartOff icons — verbatim.
7. List/Card view toggle — verbatim.
8. Search input "Search team members..." — verbatim placeholder.
9. Mobile filter drawer ("Filters" title, Status toggle, HSH switch) — verbatim.
10. Tier grouping with collapsible headers (`tier.name (×tier.multiplier) - N Members`) — verbatim.
11. "No Tier" section header — verbatim.
12. HSH Favorites section header "HotSeatHub Favorites - N Members" — verbatim.
13. Empty state: User icon + "No team members found" + conditional context string — verbatim.
14. "Add Team Member" button in empty state — verbatim.
15. Deactivate confirmation dialog: "Deactivate Team Member" + description text — verbatim.
16. `AlertDialog` footer: Cancel + Deactivate (orange) — verbatim.
17. Pending Team Invitations card (yellow bg/border) — verbatim.
18. HotSeatHub Referrals card (HSH-tinted) — verbatim.
19. Debug panel (yellow bg, viewType/teamViewType display) — verbatim.
20. `editConsultantId` URL param handler — verbatim.
21. Filtered+sorted consultant list (by last_name, then first_name; active/inactive split) — verbatim.
22. `var(--theme-*)` tokens for all card, list, button, section layout — matches.

---

## Defects

### DEFECT-TM-01 (CRITICAL) — ConsultantForm (edit/create profile) is a stub
- **Bible:** Clicking a team member (if owner/admin or own profile) opens `ConsultantForm` rendered inside a Card. The form has: first_name, last_name, phone, title, profile_photo upload, signature_image upload, company_role dropdown, consultant_tier_id, is_sales checkbox, services multi-select, Google Calendar connect/disconnect, calendar sync preferences (in-trial-only, sales-activities, event color).
- **Port:** Clicking a member opens a simplified card showing avatar + name + email + phone + "Full profile editing coming soon." No actual form. The `selectedConsultant` panel is a read-only view stub.
- **Fix required:** Port `ConsultantForm` component and wire it into the selected-consultant flow.

### DEFECT-TM-02 (CRITICAL) — InviteTeamMemberWizard not implemented
- **Bible:** `InviteTeamMemberWizard` is a 3-step wizard: (1) email + name, (2) role selection, (3) services. Has `existingEmails` dedup check. Sends via `sendInvitationEmail` function call.
- **Port:** `handleInvite()` calls `toast.info('Invite functionality coming soon')`. No wizard.
- **Fix required:** Port `InviteTeamMemberWizard`.

### DEFECT-TM-03 (CRITICAL) — ReferralInviteForm not implemented
- **Bible:** `ReferralInviteForm` (Drawer or Dialog) collects referral email + optional message, sends via `sendInvitationEmail` with `invitation_type: 'referral'`.
- **Port:** `handleReferral()` calls `toast.info('Referral invitation coming soon')`. No form.
- **Fix required:** Port `ReferralInviteForm`.

### DEFECT-TM-04 (CRITICAL) — Pending invitations are hardcoded empty
- **Bible:** Fetches from `base44.entities.Invitation.filter({company_id, status: 'pending'})` + accepted referrals. RTS subscription on `Invitation` entity refreshes list in real time.
- **Port:** `const pendingInvitations: PendingInvite[] = []` — hardcoded. No Tier-2 query wired.
- **Fix required:** Wire pending invitations query to Supabase via entity store.

### DEFECT-TM-05 (CRITICAL) — HSH favoriteUserInfos hardcoded empty
- **Bible:** Fetches `FavoriteSubcontractor` records → pulls `UserInfo` rows for favorited companies → enriches with emails via `getEmails` function. Shows these as "HotSeatHub Favorites" tier.
- **Port:** `const favoriteUserInfos: Consultant[] = []` — hardcoded. HSH favorites section never renders.
- **Fix required:** Wire Tier-2 query for favorite user infos.

### DEFECT-TM-06 (CRITICAL) — Cancel invitation is a stub
- **Bible:** `deleteInviteMutation.mutate(inviteId)` calls `cancelInvitation` cloud function. Sets `cancellingInviteId` to show spinner during cancel.
- **Port:** `handleCancelInvite` calls `toast.info('Invitation management coming soon')` and fakes a brief `cancellingInviteId` cycle.
- **Fix required:** Wire `cancelInvitation` entity function call.

### DEFECT-TM-07 (CRITICAL) — Deactivate mutation is a stub
- **Bible:** `deactivateMutation.mutate(userInfoId)` calls `base44.entities.UserInfo.update(userInfoId, { status: 'inactive' })`. RTS subscription auto-refreshes list.
- **Port:** `handleDeactivateConfirm()` calls `toast.info('Deactivation coming soon')`.
- **Fix required:** Wire deactivate mutation to Supabase update.

### DEFECT-TM-08 (HIGH) — Reactivate mutation missing
- **Bible:** `reactivateMutation` is available on the `ConsultantForm`. The form's `onReactivate` prop calls `reactivateMutation.mutate(consultant.id)` which sets `status: 'active'`.
- **Port:** Not implemented (form stub means this isn't surfaced yet).
- **Fix required:** Implement alongside ConsultantForm port.

### DEFECT-TM-09 (HIGH) — Calendar health check absent
- **Bible:** On mount, loops through consultants with `google_calendar_refresh_token` and calls `testCalendarConnection` to set `calendarHealth[id]` to `'healthy'` or `'error'`. Renders in card as "Connected" (green), "Expired" (red), or "Checking..." (yellow).
- **Port:** No `calendarHealth` state. Cards render Calendar badges but without health status.
- **Fix required:** Implement calendar health check and badge rendering in `TierSection`/card components.

### DEFECT-TM-10 (HIGH) — userServices / services data empty
- **Bible:** Shows assigned services per member using `consultantServices.filter(cs => cs.consultant_id === consultant.id)` + `services.find(s => s.id === cs.service_id)`, sorted by category order.
- **Port:** `const userServices: UserServiceRecord[] = []` and `const services: ServiceRecord[] = []` hardcoded. No services shown on any card.
- **Fix required:** Wire from Tier-1 data (services and userServices come from `useTier1()`).

### DEFECT-TM-11 (HIGH) — Role update dropdown missing
- **Bible:** Admin/owner can change a consultant's role inline via `handleRoleChange` which calls `updateRoleMutation.mutate({ userInfoId, company_role })`. Self-change blocked with ErrorDialog.
- **Port:** Role is displayed as a badge but not editable (no dropdown in card; ConsultantForm stub doesn't include it).
- **Fix required:** Add role change capability to ConsultantForm.

### DEFECT-TM-12 (MEDIUM) — Card/list view services rendering incomplete
- **Bible:** Both list and card views show assigned service names joined with commas under the Award icon.
- **Port:** Services are passed to `TierSection` but are all empty arrays. Service list renders blank.
- **Fix required:** Fix once Tier-1 services/userServices are wired.

### DEFECT-TM-13 (MEDIUM) — View preference not persisted back
- **Bible:** `handleViewTypeChange` calls `base44.entities.UserInfo.update(currentUserInfo.id, { preferences: {..., teamViewType: newViewType} })`. RTS sub patches cache.
- **Port:** `setViewType(...)` updates local state only. Not persisted.
- **Fix required:** Wire to entity update store.

---

## Business Rules Assessment (RULE J)

| Rule | Bible Location | Port Status |
|------|---------------|-------------|
| Filtered consultants: search + status match | Team.jsx lines 562–577 | PASS |
| Sort by last_name then first_name | Team.jsx line 573–576 | PASS |
| isOwnerOrAdmin gates all admin actions | Team.jsx line 470 | PASS |
| isOwnProfile = consultant.user_id === currentUser.id | Team.jsx line 429 | PASS |
| Non-admin own-profile edit: can only change photo/name/phone/title/calendar prefs | Team.jsx lines 437–451 | ABSENT (ConsultantForm stub) |
| skipServiceUpdate for non-admin self-edit | Team.jsx line 453 | ABSENT (ConsultantForm stub) |
| Self-role-change blocked | Team.jsx line 484 | ABSENT (no role UI) |
| teamShowHshFavorites pref defaults to true | Team.jsx lines 103–107 | PASS |
| teamViewType pref defaults to 'card' | Team.jsx line 99 | PASS |
| existingEmails dedup in invite: all consultants + pending invites | Team.jsx lines 1744–1750 | ABSENT (wizard stub) |
| getTierColor: multiplier ≥ 1.2 → purple, ≥ 1.0 → blue, else green | Team.jsx lines 580–586 | ABSENT (not in TierSection) |

---

## Inline Fixes Made
None — defects require feature porting, not inline edits.
