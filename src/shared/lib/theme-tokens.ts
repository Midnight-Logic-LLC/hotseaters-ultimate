/**
 * theme-tokens.ts — flat catalog of every `--theme-*` CSS variable the
 * theme settings editor (S10) exposes to admins.
 *
 * Derived from `src/shared/lib/theme.ts::generateThemeVars()` (the
 * single source of truth for what variables the runtime applies). Every
 * entry here MUST appear as a key in the record `generateThemeVars`
 * returns; the editor uses these entries to render controls, build the
 * "reset to defaults" payload, and serialize the export JSON.
 *
 * Pure data — no I/O, no DOM access.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { DEFAULT_THEME, generateThemeVars } from './theme';

export type ThemeTokenType = 'color' | 'size' | 'font' | 'shadow' | 'radius';

export interface ThemeToken {
  /** CSS variable name without the leading `--`. */
  key: string;
  /** Human-readable label for the control. */
  label: string;
  /** Group heading the control renders under. */
  group: string;
  /** Control affordance hint. */
  type: ThemeTokenType;
  /** Default value (matches `generateThemeVars(DEFAULT_THEME)[--key]`). */
  default: string;
}

const DEFAULT_VARS = generateThemeVars(DEFAULT_THEME);

function token(
  group: string,
  type: ThemeTokenType,
  cssName: string,
  label: string,
): ThemeToken {
  // cssName arrives as the full var name (e.g. `--theme-brand-primary`);
  // strip the leading `--` so the editor can build the variable back up.
  const key = cssName.replace(/^--/, '');
  const defaultValue = DEFAULT_VARS[cssName] ?? '';
  return { key, label, group, type, default: defaultValue };
}

const GROUP_BRAND = 'HotSeaters Brand';
const GROUP_HSH = 'HotSeatHub Brand';
const GROUP_SEMANTIC = 'Semantic';
const GROUP_NEUTRAL = 'Neutral Palette';
const GROUP_SURFACE = 'Page & Sidebar';
const GROUP_TYPOGRAPHY = 'Typography';
const GROUP_SPACING = 'Spacing';
const GROUP_DIALOG = 'Dialogs';
const GROUP_CARD = 'Cards';
const GROUP_BUTTON = 'Buttons & Tabs';
const GROUP_SECTION = 'Section Headers';
const GROUP_LIST = 'List Containers';
const GROUP_LIST_ITEM = 'List Items';
const GROUP_INPUT = 'Inputs';

