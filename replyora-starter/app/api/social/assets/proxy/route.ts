import { NextResponse } from "next/server";

import { getCurrentWorkspaceId } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * GET /api/social/assets/proxy?url=<r2 public url>
 *
 * Same-origin image proxy for the crop editor. Assets live on the R2 public
 * host, so drawing one into a <canvas> taints it and canvas.toBlob() then
 * throws SecurityError — the crop could never be exported. Serving the bytes
 * from our own origin keeps the canvas clean.
 *
 * SSRF: this endpoint fetches a URL supplied by the client, so it is strictly
 * limited to the configured R2 public base — same origin AND same path prefix.
 * Anything else is refused outright; it must never become a general fetcher for
 * internal addresses. A session is required as well, so it isn't an open relay.
 */
export async function GET(req: Request) {
  try {
    await getCurrentWorkspaceId();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const base = process.env.R2_PUBLIC_URL;
  if (!base) {
    return NextResponse.json({ error: "storage_not_configured" }, { status: 501 });
  }

  const raw = new URL(req.url).searchParams.get("url") ?? "";
  let target: URL;
  let allowed: URL;
  try {
    target = new URL(raw);
    allowed = new URL(base);
  } catch {
    return NextResponse.json({ error: "bad_url" }, { status: 400 });
  }

  // Origin AND path prefix must match the configured bucket base.
  const prefix = allowed.pathname.replace(/\/$/, "");
  if (
    target.origin !== allowed.origin ||
    !target.pathname.startsWith(prefix === "" ? "/" : `${prefix}/`)
  ) {
    return NextResponse.json({ error: "forbidden_host" }, { status: 403 });
  }

  const upstream = await fetch(target.toString(), { redirect: "error" }).catch(
    () => null,
  );
  if (!upstream || !upstream.ok) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "not_an_image" }, { status: 415 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      // Private: these are tenant assets, so no shared/CDN caching.
      "Cache-Control": "private, max-age=300",
    },
  });
}
