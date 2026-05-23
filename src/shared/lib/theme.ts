/**
 * Theme utilities — port of `HotSeatersMVP/src/components/theme/themeUtils.jsx`
 * AND `HotSeatersMVP/src/components/theme/defaultTheme.jsx`.
 *
 * Pure functions only. No I/O. Token names match the legacy app exactly so
 * ported feature CSS continues to work.
 *
 * Two reference themes:
 *
 *   - `DEFAULT_THEME` — the in-app default (from `themeUtils.jsx`). Body font
 *     defaults to system-ui. Companies override this via `company.theme`.
 *
 *   - `MARKETING_THEME` — the marketing-pages default (from `defaultTheme.jsx`,
 *     based on the legacy "Courtroom Pixels" company theme). Uses the custom
 *     Google Fonts (Zen Dots / Michroma / Montserrat / Syncopate) and a pale
 *     blue page background `#f6fbfe`. Used by Landing, Pricing, ReferralLanding,
 *     PrivacyPolicy, TermsOfService.
 *
 * Both are bible-verbatim. Do not vary.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

export interface ThemeTypography {
  brandTitleFont?: string;
  brandSubtitleFont?: string;
  bodyFont?: string;
  sidebarFont?: string;
  pageTitleSize?: string;
  sectionTitleSize?: string;
  cardTitleSize?: string;
  bodyTextSize?: string;
  labelSize?: string;
  captionSize?: string;
  sidebarTextSize?: string;
  sidebarBoldHeadings?: boolean;
}

export interface ThemeSpacing {
  pagePadding?: string;
  pagePaddingLg?: string;
  sectionGap?: string;
  cardGap?: string;
  elementGap?: string;
  maxContentWidth?: string;
}

export interface ThemeComponentBox {
  borderRadius?: string;
  shadow?: string;
  borderWidth?: string;
  backgroundColor?: string;
  headerBackground?: string;
  padding?: string;
  headerPadding?: string;
}

export interface ThemeComponentButtons {
  borderRadius?: string;
  shadow?: string;
  groupBackground?: string;
  groupShadow?: string;
  buttonTextSize?: string;
  tabRadius?: string;
  tabShadow?: string;
  tabGroupShadow?: string;
  tabGroupBackground?: string;
  tabTextSize?: string;
}

export interface ThemeComponentSectionHeaders {
  borderBottomWidth?: string;
  spacing?: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  padding?: string;
}

export interface ThemeComponentListContainer {
  borderRadius?: string;
  borderWidth?: string;
  itemSpacing?: string;
  backgroundColor?: string;
  padding?: string;
}

export interface ThemeComponentListItem {
  borderRadius?: string;
  shadow?: string;
  borderWidth?: string;
  backgroundColor?: string;
  padding?: string;
}

export interface ThemeComponentForms {
  inputBorderRadius?: string;
  inputBorderWidth?: string;
  inputBackgroundColor?: string;
}

export interface ThemeComponents {
  dialogs?: ThemeComponentBox;
  cards?: ThemeComponentBox;
  buttons?: ThemeComponentButtons;
  sectionHeaders?: ThemeComponentSectionHeaders;
  listContainers?: ThemeComponentListContainer;
  listItems?: ThemeComponentListItem;
  forms?: ThemeComponentForms;
}

export interface CompanyTheme {
  brand_primary?: string;
  brand_primary_hover?: string;
  brand_operations?: string;
  brand_emphasis?: string;
  brand_accent_warm?: string;
  brand_accent_urgent?: string;

  hsh_primary?: string;
  hsh_primary_hover?: string;
  hsh_accent_light?: string;
  hsh_background?: string;
  hsh_secondary?: string;
  hsh_secondary_light?: string;

  success?: string;
  success_light?: string;
  warning?: string;
  warning_light?: string;
  danger?: string;
  danger_light?: string;
  info?: string;
  info_light?: string;

  stone_50?: string;
  stone_100?: string;
  stone_200?: string;
  stone_500?: string;
  stone_600?: string;
  stone_900?: string;

  page_background?: string;
  sidebar_background?: string;

  typography?: ThemeTypography;
  spacing?: ThemeSpacing;
  components?: ThemeComponents;
}

/**
 * The default Company.theme — verbatim from MVP `themeUtils.jsx`.
 */
