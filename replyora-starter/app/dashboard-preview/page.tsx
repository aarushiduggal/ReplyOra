import type { Metadata } from "next";

import {
  ActivityDemo,
  CockpitDemo,
  CommandBarDemo,
} from "@/components/social/preview/dashboard-demos";

export const metadata: Metadata = {
  title: "Dashboard concepts — replyora",
  robots: { index: false, follow: false },
};

/**
 * Internal preview: three "unique" dashboard additions to choose from, rendered
 * on the brand surface. Not linked anywhere and not indexed — /dashboard-preview.
 */
export default async function DashboardPreviewPage({
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
              Three ways to make the dashboard feel alive
            </h1>
            <p className="mt-3 max-w-2xl text-ink/70">
              Pick the ones you like and I&apos;ll wire them into the real{" "}
              <span className="font-medium text-ink">/clients</span> home. They
              can also be combined.
            </p>
          </>
        )}

        {(!only || only === "cockpit") && (
        <Section
          n="01"
          title="Cockpit — live stat tiles"
          blurb="A row of at-a-glance numbers at the top of the dashboard: scheduled, in review, published, outstanding invoices. Numbers count up on load, one tile pulses when something is live, another draws a little trend line."
        >
          <CockpitDemo />
        </Section>
        )}

        {(!only || only === "activity") && (
        <Section
          n="02"
          title="Activity — a live feed"
          blurb="A running timeline of what's happening across all your clients — posts scheduled, approvals in, invoices sent, captions generated. Feels like the studio is working even when you're not looking."
        >
          <ActivityDemo />
        </Section>
        )}

        {(!only || only === "command") && (
        <Section
          n="03"
          title="Command bar — jump anywhere (⌘K)"
          blurb="Press ⌘K (or Ctrl+K) from anywhere to search clients and sections and jump straight there. Fast, keyboard-first, the kind of thing that makes a tool feel premium."
        >
          <div className="rounded-2xl border border-dashed border-oxblood/20 bg-white/40 py-10">
            <CommandBarDemo />
            <p className="mt-4 text-center text-xs text-ink/45">
              Try it: press ⌘K (or Ctrl+K), or click the bar above.
            </p>
          </div>
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
