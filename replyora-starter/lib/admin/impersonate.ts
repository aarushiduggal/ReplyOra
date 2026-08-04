import "server-only";

import { cookies } from "next/headers";
import { createHmac } from "crypto";

import { isStaff } from "@/lib/auth/owner";

/**
 * Staff/owner impersonation ("Enter as") for the new Neon/Auth.js stack.
 *
 * The impersonation target is stored in a signed, httpOnly cookie. It's only
 * ever honoured when the HMAC verifies AND the stored actor is still staff, so
 * a leaked/forged cookie is useless. Reading is safe anywhere; set/clear must
 * run in a Server Action or Route Handler.
 */

const COOKIE = "rp_imp";
const SECRET =
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "replyora-dev-imp";

export interface Impersonation {
  actorUserId: string;
  actorEmail: string;
  workspaceId: string;
}

function sign(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

function encode(p: Impersonation): string {
  const b = Buffer.from(JSON.stringify(p)).toString("base64url");
  return `${b}.${sign(b)}`;
}

function decode(token: string): Impersonation | null {
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const b = token.slice(0, i);
  const sig = token.slice(i + 1);
  if (sign(b) !== sig) return null;
  try {
    return JSON.parse(Buffer.from(b, "base64url").toString()) as Impersonation;
  } catch {
    return null;
  }
}

/** Read + validate the impersonation cookie (HMAC ok AND actor still staff). */
export async function readImpersonation(): Promise<Impersonation | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const p = decode(raw);
  if (!p || !isStaff(p.actorEmail)) return null;
  return p;
}

export async function setImpersonationCookie(p: Impersonation): Promise<void> {
  (await cookies()).set(COOKIE, encode(p), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearImpersonationCookie(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
