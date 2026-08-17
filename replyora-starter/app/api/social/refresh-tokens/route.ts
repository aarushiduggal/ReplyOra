import { NextResponse } from "next/server";

import { refreshExpiringInstagramTokens } from "@/lib/social/token-refresh";

export const runtime = "nodejs";

/**
 * Refreshes Instagram long-lived tokens nearing expiry (~60-day lifetime).
 * Call from a Netlify scheduled function (e.g. daily). Pass CRON_SECRET as the
 * `x-cron-secret` header or `?secret=` query param.
 *
 * REQUIRES CRON_SECRET and FAILS CLOSED — see the note in publish-due/route.ts.
 * Left unguarded, anyone could spin this endpoint and burn the Meta API quota.
 */
async function run(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error(
      "[refresh-tokens] CRON_SECRET is not set — refusing to run. Set it in Netlify env.",
    );
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const provided =
    req.headers.get("x-cron-secret") ??
    new URL(req.url).searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await refreshExpiringInstagramTokens();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
