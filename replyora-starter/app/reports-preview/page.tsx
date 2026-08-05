import type { Metadata } from "next";

import { ReportsWorkspace } from "@/components/social/reports/reports-workspace";
import { GuideProvider } from "@/components/social/guide";
import type { ClientPost } from "@/lib/social/posts";
import type { Platform, PostStatus } from "@/lib/social/types";

export const metadata: Metadata = {
  title: "Reports preview — replyora",
  robots: { index: false, follow: false },
};

/** Deterministic-ish sample feed so the enhanced report renders with data. */
function samplefeed(todayMs: number): ClientPost[] {
  // [daysAgo, pillar, status, platform, caption] — weighted toward recent so
  // the cadence chart trends up and the auto-insight has something to say.
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
    [0, "Education", "scheduled", "instagram", "5 questions to ask your stylist"],
  ];
  return rows.map((r, i) => {
    const d = new Date(todayMs - r[0] * 86400000).toISOString().slice(0, 10);
    return {
      id: `sample-${i}`,
      clientId: "preview",
      platform: r[3],
      pillar: r[1],
      topic: "",
      caption: r[4],
      hashtags: [],
      status: r[2],
      scheduledFor: `${d}T10:00:00.000Z`,
      orderIndex: i,
      createdAt: `${d}T10:00:00.000Z`,
    } satisfies ClientPost;
  });
}

export default function ReportsPreviewPage() {
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);
  const posts = samplefeed(now.getTime());

  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-oxblood/70">
          Internal preview · sample data
        </p>
        <GuideProvider>
          <ReportsWorkspace
            clientId="preview"
            clientName="Bloom Hair Studio"
            connected={false}
            posts={posts}
            reportTitle="Performance Report"
            todayISO={todayISO}
          />
        </GuideProvider>
      </div>
    </main>
  );
}
