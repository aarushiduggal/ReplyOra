import type { MetadataRoute } from "next";

import { BLOG_POSTS } from "@/lib/blog";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://replyora.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "/demo",
    "/blog",
    "/privacy",
    "/terms",
    "/security",
    "/login",
    "/signup",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries];
}