export const THEME_TOKENS: ReadonlyArray<ThemeToken> = [
  // HotSeaters Brand
  token(GROUP_BRAND, 'color', '--theme-brand-primary', 'Brand Primary'),
  token(GROUP_BRAND, 'color', '--theme-brand-primary-hover', 'Brand Primary Hover'),
  token(GROUP_BRAND, 'color', '--theme-brand-operations', 'Operations'),
  token(GROUP_BRAND, 'color', '--theme-brand-emphasis', 'Emphasis'),
  token(GROUP_BRAND, 'color', '--theme-brand-accent-warm', 'Warm Accent'),
  token(GROUP_BRAND, 'color', '--theme-brand-accent-urgent', 'Urgent Accent'),

  // HotSeatHub Brand
  token(GROUP_HSH, 'color', '--theme-hsh-primary', 'HSH Primary'),
  token(GROUP_HSH, 'color', '--theme-hsh-primary-hover', 'HSH Primary Hover'),
  token(GROUP_HSH, 'color', '--theme-hsh-accent-light', 'HSH Light Accent'),
  token(GROUP_HSH, 'color', '--theme-hsh-background', 'HSH Background'),
  token(GROUP_HSH, 'color', '--theme-hsh-secondary', 'HSH Secondary'),
  token(GROUP_HSH, 'color', '--theme-hsh-secondary-light', 'HSH Secondary Light'),

  // Semantic
  token(GROUP_SEMANTIC, 'color', '--theme-success', 'Success'),
  token(GROUP_SEMANTIC, 'color', '--theme-success-light', 'Success Light'),
  token(GROUP_SEMANTIC, 'color', '--theme-warning', 'Warning'),
  token(GROUP_SEMANTIC, 'color', '--theme-warning-light', 'Warning Light'),
  token(GROUP_SEMANTIC, 'color', '--theme-danger', 'Danger'),
  token(GROUP_SEMANTIC, 'color', '--theme-danger-light', 'Danger Light'),
  token(GROUP_SEMANTIC, 'color', '--theme-info', 'Info'),
  token(GROUP_SEMANTIC, 'color', '--theme-info-light', 'Info Light'),

  // Neutral palette
  token(GROUP_NEUTRAL, 'color', '--theme-stone-50', 'Stone 50'),
  token(GROUP_NEUTRAL, 'color', '--theme-stone-100', 'Stone 100'),
  token(GROUP_NEUTRAL, 'color', '--theme-stone-200', 'Stone 200'),
  token(GROUP_NEUTRAL, 'color', '--theme-stone-500', 'Stone 500'),
  token(GROUP_NEUTRAL, 'color', '--theme-stone-600', 'Stone 600'),
  token(GROUP_NEUTRAL, 'color', '--theme-stone-900', 'Stone 900'),

  // Surface
  token(GROUP_SURFACE, 'color', '--theme-page-bg', 'Page Background'),
  token(GROUP_SURFACE, 'color', '--theme-sidebar-bg', 'Sidebar Background'),

  // Typography
  token(GROUP_TYPOGRAPHY, 'font', '--theme-font-brand-title', 'Brand Title Font'),
  token(GROUP_TYPOGRAPHY, 'font', '--theme-font-brand-subtitle', 'Brand Subtitle Font'),
  token(GROUP_TYPOGRAPHY, 'font', '--theme-font-body', 'Body Font'),
  token(GROUP_TYPOGRAPHY, 'font', '--theme-font-sidebar', 'Sidebar Font'),
  token(GROUP_TYPOGRAPHY, 'size', '--theme-text-page-title', 'Page Title Size'),
  token(GROUP_TYPOGRAPHY, 'size', '--theme-text-section-title', 'Section Title Size'),
  token(GROUP_TYPOGRAPHY, 'size', '--theme-text-card-title', 'Card Title Size'),
  token(GROUP_TYPOGRAPHY, 'size', '--theme-text-body', 'Body Text Size'),
  token(GROUP_TYPOGRAPHY, 'size', '--theme-text-label', 'Label Size'),
  token(GROUP_TYPOGRAPHY, 'size', '--theme-text-caption', 'Caption Size'),
  token(GROUP_TYPOGRAPHY, 'size', '--theme-text-sidebar', 'Sidebar Text Size'),
  token(GROUP_TYPOGRAPHY, 'size', '--theme-sidebar-heading-weight', 'Sidebar Heading Weight'),

  // Spacing
  token(GROUP_SPACING, 'size', '--theme-page-padding', 'Page Padding'),
  token(GROUP_SPACING, 'size', '--theme-page-padding-lg', 'Page Padding (Large)'),
  token(GROUP_SPACING, 'size', '--theme-section-gap', 'Section Gap'),
  token(GROUP_SPACING, 'size', '--theme-card-gap', 'Card Gap'),
  token(GROUP_SPACING, 'size', '--theme-element-gap', 'Element Gap'),
  token(GROUP_SPACING, 'size', '--theme-max-content-width', 'Max Content Width'),

  // Dialogs
  token(GROUP_DIALOG, 'radius', '--theme-dialog-radius', 'Dialog Radius'),
  token(GROUP_DIALOG, 'shadow', '--theme-dialog-shadow', 'Dialog Shadow'),
  token(GROUP_DIALOG, 'size', '--theme-dialog-border', 'Dialog Border Width'),
  token(GROUP_DIALOG, 'color', '--theme-dialog-bg', 'Dialog Background'),
  token(GROUP_DIALOG, 'color', '--theme-dialog-header-bg', 'Dialog Header Background'),
  token(GROUP_DIALOG, 'size', '--theme-dialog-padding', 'Dialog Padding'),
  token(GROUP_DIALOG, 'size', '--theme-dialog-header-padding', 'Dialog Header Padding'),

  // Cards
  token(GROUP_CARD, 'radius', '--theme-card-radius', 'Card Radius'),
  token(GROUP_CARD, 'shadow', '--theme-card-shadow', 'Card Shadow'),
  token(GROUP_CARD, 'size', '--theme-card-border', 'Card Border Width'),
  token(GROUP_CARD, 'color', '--theme-card-bg', 'Card Background'),
  token(GROUP_CARD, 'color', '--theme-card-header-bg', 'Card Header Background'),
  token(GROUP_CARD, 'size', '--theme-card-padding', 'Card Padding'),
  token(GROUP_CARD, 'size', '--theme-card-header-padding', 'Card Header Padding'),

  // Buttons & Tabs
  token(GROUP_BUTTON, 'radius', '--theme-button-radius', 'Button Radius'),
  token(GROUP_BUTTON, 'shadow', '--theme-button-shadow', 'Button Shadow'),
  token(GROUP_BUTTON, 'color', '--theme-button-group-bg', 'Button Group Background'),
  token(GROUP_BUTTON, 'shadow', '--theme-button-group-shadow', 'Button Group Shadow'),
  token(GROUP_BUTTON, 'size', '--theme-button-text-size', 'Button Text Size'),
  token(GROUP_BUTTON, 'radius', '--theme-tab-radius', 'Tab Radius'),
  token(GROUP_BUTTON, 'shadow', '--theme-tab-shadow', 'Tab Shadow'),
  token(GROUP_BUTTON, 'shadow', '--theme-tab-group-shadow', 'Tab Group Shadow'),
  token(GROUP_BUTTON, 'color', '--theme-tab-group-bg', 'Tab Group Background'),
  token(GROUP_BUTTON, 'color', '--theme-tab-active-bg', 'Active Tab Background'),
  token(GROUP_BUTTON, 'color', '--theme-tab-active-text', 'Active Tab Text'),
  token(GROUP_BUTTON, 'size', '--theme-tab-text-size', 'Tab Text Size'),

  // Section headers
  token(GROUP_SECTION, 'size', '--theme-section-border', 'Section Border Width'),
  token(GROUP_SECTION, 'size', '--theme-section-spacing', 'Section Spacing'),
  token(GROUP_SECTION, 'color', '--theme-section-bg', 'Section Background'),
  token(GROUP_SECTION, 'color', '--theme-section-text', 'Section Text Color'),
  token(GROUP_SECTION, 'size', '--theme-section-font-size', 'Section Font Size'),
  token(GROUP_SECTION, 'size', '--theme-section-padding', 'Section Padding'),

  // List containers
  token(GROUP_LIST, 'radius', '--theme-list-radius', 'List Radius'),
  token(GROUP_LIST, 'size', '--theme-list-border', 'List Border Width'),
  token(GROUP_LIST, 'size', '--theme-list-spacing', 'List Item Spacing'),
  token(GROUP_LIST, 'color', '--theme-list-bg', 'List Background'),
  token(GROUP_LIST, 'size', '--theme-list-padding', 'List Padding'),

  // List items
  token(GROUP_LIST_ITEM, 'radius', '--theme-list-item-radius', 'List Item Radius'),
  token(GROUP_LIST_ITEM, 'shadow', '--theme-list-item-shadow', 'List Item Shadow'),
  token(GROUP_LIST_ITEM, 'size', '--theme-list-item-border', 'List Item Border Width'),
  token(GROUP_LIST_ITEM, 'color', '--theme-list-item-bg', 'List Item Background'),
  token(GROUP_LIST_ITEM, 'size', '--theme-list-item-padding', 'List Item Padding'),

  // Inputs
  token(GROUP_INPUT, 'radius', '--theme-input-radius', 'Input Radius'),
  token(GROUP_INPUT, 'size', '--theme-input-border', 'Input Border Width'),
  token(GROUP_INPUT, 'color', '--theme-input-bg', 'Input Background'),
];

/**
 * Stable list of group headings in the order they appear in the editor.
 */
export const THEME_TOKEN_GROUPS: ReadonlyArray<string> = Array.from(
  new Set(THEME_TOKENS.map((t) => t.group)),
);

/**
 * Build the `{ [key]: defaultValue }` record used when the user resets
 * the editor back to defaults.
 */
export function defaultTokenValues(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const t of THEME_TOKENS) out[t.key] = t.default;
  return out;
}
