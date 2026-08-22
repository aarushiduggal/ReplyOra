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
