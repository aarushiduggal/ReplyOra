/**
 * Owner + staff access (mirrors the comp-account pattern, lib/comp-accounts.ts).
 *
 * OWNER_EMAILS  — always full access: bypass every plan gate, both Personal AND
 *                 Agency features unlocked, skip onboarding, see the owner panel.
 * STAFF_EMAILS  — may reach /admin and impersonate. Falls back to OWNER_EMAILS.
 *
 * Pure, email-based, no session import (so lib/auth/session.ts can import it
 * without a cycle). Matching is case-insensitive.
 */

function parse(csv: string | undefined): string[] {
  return (csv ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function ownerEmails(): string[] {
  return parse(process.env.OWNER_EMAILS);
}

/** Staff = STAFF_EMAILS, else fall back to OWNER_EMAILS. Owners are always staff. */
function staffEmails(): string[] {
  const staff = parse(process.env.STAFF_EMAILS);
  return Array.from(new Set([...ownerEmails(), ...staff]));
}

export function isOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  return ownerEmails().includes(email.trim().toLowerCase());
}

export function isStaff(email: string | null | undefined): boolean {
  if (!email) return false;
  return staffEmails().includes(email.trim().toLowerCase());
}
