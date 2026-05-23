# Mobile audit — Change 2 (`shadcn-ui-base-nova-port`)

**Constraint:** RULE 4 — Tauri mobile (iOS/Android WebView) is the primary
target. Touch targets ≥ 44pt. Hover-only interactions are unreliable.

**Method:** Read each interactive primitive copied from the example-app.
Verified `useIsMobile` / `useMediaQuery` wiring on responsive primitives.
Inspected default size variants and hover-dependent affordances.

**Result summary**

| Severity | Count |
|---|---|
| block  | 0 |
| warn   | 5 |
| note   | 6 |

No `block` findings — every primitive renders and is usable on touch. The
`warn` items below are real ergonomic concerns we must address either in
Change 3 (theme + layout) or in feature components that consume these
primitives. The `note` items are observations for future polish.

## Findings

| Primitive | Concern | Severity | Recommendation |
|---|---|---|---|
| `button` | Default size is `h-8` (32px). `sm` is `h-7` (28px), `xs` is `h-6` (24px), `icon` is `size-8` (32px). All below iOS HIG 44pt minimum. | warn | In Change 3, define a global rule: any button rendered inside a primary mobile flow (forms, dialog actions, bottom-tab, list rows) uses `size="lg"` (h-9 ≈ 36px) at minimum; tap-area expanders (`::before` pseudo-element with `-inset-2`) raise the hit target to 44pt without changing the visual. Do **not** change the default variant — the visual identity copies from the example-app. |
| `tooltip` | Hover-only opening; `delay = 0` default. No tap-to-show on iOS Safari. | warn | Tooltips are decorative on mobile. Feature components must pair every tooltip-only affordance with either a visible label or a long-press equivalent. Do not use tooltips to convey required information. |
| `hover-card` (`PreviewCard`) | Hover-only by definition; no native touch equivalent. | warn | Treat as desktop-only. Feature work item: a `<TouchPreview>` wrapper that swaps `HoverCard` for a `Popover` triggered by tap on `useIsMobile()`. Flag for the feature-template checklist (Change 12). |
| `dropdown-menu`, `context-menu`, `menubar` | Right-click / hover triggers do not map cleanly to touch. `context-menu` especially. | warn | Replace `context-menu` usage on mobile with an explicit "More" button opening a `Sheet`. `menubar` should not appear on mobile at all — collapse to bottom-tab + drawer per RULE 4. Enforce via the layout port (Change 3). |
| `navigation-menu` | Designed for horizontal desktop nav with hover-driven submenus. | warn | Not appropriate for mobile shell. Use only on `>= md`. Mobile shell uses a bottom-tab + `Sheet` drawer (sidebar primitive supports this). |
| `command` / `combobox` | Touch keyboard pops over filterable list; viewport recalculation on iOS can collapse the list. | note | Test on real iOS Safari + Android Chrome. If the keyboard collapses the popover, add `position="fixed"` and `inputMode` hints in the consuming feature. |
| `calendar` (`react-day-picker`) | Default day cell hit area is small; weekday header is borderline. | note | Increase day cell padding for `useIsMobile`. Default styling is acceptable for desktop. |
| `slider` | Track is thin; thumb is the only touch target. | note | Verify thumb is ≥ 24px on mobile (currently appears compliant via base-ui defaults). Add visible focus ring on touch via `:focus-visible`. |
| `input-otp` | One-character cells; need clear focus migration on iOS keyboard. | note | Verify auto-advance + paste handling on iOS. Library handles most of this but smoke-test required. |
| `accordion`, `collapsible` | Headers default to `h-9` / no min-height. Touch-friendly when content is short, less so when many items stack. | note | Set `min-h-11` (44px) on accordion triggers via the layout pass in Change 3 — visual is unchanged, hit area improves. |
| `responsive-modal` | Correctly uses `useIsMobile()` to swap between desktop dialog and `BottomSheet`. | note | Working as designed. The implementation reads `useIsMobile` from `@/shared/hooks/use-media-query` (which exports both `useMediaQuery` and `useIsMobile`). Both `use-media-query.ts` and `use-mobile.ts` provide a `useIsMobile` — the duplication is benign for now (different breakpoint sources) but worth consolidating in a future cleanup. |

## Sidebar primitive — RULE 4 conformance

`sidebar.tsx` is the foundation for the Change 3 layout port. Verified:

- Imports `useIsMobile` from `@/shared/hooks/use-mobile` ✓
- On `isMobile`, renders `<Sheet open={openMobile} onOpenChange={setOpenMobile}>` (lines 184–204) ✓
- Required exports present: `SidebarProvider`, `SidebarTrigger`, `SidebarRail`, `useSidebar`, `Sidebar`, `SidebarContent`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuButton`, `SidebarMenuItem`, `SidebarHeader`, `SidebarFooter` ✓
- Bonus exports also present: `SidebarInput`, `SidebarInset`, `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubButton`, `SidebarMenuSubItem`, `SidebarSeparator`, `SidebarGroupAction`.

No fixes required.

## Primitives considered genuinely unsafe for mobile

None at the primitive level. `hover-card` and `context-menu` are not unsafe
— they are unsuited for the *mobile shell*. They remain useful on
`>= md`. Feature code (not primitives) is where we enforce the mobile
substitution; this audit flags the pattern, Change 3 codifies the rule.

## Items to carry into Change 3

1. Define a tap-target utility (`min-h-11`, optional `::before` expander) and apply to button defaults inside feature surfaces.
2. Decide the mobile shell: bottom-tab + `Sheet` drawer (sidebar already supports this).
3. Consolidate `useIsMobile` into one source if both `use-mobile.ts` and `use-media-query.ts` survive into v0.1.
4. Add a feature-template checklist item: "Any `hover-card`, `context-menu`, `tooltip`-as-primary-affordance, or `menubar` requires a documented mobile alternative."
