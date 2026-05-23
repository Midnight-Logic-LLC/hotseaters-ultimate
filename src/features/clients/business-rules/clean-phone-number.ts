/**
 * clean-phone-number.ts — phone-string normalization + formatting.
 *
 * Ported line-for-line from `HotSeatersMVP/src/components/utils.jsx`
 * (`formatPhoneNumber`). The same rules govern storage and display: we keep
 * digits-only on the wire and render `(xxx) xxx-xxxx` only when the number
 * normalizes to exactly ten digits, otherwise we round-trip the original.
 *
 * Pure. No I/O. Safe to call in render.
 */

/** Strip everything non-numeric. */
export function cleanPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * MVP-compatible display formatter — `(555) 123-4567`. Returns the original
 * input untouched when it isn't a 10-digit US number, so international or
 * malformed values stay visible to the user instead of silently mangled.
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = cleanPhoneNumber(phone);
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}
