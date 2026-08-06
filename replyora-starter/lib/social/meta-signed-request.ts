import "server-only";
import crypto from "node:crypto";

/**
 * Meta sends a `signed_request` to the Deauthorize and Data-Deletion callbacks.
 * It's `<signature>.<payload>` where the signature is a base64url HMAC-SHA256 of
 * the payload, keyed by the app secret. We verify it and return the decoded JSON
 * (which includes `user_id` — the account that removed the app / asked for erasure).
 *
 * Docs: developers.facebook.com/docs/facebook-login/data-deletion-request
 */

function base64UrlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export interface SignedRequest {
  user_id?: string;
  [key: string]: unknown;
}

export function parseSignedRequest(signedRequest: string): SignedRequest | null {
  const secret = process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET;
  if (!secret || !signedRequest.includes(".")) return null;

  const [encodedSig, payload] = signedRequest.split(".");
  if (!encodedSig || !payload) return null;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest();
  const provided = base64UrlDecode(encodedSig);

  // Constant-time compare; lengths must match first.
  if (
    provided.length !== expected.length ||
    !crypto.timingSafeEqual(provided, expected)
  ) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(payload).toString("utf8")) as SignedRequest;
  } catch {
    return null;
  }
}
