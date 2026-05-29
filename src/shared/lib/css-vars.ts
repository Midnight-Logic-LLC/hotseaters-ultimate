/**
 * css-vars.ts — read a resolved CSS custom property off the document root.
 *
 * SSR/Tauri-safe: returns the fallback when `document` is undefined. Used by
 * chart/table/tooltip surfaces that need the live `--theme-*` token value at
 * render time (recharts cannot consume CSS variables directly).
 *
 * Per RULE 0.4, the resolved computed value is the source of truth for visual
 * parity — this reads exactly that.
 */
export function readCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