export const DEFAULT_THEME: Required<
  Omit<CompanyTheme, 'typography' | 'spacing' | 'components'>
> & {
  typography: Required<ThemeTypography>;
  spacing: Required<ThemeSpacing>;
  components: {
    dialogs: Required<ThemeComponentBox>;
    cards: Required<ThemeComponentBox>;
    buttons: ThemeComponentButtons;
    sectionHeaders: Required<ThemeComponentSectionHeaders>;
    listContainers: Required<ThemeComponentListContainer>;
    listItems: Required<ThemeComponentListItem>;
    forms: Required<ThemeComponentForms>;
  };
} = {
  brand_primary: '#0891B2',
  brand_primary_hover: '#06B6D4',
  brand_operations: '#3B82F6',
  brand_emphasis: '#1E3A8A',
  brand_accent_warm: '#F97316',
  brand_accent_urgent: '#EF4444',

  hsh_primary: '#9333EA',
  hsh_primary_hover: '#6B21A8',
  hsh_accent_light: '#A78BFA',
  hsh_background: '#F5F3FF',
  hsh_secondary: '#4F46E5',
  hsh_secondary_light: '#818CF8',

  success: '#059669',
  success_light: '#DCFCE7',
  warning: '#F59E0B',
  warning_light: '#FEF3C7',
  danger: '#DC2626',
  danger_light: '#FEE2E2',
  info: '#2563EB',
  info_light: '#DBEAFE',

  stone_50: '#FAFAF9',
  stone_100: '#F5F5F4',
  stone_200: '#E7E5E4',
  stone_500: '#78716C',
  stone_600: '#57534E',
  stone_900: '#1C1917',

  page_background: '#FAFAF9',
  sidebar_background: '#FFFFFF',

  typography: {
    brandTitleFont: 'Zen Dots',
    brandSubtitleFont: 'Michroma',
    bodyFont: 'system-ui, -apple-system, sans-serif',
    sidebarFont: 'system-ui, -apple-system, sans-serif',
    pageTitleSize: '1.875rem',
    sectionTitleSize: '1.25rem',
    cardTitleSize: '1.125rem',
    bodyTextSize: '0.875rem',
    labelSize: '0.875rem',
    captionSize: '0.75rem',
    sidebarTextSize: '0.875rem',
    sidebarBoldHeadings: false,
  },

  spacing: {
    pagePadding: '1.5rem',
    pagePaddingLg: '2rem',
    sectionGap: '1.5rem',
    cardGap: '1rem',
    elementGap: '0.5rem',
    maxContentWidth: '80rem',
  },

  components: {
    dialogs: {
      borderRadius: '0.75rem',
      shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      borderWidth: '1px',
      backgroundColor: '#FFFFFF',
      headerBackground: '#FAFAF9',
      padding: '1.5rem',
      headerPadding: '1.5rem',
    },
    cards: {
      borderRadius: '0.5rem',
      shadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      borderWidth: '1px',
      backgroundColor: '#FFFFFF',
      headerBackground: '#FAFAF9',
      padding: '1.5rem',
      headerPadding: '1.5rem',
    },
    buttons: {
      borderRadius: '0.5rem',
      shadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      groupBackground: '#FFFFFF',
    },
    sectionHeaders: {
      borderBottomWidth: '1px',
      spacing: '1.5rem',
      backgroundColor: 'transparent',
      textColor: '#1C1917',
      fontSize: '1.25rem',
      padding: '0.75rem',
    },
    listContainers: {
      borderRadius: '0.5rem',
      borderWidth: '1px',
      itemSpacing: '0.5rem',
      backgroundColor: '#FFFFFF',
      padding: '1rem',
    },
    listItems: {
      borderRadius: '0.5rem',
      shadow: 'none',
      borderWidth: '1px',
      backgroundColor: '#FFFFFF',
      padding: '0.75rem',
    },
    forms: {
      inputBorderRadius: '0.5rem',
      inputBorderWidth: '1px',
      inputBackgroundColor: '#FFFFFF',
    },
  },
};

