import "server-only";

/**
 * The one secret behind every signed token we issue: client portal share links,
 * QR upload tokens, OAuth state, and staff impersonation cookies.
 *
 * WHY THIS EXISTS: each of those four modules used to inline
 *
 *     process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "replyora-dev-…"
 *
 * so a deploy missing AUTH_SECRET would keep working — quietly signing with a
 * constant that is committed to this repository. Anyone reading the source
 * could then mint a valid share token for ANY client id and read that client's
 * whole content plan. It failed OPEN, and nothing anywhere said so.
 *
 * Now the dev fallback exists only outside production. In production a missing
 * secret throws, which denies access instead of granting forged access.
 */

const DEV_FALLBACK = "replyora-dev-portal-secret";

export function signingSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    // Loud, because this is unrecoverable and silence is what made it dangerous.
    console.error(
      "[signing] AUTH_SECRET is not set. Refusing to sign or verify tokens " +
        "with the public dev fallback — set AUTH_SECRET in the environment.",
    );
    throw new Error("AUTH_SECRET is not set");
  }
  return DEV_FALLBACK;
}
