import type { Metadata } from "next";

import { GridWorkspace } from "@/components/social/grid/grid-workspace";
import { GuideProvider } from "@/components/social/guide";
import type { GridTile } from "@/lib/social/grid";

export const metadata: Metadata = {
  title: "Grid — design lab",
  robots: { index: false, follow: false },
};

/**
 * TEMPORARY preview — delete once the Broadsheet build is signed off.
 *
 * Renders the REAL GridWorkspace with sample data, so this is not a mockup:
 * every badge, tab and drop target below is the component that ships. The Grid
 * itself needs a session, so this route exists to look at it without one.
 *
 * The sample client is deliberately not Replyora.
 */

const PROFILE = {
  username: "marie_beers",
  displayName: "Marie Beers",
  followers: "1529",
  following: "15",
  bio: "Digital Creator",
  website: "mariebeers.com.au",
};

const IMAGES = [
  "/marketing/grid-1.jpg",
  "/marketing/grid-2.jpg",
  "/marketing/grid-3.jpg",
  "/marketing/grid-4.jpg",
  "/marketing/grid-5.jpg",
  "/marketing/grid-6.jpg",
];

/** A believable month: posts, a carousel, a couple of reels, some TikToks. */
const TILES: GridTile[] = [
  { platform: "instagram", media: IMAGES[0]!, kind: "image", count: 4 },
  { platform: "instagram", media: IMAGES[1]!, kind: "video", count: 1 },
  { platform: "instagram", media: IMAGES[2]!, kind: "image", count: 1 },
  { platform: "instagram", media: null, kind: null, count: 0 },
  { platform: "instagram", media: IMAGES[3]!, kind: "image", count: 3 },
  { platform: "facebook", media: IMAGES[4]!, kind: "image", count: 1 },
  { platform: "tiktok", media: IMAGES[1]!, kind: "video", count: 1 },
  { platform: "tiktok", media: IMAGES[5]!, kind: "video", count: 1 },
  { platform: "tiktok", media: null, kind: null, count: 0 },
].map((t, i) => ({
  id: `lab_${i}`,
  caption:
    i % 3 === 0
      ? "Behind the scenes at the studio this week"
      : "Three things nobody tells you about colour",
  status: i % 4 === 0 ? "scheduled" : "draft",
  platform: t.platform as GridTile["platform"],
  pillar: ["Education", "Behind the scenes", "Promotion"][i % 3]!,
  orderIndex: i,
  mediaUrl: t.media,
  scheduledFor:
    i % 4 === 0 ? new Date(Date.now() + i * 86_400_000).toISOString() : null,
  publishError: null,
  mediaKind: t.kind as GridTile["mediaKind"],
  mediaCount: t.count,
}));

const ASSETS = [
  { id: "a1", url: "/marketing/feed-2.jpg", kind: "image" as const },
  { id: "a2", url: "/marketing/feed-3.jpg", kind: "video" as const },
  { id: "a3", url: "/marketing/feed-4.jpg", kind: "image" as const },
  { id: "a4", url: "/marketing/feed-5.jpg", kind: "video" as const },
  { id: "a5", url: "/marketing/feed-6.jpg", kind: "image" as const },
  { id: "a6", url: "/marketing/grid-7.jpg", kind: "video" as const },
];

export default function DesignLabPage() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="border-b border-ink/10 bg-cream px-6 py-3">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-oxblood">
            Preview
          </span>
          <span className="text-[12px] text-ink/60">
            The real Grid component · switch tabs to see each plate
          </span>
          <span className="ml-auto text-[11px] text-ink/45">Sample client</span>
        </div>
      </div>
      {/* The masthead carries the guide trigger, which the real (social)
          layout provides. Supply it here so the lab renders identically. */}
      <GuideProvider>
        {/* One instance per platform so all three plates can be seen at once —
            the tabs need a session to switch, and this route has none. */}
        {(["instagram", "facebook", "tiktok"] as const).map((pf) => (
          <div key={pf} className="mx-auto max-w-[1180px] px-6 py-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-oxblood">
              {pf}
            </p>
            <GridWorkspace
              clientId="lab"
              clientName="Marie Beers"
              tiles={TILES}
              profile={PROFILE}
              assets={ASSETS}
              connectedPlatforms={["instagram", "facebook", "tiktok"]}
              initialPlatform={pf}
            />
          </div>
        ))}
      </GuideProvider>
    </div>
  );
}
