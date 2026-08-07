import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { makeUploadToken } from "@/lib/social/upload-token";
import { APP_URL } from "@/lib/data/mode";

export const runtime = "nodejs";

/**
 * POST /api/social/assets/phone-link  { clientId }
 * Returns a signed /upload/<token> URL + a QR data-URL to display. The token is
 * scoped to the caller's workspace + this client and expires in 30 minutes.
 */
export async function POST(req: Request) {
  let workspaceId: string;
  try {
    workspaceId = await getCurrentWorkspaceId();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { clientId?: string } | null;
  const clientId = body?.clientId;
  if (!clientId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const token = makeUploadToken(clientId, workspaceId);
  const base = APP_URL.replace(/\/$/, "");
  const url = `${base}/upload/${token}`;
  const qr = await QRCode.toDataURL(url, {
    margin: 1,
    width: 320,
    color: { dark: "#2B1413", light: "#FBF7EFff" },
  });

  return NextResponse.json({ url, qr, expiresInMin: 30 });
}
