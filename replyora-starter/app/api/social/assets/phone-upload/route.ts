import { NextResponse } from "next/server";

import { hasStorage, presignR2Put } from "@/lib/social/storage";
import { createAssetForWorkspace } from "@/lib/social/assets";
import { verifyUploadToken } from "@/lib/social/upload-token";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per file

/**
 * POST /api/social/assets/phone-upload  (multipart: token, file)
 *
 * PUBLIC (no login) — the phone proves itself with the signed token from the
 * QR. The token carries the workspace + client, so files can only land in that
 * one client's library. We still validate type + size before storing.
 */
export async function POST(req: Request) {
  if (!hasStorage()) {
    return NextResponse.json({ error: "storage_not_configured" }, { status: 501 });
  }

  const form = await req.formData().catch(() => null);
  const token = (form?.get("token") as string) || "";
  const claim = verifyUploadToken(token);
  if (!claim) {
    return NextResponse.json({ error: "invalid_or_expired" }, { status: 401 });
  }

  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }

  const contentType = file.type || "application/octet-stream";
  if (!/^(image|video)\//.test(contentType)) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const kind = contentType.startsWith("video") ? "video" : "image";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const rand = Math.random().toString(36).slice(2, 10);
  const key = `${claim.workspaceId}/${claim.clientId}/${rand}-${safeName}`;

  const presigned = presignR2Put(key, contentType);
  if (!presigned) {
    return NextResponse.json({ error: "storage_not_configured" }, { status: 501 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const put = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: bytes,
  });
  if (!put.ok) {
    return NextResponse.json({ error: `r2_rejected_${put.status}` }, { status: 502 });
  }

  await createAssetForWorkspace(claim.workspaceId, {
    clientId: claim.clientId,
    url: presigned.publicUrl,
    kind,
    uploadedBy: "client",
  });

  return NextResponse.json({ ok: true, url: presigned.publicUrl });
}
