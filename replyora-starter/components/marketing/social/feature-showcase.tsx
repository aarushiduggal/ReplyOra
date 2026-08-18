import {
  BarChart3,
  CalendarClock,
  CheckCheck,
  LayoutGrid,
  Sparkles,
} from "lucide-react";

import { Reveal } from "@/components/marketing/motion";

/**
 * Feature showcase of the real dashboard capabilities. Each card carries a tiny
 * hand-built CSS "mini-mock" so the product feels tangible without screenshots.
 */

function GridMock() {
  const photos = [
    "content-1.jpg", "feed-2.jpg", "content-2.jpg",
    "feed-4.jpg", "content-3.jpg", "content-6.jpg",
    "content-4.jpg", "feed-6.jpg", "content-5.jpg",
  ];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {photos.map((p) => (
        <div
          key={p}
          className="aspect-square overflow-hidden rounded-md bg-oat"
          style={{
            backgroundImage: `url(/marketing/${p})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}
    </div>
  );
}

function CalendarMock() {
  const active = [2, 4, 6, 9, 11];
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className={`aspect-square rounded-sm ${
            active.includes(i) ? "bg-oxblood" : "bg-oat"
          }`}
        />
      ))}
    </div>
  );
}

function CaptionMock() {
  return (
    <div className="space-y-2">
      <div className="h-2 w-11/12 rounded-full bg-oat" />
      <div className="h-2 w-full rounded-full bg-oat" />
      <div className="h-2 w-9/12 rounded-full bg-oat" />
      <div className="flex gap-1.5 pt-1">
        {["#glow", "#local", "#booknow"].map((t) => (
          <span
            key={t}
            className="rounded-full bg-rose/15 px-2 py-0.5 text-[10px] font-medium text-wine"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function ApprovalsMock() {
  return (
    <div className="space-y-2">
      {["Reel · Mon", "Carousel · Wed"].map((row, i) => (
        <div
          key={row}
          className="flex items-center gap-2 rounded-lg border border-oxblood/10 bg-white px-2.5 py-2"
        >
          <span className="h-6 w-6 rounded-md bg-gradient-to-br from-oxblood to-rose" />
          <span className="text-[11px] text-ink/70">{row}</span>
          <span
            className={`ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              i === 0
                ? "bg-oxblood text-cream"
                : "border border-oxblood/20 text-ink/60"
            }`}
          >
            {i === 0 ? (
              <>
                <CheckCheck className="h-3 w-3" /> Approved
              </>
            ) : (
              "Pending"
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function ReportMock() {
  const bars = [40, 62, 48, 78, 90, 70];
  return (
    <div className="flex h-20 items-end gap-1.5">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-gradient-to-t from-rose to-oxblood"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

interface Feature {
  icon: typeof LayoutGrid;
  title: string;
  body: string;
  mock: React.ReactNode;
  wide?: boolean;
}

const FEATURES: Feature[] = [
  {
    icon: LayoutGrid,
    title: "Grid planner",
    body: "Design your feed visually. Drag, drop and reorder until the whole grid looks right — then lock it in.",
    mock: <GridMock />,
    wide: true,
  },
  {
    icon: CalendarClock,
    title: "Content calendar",
    body: "A month of Instagram & TikTok mapped out at a glance, scheduled to post on time without you lifting a finger.",
    mock: <CalendarMock />,
  },
  {
    icon: Sparkles,
    title: "AI captions",
    body: "On-brand captions, hooks and hashtags generated from your business — never a generic template.",
    mock: <CaptionMock />,
  },
  {
    icon: CheckCheck,
    title: "Approvals & client portal",
    body: "Share a clean portal, collect two-tap approvals, and keep every client in the loop without the email chase.",
    mock: <ApprovalsMock />,
  },
  {
    icon: BarChart3,
    title: "Reports",
    body: "Simple, branded performance reports that show what's working — ready to send to a client or keep for yourself.",
    mock: <ReportMock />,
  },
];

export function FeatureShowcase() {
  return (
    <section id="features" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-roseink">
            One calm dashboard
          </p>
          <h2 className="mt-3 font-display text-4xl text-oxblood sm:text-5xl">
            Everything your feed needs, in one place.
          </h2>
          <p className="mt-4 text-ink/70">
            Plan, create, approve and measure — the whole job, handled from a
            single, unhurried workspace.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.title}
              delay={i * 0.07}
              className={f.wide ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : ""}
            >
              <div className="flex h-full flex-col rounded-2xl border border-oxblood/10 bg-cream p-6 transition-transform duration-200 hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-oxblood text-cream">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-xl text-wine">{f.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">{f.body}</p>
                <div className="mt-5 rounded-xl border border-oxblood/10 bg-white p-4">
                  {f.mock}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
