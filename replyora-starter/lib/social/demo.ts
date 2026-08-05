/**
 * Seeded demo client for MOCK/local mode (no DATABASE_URL).
 *
 * Module memory doesn't survive between dev requests, so instead of persisting
 * user-created data we always reconstruct one fully-populated brand —
 * "Bloom Hair Studio" — so every screen has a real name, a full feed, reports
 * data and a working client portal. On Neon (production) this file is unused;
 * real clients come from the database.
 */

import type { Client } from "./clients";
import type { GridTile, ProfilePreview } from "./grid";
import type { ClientPost } from "./posts";
import type { Platform, PostStatus } from "./types";

export const DEMO_WS_ID = "ws_demo";
export const DEMO_CLIENT_ID = "cl_demo_bloom";

export const DEMO_CLIENT: Client & { workspaceId: string } = {
  id: DEMO_CLIENT_ID,
  workspaceId: DEMO_WS_ID,
  name: "Bloom Hair Studio",
  handle: "@bloomhairstudio",
  avatarUrl: "/marketing/feed-6.jpg",
  platforms: ["instagram"],
  pillarCount: 4,
  createdAt: "2026-06-01T09:00:00.000Z",
};

export const DEMO_PROFILE: ProfilePreview = {
  username: "bloomhairstudio",
  displayName: "Bloom Hair Studio",
  followers: "4.2k",
  following: "312",
  bio: "Colour + care studio · Sydney\nBooking link below ↓",
  website: "bloomhairstudio.com.au",
};

const FEED = [
  "feed-1.jpg",
  "feed-2.jpg",
  "feed-3.jpg",
  "feed-4.jpg",
  "feed-5.jpg",
  "feed-7.jpg",
  "feed-8.jpg",
  "feed-9.jpg",
  "feed-10.jpg",
];

/** Twelve grid tiles with placed images — a planned, cohesive feed. */
export function demoTiles(): GridTile[] {
  const rows: [string, PostStatus, string | null][] = [
    ["3 signs your colour needs a refresh", "published", "feed-1.jpg"],
    ["Sunday reset at the studio", "published", "feed-2.jpg"],
    ["How to make your blow-dry last", "published", "feed-3.jpg"],
    ["“Best cut I’ve had in years”", "published", "feed-4.jpg"],
    ["The 60-second morning routine", "published", "feed-5.jpg"],
    ["Gloss vs toner — the difference", "published", "feed-7.jpg"],
    ["Before & after: balayage", "scheduled", "feed-8.jpg"],
    ["A day in the life", "scheduled", "feed-9.jpg"],
    ["Your at-home care checklist", "scheduled", "feed-10.jpg"],
    ["5 questions to ask your stylist", "draft", null],
    ["Meet the team", "draft", null],
    ["Spring colour trends", "draft", null],
  ];
  const pillars = ["Education", "Behind the scenes", "Testimonial", "Promotion"];
  return rows.map((r, i) => ({
    id: `${DEMO_CLIENT_ID}_tile_${i}`,
    caption: r[0],
    status: r[1],
    pillar: pillars[i % pillars.length] ?? "Education",
    orderIndex: i,
    mediaUrl: r[2] ? `/marketing/${r[2]}` : null,
  }));
}

/** ~14 posts spread across the last month — powers Reports, Calendar, Studio. */
export function demoPosts(nowMs: number): ClientPost[] {
  const rows: [number, string, PostStatus, Platform, string][] = [
    [28, "Education", "published", "instagram", "3 signs your colour needs a refresh"],
    [26, "Behind the scenes", "published", "instagram", "Sunday reset at the studio"],
    [23, "Promotion", "published", "tiktok", "Mid-week blow-dry, 20% off"],
    [21, "Education", "published", "instagram", "How to make your blow-dry last"],
    [18, "Testimonial", "published", "instagram", "“Best cut I’ve had in years”"],
    [15, "Education", "published", "instagram", "The 60-second morning routine"],
    [12, "Behind the scenes", "published", "tiktok", "New arrivals unboxing"],
    [10, "Promotion", "published", "instagram", "Book your spring refresh"],
    [8, "Education", "published", "instagram", "Gloss vs toner — what’s the difference?"],
    [6, "Testimonial", "published", "instagram", "Before & after: balayage"],
    [4, "Behind the scenes", "scheduled", "instagram", "A day in the life"],
    [2, "Education", "scheduled", "instagram", "Your at-home care checklist"],
    [1, "Promotion", "scheduled", "tiktok", "Weekend openings just dropped"],
    [0, "Education", "draft", "instagram", "5 questions to ask your stylist"],
  ];
  return rows.map((r, i) => {
    const d = new Date(nowMs - r[0] * 86400000).toISOString();
    return {
      id: `${DEMO_CLIENT_ID}_post_${i}`,
      clientId: DEMO_CLIENT_ID,
      platform: r[3],
      pillar: r[1],
      topic: "",
      caption: r[4],
      hashtags: ["#hairstudio", "#sydneyhair"],
      status: r[2],
      scheduledFor: d,
      orderIndex: i,
      createdAt: d,
    };
  });
}
