import type { Metadata } from "next";
import Image from "next/image";
import { Images, Play, Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Grid — design lab",
  robots: { index: false, follow: false },
};

/**
 * TEMPORARY design lab — delete once the Broadsheet build lands.
 *
 * Broadsheet, carrying all three content shapes. The masthead, the rule under
 * it and the side columns never move; only the centre plate changes with the
 * platform — squares for Instagram, a 9:16 shelf for TikTok. That's what makes
 * one layout able to hold a grid-shaped network and a video-shaped one without
 * pretending they're the same thing.
 */

const CLIENT = { name: "Marie Beers", handle: "marie_beers", followers: "1,529" };

const SQUARES = [
  { src: "/marketing/grid-1.jpg", badge: "carousel" as const, count: 4 },
  { src: "/marketing/grid-2.jpg", badge: "reel" as const },
  { src: "/marketing/grid-3.jpg", badge: null },
  { src: "/marketing/grid-4.jpg", badge: null },
  { src: "/marketing/grid-5.jpg", badge: "carousel" as const, count: 3 },
  { src: "/marketing/grid-6.jpg", badge: null },
  { src: "/marketing/grid-7.jpg", badge: "reel" as const },
  { src: "/marketing/grid-8.jpg", badge: null },
  { src: "/marketing/feed-1.jpg", badge: null },
];

const CLIPS = [
  { src: "/marketing/grid-2.jpg", len: "0:22", day: "Tue 7pm" },
  { src: "/marketing/grid-7.jpg", len: "0:15", day: "Thu 6pm" },
  { src: "/marketing/feed-3.jpg", len: "0:31", day: "Sat 11am" },
  { src: "/marketing/grid-4.jpg", len: "0:18", day: "Tue 7pm" },
];

const SLIDES = [
  "/marketing/feed-2.jpg",
  "/marketing/feed-3.jpg",
  "/marketing/feed-4.jpg",
  "/marketing/feed-5.jpg",
];

const ASSETS: { src: string; kind: "image" | "video" }[] = [
  { src: "/marketing/feed-2.jpg", kind: "image" },
  { src: "/marketing/feed-3.jpg", kind: "video" },
  { src: "/marketing/feed-4.jpg", kind: "image" },
  { src: "/marketing/feed-5.jpg", kind: "video" },
  { src: "/marketing/feed-6.jpg", kind: "image" },
];

