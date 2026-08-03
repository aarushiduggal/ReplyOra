import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://replyora.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep the app + widget out of the index; marketing pages are indexable.
      disallow: ["/dashboard", "/widget", "/api", "/onboarding"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
