/**
 * Comp (complimentary) internal accounts.
 *
 * These workspace owners always get full Pro access and are never charged or
 * paywalled — used by the Replyora team to test everything on the live site.
 * Everyone else follows the normal trial → paid Stripe flow.
 *
 * The founder account is always included; add more via COMP_ACCOUNT_EMAILS
 * (comma-separated) without a code change. Matching is case-insensitive.
 */
const DEFAULT_COMP = ["aarushiduggal8@gmail.com"];

function compAccountEmails(): string[] {
  const fromEnv = (process.env.COMP_ACCOUNT_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_COMP, ...fromEnv]));
}

/** True if this email should get free, permanent full Pro access. */
export function isCompAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  return compAccountEmails().includes(email.trim().toLowerCase());
}