export default function DesignLabPage() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="sticky top-0 z-30 border-b border-ink/10 bg-cream/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-oxblood">
            Broadsheet
          </span>
          <span className="text-[12px] text-ink/60">
            One layout, three content shapes
          </span>
          <span className="ml-auto text-[11px] text-ink/45">Sample client</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] space-y-14 px-6 py-10">
        <Block
          n="1"
          title="Instagram — the square grid"
          note="Reels carry a play badge, carousels carry a stack badge with the slide count. Same tile, different mark — you can read the whole month's format mix at a glance."
        >
          <Broadsheet tab="instagram">
            <div className="grid grid-cols-3 gap-[5px]">
              {SQUARES.map((t, i) => (
                <div key={t.src} className="relative aspect-square overflow-hidden bg-oat">
                  <Image src={t.src} alt="" fill sizes="200px" className="object-cover" />
                  {i < 3 && (
                    <span className="absolute left-1.5 top-1.5 bg-ink/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-cream">
                      Planned
                    </span>
                  )}
                  {t.badge === "reel" && (
                    <span className="absolute right-1.5 top-1.5 text-cream drop-shadow">
                      <Play className="h-3.5 w-3.5 fill-current" />
                    </span>
                  )}
                  {t.badge === "carousel" && (
                    <span className="absolute right-1.5 top-1.5 flex items-center gap-1 bg-ink/75 px-1.5 py-0.5 text-[9px] font-semibold text-cream">
                      <Images className="h-3 w-3" /> {t.count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Broadsheet>
        </Block>

        <Block
          n="2"
          title="Carousel — opened"
          note="Click a stacked tile and it opens in place: the slides lay out in order, drag to reorder, up to ten. Instagram won't publish a carousel that mixes photo and video, so the editor refuses it here rather than letting it fail at 7pm on a Tuesday."
        >
          <Broadsheet tab="instagram">
            <div className="border border-ink/15 bg-white p-3">
              <div className="mb-3 flex items-baseline justify-between">
                <p className="font-display text-[15px] text-ink">Carousel · 4 slides</p>
                <span className="text-[10px] uppercase tracking-[0.14em] text-ink/45">
                  Drag to reorder
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {SLIDES.map((src, i) => (
                  <div key={src} className="relative aspect-square overflow-hidden bg-oat">
                    <Image src={src} alt="" fill sizes="120px" className="object-cover" />
                    <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center bg-ink text-[9px] font-bold text-cream">
                      {i + 1}
                    </span>
                  </div>
                ))}
                <button className="flex aspect-square items-center justify-center border border-dashed border-ink/30 text-ink/40">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 border-t border-ink/10 pt-2.5 text-[11px] text-ink/55">
                Slide 1 is what shows in the grid and the client&apos;s approval link.
              </p>
            </div>
          </Broadsheet>
        </Block>

        <Block
          n="3"
          title="TikTok — the video shelf"
          note="Not a grid. TikTok is a queue of 9:16 clips, so the centre plate becomes a shelf: each clip with its length and posting slot. This is the surface that didn't exist — the reason you could connect TikTok but never actually give it a video."
        >
          <Broadsheet tab="tiktok">
            <div className="border border-ink/15 bg-white p-3">
              <div className="mb-3 flex items-baseline justify-between">
                <p className="font-display text-[15px] text-ink">4 clips queued</p>
                <span className="text-[10px] uppercase tracking-[0.14em] text-ink/45">
                  Video only
                </span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {CLIPS.map((c) => (
                  <div key={c.src} className="w-[104px] shrink-0">
                    <div className="relative aspect-[9/16] overflow-hidden bg-oat">
                      <Image src={c.src} alt="" fill sizes="120px" className="object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center text-cream/90 drop-shadow">
                        <Play className="h-6 w-6 fill-current" />
                      </span>
                      <span className="absolute bottom-1 right-1 bg-ink/75 px-1 py-0.5 text-[9px] font-semibold text-cream">
                        {c.len}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[10px] uppercase tracking-[0.1em] text-ink/60">
                      {c.day}
                    </p>
                  </div>
                ))}
                <button className="flex aspect-[9/16] w-[104px] shrink-0 flex-col items-center justify-center gap-1.5 border border-dashed border-ink/30 text-ink/45">
                  <Plus className="h-5 w-5" />
                  <span className="text-[9px] uppercase tracking-[0.1em]">Add clip</span>
                </button>
              </div>
              <p className="mt-3 border-t border-ink/10 pt-2.5 text-[11px] text-ink/55">
                TikTok only accepts video — photo assets are hidden on this tab so
                you can&apos;t schedule something that would be rejected.
              </p>
            </div>
          </Broadsheet>
        </Block>
      </div>
    </div>
  );
}

function Block({
  n,
  title,
  note,
  children,
}: {
  n: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cream">
            {n}
          </span>
          <h2 className="font-display text-2xl text-ink">{title}</h2>
        </div>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink/70">{note}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-ink/12">{children}</div>
    </section>
  );
}

/** The fixed newspaper furniture. Only `children` (the plate) ever changes. */
function Broadsheet({
  tab,
  children,
}: {
  tab: "instagram" | "facebook" | "tiktok";
  children: React.ReactNode;
}) {
  const isTikTok = tab === "tiktok";
  return (
    <div className="bg-porcelain px-9 py-8">
      <div className="border-b-[3px] border-ink pb-3">
        <div className="flex items-baseline justify-between text-[9px] font-semibold uppercase tracking-[0.22em] text-ink/55">
          <span>Connected</span>
          <span>The Grid</span>
          <span>16 August 2026</span>
        </div>
        <h3 className="mt-2 text-center font-display text-[42px] font-light leading-[0.95] tracking-tight text-ink">
          {CLIENT.name}
        </h3>
        {/* the only navigation: which paper you're reading */}
        <div className="mt-3 flex justify-center gap-7 text-[10px] font-semibold uppercase tracking-[0.18em]">
          {(["instagram", "facebook", "tiktok"] as const).map((p) => (
            <span
              key={p}
              className={
                p === tab
                  ? "border-b-2 border-ink pb-1 text-ink"
                  : "pb-1 text-ink/35"
              }
            >
              {p}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-b border-ink py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-ink/70">
        <span>{isTikTok ? "4 clips" : "9 planned"}</span>
        <span>·</span>
        <span>{CLIENT.followers} followers</span>
        <span>·</span>
        <span>{isTikTok ? "Avg 0:21" : "Harmony 71%"}</span>
        <span>·</span>
        <span>Next: Tue 7pm</span>
      </div>

      <div className="mt-6 grid gap-7 lg:grid-cols-[1fr_2fr_1fr]">
        <div className="space-y-5 text-[12px] leading-relaxed text-ink/75">
          <Col title="The account">
            Connected as <span className="text-ink">{CLIENT.handle}</span>.
            {isTikTok
              ? " Clips post straight to TikTok at the time you set."
              : " Live posts pulled from Instagram; planned tiles sit on top."}
          </Col>
          <Col title="Formats">
            {isTikTok ? (
              "Video only — 9:16, up to 10 minutes."
            ) : (
              <>
                Post · Carousel up to 10 · Reel
                <span className="mt-1.5 block text-[11px] text-ink/50">
                  Photo and video can&apos;t be mixed in one carousel.
                </span>
              </>
            )}
          </Col>
        </div>

        <div>
          {children}
          <p className="mt-2.5 text-center text-[10px] italic text-ink/55">
            {isTikTok
              ? "Drag a clip to reorder the queue"
              : "Planned posts shown above the live feed · drag to reorder"}
          </p>
        </div>

        <div className="space-y-5 text-[12px] leading-relaxed text-ink/75">
          <div>
            <p className="mb-1.5 font-display text-[15px] text-ink">Assets</p>
            <div className="mb-2.5 h-px w-8 bg-ink/30" />
            <div className="grid grid-cols-3 gap-1.5">
              {ASSETS.filter((a) => (isTikTok ? a.kind === "video" : true)).map((a) => (
                <div key={a.src} className="relative aspect-square overflow-hidden bg-oat">
                  <Image src={a.src} alt="" fill sizes="70px" className="object-cover" />
                  {a.kind === "video" && (
                    <span className="absolute bottom-0.5 right-0.5 text-cream drop-shadow">
                      <Play className="h-2.5 w-2.5 fill-current" />
                    </span>
                  )}
                </div>
              ))}
              <button className="flex aspect-square items-center justify-center border border-dashed border-ink/30 text-ink/40">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-ink/50">
              {isTikTok ? "Only video shown here." : "Photos and video."}
            </p>
          </div>
          <div>
            <p className="mb-1.5 font-display text-[15px] text-ink">In the queue</p>
            <div className="mb-2 h-px w-8 bg-ink/30" />
            {[
              ["Drafts", "2"],
              ["Scheduled", isTikTok ? "4" : "9"],
              ["Awaiting approval", "1"],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between border-b border-ink/10 py-1 last:border-0">
                <span>{l}</span>
                <span className="text-ink">{v}</span>
              </div>
            ))}
          </div>
          <button className="w-full bg-ink py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cream">
            {isTikTok ? "Add a clip" : "Add a post"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 font-display text-[15px] text-ink">{title}</p>
      <div className="mb-2 h-px w-8 bg-ink/30" />
      <div>{children}</div>
    </div>
  );
}
