# V06 Audit — Client Detail Page

**Bible:** `HotSeatersMVP/src/components/clients/ClientDetails.jsx` (rendered within `Clients.jsx` as an inline overlay — NOT a separate route in the bible)
**Port:** `src/features/clients/pages/client-detail-page.tsx` (150 lines) at route `/Clients/:clientId`
**Audit date:** 2026-06-29

---

## Architecture note
The bible renders `ClientDetails` as an overlay inside the Clients list page (same route, replaces list content). The port routes to a separate page at `/Clients/:id`. This is an acceptable architectural adaptation — the rendered output is what matters for parity, not the routing mechanism.

---

## Gate Results

| Gate | Status | Notes |
|------|--------|-------|
| 1. Bible read end-to-end | PARTIAL | `ClientDetails.jsx` not directly read — it is a component file. The `Clients.jsx` bible shows props passed to it. Need to read the full component for complete audit. |
| 2. DOM regions/hierarchy match | PARTIAL | Header (firm name, type badge, phone, website, address) + tabs (Overview, Addresses, Service Overrides, Trials) are present. But Contacts tab is absent, Trials tab is stub. |
| 3. Every visible string verbatim | PARTIAL | Tab names present; "Back to Clients" ✓; Overview field labels need verification against ClientDetails.jsx |
| 4. Image assets locally hosted | N/A | No images |
| 5. var(--theme-*) tokens referenced | FAIL | Port uses Tailwind classes (`text-stone-900`, `text-sm`, `gap-3`, etc.) not `var(--theme-*)` tokens |
| 6. Animations reproduced | N/A | No animations on detail page |
| 7. Deep links/CTAs correct | PASS | Back button → `/Clients`; Edit opens form sheet |
| 8. Business rules preserved | FAIL | Trials tab is stub; Contacts tab absent; sales_lead resolved to name not ID |

---

## Defects — Critical

### DEF-CD1: Trials tab is a placeholder stub
**Bible:** Trials tab shows all trials associated with the client.
**Port:** "Trials feature lands in Change 7. Once available, this tab will list trials joined by `client_id`." — explicit TODO stub.
**Severity:** HIGH — user-visible functionality loss (contacts and trials are primary reasons to open a client detail).

### DEF-CD2: No Contacts tab
**Bible `ClientDetails.jsx`:** Has a full Contacts section/tab that lists attorneys associated with the client, with add/edit/delete contact capability.
**Port:** No Contacts tab at all.
**Severity:** CRITICAL — contacts are the core content of a client detail page.

### DEF-CD3: Sales lead shows raw ID not name
**Bible:** Sales lead rendered as `{salesLead.first_name} {salesLead.last_name}` by looking up the UserInfo from context.
**Port:** `<Field label="Sales lead" value={client.sales_lead ?? '—'} />` — renders raw UUID.
**Severity:** HIGH.

### DEF-CD4: var(--theme-*) token violation
**Port:** Uses `text-2xl font-bold text-stone-900`, `text-sm text-stone-600`, `gap-3`, `p-6` etc. — hardcoded Tailwind rather than `var(--theme-*)`.
**Severity:** HIGH.

---

## Defects — RULE J (Business rules)

### BR-CD1: clientTierMultiplier vs clientTierBadgeClass cross-check needed
**Bible:** `getTypeColor` on list page uses thresholds 0.9 and 1.0. The detail page shows type badge and tier badge — verify `clientTierBadgeClass` in `business-rules/client-tier-multiplier.ts` uses same thresholds.

### BR-CD2: Website display/clean business rules
**Port:** `displayClientWebsite` and `cleanClientWebsite` are imported from `business-rules/clean-client-website.ts` — these need verification against bible's URL cleaning logic.

---

## V11 Backlog Items

- [ ] **V11-CD1** Port Contacts tab with add/edit/delete attorney capability (DEF-CD2) — CRITICAL
- [ ] **V11-CD2** Port Trials tab (DEF-CD1) — depends on trials feature being stable
- [ ] **V11-CD3** Resolve `sales_lead` UUID to name via UserInfo lookup (DEF-CD3)
- [ ] **V11-CD4** Replace hardcoded Tailwind tokens with `var(--theme-*)` (DEF-CD4)
- [ ] **V11-CD5** Verify `clientTierBadgeClass` thresholds match `getTypeColor` (BR-CD1)
- [ ] **V11-CD6** Read `ClientDetails.jsx` bible component end-to-end for full gate 1 compliance

---

## Inline fixes applied
None — all defects require structural changes.
