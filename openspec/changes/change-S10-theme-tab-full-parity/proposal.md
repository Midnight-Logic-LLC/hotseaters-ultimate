# change-S10 — Theme tab full parity

## Why

The bible's `ThemeManagement.jsx` (2120 LOC) is a complete visual theme editor.
It reads and writes all ~80 `--theme-*` CSS variable tokens to `company.theme`
JSONB. The port's `BrandingForm` only edits one color (brand_primary).

The Theme tab is admin-gated (`user.role === 'admin'`) and critical for testing
visual parity: the same token system (`var(--theme-*)`) is used by every page
in the app.

## What changes

1. NEW `src/features/company/components/theme-settings-tab.tsx`
   - Token editor: grouped sections (colors, typography, spacing, borders, shadows, animations)
   - Per-token: color swatch + hex input (for color tokens) or text input (for dimension tokens)
   - Live preview: applies `applyThemeVars(previewTokens)` immediately as user types
   - "Save Theme" button → `updateCompanyImmediate({ theme: tokenMap })`
   - "Reset to Defaults" → confirms then clears `company.theme` JSONB
   - "Export Theme" → downloads JSON
   - "Import Theme" → file input, parses JSON, populates editor
   - Reads all tokens from `src/shared/lib/theme.ts` (already has `applyThemeVars`)

2. Extract token catalog to `src/shared/lib/theme-tokens.ts`
   - All 80 token names with default values and categories
   - Used by ThemeManagement to know which tokens to render

## Acceptance

- All ~80 `--theme-*` tokens editable
- Live preview applies immediately (calls `applyThemeVars`)
- Save persists to `company.theme` JSONB
- Reset clears to defaults
- Export/import round-trip works
- Tab only visible when `user.role === 'admin'`
