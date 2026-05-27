# Tasks — change-S12

- [ ] T1. NEW `src/features/company/components/marketplace-settings-tab.tsx`:
  - Read: `company` from `useTier1()`, `userInfo` from `useTier1()`
  - `useEntitySetting<{ hsh_decline_notifications: string; hsh_decline_notification_threshold: number }>('user.preferences', userInfo?.id, 'user_info')` for preferences JSONB
  - `updateCompanyImmediate` from `useCompanySettings` for company field updates
  - Render:
    - Card "HotSeatHub Settings" (Orbit icon in CardTitle)
    - Row "Enable Help Wanted": Switch + description text (exact bible copy)
    - Conditional (when marketplace_post_jobs):
      - Sub-card "Profit Margin Target": margin_type select + margin_value input. onChange → `updateCompanyImmediate({ profit_margin_type, profit_margin_value })`
      - Sub-card "Decline Notifications":
        - `hsh_decline_notifications` select (with_message_only/all/none)
        - Helper text varies by selection (three distinct paragraphs — copy exactly from bible lines 517–523)
        - onChange → `entitySettingSave({ hsh_decline_notifications: value })`
        - Conditional (when === 'all'): frequency input — "Send notification every [N] declines" — onChange → `entitySettingSave({ hsh_decline_notification_threshold: n })`

- [ ] T2. NEW `src/features/company/components/__tests__/marketplace-settings-tab.spec.tsx`:
  - Render with company.marketplace_post_jobs = false → profit margin + decline sections not rendered
  - Set marketplace_post_jobs = true → both sub-sections visible
  - Decline mode "all" → threshold input visible
  - Threshold input onChange → calls entity setting save

- [ ] T3. `pnpm typecheck && pnpm lint && pnpm test` green

## Acceptance

- No `base44` references
- `userInfo.preferences` written via `useEntitySetting` (S15), not via direct Supabase call
- Company fields written via `updateCompanyImmediate` (store action)
- All helper text copy matches bible exactly
