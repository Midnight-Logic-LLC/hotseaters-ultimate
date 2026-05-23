/**
 * clean-client-website.ts — normalize a free-text website field.
 *
 * MVP stores the raw string the user typed but trims whitespace and prepends
 * `https://` when the URL has no protocol so the rendered link is clickable.
 * Empty / null returns `''`. Pure.
 */

const PROTOCOL_RE = /^(https?:)?\/\//i;

export function cleanClientWebsite(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.length === 0) return '';
  if (PROTOCOL_RE.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Build the visible label (drops protocol + trailing slash) for displaying
 * a website in a card without losing the navigable form.
 */
export function displayClientWebsite(value: string | null | undefined): string {
  const cleaned = cleanClientWebsite(value);
  if (!cleaned) return '';
  return cleaned.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}
