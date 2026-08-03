import { NextResponse } from "next/server";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { hasStorage, presignR2Put } from "@/lib/social/storage";

export const runtime = "nodejs";

/**
 * POST /api/social/assets/presign
 * Body: { clientId?: string, filename: string, contentType: string }
 * Returns a SigV4 presigned R2 PUT URL scoped under the caller's workspace.
 */
export async function POST(req: Request) {
  if (!hasStorage()) {
    return NextResponse.json(
      { error: "storage_not_configured" },
      { status: 501 },
    );
  }

  let workspaceId: string;
  try {
    workspaceId = await getCurrentWorkspaceId();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    clientId?: string;
    filename?: string;
    contentType?: string;
  } | null;

  if (!body?.filename || !body?.contentType) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const safeName = body.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const rand = Math.random().toString(36).slice(2, 10);
  const scope = body.clientId
    ? `${workspaceId}/${body.clientId}`
    : `${workspaceId}/library`;
  const key = `${scope}/${rand}-${safeName}`;

  const presigned = presignR2Put(key, body.contentType);
  if (!presigned) {
    return NextResponse.json(
      { error: "storage_not_configured" },
      { status: 501 },
    );
  }
  return NextResponse.json(presigned);
}
