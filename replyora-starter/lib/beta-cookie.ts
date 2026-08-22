import "server-only";

import { cookies } from "next/headers";

/**
 * The invite code has to survive a round trip to Google and back.
 *
 * The Google button leaves our site entirely, so the code can't ride on the
 * form. /join/<code> drops it in this cookie first; the signIn callback in
 * auth.ts reads it when the user returns. Email+password signup passes the code
 * in the request body and doesn't depend on this, but sets it too so the flows
 * behave identically.
 *
 * Not signed: the code IS the secret, and it's verified against the database on
 * every use. A forged cookie just fails the lookup.
 */

export const BETA_COOKIE = "ro_invite";
const MAX_AGE = 60 * 60; // an hour is plenty to finish signing up

export async function setInviteCookie(code: string): Promise<void> {
  (await cookies()).set(BETA_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax", // must survive the Google redirect back to us
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function readInviteCookie(): Promise<string | null> {
  try {
    return (await cookies()).get(BETA_COOKIE)?.value?.trim() || null;
  } catch {
    return null;
  }
}

export async function clearInviteCookie(): Promise<void> {
  try {
    (await cookies()).delete(BETA_COOKIE);
  } catch {
    /* nothing to clear */
  }
}
