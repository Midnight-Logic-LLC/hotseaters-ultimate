# Tasks — change-S10

- [ ] T1. Read `HotSeatersMVP/src/components/settings/ThemeManagement.jsx` in full (2120 LOC). Document: all token categories, all token names with defaults, the live-preview mechanism, export/import formats, reset flow.

- [ ] T2. NEW `src/shared/lib/theme-tokens.ts`:
  - `export const THEME_TOKEN_CATALOG: ThemeTokenDefinition[]`
  - `ThemeTokenDefinition`: `{ key: string; label: string; category: string; type: 'color' | 'dimension' | 'number'; defaultValue: string }`
  - Include all ~80 `--theme-*` tokens (copy from `src/index.css` `:root` block)

- [ ] T3. NEW `src/features/company/components/theme-settings-tab.tsx`:
  - Props: `{ company, onUpdate, isLoading }` — matches bible's ThemeManagement props
  - Read existing theme from `company.theme` JSONB; fall back to `THEME_TOKEN_CATALOG` defaults
  - Local state: `previewTokens` (Map of key → value)
  - Token editor: `THEME_TOKEN_CATALOG` grouped by `category`
  - Per color token: `<input type="color">` + hex text input (bidirectional sync)
  - Per dimension token: text input
  - `onChange` any token → update `previewTokens` + call `applyThemeVars(Object.fromEntries(previewTokens))`
  - "Save Theme" button → `onUpdate({ theme: Object.fromEntries(previewTokens) })`
  - "Reset to Defaults" button → AlertDialog confirm → `onUpdate({ theme: null })` + reset previewTokens to defaults + `applyThemeVars(defaults)`
  - "Export Theme" button → `URL.createObjectURL(new Blob([JSON.stringify(...)]))` + auto-download
  - "Import Theme" button → `<input type="file" accept=".json">` hidden, triggered on click → parse JSON → update previewTokens + apply

- [ ] T4. NEW `src/features/company/components/__tests__/theme-settings-tab.spec.tsx`:
  - Render with empty company.theme → defaults applied
  - Change a color token → `applyThemeVars` called with updated map
  - Save → `onUpdate` called with correct theme object
  - Reset → AlertDialog opens; confirm → `onUpdate({ theme: null })` called

- [ ] T5. `pnpm typecheck && pnpm lint && pnpm test` green

## Acceptance

- All ~80 tokens editable (count matches the `:root` block in `src/index.css`)
- Live preview works without requiring save
- Export JSON contains all token key/value pairs
- Import replaces all tokens from uploaded JSON
- Reset confirms before clearing
