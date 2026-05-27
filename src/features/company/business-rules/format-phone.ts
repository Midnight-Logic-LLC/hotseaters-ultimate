/**
 * format-phone.ts — pure phone-number masking for the company settings form.
 *
 * Mirrors the bible (HotSeatersMVP) CompanySettingsTab phone-onChange logic:
 * strips non-digits, optionally drops a leading US country-code "1",
 * formats as (XXX) XXX-XXXX, and handles partial input gracefully so the
 * controlled input never crashes while the user is mid-type.
 */

const MAX_DIGITS = 10;

/**
 * Mask a raw phone string as `(XXX) XXX-XXXX`.
 *
 * - Empty / whitespace input → empty string.
 * - Leading "1" country code on an 11-digit string is dropped to match the
 *   bible's intent of displaying the local 10-digit number.
 * - Partial input is formatted progressively (`555` → `(555`, `5551234` →
 *   `(555) 123-4`).
 */
export function formatPhone(raw: string): string {
  if (typeof raw !== 'string') {
    return '';
  }

  const digitsOnly = raw.replace(/\D/g, '');
  if (digitsOnly.length === 0) {
    return '';
  }

  // Drop leading US country code "1" when we have an 11-digit string.
  const trimmed =
    digitsOnly.length === 11 && digitsOnly.startsWith('1')
      ? digitsOnly.slice(1)
      : digitsOnly;

  const value = trimmed.slice(0, MAX_DIGITS);

  if (value.length <= 3) {
    return value.length === 3 ? `(${value}) ` : `(${value}`;
  }
  if (value.length <= 6) {
    return `(${value.slice(0, 3)}) ${value.slice(3)}`;
  }
  return `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
}
