import { NextResponse } from "next/server";

import { getCurrentWorkspaceId } from "@/lib/auth/session";
import { listClientConnections } from "@/lib/social/connections";
import { HAS_INSTAGRAM_LOGIN, HAS_META } from "@/lib/social/publish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Owner-only diagnostic: shows exactly what Instagram returns for a client's
 * media, so a "connected but empty grid" is debuggable without server logs.
 * GET /api/social/debug/ig-feed?client=<clientId>
 * Never returns the access token — only the Graph API's status + payload.
 */
export async function GET(req: Request) {
  try {
    await getCurrentWorkspaceId(); // must be signed in; scopes the read
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const clientId = new URL(req.url).searchParams.get("client") ?? "";
  if (!clientId) return NextResponse.json({ error: "missing ?client=" }, { status: 400 });

  const conns = await listClientConnections(clientId).catch(() => []);
  const ig = conns.find((c) => c.platform === "instagram");

  const diag: Record<string, unknown> = {
    mode: HAS_INSTAGRAM_LOGIN ? "instagram_login" : HAS_META ? "facebook_login" : "none",
    hasInstagramLogin: HAS_INSTAGRAM_LOGIN,
    hasMeta: HAS_META,
    connectionFound: Boolean(ig),
    externalAccountId: ig?.externalAccountId ?? null,
    username: ig?.externalUsername ?? null,
    hasToken: Boolean(ig?.accessToken),
  };

  if (!ig?.accessToken) {
    return NextResponse.json({ ...diag, note: "No Instagram connection/token for this client." });
  }

  const base = HAS_INSTAGRAM_LOGIN
    ? "https://graph.instagram.com/v21.0"
    : "https://graph.facebook.com/v21.0";
  const target = HAS_INSTAGRAM_LOGIN ? "me" : ig.externalAccountId;
  const url =
    `${base}/${target}/media?fields=id,media_type,media_url,permalink,timestamp&limit=6&access_token=${ig.accessToken}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const body = (await res.json()) as { data?: unknown[]; error?: unknown };
    return NextResponse.json({
      ...diag,
      requestedPath: `${base}/${target}/media`,
      httpStatus: res.status,
      mediaCount: Array.isArray(body.data) ? body.data.length : 0,
      graphError: body.error ?? null,
      sample: Array.isArray(body.data) ? body.data.slice(0, 3) : null,
    });
  } catch (e) {
    return NextResponse.json({ ...diag, fetchError: String(e) });
  }
}
