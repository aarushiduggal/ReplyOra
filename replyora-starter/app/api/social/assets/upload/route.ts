import { NextResponse } from "next/server";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { hasStorage, presignR2Put } from "@/lib/social/storage";
import { createAsset } from "@/lib/social/assets";

export const runtime = "nodejs";

/**
 * POST /api/social/assets/upload  (multipart: file, clientId?)
 *
 * Server-side upload proxy: the browser sends the file to us (same origin), and
 * WE upload it to R2. This avoids R2 CORS entirely and works even when the
 * viewer's network blocks the R2 host — the server does the R2 request.
 * Note: bound by the serverless request-body limit, so best for images.
 */
export async function POST(req: Request) {
  if (!hasStorage()) {
    return NextResponse.json({ error: "storage_not_configured" }, { status: 501 });
  }

  let workspaceId: string;
  try {
    workspaceId = await getCurrentWorkspaceId();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const clientId = (form?.get("clientId") as string) || undefined;
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }

  const contentType = file.type || "application/octet-stream";
  const kind = contentType.startsWith("video") ? "video" : "image";

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const rand = Math.random().toString(36).slice(2, 10);
  const scope = clientId ? `${workspaceId}/${clientId}` : `${workspaceId}/library`;
  const key = `${scope}/${rand}-${safeName}`;

  const presigned = presignR2Put(key, contentType);
  if (!presigned) {
    return NextResponse.json({ error: "storage_not_configured" }, { status: 501 });
  }

  // Server → R2. No CORS, and it runs from Netlify's network (not the viewer's).
  const bytes = Buffer.from(await file.arrayBuffer());
  const put = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: bytes,
  });
  if (!put.ok) {
    const detail = await put.text().catch(() => "");
    return NextResponse.json(
      { error: `r2_rejected_${put.status}`, detail: detail.slice(0, 200) },
      { status: 502 },
    );
  }

  const asset = await createAsset({
    clientId: clientId ?? null,
    url: presigned.publicUrl,
    kind,
  });
  return NextResponse.json({ ok: true, asset });
}
