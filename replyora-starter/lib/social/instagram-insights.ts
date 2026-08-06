import "server-only";

import { listClientConnections } from "@/lib/social/connections";
import { HAS_INSTAGRAM_LOGIN } from "@/lib/social/publish";

/**
 * Real Instagram performance for the Reports page — pulls per-media insights via
 * the Meta Graph API (reach, likes, comments, saves, shares) and aggregates them
 * into the "at a glance" numbers. Needs the client's IG connected with the
 * `instagram_business_manage_insights` permission.
 *
 * Returns null when IG isn't connected / Meta isn't configured / the call fails —
 * the Reports page then falls back to plan-activity view.
 */

const GRAPH = HAS_INSTAGRAM_LOGIN
  ? "https://graph.instagram.com/v21.0"
  : "https://graph.facebook.com/v21.0";

export interface InsightsSummary {
  posts: number;
  reach: number;
  engagements: number; // likes + comments + saves + shares
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  avgEngagementRate: number; // engagements / reach, %
  perFormat: { format: string; posts: number; engagements: number; reach: number }[];
}

interface MediaNode {
  id: string;
  media_type?: string;
  like_count?: number;
  comments_count?: number;
}

// Media-level metrics that Instagram exposes for organic posts.
const MEDIA_METRICS = "reach,saved,shares";

export async function fetchInstagramInsights(
  clientId: string,
  limit = 30,
): Promise<InsightsSummary | null> {
  let conns;
  try {
    conns = await listClientConnections(clientId);
  } catch {
    return null;
  }
  const ig = conns.find((c) => c.platform === "instagram");
  if (!ig?.accessToken || !ig.externalAccountId) return null;
  const token = ig.accessToken;

  try {
    // 1) recent media with the counts that come for free on the node. Some
    // accounts reject like_count/comments_count — fall back to minimal fields
    // so we still return post counts instead of nothing.
    const target = HAS_INSTAGRAM_LOGIN ? "me" : ig.externalAccountId;
    const mediaUrl = (fields: string) =>
      `${GRAPH}/${target}/media?fields=${fields}&limit=${limit}&access_token=${token}`;
    let mediaRes = await fetch(mediaUrl("id,media_type,like_count,comments_count"), {
      next: { revalidate: 900 },
    });
    if (!mediaRes.ok) {
      mediaRes = await fetch(mediaUrl("id,media_type"), { next: { revalidate: 900 } });
    }
    if (!mediaRes.ok) return null;
    const media = ((await mediaRes.json()) as { data?: MediaNode[] }).data ?? [];
    if (media.length === 0) {
      return {
        posts: 0, reach: 0, engagements: 0, likes: 0, comments: 0,
        saves: 0, shares: 0, avgEngagementRate: 0, perFormat: [],
      };
    }

    // 2) per-media reach/saved/shares insights (in parallel, tolerate failures)
    const perMedia = await Promise.all(
      media.map(async (m) => {
        let reach = 0, saved = 0, shares = 0;
        try {
          const r = await fetch(
            `${GRAPH}/${m.id}/insights?metric=${MEDIA_METRICS}&access_token=${token}`,
            { next: { revalidate: 900 } },
          );
          if (r.ok) {
            const rows = ((await r.json()) as {
              data?: { name: string; values?: { value?: number }[] }[];
            }).data ?? [];
            for (const row of rows) {
              const v = row.values?.[0]?.value ?? 0;
              if (row.name === "reach") reach = v;
              else if (row.name === "saved") saved = v;
              else if (row.name === "shares") shares = v;
            }
          }
        } catch {
          /* leave zeros for this media */
        }
        const likes = m.like_count ?? 0;
        const comments = m.comments_count ?? 0;
        return {
          format: normFormat(m.media_type),
          reach,
          likes,
          comments,
          saves: saved,
          shares,
          engagements: likes + comments + saved + shares,
        };
      }),
    );

    const sum = (f: (x: (typeof perMedia)[number]) => number) =>
      perMedia.reduce((a, x) => a + f(x), 0);

    const reach = sum((x) => x.reach);
    const engagements = sum((x) => x.engagements);

    // per-format rollup
    const byFormat = new Map<string, { posts: number; engagements: number; reach: number }>();
    for (const x of perMedia) {
      const e = byFormat.get(x.format) ?? { posts: 0, engagements: 0, reach: 0 };
      e.posts += 1;
      e.engagements += x.engagements;
      e.reach += x.reach;
      byFormat.set(x.format, e);
    }

    return {
      posts: perMedia.length,
      reach,
      engagements,
      likes: sum((x) => x.likes),
      comments: sum((x) => x.comments),
      saves: sum((x) => x.saves),
      shares: sum((x) => x.shares),
      avgEngagementRate: reach > 0 ? (engagements / reach) * 100 : 0,
      perFormat: [...byFormat.entries()].map(([format, v]) => ({ format, ...v })),
    };
  } catch {
    return null;
  }
}

function normFormat(t?: string): string {
  if (t === "VIDEO") return "Reel";
  if (t === "CAROUSEL_ALBUM") return "Carousel";
  return "Post";
}
