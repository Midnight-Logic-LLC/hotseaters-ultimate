/**
 * guess-contact-email.ts — port of the email-pattern heuristic embedded in
 * HotSeatersMVP/src/components/sales/AddContactWizard.jsx (the auto-guess
 * useEffect). Pure + testable (no React, no I/O).
 *
 * Given a firm's existing contacts (with emails), detect the dominant email
 * pattern (first.last / firstlast / f+last / first / last) and apply it to a
 * new contact's name. Returns null when there isn't enough signal to guess.
 *
 * HotSeatersMVP is the bible.
 */

export interface ContactWithEmail {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

export function guessContactEmail(
  firstName: string,
  lastName: string,
  firmContacts: ContactWithEmail[],
): string | null {
  if (!firstName || !lastName) return null;

  const withEmail = firmContacts.filter((a) => !!a.email);
  if (withEmail.length === 0) return null;

  // Most common domain (avoid outliers).
  const domainCounts: Record<string, number> = {};
  withEmail.forEach((a) => {
    const d = a.email!.split('@')[1];
    if (d) domainCounts[d] = (domainCounts[d] ?? 0) + 1;
  });
  const domain = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!domain) return null;

  const sampleEmails = withEmail
    .filter((a) => a.email!.split('@')[1] === domain)
    .map((a) => a.email!.split('@')[0]!.toLowerCase());
  if (sampleEmails.length === 0) return null;

  const firstSample = sampleEmails[0]!;
  const sampleContact = withEmail.find((a) => a.email!.split('@')[1] === domain)!;
  const sampleFirst = (sampleContact.first_name ?? '').toLowerCase();
  const sampleLast = (sampleContact.last_name ?? '').toLowerCase();

  const fn = firstName.toLowerCase();
  const ln = lastName.toLowerCase();
  const fi = firstName.charAt(0).toLowerCase();

  if (firstSample === `${sampleFirst}.${sampleLast}`) return `${fn}.${ln}@${domain}`;
  if (firstSample === `${sampleFirst}${sampleLast}`) return `${fn}${ln}@${domain}`;
  if (firstSample === `${sampleFirst.charAt(0)}${sampleLast}`) return `${fi}${ln}@${domain}`;
  if (firstSample === sampleFirst) return `${fn}@${domain}`;
  if (firstSample === sampleLast) return `${ln}@${domain}`;
  // Default fallback: firstinitial+last.
  return `${fi}${ln}@${domain}`;
}
