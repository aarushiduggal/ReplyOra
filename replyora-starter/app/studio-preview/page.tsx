import type { Metadata } from "next";

import { FormatTools, type FormatTool } from "@/components/social/studio/format-tools";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Studio tools — preview",
  robots: { index: false, follow: false },
};

/** TEMPORARY preview — Studio needs a session; this doesn't. Delete after sign-off. */
const TOOLS: { tool: FormatTool; title: string; try: string }[] = [
  { tool: "reel", title: "Reel / TikTok script", try: "why we always do a strand test first" },
  { tool: "carousel", title: "Carousel outline", try: "how to make a blonde last between appointments" },
  { tool: "hooks", title: "Hook rewriter", try: "paste any caption" },
  { tool: "story", title: "Story sequence", try: "a colour appointment start to finish" },
  { tool: "replies", title: "Reply pack", try: "a hair salon in Sydney doing colour" },
];

export default function StudioPreviewPage() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="border-b border-ink/10 px-6 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-oxblood">
          Studio preview
        </span>
        <span className="ml-4 text-[12px] text-ink/60">Five tools · sample client</span>
      </div>
      <div className="mx-auto max-w-3xl space-y-14 px-6 py-10">
        {TOOLS.map((t) => (
          <section key={t.tool} className="border-t border-ink/10 pt-12 first:border-0 first:pt-0">
            <h2 className="mb-1 font-display text-2xl text-ink">{t.title}</h2>
            <p className="mb-5 text-[13px] text-ink/60">
              Try: <em>{t.try}</em>
            </p>
            <FormatTools clientId="preview" businessName="Bloom Hair Studio" tool={t.tool} />
          </section>
        ))}
      </div>
      <Toaster />
    </div>
  );
}
