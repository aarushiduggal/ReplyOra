import "server-only";

import { fetchLiveInstagramFeed } from "@/lib/social/instagram-feed";

/**
 * Live grid intelligence — analyses the REAL colours of a client's Instagram
 * feed (server-side, since browsers can't read cross-origin image pixels), and
 * projects how the agency's PLANNED posts would shift the feed's harmony.
 *
 * Downloads each image, shrinks it to 1px with sharp to get its average colour,
 * then scores harmony as how tightly the colours cluster. Returns null when IG
 * isn't connected / sharp is unavailable — the grid falls back to planned-tile
 * analysis then.
 */

export interface FeedAnalysis {
  posts: number;
  palette: string[]; // representative hex colours from the live feed
  liveHarmony: number; // 0–100 consistency of the current live feed
  projectedHarmony: number; // harmony if the planned posts were added
  delta: number; // projectedHarmony − liveHarmony (+ improves, − clashes)
}

type RGB = [number, number, number];

function toHex([r, g, b]: RGB): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

async function avgColor(url: string): Promise<RGB | null> {
  try {
    const sharp = (await import("sharp")).default;
    const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1h
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const { data } = await sharp(buf)
      .resize(1, 1, { fit: "cover" })
      .raw()
      .toBuffer({ resolveWithObject: true });
    return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0];
  } catch {
    return null; // sharp missing / decode failed / network
  }
}

/** Harmony 0–100 from how tightly a set of colours clusters around their mean. */
function harmonyOf(colors: RGB[]): number {
  if (colors.length === 0) return 0;
  const mean: RGB = [0, 1, 2].map(
    (i) => Math.round(colors.reduce((a, c) => a + (c[i] ?? 0), 0) / colors.length),
  ) as RGB;
  const dists = colors.map((c) =>
    Math.sqrt((c[0] - mean[0]) ** 2 + (c[1] - mean[1]) ** 2 + (c[2] - mean[2]) ** 2),
  );
  const meanDist = dists.reduce((a, b) => a + b, 0) / dists.length;
  // 441 ≈ max RGB distance; scale so a tight feed ≈ 100, a scattered one ≈ low.
  return Math.max(0, Math.min(100, Math.round(100 - (meanDist / 441) * 180)));
}

export async function analyzeLiveFeed(
  clientId: string,
  plannedMediaUrls: string[] = [],
): Promise<FeedAnalysis | null> {
  let feed;
  try {
    feed = await fetchLiveInstagramFeed(clientId, 9);
  } catch {
    return null;
  }
  if (!feed.connected || feed.media.length === 0) return null;

  const liveColors = (await Promise.all(feed.media.map((m) => avgColor(m.mediaUrl)))).filter(
    (c): c is RGB => c !== null,
  );
  if (liveColors.length === 0) return null;

  const plannedColors = (
    await Promise.all(plannedMediaUrls.slice(0, 9).map((u) => avgColor(u)))
  ).filter((c): c is RGB => c !== null);

  const liveHarmony = harmonyOf(liveColors);
  const projectedHarmony = harmonyOf([...liveColors, ...plannedColors]);

  // Palette: up to 5 representative colours across the live feed.
  const palette = liveColors.slice(0, 5).map(toHex);

  return {
    posts: feed.media.length,
    palette,
    liveHarmony,
    projectedHarmony: plannedColors.length ? projectedHarmony : liveHarmony,
    delta: plannedColors.length ? projectedHarmony - liveHarmony : 0,
  };
}
