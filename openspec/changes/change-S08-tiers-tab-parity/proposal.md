# change-S08 — Tiers tab full parity

## Why

The bible's `TierManagement.jsx` (564 LOC) manages consultant tier definitions.
Tiers define the rate categories for subcontractors in the HotSeatHub marketplace
and are referenced by service pricing. Not ported at all.

## What changes

1. NEW `src/features/company/components/tiers-settings-tab.tsx`
   - Tier CRUD: name, description, color, max_team_members, features list (string array)
   - DnD reorder
   - Assign tier to company (admin panel section)
   - Entity: `MetadataType` with scope = 'tier'

## Acceptance

- Full CRUD for tiers
- DnD reorder saves `sort_order`
- Feature list is a dynamic string array (add/remove items)