const SYSTEM_FONTS = new Set([
  'sans-serif',
  'serif',
  'monospace',
  'system-ui',
  '-apple-system',
]);

function formatFontForCSS(fontValue: string | undefined): string | undefined {
  if (!fontValue) return fontValue;
  return fontValue
    .split(',')
    .map((f) => f.trim().replace(/['"]/g, ''))
    .map((f) => (SYSTEM_FONTS.has(f.toLowerCase()) ? f : f.includes(' ') ? `'${f}'` : f))
    .join(', ');
}

function readableTextOn(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length < 6) return '#FFFFFF';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1C1917' : '#FFFFFF';
}

/**
 * Build the full `--theme-*` CSS variable map for a given company theme.
 * Returns a `Record<string,string>` (variable-name → value). Pure.
 */
export function generateThemeVars(theme: CompanyTheme | null | undefined): Record<string, string> {
  const safe = theme ?? {};
  const merged = {
    ...DEFAULT_THEME,
    ...safe,
    typography: { ...DEFAULT_THEME.typography, ...(safe.typography ?? {}) },
    spacing: { ...DEFAULT_THEME.spacing, ...(safe.spacing ?? {}) },
    components: {
      dialogs: { ...DEFAULT_THEME.components.dialogs, ...(safe.components?.dialogs ?? {}) },
      cards: { ...DEFAULT_THEME.components.cards, ...(safe.components?.cards ?? {}) },
      buttons: { ...DEFAULT_THEME.components.buttons, ...(safe.components?.buttons ?? {}) },
      sectionHeaders: {
        ...DEFAULT_THEME.components.sectionHeaders,
        ...(safe.components?.sectionHeaders ?? {}),
      },
      listContainers: {
        ...DEFAULT_THEME.components.listContainers,
        ...(safe.components?.listContainers ?? {}),
      },
      listItems: {
        ...DEFAULT_THEME.components.listItems,
        ...(safe.components?.listItems ?? {}),
      },
      forms: { ...DEFAULT_THEME.components.forms, ...(safe.components?.forms ?? {}) },
    },
  };

  const t = merged.typography;
  const s = merged.spacing;
  const c = merged.components;
  const b = c.buttons;

  const tabGroupBgKey = b.tabGroupBackground as keyof typeof merged | undefined;
  const tabGroupBg =
    tabGroupBgKey && typeof merged[tabGroupBgKey] === 'string'
      ? (merged[tabGroupBgKey] as string)
      : merged.stone_100;

  const vars: Record<string, string> = {
    // HotSeaters Brand
    '--theme-brand-primary': merged.brand_primary,
    '--theme-brand-primary-hover': merged.brand_primary_hover,
    '--theme-brand-operations': merged.brand_operations,
    '--theme-brand-emphasis': merged.brand_emphasis,
    '--theme-brand-accent-warm': merged.brand_accent_warm,
    '--theme-brand-accent-urgent': merged.brand_accent_urgent,

    // HotSeatHub Brand
    '--theme-hsh-primary': merged.hsh_primary,
    '--theme-hsh-primary-hover': merged.hsh_primary_hover,
    '--theme-hsh-accent-light': merged.hsh_accent_light,
    '--theme-hsh-background': merged.hsh_background,
    '--theme-hsh-secondary': merged.hsh_secondary,
    '--theme-hsh-secondary-light': merged.hsh_secondary_light,

    // Semantic
    '--theme-success': merged.success,
    '--theme-success-light': merged.success_light,
    '--theme-warning': merged.warning,
    '--theme-warning-light': merged.warning_light,
    '--theme-danger': merged.danger,
    '--theme-danger-light': merged.danger_light,
    '--theme-info': merged.info,
    '--theme-info-light': merged.info_light,

    // Neutral palette
    '--theme-stone-50': merged.stone_50,
    '--theme-stone-100': merged.stone_100,
    '--theme-stone-200': merged.stone_200,
    '--theme-stone-500': merged.stone_500,
    '--theme-stone-600': merged.stone_600,
    '--theme-stone-900': merged.stone_900,

    '--theme-page-bg': merged.page_background,
    '--theme-sidebar-bg': merged.sidebar_background,

    // Typography
    '--theme-font-brand-title': formatFontForCSS(t.brandTitleFont) ?? '',
    '--theme-font-brand-subtitle': formatFontForCSS(t.brandSubtitleFont) ?? '',
    '--theme-font-body': formatFontForCSS(t.bodyFont) ?? '',
    '--theme-font-sidebar': formatFontForCSS(t.sidebarFont) ?? '',
    '--theme-text-page-title': t.pageTitleSize,
    '--theme-text-section-title': t.sectionTitleSize,
    '--theme-text-card-title': t.cardTitleSize,
    '--theme-text-body': t.bodyTextSize,
    '--theme-text-label': t.labelSize,
    '--theme-text-caption': t.captionSize,
    '--theme-text-sidebar': t.sidebarTextSize,
    '--theme-sidebar-heading-weight': t.sidebarBoldHeadings ? '700' : '400',

    // Spacing
    '--theme-page-padding': s.pagePadding,
    '--theme-page-padding-lg': s.pagePaddingLg,
    '--theme-section-gap': s.sectionGap,
    '--theme-card-gap': s.cardGap,
    '--theme-element-gap': s.elementGap,
    '--theme-max-content-width': s.maxContentWidth,

    // Dialogs
    '--theme-dialog-radius': c.dialogs.borderRadius,
    '--theme-dialog-shadow': c.dialogs.shadow,
    '--theme-dialog-border': c.dialogs.borderWidth,
    '--theme-dialog-bg': c.dialogs.backgroundColor,
    '--theme-dialog-header-bg': c.dialogs.headerBackground,
    '--theme-dialog-padding': c.dialogs.padding,
    '--theme-dialog-header-padding': c.dialogs.headerPadding,

    // Cards
    '--theme-card-radius': c.cards.borderRadius,
    '--theme-card-shadow': c.cards.shadow,
    '--theme-card-border': c.cards.borderWidth,
    '--theme-card-bg': c.cards.backgroundColor,
    '--theme-card-header-bg': c.cards.headerBackground,
    '--theme-card-padding': c.cards.padding,
    '--theme-card-header-padding': c.cards.headerPadding,

    // Buttons
    '--theme-button-radius': b.borderRadius ?? '0.5rem',
    '--theme-button-shadow': b.shadow ?? '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '--theme-button-group-bg': b.groupBackground ?? '#FFFFFF',
    '--theme-button-group-shadow': b.groupShadow ?? 'none',
    '--theme-button-text-size': b.buttonTextSize ?? '0.875rem',
    '--theme-tab-radius': b.tabRadius ?? b.borderRadius ?? '0.5rem',
    '--theme-tab-shadow': b.tabShadow ?? '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '--theme-tab-group-shadow': b.tabGroupShadow ?? 'none',
    '--theme-tab-group-bg': tabGroupBg,
    '--theme-tab-active-bg': merged.brand_primary,
    '--theme-tab-active-text': readableTextOn(merged.brand_primary),
    '--theme-tab-text-size': b.tabTextSize ?? '0.875rem',

    // Section headers
    '--theme-section-border': c.sectionHeaders.borderBottomWidth,
    '--theme-section-spacing': c.sectionHeaders.spacing,
    '--theme-section-bg': c.sectionHeaders.backgroundColor,
    '--theme-section-text': c.sectionHeaders.textColor,
    '--theme-section-font-size': c.sectionHeaders.fontSize,
    '--theme-section-padding': c.sectionHeaders.padding,

    // List container
    '--theme-list-radius': c.listContainers.borderRadius,
    '--theme-list-border': c.listContainers.borderWidth,
    '--theme-list-spacing': c.listContainers.itemSpacing,
    '--theme-list-bg': c.listContainers.backgroundColor,
    '--theme-list-padding': c.listContainers.padding,

    // List items
    '--theme-list-item-radius': c.listItems.borderRadius,
    '--theme-list-item-shadow': c.listItems.shadow,
    '--theme-list-item-border': c.listItems.borderWidth,
    '--theme-list-item-bg': c.listItems.backgroundColor,
    '--theme-list-item-padding': c.listItems.padding,

    // Inputs
    '--theme-input-radius': c.forms.inputBorderRadius,
    '--theme-input-border': c.forms.inputBorderWidth,
    '--theme-input-bg': c.forms.inputBackgroundColor,
  };

  return vars;
}

/**
 * Apply the generated vars to `document.documentElement`. Side-effect.
 * Safe to call repeatedly; setting the same value is idempotent.
 */
export function applyThemeVars(theme: CompanyTheme | null | undefined): void {
  if (typeof document === 'undefined') return;
  const vars = generateThemeVars(theme);
  const root = document.documentElement;
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
}

// ─── Marketing theme + custom fonts (bible — defaultTheme.jsx) ───────────────

/**
 * `MARKETING_THEME` — verbatim from `HotSeatersMVP/src/components/theme/defaultTheme.jsx`.
 *
 * Differs from `DEFAULT_THEME` (the in-app default) in:
 *   - body font: `Montserrat, system-ui, -apple-system, sans-serif`
 *   - sidebar font: `Syncopate, sans-serif`
 *   - brand title font carries `"Zen Dots", sans-serif`
 *   - brand subtitle font carries `Michroma, sans-serif`
 *   - page_background: `#f6fbfe` (pale blue) instead of `#FAFAF9`
 *   - maxContentWidth: `96rem` (max-w-[96rem]) instead of `80rem` (max-w-7xl)
 *   - bodyTextSize: `1rem` instead of `0.875rem`
 *   - sidebarTextSize: `0.625rem` instead of `0.875rem`
 *   - sidebarBoldHeadings: true
 *   - dialogs / cards / buttons / listItems padding + shadows differ — see
 *     defaultTheme.jsx for the exact values, all faithfully reproduced below.
 *
 * Marketing pages (Landing, Pricing, ReferralLanding, PrivacyPolicy,
 * TermsOfService) MUST call `applyThemeVars(MARKETING_THEME)` on mount.
 */
export const MARKETING_THEME: CompanyTheme = {
  brand_primary: '#0891B2',
  brand_primary_hover: '#06B6D4',
  brand_operations: '#30a2e8',
  brand_emphasis: '#1E3A8A',
  brand_accent_warm: '#F97316',
  brand_accent_urgent: '#EF4444',

  hsh_primary: '#9333EA',
  hsh_primary_hover: '#6B21A8',
  hsh_accent_light: '#A78BFA',
  hsh_background: '#F5F3FF',
  hsh_secondary: '#4F46E5',
  hsh_secondary_light: '#818CF8',

  success: '#059669',
  success_light: '#DCFCE7',
  warning: '#F59E0B',
  warning_light: '#FEF3C7',
  danger: '#DC2626',
  danger_light: '#FEE2E2',
  info: '#2563EB',
  info_light: '#DBEAFE',

  stone_50: '#FAFAF9',
  stone_100: '#F5F5F4',
  stone_200: '#E7E5E4',
  stone_500: '#78716C',
  stone_600: '#57534E',
  stone_900: '#1C1917',

  page_background: '#f6fbfe',
  sidebar_background: '#ffffff',

  typography: {
    brandTitleFont: '"Zen Dots", sans-serif',
    brandSubtitleFont: 'Michroma, sans-serif',
    bodyFont: 'Montserrat, system-ui, -apple-system, sans-serif',
    sidebarFont: 'Syncopate, sans-serif',
    pageTitleSize: '1.875rem',
    sectionTitleSize: '1.25rem',
    cardTitleSize: '1.125rem',
    bodyTextSize: '1rem',
    labelSize: '0.875rem',
    captionSize: '0.75rem',
    sidebarTextSize: '0.625rem',
    sidebarBoldHeadings: true,
  },

  spacing: {
    pagePadding: '1.5rem',
    pagePaddingLg: '2rem',
    sectionGap: '1.5rem',
    cardGap: '1rem',
    elementGap: '0.5rem',
    maxContentWidth: '96rem',
  },

  components: {
    dialogs: {
      borderRadius: '0.5rem',
      shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      borderWidth: '1px',
      backgroundColor: '#FFFFFF',
      headerBackground: '#FAFAF9',
      padding: '1rem',
      headerPadding: '1rem',
    },
    cards: {
      borderRadius: '0.5rem',
      shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      borderWidth: '1px',
      backgroundColor: '#FFFFFF',
      headerBackground: '#e8e8e8',
      padding: '1rem',
      headerPadding: '0.75rem',
    },
    buttons: {
      borderRadius: '0.5rem',
      shadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      groupBackground: '#f2f2f2',
      groupShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      buttonTextSize: '0.875rem',
      tabRadius: '0.5rem',
      tabShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      tabGroupShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)',
      tabGroupBackground: 'stone_200',
      tabTextSize: '0.875rem',
    },
    sectionHeaders: {
      borderBottomWidth: '1px',
      spacing: '0.75rem',
      backgroundColor: 'transparent',
      textColor: '#1C1917',
      fontSize: '1.125rem',
      padding: '1rem',
    },
    listContainers: {
      borderRadius: '0.5rem',
      borderWidth: '1px',
      itemSpacing: '0.5rem',
      backgroundColor: '#FFFFFF',
      padding: '1rem',
    },
    listItems: {
      borderRadius: '0.5rem',
      shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      borderWidth: '1px',
      backgroundColor: '#fafaf9',
      padding: '0.75rem',
    },
    forms: {
      inputBorderRadius: '0.5rem',
      inputBorderWidth: '1px',
      inputBackgroundColor: '#ffffff',
    },
  },
};

/**
 * Custom Google Fonts the marketing pages depend on — verbatim from
 * `defaultTheme.jsx`'s `defaultCustomFonts`. Use these to build the Google
 * Fonts URL in `index.html` (or per-page if needed).
 *
 * Built URL pattern:
 *
 *   https://fonts.googleapis.com/css2?family=Zen+Dots&family=Michroma&family=Montserrat&family=Syncopate&display=swap
 */
export const DEFAULT_CUSTOM_FONTS = ['Zen Dots', 'Michroma', 'Montserrat', 'Syncopate'] as const;

/**
 * Build the Google Fonts CSS2 URL from `DEFAULT_CUSTOM_FONTS`. Pure.
 *
 * Mirrors `HotSeatersMVP/src/pages/Landing.jsx` lines 95-96:
 *   const fontFamilies = defaultCustomFonts.map(f => f.replace(/ /g, '+')).join('&family=');
 *   const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
 */
export function buildGoogleFontsUrl(fonts: readonly string[] = DEFAULT_CUSTOM_FONTS): string {
  const families = fonts.map((f) => f.replace(/ /g, '+')).join('&family=');
  return `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
}
