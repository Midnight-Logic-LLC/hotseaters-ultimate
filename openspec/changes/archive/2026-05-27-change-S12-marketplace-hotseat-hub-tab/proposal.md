# change-S12 — HotSeatHub / Marketplace tab full parity

## Why

The bible's marketplace tab (inlined in Settings.jsx, lines ~355–575) controls
HotSeatHub marketplace settings including the Enable Help Wanted toggle, profit
margin configuration, and decline notification preferences. It mixes company-level
settings (`company.*` columns) with user-level preferences (`userInfo.preferences`
JSONB — handled by change-S15).

The tab is gated on `(owner || admin) && company.has_hsh_addon`.

## What changes

1. NEW `src/features/company/components/marketplace-settings-tab.tsx`
   - "Enable Help Wanted" Switch → immediate `updateCompanyImmediate({ marketplace_post_jobs: checked })`
   - When `company.marketplace_post_jobs`:
     - "Profit Margin Target" sub-section: margin_type select (percentage/dollar) + margin_value input → immediate save
     - "Decline Notifications" sub-section: hsh_decline_notifications select (with_message_only/all/none) → saves to `userInfo.preferences` JSONB via `useEntitySetting`
     - When hsh_decline_notifications === 'all': notification frequency threshold input → saves to preferences JSONB
   - Helper text for each setting matches bible exactly

2. Depends on change-S15 (`useEntitySetting`) for `userInfo.preferences` JSONB read/write

## Acceptance

- Enable Help Wanted toggle saves immediately to `company.marketplace_post_jobs`
- Profit margin type/value save immediately to `company.*`
- Decline notification preference saves to `entity_setting` row for `user.preferences` scope via `useEntitySetting`
- Threshold input only shown when notification mode is "all"
- Descriptive helper text matches bible exactly (per RULE 0 — copy is content)
