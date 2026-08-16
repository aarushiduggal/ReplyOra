import "server-only";

import { listClientConnections } from "@/lib/social/connections";
import { HAS_INSTAGRAM_LOGIN } from "@/lib/social/publish";
import { fetchOrTimeout } from "@/lib/social/http";

/**
 * Real "best times to post" for a client's Instagram, from the Meta Graph
 * `online_followers` insight — i.e. when this account's followers are actually
 * online, averaged over the last ~30 days by weekday + hour.
 *
 * Requires instagram_manage_insights (approved) AND ≥100 followers (Meta only
 * returns online_followers above that threshold). When it isn't available we
 * fall back to general best-practice windows, flagged via `source` so the UI
 * can label it honestly.
 */

const GRAPH = HAS_INSTAGRAM_LOGIN
  ? "https://graph.instagram.com/v21.0"
  : "https://graph.facebook.com/v21.0";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** General best-practice windows — the honest fallback when insights are thin. */
const GENERAL: string[] = ["Tue 7pm", "Thu 6pm", "Sun 11am"];

export interface RecommendedTimes {
  times: string[];
  source: "audience" | "general";
}

function label(day: number, hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "am" : "pm";
  return `${DAYS[day]} ${h12}${ampm}`;
}

interface OnlineValue {
  value?: Record<string, number>;
  end_time?: string;
}

export async function computeRecommendedTimes(
  clientId: string,
): Promise<RecommendedTimes> {
  let conns;
  try {
    conns = await listClientConnections(clientId);
  } catch {
    return { times: GENERAL, source: "general" };
  }
  const ig = conns.find((c) => c.platform === "instagram");
  if (!ig?.accessToken || !ig.externalAccountId) {
    return { times: GENERAL, source: "general" };
  }

  const target = HAS_INSTAGRAM_LOGIN ? "me" : ig.externalAccountId;
  try {
    const url =
      `${GRAPH}/${target}/insights` +
      `?metric=online_followers&period=lifetime&access_token=${ig.accessToken}`;
    const res = await fetchOrTimeout(url, { next: { revalidate: 21600 } }); // 6h cache
    if (!res || !res.ok) return { times: GENERAL, source: "general" };
    const json = (await res.json()) as {
      data?: { values?: OnlineValue[] }[];
    };
    const values = json.data?.[0]?.values ?? [];
    if (values.length === 0) return { times: GENERAL, source: "general" };

    // Sum online-follower counts into a [weekday][hour] grid.
    const grid: number[][] = Array.from({ length: 7 }, () =>
      Array<number>(24).fill(0),
    );
    let any = false;
    for (const v of values) {
      if (!v.value || !v.end_time) continue;
      const day = new Date(v.end_time).getUTCDay();
      for (const [hStr, count] of Object.entries(v.value)) {
        const h = Number(hStr);
        if (Number.isFinite(h) && h >= 0 && h < 24) {
          grid[day]![h]! += count;
          if (count > 0) any = true;
        }
      }
    }
    if (!any) return { times: GENERAL, source: "general" };

    // Best hour per day, then take the 3 strongest days (distinct days = variety).
    const perDay = grid.map((hours, day) => {
      let bestH = 0;
      let bestV = -1;
      hours.forEach((val, h) => {
        if (val > bestV) {
          bestV = val;
          bestH = h;
        }
      });
      return { day, hour: bestH, val: bestV };
    });
    const top = perDay
      .filter((d) => d.val > 0)
      .sort((a, b) => b.val - a.val)
      .slice(0, 3)
      .sort((a, b) => a.day - b.day || a.hour - b.hour); // stable, calendar order

    if (top.length === 0) return { times: GENERAL, source: "general" };
    return { times: top.map((t) => label(t.day, t.hour)), source: "audience" };
  } catch {
    return { times: GENERAL, source: "general" };
  }
}
