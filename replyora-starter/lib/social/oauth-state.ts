import { createHmac, timingSafeEqual } from "crypto";
import { signingSecret } from "@/lib/signing-secret";

/**
 * Signed `state` for the social-account connect flows (Instagram / Facebook /
 * TikTok).
 *
 * The clientId used to travel through OAuth as bare `state`, which meant the
 * value coming back on the callback was entirely attacker-controllable — the
 * textbook OAuth CSRF shape. It's now an HMAC over clientId + issue time, so a
 * callback can only carry a clientId this server actually sent.
 *
 * It is NOT an authorisation check on its own: the callback still writes through
 * upsertConnection(), which verifies the client belongs to the caller's
 * workspace. This closes the forgery hole; that closes the tenancy one.
 *
 * Mirrors lib/social/upload-token.ts (same secret, same constant-time compare).
 */



/** OAuth round-trips are seconds; 30 minutes is generous and bounds replay. */
const MAX_AGE_MS = 30 * 60 * 1000;

function sign(payload: string): string {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

/** Build the `state` value to send to the provider. */
export function makeOAuthState(clientId: string, now: number = Date.now()): string {
  const payload = `${clientId}.${now}`;
  const body = Buffer.from(payload).toString("base64url");
  return `${body}~${sign(payload)}`;
}

/**
 * Verify a `state` coming back from the provider. Returns the clientId, or null
 * if the signature is wrong, the value is malformed, or it has expired.
 */
export function verifyOAuthState(
  state: string,
  now: number = Date.now(),
): string | null {
  const i = state.lastIndexOf("~");
  if (i < 0) return null;

  const body = state.slice(0, i);
  const sig = state.slice(i + 1);

  let payload: string;
  try {
    payload = Buffer.from(body, "base64url").toString("utf8");
  } catch {
    return null;
  }

  // Constant-time compare — length must match first, or timingSafeEqual throws.
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  // clientIds contain no dots, so the LAST dot separates the timestamp.
  const dot = payload.lastIndexOf(".");
  if (dot < 1) return null;
  const clientId = payload.slice(0, dot);
  const issued = Number(payload.slice(dot + 1));
  if (!clientId || !Number.isFinite(issued)) return null;
  if (now - issued > MAX_AGE_MS || issued > now + 60_000) return null;

  return clientId;
}
