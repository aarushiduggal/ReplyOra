import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signed, expiring token for the "upload from phone" flow.
 *
 * The agency generates a QR that points at /upload/<token>; the token is an
 * HMAC over clientId + workspaceId + expiry, so the phone (which has no login)
 * can drop files straight into that client's asset library and nothing else.
 * Can't be forged without AUTH_SECRET, and it stops working after 30 minutes.
 */

const SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "replyora-dev-portal-secret";

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function makeUploadToken(
  clientId: string,
  workspaceId: string,
  ttlMs: number = DEFAULT_TTL_MS,
): string {
  const exp = Date.now() + ttlMs;
  const payload = `${clientId}.${workspaceId}.${exp}`;
  const body = Buffer.from(payload).toString("base64url");
  return `${body}~${sign(payload)}`;
}

export function verifyUploadToken(
  token: string,
): { clientId: string; workspaceId: string } | null {
  const i = token.lastIndexOf("~");
  if (i < 0) return null;
  const body = token.slice(0, i);
  const sig = token.slice(i + 1);
  let payload: string;
  try {
    payload = Buffer.from(body, "base64url").toString("utf8");
  } catch {
    return null;
  }
  // Constant-time signature check.
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const parts = payload.split(".");
  if (parts.length !== 3) return null;
  const clientId = parts[0];
  const workspaceId = parts[1];
  const exp = Number(parts[2]);
  if (!clientId || !workspaceId || !Number.isFinite(exp)) return null;
  if (Date.now() > exp) return null;
  return { clientId, workspaceId };
}
