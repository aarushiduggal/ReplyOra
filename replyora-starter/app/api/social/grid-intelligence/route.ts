import { NextResponse } from "next/server";

import { analyzeLiveFeed } from "@/lib/social/feed-analysis";
import { computeRecommendedTimes } from "@/lib/social/best-times";

export const runtime = "nodejs";

/**
 * Real grid intelligence for a client, loaded AFTER the Grid shell renders so
 * the heavy image-colour analysis + insights call never block the page:
 *   - analysis: live-feed palette + harmony (server-side pixel read)
 *   - times:    when this account's followers are actually online
 * Both are workspace-scoped via the session and fault-tolerant.
 */
export async function GET(req: Request) {
  const clientId = new URL(req.url).searchParams.get("client");
  if (!clientId) {
    return NextResponse.json({ analysis: null, times: [], timesSource: "general" });
  }
  const [analysis, recommended] = await Promise.all([
    analyzeLiveFeed(clientId).catch(() => null),
    computeRecommendedTimes(clientId).catch(() => ({
      times: [] as string[],
      source: "general" as const,
    })),
  ]);
  return NextResponse.json({
    analysis,
    times: recommended.times,
    timesSource: recommended.source,
  });
}
