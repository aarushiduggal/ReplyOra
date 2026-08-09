import { NextResponse } from "next/server";

import { refreshExpiringInstagramTokens } from "@/lib/social/token-refresh";

export const runtime = "nodejs";

/**
 * Refreshes Instagram long-lived tokens nearing expiry (~60-day lifetime).
 * Call from a Netlify scheduled function (e.g. daily). Guarded by CRON_SECRET
 * when set — pass it as the `x-cron-secret` header or `?secret=` query param.
 */
async function run(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided =
      req.headers.get("x-cron-secret") ??
      new URL(req.url).searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
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
