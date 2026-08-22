/**
 * ReplyOra Social — core types.
 *
 * The social-media-management side of ReplyOra. Instagram + TikTok only for now
 * (more networks later). Chat/reply assistant becomes an optional add-on.
 */

export type Platform = "instagram" | "tiktok" | "facebook";

export type PostStatus = "draft" | "scheduled" | "published";

/** Content format shown on the calendar (Post / Reel / Carousel / Story). */
export type PostFormat = "post" | "reel" | "carousel" | "story";

export const POST_FORMAT_LABEL: Record<PostFormat, string> = {
  post: "Post",
  reel: "Reel",
  carousel: "Carousel",
  story: "Story",
};

export interface SocialPost {
  id: string;
  workspaceId: string;
  platform: Platform;
  /** Content theme, e.g. "Educational", "Promotion", "Testimonial". */
  pillar: string;
  /** What the post is about — the prompt the caption was generated from. */
  topic: string;
  caption: string;
  hashtags: string[];
  status: PostStatus;
  /** ISO datetime when it's scheduled to publish (null while a plain draft). */
  scheduledFor: string | null;
  createdAt: string;
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
};

export const PLATFORMS: Platform[] = ["instagram", "tiktok", "facebook"];

/** The content themes offered in the studio. */
export const PILLARS = [
  "Educational",
  "Promotion",
  "Testimonial",
  "Behind the scenes",
  "Tips",
  "Offer",
] as const;

/**
 * Most slides Instagram will accept in one carousel. Facebook allows more, so
 * this is the binding limit. Lives here rather than in post-media.ts because
 * the Grid (a client component) needs it, and post-media is server-only.
 */
export const MAX_SLIDES = 10;

export type MediaKind = "image" | "video";

/** One slide of a post, in order. */
export interface PostMedia {
  url: string;
  kind: MediaKind;
  position: number;
}

/**
 * What this media list can publish as.
 *
 * Pure, and deliberately in the client-safe module: the Grid editor needs to
 * warn about an invalid carousel WHILE the user is building it, and the
 * publisher needs the same answer hours later. Two copies of this rule would
 * drift, and the drift would show up as a post that looked fine and then
 * failed at 7pm.
 */
export type MediaShape =
  | { kind: "empty" }
  | { kind: "image" }
  | { kind: "video" }
  | { kind: "carousel"; slides: number }
  | { kind: "invalid"; reason: string };

export function shapeOf(media: PostMedia[]): MediaShape {
  if (media.length === 0) return { kind: "empty" };
  if (media.length === 1) {
    return media[0]!.kind === "video" ? { kind: "video" } : { kind: "image" };
  }
  if (media.length > MAX_SLIDES) {
    return {
      kind: "invalid",
      reason: `Carousels can hold at most ${MAX_SLIDES} slides.`,
    };
  }
  const videos = media.filter((m) => m.kind === "video").length;
  if (videos > 0 && videos < media.length) {
    return {
      kind: "invalid",
      reason: "Instagram won't publish a carousel that mixes photos and video.",
    };
  }
  return { kind: "carousel", slides: media.length };
}
