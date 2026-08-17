import { NextResponse } from "next/server";

import { listDuePosts, publishPost } from "@/lib/social/publish";

export const runtime = "nodejs";

/**
 * Publishes every post whose scheduled time has passed (approved, no prior
 * error) and flips it to published. Called by the Netlify scheduled function
 * (netlify/functions/publish-cron.mjs).
 *
 * REQUIRES CRON_SECRET. This used to be enforced only "when set", which meant a
 * missing env var left the endpoint world-callable — anyone could POST it and
 * push every workspace's due posts live. It now FAILS CLOSED: no secret
 * configured => nobody gets in, including the cron. Set CRON_SECRET in Netlify.
 */
async function run(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error(
      "[publish-due] CRON_SECRET is not set — refusing to run. Set it in Netlify env.",
    );
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const provided =
    req.headers.get("x-cron-secret") ??
    new URL(req.url).searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const due = await listDuePosts();
  const results: { postId: string; ok: boolean; error?: string }[] = [];
  for (const d of due) {
    const r = await publishPost(d.workspaceId, d.postId);
    results.push({ postId: d.postId, ok: r.ok, error: r.error });
  }
  return NextResponse.json({ processed: results.length, results });
}

export async function POST(req: Request) {
  return run(req);
}
export async function GET(req: Request) {
  return run(req);
}
