import type { Metadata } from "next";

import {
  IntelligenceDemo,
  PolishDemo,
  PowerDemo,
} from "@/components/social/preview/grid-demos";

export const metadata: Metadata = {
  title: "Grid enhancements — replyora",
  robots: { index: false, follow: false },
};

/**
 * Internal preview: three directions for enhancing the client Grid page.
 * Not linked anywhere, not indexed — /grid-preview (or ?only=polish|iq|power).
 */
export default async function GridPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ only?: string }>;
}) {
  const { only } = await searchParams;
  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="mx-auto max-w-5xl px-6 py-16">
        {!only && (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-oxblood/70">
              Internal preview
            </p>
            <h1 className="mt-2 font-display text-4xl text-oxblood sm:text-5xl">
              Three ways to enhance the Grid
            </h1>
            <p className="mt-3 max-w-2xl text-ink/70">
              Pick the ones you like and I&apos;ll build them into the real{" "}
              <span className="font-medium text-ink">client Grid</span> page.
              They combine well.
            </p>
          </>
        )}

        {(!only || only === "polish") && (
          <Section
            n="01"
            title="Premium polish + live motion"
            blurb="The feed mock fills with real tiles that spring into place, lift on hover, and drag smoothly — the whole page feels high-end like the new homepage."
          >
            <div className="flex justify-center py-4">
              <PolishDemo />
            </div>
          </Section>
        )}

        {(!only || only === "iq") && (
          <Section
            n="02"
            title="Grid intelligence"
            blurb="Smart cues layered on the feed: a harmony score that reads your colour consistency, a 'first impression' line across the visible rows, your palette, and best-times-to-post."
          >
            <IntelligenceDemo />
          </Section>
        )}

        {(!only || only === "power") && (
          <Section
            n="03"
            title="More power features"
            blurb="Drag an asset straight onto a grid slot, multi-select tiles, then bulk-schedule or caption the whole selection at once — real speed for planning a month."
          >
            <PowerDemo />
          </Section>
        )}
      </div>
    </main>
  );
}

function Section({
  n,
  title,
  blurb,
  children,
}: {
  n: string;
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 border-t border-oxblood/10 pt-10">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-2xl text-oxblood/40">{n}</span>
        <h2 className="font-display text-2xl text-oxblood">{title}</h2>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">{blurb}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}
