/**
 * format-phone.ts — pure utilities for formatting US phone numbers as
 * the user types `(NNN) NNN-NNNN`. No React imports.
 *
 * Store raw digits; display formatted.
 *
 * BIBLE: HotSeatersMVP StepProfile.jsx / StepCompanyInfo.jsx inline phone
 * formatter (slice-3-3-4).
 */
export function formatPhone(digitsOrFormatted: string): string {
  const d = digitsOrFormatted.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function stripPhone(formatted: string): string {
  return formatted.replace(/\D/g, '');
}
