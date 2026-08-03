import { createHash, createHmac } from "crypto";

/**
 * ReplyOra Social — object storage (Cloudflare R2, S3-compatible).
 *
 * Free tier, no egress fees. We generate SigV4 **presigned PUT** URLs so the
 * browser uploads media straight to R2 (no file bytes through our functions).
 * Dependency-free — pure node:crypto — so nothing new to install.
 *
 * Activates when these env vars are set (Netlify → Site settings → Env):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *   R2_BUCKET, R2_PUBLIC_URL  (the bucket's public https base, no trailing slash)
 *
 * Until then hasStorage() is false and the UI shows a "connect storage" state.
 */

export function hasStorage(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_PUBLIC_URL,
  );
}

const REGION = "auto";
const SERVICE = "s3";

function sha256Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}
function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}
function encodeRfc3986(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}
/** Encode an object key but keep "/" separators. */
function encodeKey(key: string): string {
  return key.split("/").map(encodeRfc3986).join("/");
}

export interface PresignResult {
  /** PUT the file bytes here (Content-Type must match contentType). */
  uploadUrl: string;
  /** Where the file will be publicly readable after upload. */
  publicUrl: string;
  key: string;
}

/**
 * Presign a PUT to R2. `expiresIn` seconds (default 15 min).
 * Returns null if storage isn't configured.
 */
export function presignR2Put(
  key: string,
  contentType: string,
  expiresIn = 900,
  nowMs = Date.now(),
): PresignResult | null {
  if (!hasStorage()) return null;
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
  const bucket = process.env.R2_BUCKET!;
  const publicBase = process.env.R2_PUBLIC_URL!.replace(/\/$/, "");

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const now = new Date(nowMs);
  const amzDate = now
    .toISOString()
    .replace(/[:-]|\.\d{3}/g, "")
    .replace(/(\d{8})(\d{6})Z?/, "$1T$2Z");
  const dateStamp = amzDate.slice(0, 8);

  const canonicalUri = `/${encodeRfc3986(bucket)}/${encodeKey(key)}`;
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;

  const query: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "host",
  };
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(query[k]!)}`)
    .join("&");

  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = "host";
  const payloadHash = "UNSIGNED-PAYLOAD";

  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning)
    .update(stringToSign, "utf8")
    .digest("hex");

  const uploadUrl = `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  const publicUrl = `${publicBase}/${encodeKey(key)}`;
  return { uploadUrl, publicUrl, key };
}
