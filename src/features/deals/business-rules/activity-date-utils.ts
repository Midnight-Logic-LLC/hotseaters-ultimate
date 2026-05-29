/**
 * activity-date-utils.ts — pure date helpers for sales-activity date pickers.
 *
 * Extracted from inline-sales-activity-form.tsx (RULE A file-size split). The
 * sales_activity `scheduled_date` is stored as a UTC-safe `yyyy-MM-dd` string,
 * but the calendar must hydrate it as a LOCAL date so the picked day never
 * shifts across a timezone boundary. These two helpers bridge the two
 * representations.
 *
 * Pure — no I/O. HotSeatersMVP is the bible.
 */

/**
 * Parse a stored `yyyy-MM-dd` (date-only) string into a LOCAL `Date` so the
 * calendar highlights the exact stored day, never the day before/after due to
 * UTC parsing. Returns `undefined` for empty or malformed input.
 */
export function parseStoredDateForLocalPicker(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number);
  if (year == null || month == null || day == null) return undefined;
  return new Date(year, month - 1, day);
}

/**
 * Format a calendar-picked `Date` back into the stored `yyyy-MM-dd` string,
 * reading the LOCAL Y/M/D so the stored day matches what the user clicked.
 */
export function formatPickedDateForUtcStorage(dateObj: Date): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
